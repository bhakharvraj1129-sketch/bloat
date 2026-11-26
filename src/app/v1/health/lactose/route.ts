import { z } from "zod";
import { route } from "@/server/http";
import { staleDoctorReportOps } from "@/server/meals";

const body = z.strictObject({
  breath_test: z.enum(["positive", "negative", "unclear", "not_had"]).nullable(),
  after_dairy: z.array(z.enum(["bloating", "gas", "diarrhoea", "pain", "nothing"])).max(5),
});

// Changing earlier lactose details corrects the record: stored doctor reports are flagged and their
// share links revoked (plan B05). The first answer adds information and flags nothing.
export const PUT = route({ body, mutation: true, feature: "health_background" }, async (ctx) => {
  const { data: prior } = await ctx.db.from("lactose_details").select("breath_test,after_dairy").eq("user_id", ctx.userId).maybeSingle();
  const changed = !!prior && (prior.breath_test !== ctx.body.breath_test || JSON.stringify([...(prior.after_dairy ?? [])].sort()) !== JSON.stringify([...ctx.body.after_dairy].sort()));
  return ctx.commit([
    { op: "upsert", table: "lactose_details", row: { ...ctx.body, updated_at: new Date(ctx.now).toISOString() }, conflict: ["user_id"] },
    ...(changed ? await staleDoctorReportOps(ctx.db, ctx.userId) : []),
  ], 200, { lactose: ctx.body });
});
