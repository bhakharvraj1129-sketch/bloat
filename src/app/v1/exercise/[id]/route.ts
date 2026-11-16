import { notFound, route } from "@/server/http";

export const DELETE = route({ mutation: true, feature: "exercise_log" }, async (ctx) => {
  const { data } = await ctx.db.from("exercise_records").select("id").eq("user_id", ctx.userId).eq("id", ctx.params.id!).maybeSingle();
  if (!data) notFound("Exercise record");
  return ctx.commit([{ op: "delete", table: "exercise_records", match: { id: data!.id }, require: true }], 204, null);
});
