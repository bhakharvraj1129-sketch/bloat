import { notFound, route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { staleReportOps } from "@/server/meals";
import { analysisDate } from "@/lib/time";

// Deleting removes the record; stored reports that used it are flagged and their share links revoked.
export const DELETE = route({ mutation: true, feature: "bowel_log" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const { data } = await ctx.db.from("bowel_movements").select("id,occurred_at").eq("user_id", ctx.userId).eq("id", ctx.params.id!).maybeSingle();
  if (!data) notFound("Bowel record");
  const stale = await staleReportOps(ctx.db, ctx.userId, analysisDate(Date.parse(data!.occurred_at as string), u.periods));
  return ctx.commit([{ op: "delete", table: "bowel_movements", match: { id: data!.id }, require: true }, ...stale], 204, null);
});
