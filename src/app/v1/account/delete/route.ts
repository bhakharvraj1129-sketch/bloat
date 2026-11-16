import { z } from "zod";
import { ApiError, route } from "@/server/http";
import { srv } from "@/server/db";

// Delete account (free, never blocked). Verify, remove kept photos, then purge every record and
// the sign-in itself. A tombstone stops a restored backup from bringing the account back.
export const POST = route({ body: z.strictObject({ confirm: z.string() }) }, async (ctx) => {
  if (ctx.body.confirm !== "DELETE") throw new ApiError(422, "CONFIRM_REQUIRED", "Type DELETE to confirm.");
  const { data: files } = await ctx.db.storage.from("meal-photos").list(ctx.userId, { limit: 1000 });
  if (files?.length) await ctx.db.storage.from("meal-photos").remove(files.map((f) => `${ctx.userId}/${f.name}`));
  await srv("srv_delete_account", { p_user: ctx.userId });
  await ctx.db.auth.signOut().catch(() => {});
  return { status: 200, data: { deleted: true } };
});
