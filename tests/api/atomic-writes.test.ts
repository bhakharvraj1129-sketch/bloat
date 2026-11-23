import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { call, makePro, onboarded } from "./helpers";

// A save and its duplicate-tap record must land in one transaction (CLAUDE.md). These checks make the
// database refuse part of a save and then confirm that nothing of it is left behind.
// LOCAL stack only: the failure is a temporary trigger on the local database, for one test user.

function sql(query: string): string {
  return execFileSync("docker", ["exec", "supabase_db_bloat", "psql", "-U", "postgres", "-v", "ON_ERROR_STOP=1", "-tAc", query], { encoding: "utf8" }).trim();
}

/** Make the database refuse inserts into `table` for one user, until the returned function is called. */
function refuseInserts(table: string, userId: string, where = "true"): () => void {
  const name = `test_refuse_${randomUUID().replace(/-/g, "")}`;
  sql(`create function private.${name}() returns trigger language plpgsql as $$ begin
         if new.user_id = '${userId}' and (${where}) then raise exception 'TEST_REFUSED'; end if; return new; end $$;
       create trigger ${name} before insert on public.${table} for each row execute function private.${name}();`);
  return () => sql(`drop trigger if exists ${name} on public.${table}; drop function if exists private.${name}();`);
}

describe("Saves are all or nothing", () => {
  it("recalled-meals offer: when the answer cannot be saved, the offer is not used up, and the same request then saves once", async () => {
    const u = await onboarded();
    expect((await call(u, "POST", "/v1/meals", { save_key: randomUUID(), dish_text: "atomic toast", eaten: { mode: "now" } })).status).toBe(201);
    await makePro(u);
    expect((await call(u, "GET", "/v1/meals/recalled-check")).body).toMatchObject({ offered: false, meals: [{ dish_text: "atomic toast" }] });

    const key = randomUUID();
    const state = () => ({
      offered_at: sql(`select coalesce(recalled_check_offered_at::text, 'null') from public.entitlements where user_id = '${u.id}'`),
      answers: Number(sql(`select count(*) from public.product_events where user_id = '${u.id}' and name = 'recalled_check_answered'`)),
      saves: Number(sql(`select count(*) from public.command_log where user_id = '${u.id}' and key = '${key}'`)),
    });

    // The second part of the save (the answer and its duplicate-tap record) is refused.
    const restore = refuseInserts("product_events", u.id, "new.name = 'recalled_check_answered'");
    try {
      const failed = await call(u, "POST", "/v1/meals/recalled-check", { answer: "not_now" }, { key });
      expect(failed.status).toBe(500);
      expect(failed.body.error.message).toBe("Something went wrong. Nothing was saved.");
      // Nothing of the save is left: the offer is still open, no answer, no duplicate-tap record.
      expect(state()).toEqual({ offered_at: "null", answers: 0, saves: 0 });
      expect((await call(u, "GET", "/v1/meals/recalled-check")).body.offered).toBe(false);
    } finally {
      restore();
    }

    // The person taps again (same request): it saves, once.
    const retry = await call(u, "POST", "/v1/meals/recalled-check", { answer: "not_now" }, { key });
    expect(retry.status, JSON.stringify(retry.body)).toBe(200);
    expect(retry.body).toEqual({ answer: "not_now" });
    const after = state();
    expect(after.offered_at).not.toBe("null");
    expect([after.answers, after.saves]).toEqual([1, 1]);
    // A repeat of the same request gives the same answer and writes nothing new.
    const again = await call(u, "POST", "/v1/meals/recalled-check", { answer: "not_now" }, { key });
    expect(again.status).toBe(200);
    expect(state()).toEqual(after);
    // A new request is refused: the offer is made once.
    expect((await call(u, "POST", "/v1/meals/recalled-check", { answer: "yes_go_through_them" })).status).toBe(409);
    expect(state().answers).toBe(1);
  });

  it("recalled-meals offer: when the duplicate-tap record cannot be saved, the offer is not used up either", async () => {
    const u = await onboarded();
    expect((await call(u, "POST", "/v1/meals", { save_key: randomUUID(), dish_text: "atomic soup", eaten: { mode: "now" } })).status).toBe(201);
    await makePro(u);
    const key = randomUUID();
    const state = () => ({
      offered: sql(`select recalled_check_offered_at is not null from public.entitlements where user_id = '${u.id}'`),
      answers: Number(sql(`select count(*) from public.product_events where user_id = '${u.id}' and name = 'recalled_check_answered'`)),
      saves: Number(sql(`select count(*) from public.command_log where user_id = '${u.id}' and key = '${key}'`)),
    });
    const restore = refuseInserts("command_log", u.id, "new.route like '%recalled-check%'");
    try {
      expect((await call(u, "POST", "/v1/meals/recalled-check", { answer: "yes_go_through_them" }, { key })).status).toBe(500);
      // The offer mark and the answer were written before the refused record: both were rolled back.
      expect(state()).toEqual({ offered: "f", answers: 0, saves: 0 });
    } finally {
      restore();
    }
    // The same request again saves once; repeating it writes nothing new.
    expect((await call(u, "POST", "/v1/meals/recalled-check", { answer: "yes_go_through_them" }, { key })).status).toBe(200);
    expect(state()).toEqual({ offered: "t", answers: 1, saves: 1 });
    expect((await call(u, "POST", "/v1/meals/recalled-check", { answer: "yes_go_through_them" }, { key })).status).toBe(200);
    expect(state()).toEqual({ offered: "t", answers: 1, saves: 1 });
    expect((await call(u, "GET", "/v1/meals/recalled-check")).body.offered).toBe(true);
  });
});
