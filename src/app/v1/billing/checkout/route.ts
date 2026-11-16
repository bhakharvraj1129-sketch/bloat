import { z } from "zod";
import { route } from "@/server/http";
import { checkoutEnabled } from "@/server/flags";

// Upgrade tap. Real checkout is off until Gate 2: the tap is counted (plan D01) and nothing is charged.
export const POST = route({ body: z.strictObject({ interval: z.enum(["monthly", "three_month", "annual"]) }), mutation: true }, async (ctx) => {
  const enabled = await checkoutEnabled(ctx.db);
  return ctx.commit(
    [{ op: "insert", table: "product_events", row: { name: "upgrade_tapped", props: { interval: ctx.body.interval } } }],
    200,
    { checkout: enabled ? "unavailable" : "off", message: "Payments are not switched on yet. Nothing was charged, and your free diary keeps working." },
  );
});
