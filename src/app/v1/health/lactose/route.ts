import { z } from "zod";
import { route } from "@/server/http";

const body = z.strictObject({
  breath_test: z.enum(["positive", "negative", "unclear", "not_had"]).nullable(),
  after_dairy: z.array(z.enum(["bloating", "gas", "diarrhoea", "pain", "nothing"])).max(5),
});

export const PUT = route({ body, mutation: true, feature: "health_background" }, async (ctx) =>
  ctx.commit([{ op: "upsert", table: "lactose_details", row: { ...ctx.body, updated_at: new Date(ctx.now).toISOString() }, conflict: ["user_id"] }], 200, { lactose: ctx.body }));
