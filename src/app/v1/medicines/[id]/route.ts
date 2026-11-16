import { notFound, route } from "@/server/http";

export const DELETE = route({ mutation: true, feature: "medicines" }, async (ctx) => {
  const { data: med } = await ctx.db.from("medicines").select("id").eq("user_id", ctx.userId).eq("id", ctx.params.id!).maybeSingle();
  if (!med) notFound("Medicine");
  return ctx.commit([{ op: "delete", table: "medicines", match: { id: med!.id }, require: true }], 204, null);
});
