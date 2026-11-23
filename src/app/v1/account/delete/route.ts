import { z } from "zod";
import { ApiError, route } from "@/server/http";
import { srv } from "@/server/db";
import type { Db } from "@/server/supabase";

// Delete account (free, never blocked by plan). Verify, remove kept photos, then purge every record
// and the sign-in itself. A tombstone stops a restored backup from bringing the account back.
//
// Photos first, and only the account's own sign-in can remove them: once the account is gone nothing
// could. So the account is deleted only after storage confirms the photo folder is empty. If storage
// keeps failing, nothing is deleted, the person is told to try again, and the founder gets an alert
// (counts only). That way a photo is never left behind without an owner.
const RETRY_DELAYS_MS = [0, 250, 750, 1500];
const BUCKET = "meal-photos";

async function removeKeptPhotos(db: Db, userId: string): Promise<{ left: number; reason: string | null }> {
  let reason: string | null = null;
  for (const wait of RETRY_DELAYS_MS) {
    if (wait) await new Promise((r) => setTimeout(r, wait));
    reason = null;
    // Remove in pages until the folder is empty; stop this attempt at the first error or if nothing moves.
    for (let page = 0; page < 50 && !reason; page++) {
      const { data, error } = await db.storage.from(BUCKET).list(userId, { limit: 1000 });
      if (error) { reason = "list_failed"; break; }
      if (!data.length) return { left: 0, reason: null };
      const { error: removeError } = await db.storage.from(BUCKET).remove(data.map((f) => `${userId}/${f.name}`));
      if (removeError) { reason = "remove_failed"; break; }
      const { data: after, error: checkError } = await db.storage.from(BUCKET).list(userId, { limit: 1000 });
      if (checkError) { reason = "list_failed"; break; }
      if (after.length >= data.length && after.length > 0) reason = "not_removed";
    }
  }
  const { data } = await db.storage.from(BUCKET).list(userId, { limit: 1000 });
  return { left: data?.length ?? -1, reason: reason ?? "not_removed" };
}

export const POST = route({ body: z.strictObject({ confirm: z.string() }) }, async (ctx) => {
  if (ctx.body.confirm !== "DELETE") throw new ApiError(422, "CONFIRM_REQUIRED", "Type DELETE to confirm.");
  const photos = await removeKeptPhotos(ctx.db, ctx.userId);
  if (photos.left !== 0) {
    // Observable: a log line and a founder alert, with counts only (no account ID, no file names).
    const detail = { files_left: photos.left, attempts: RETRY_DELAYS_MS.length, reason: photos.reason };
    console.error(JSON.stringify({ level: "error", request_id: ctx.requestId, event: "photo_cleanup_failed", ...detail }));
    await srv("srv_alert", { p_kind: "photo_cleanup_failed", p_detail: detail }).catch(() => {});
    throw new ApiError(503, "PHOTOS_NOT_REMOVED", "Your photos couldn't be removed yet, so nothing was deleted. Try again in a moment.");
  }
  await srv("srv_delete_account", { p_user: ctx.userId });
  await ctx.db.auth.signOut().catch(() => {});
  return { status: 200, data: { deleted: true } };
});
