import { notFound, route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { staleReportOps } from "@/server/meals";
import { analysisDate } from "@/lib/time";

// Deleting removes the record; stored reports that used it are flagged and their share links revoked.
export const DELETE = route({ mutation: true, feature: "exercise_log" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const { data } = await ctx.db.from("exercise_records").select("id,started_at").eq("user_id", ctx.userId).eq("id", ctx.params.id!).maybeSingle();
  if (!data) notFound("Exercise record");
  const stale = await staleReportOps(ctx.db, ctx.userId, analysisDate(Date.parse(data!.started_at as string), u.periods));
  return ctx.commit([{ op: "delete", table: "exercise_records", match: { id: data!.id }, require: true }, ...stale], 204, null);
});
