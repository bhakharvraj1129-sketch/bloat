import { notFound, route } from "@/server/http";
import { staleDoctorReportOps } from "@/server/meals";

// Deleting a medicine also flags stored doctor reports and revokes their share links (plan B05).
export const DELETE = route({ mutation: true, feature: "medicines" }, async (ctx) => {
  const { data: med } = await ctx.db.from("medicines").select("id").eq("user_id", ctx.userId).eq("id", ctx.params.id!).maybeSingle();
  if (!med) notFound("Medicine");
  return ctx.commit([{ op: "delete", table: "medicines", match: { id: med!.id }, require: true }, ...(await staleDoctorReportOps(ctx.db, ctx.userId))], 204, null);
});
