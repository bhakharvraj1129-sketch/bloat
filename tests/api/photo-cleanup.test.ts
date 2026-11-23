import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { BASE, call, proUser, srvRpc, type User } from "./helpers";

// Deleting an account must also delete its kept meal photos (plan: "records, photos ... deleted";
// "Never keeps health data after deletion"). These checks make the storage service fail while the
// photos are removed, then let it recover. LOCAL stack only: synthetic photos, disposable accounts;
// the failure is a temporary trigger on the local database for one account's folder.

function sql(query: string): string {
  return execFileSync("docker", ["exec", "supabase_db_bloat", "psql", "-U", "postgres", "-v", "ON_ERROR_STOP=1", "-tAc", query], { encoding: "utf8" }).trim();
}
/** Files really on the local storage disk for this account (not just database rows). */
function filesOnDisk(userId: string): number {
  const out = execFileSync("docker", ["exec", "supabase_storage_bloat", "sh", "-c", `find /mnt -path '*meal-photos*' -path '*${userId}*' -type f | wc -l`], { encoding: "utf8" });
  return Number(out.trim());
}
const rows = (userId: string) => Number(sql(`select count(*) from storage.objects where bucket_id = 'meal-photos' and name like '${userId}/%'`));
const accounts = (userId: string) => Number(sql(`select count(*) from auth.users where id = '${userId}'`));
const alerts = async () => ((await srvRpc("srv_admin_read", {})).alerts as Array<{ kind: string; detail: Record<string, unknown>; created_at: string }>)
  .filter((a) => a.kind === "photo_cleanup_failed");

async function accountWithPhotos(n: number): Promise<User> {
  const u = await proUser();
  expect((await call(u, "POST", "/v1/consents", { type: "ai_meal" })).status).toBeLessThan(300);
  expect((await call(u, "PATCH", "/v1/me/profile", { keep_meal_photos: true })).status).toBe(200);
  for (let i = 0; i < n; i++) {
    const jpeg = await sharp({ create: { width: 64, height: 64, channels: 3, background: { r: 40 * i, g: 120, b: 60 } } }).jpeg().toBuffer();
    const form = new FormData();
    form.set("photo", new Blob([new Uint8Array(jpeg)], { type: "image/jpeg" }), "synthetic.jpg");
    form.set("save_key", randomUUID());
    const res = await fetch(`${BASE}/v1/meal-photos`, { method: "POST", headers: { Authorization: `Bearer ${u.token}` }, body: form });
    expect(res.status).toBe(200);
    expect((await res.json()).kept).toBe(true);
  }
  expect(rows(u.id)).toBe(n);
  expect(filesOnDisk(u.id)).toBe(n);
  return u;
}

/** Make the storage service fail to delete this account's files, until the returned function is called. */
function storageRefusesDeletes(userId: string): () => void {
  const name = `test_storage_${randomUUID().replace(/-/g, "")}`;
  sql(`create function private.${name}() returns trigger language plpgsql as $$ begin
         if old.name like '${userId}/%' then raise exception 'TEST_STORAGE_DOWN'; end if; return old; end $$;
       create trigger ${name} before delete on storage.objects for each row execute function private.${name}();`);
  return () => sql(`drop trigger if exists ${name} on storage.objects; drop function if exists private.${name}();`);
}

/** Make the storage service silently keep one file (no error): the delete succeeds for the others. */
function storageSilentlyKeeps(fileName: string): () => void {
  const name = `test_keep_${randomUUID().replace(/-/g, "")}`;
  sql(`create function private.${name}() returns trigger language plpgsql as $$ begin
         if old.name = '${fileName}' then return null; end if; return old; end $$;
       create trigger ${name} before delete on storage.objects for each row execute function private.${name}();`);
  return () => sql(`drop trigger if exists ${name} on storage.objects; drop function if exists private.${name}();`);
}

const remove = (u: User) => call(u, "POST", "/v1/account/delete", { confirm: "DELETE" });

describe("Delete account: kept meal photos", () => {
  it("with no failure: every kept photo is removed from storage, then the account is deleted", async () => {
    const u = await accountWithPhotos(3);
    const r = await remove(u);
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ deleted: true });
    expect([rows(u.id), filesOnDisk(u.id), accounts(u.id)]).toEqual([0, 0, 0]);
  });

  it("when storage fails, nothing is deleted, the person is told, the founder sees an alert; once storage works, trying again deletes the photos and the account", async () => {
    const u = await accountWithPhotos(2);
    const before = (await alerts()).length;
    const restore = storageRefusesDeletes(u.id);
    try {
      const failed = await remove(u);
      expect(failed.status).toBe(503);
      expect(failed.body.error.code).toBe("PHOTOS_NOT_REMOVED");
      // Nothing was deleted: the account and both photos are still there, and the person can try again.
      expect([accounts(u.id), rows(u.id), filesOnDisk(u.id)]).toEqual([1, 2, 2]);
      expect((await call(u, "GET", "/v1/me/state")).status).toBe(200);
      // The founder sees it, with counts only: no account ID, no file name.
      const now = await alerts();
      expect(now.length).toBe(before + 1);
      expect(now[0]!.detail).toMatchObject({ files_left: 2 });
      expect(JSON.stringify(now[0]!.detail)).not.toContain(u.id);
      // Trying again while storage is still failing changes nothing either.
      expect((await remove(u)).status).toBe(503);
      expect([accounts(u.id), rows(u.id), filesOnDisk(u.id)]).toEqual([1, 2, 2]);
    } finally {
      restore();
    }
    // Storage works again: the same button deletes the photos (rows and files) and then the account.
    const ok = await remove(u);
    expect(ok.status, JSON.stringify(ok.body)).toBe(200);
    expect([rows(u.id), filesOnDisk(u.id), accounts(u.id)]).toEqual([0, 0, 0]);
    expect(Number(sql(`select count(*) from public.meal_photos where user_id = '${u.id}'`))).toBe(0);
  });

  it("a storage failure that clears during the automatic retries still deletes everything in one tap", async () => {
    const u = await accountWithPhotos(1);
    const restore = storageRefusesDeletes(u.id);
    // Storage recovers 300 ms later, inside the route's own retries.
    const recovering = new Promise<void>((resolve) => setTimeout(() => { restore(); resolve(); }, 300));
    const r = await remove(u);
    await recovering;
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect([rows(u.id), filesOnDisk(u.id), accounts(u.id)]).toEqual([0, 0, 0]);
  });

  it("partial removal: storage removes 2 of 3 photos and silently keeps one; nothing else is deleted, the person is told, and the retry removes the last photo and the account", async () => {
    const u = await accountWithPhotos(3);
    const kept = sql(`select name from storage.objects where bucket_id = 'meal-photos' and name like '${u.id}/%' order by name limit 1`);
    const before = (await alerts()).length;
    const restore = storageSilentlyKeeps(kept);
    try {
      const r = await remove(u);
      // Storage said yes but one photo is still there: the route checks the folder, so it is not fooled.
      expect(r.status).toBe(503);
      expect(r.body.error.code).toBe("PHOTOS_NOT_REMOVED");
      expect([accounts(u.id), rows(u.id), filesOnDisk(u.id)]).toEqual([1, 1, 1]); // 2 of 3 removed; the account and its records stay
      expect(Number(sql(`select count(*) from public.profiles where user_id = '${u.id}'`))).toBe(1);
      expect(sql(`select count(*) from storage.objects where name = '${kept}'`)).toBe("1");
      const now = await alerts();
      expect(now.length).toBe(before + 1);
      expect(now[0]!.detail).toMatchObject({ files_left: 1, reason: "not_removed" });
      expect((await call(u, "GET", "/v1/me/state")).status).toBe(200); // still signed in, can try again
    } finally {
      restore();
    }
    const ok = await remove(u);
    expect(ok.status, JSON.stringify(ok.body)).toBe(200);
    expect([rows(u.id), filesOnDisk(u.id), accounts(u.id)]).toEqual([0, 0, 0]);
  });
});
