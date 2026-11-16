import { z } from "zod";
import { ApiError, route } from "@/server/http";
import { loadUser, resolveTime } from "@/server/userdata";
import { ifMatch, timeInput } from "@/server/schemas";
import { getMeal, staleReportOps } from "@/server/meals";
import { DbError } from "@/server/db";

const body = z.strictObject({
  dish_text: z.string().trim().min(1).max(300).optional(),
  eaten: timeInput.optional(),
  portion: z.enum(["small", "medium", "large", "not_sure"]).optional(),
  pace: z.enum(["slowly", "usual_pace", "quickly", "not_sure"]).nullable().optional(),
  origin: z.enum(["home", "restaurant_or_takeaway", "someone_else_s_home", "other", "not_sure"]).nullable().optional(),
});

export const PATCH = route({ body, mutation: true, feature: "edit_delete" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const m = await getMeal(ctx.db, ctx.userId, ctx.params.id!);
  const rev = ifMatch(ctx.req);
  if (rev === null) throw new ApiError(422, "IF_MATCH_REQUIRED", "Send the record's revision in If-Match.");
  if (rev !== m.revision) throw new ApiError(409, "REVISION_CONFLICT", "This record changed somewhere else. Reload and try again.", { revision: m.revision });
  const set: Record<string, unknown> = { revision: m.revision + 1 };
  const b = ctx.body;
  if (b.dish_text !== undefined) set.dish_text = b.dish_text;
  if (b.portion !== undefined) set.portion = b.portion;
  if (b.pace !== undefined) set.pace = b.pace;
  if (b.origin !== undefined) set.origin = b.origin;
  if (b.eaten) {
    const t = resolveTime(b.eaten, u, ctx.now);
    Object.assign(set, { eaten_at: t.iso, zone: t.zone, offset_min: t.offset_min, time_precision: t.precision });
  }
  const { analysisDate } = await import("@/lib/time");
  const stale = await staleReportOps(ctx.db, ctx.userId, analysisDate(Date.parse(m.eaten_at), u.periods));
  try {
    return await ctx.commit(
      [{ op: "update", table: "meals", match: { id: m.id, revision: m.revision }, set, require: true }, ...stale],
      200, { meal: { ...m, ...set } },
    );
  } catch (e) {
    if (e instanceof DbError && e.isNoMatch) throw new ApiError(409, "REVISION_CONFLICT", "This record changed somewhere else. Reload and try again.");
    throw e;
  }
});

// Deleting a meal removes it from every view and calculation; a stored report that used it is
// flagged for regeneration and its share link is revoked (test Q89).
export const DELETE = route({ mutation: true, feature: "edit_delete" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const m = await getMeal(ctx.db, ctx.userId, ctx.params.id!);
  const { analysisDate } = await import("@/lib/time");
  const stale = await staleReportOps(ctx.db, ctx.userId, analysisDate(Date.parse(m.eaten_at), u.periods));
  return ctx.commit([{ op: "delete", table: "meals", match: { id: m.id }, require: true }, ...stale], 204, null);
});
