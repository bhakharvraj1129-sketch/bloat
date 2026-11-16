import { notFound, route } from "@/server/http";

export const DELETE = route({ mutation: true, feature: "bowel_log" }, async (ctx) => {
  const { data } = await ctx.db.from("bowel_movements").select("id").eq("user_id", ctx.userId).eq("id", ctx.params.id!).maybeSingle();
  if (!data) notFound("Bowel record");
  return ctx.commit([{ op: "delete", table: "bowel_movements", match: { id: data!.id }, require: true }], 204, null);
});
