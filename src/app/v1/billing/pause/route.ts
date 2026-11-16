import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ApiError, route } from "@/server/http";
import { addMonths, applyEvent } from "@/server/billing";

// Pause Pro for 1, 2 or 3 months: no charge, data kept, Pro screens locked until resume.
export const POST = route({ body: z.strictObject({ months: z.union([z.literal(1), z.literal(2), z.literal(3)]) }) }, async (ctx) => {
  if (ctx.plan !== "pro") throw new ApiError(409, "NOT_PRO", "There is no active Pro plan to pause.");
  const pause_until = addMonths(ctx.now, ctx.body.months);
  await applyEvent({ provider: ctx.entitlement?.provider ?? "mock", event_id: `pause_${randomUUID()}`, user_id: ctx.userId, type: "paused", occurred_at: new Date(ctx.now).toISOString(), pause_until });
  return { status: 200, data: { status: "paused", pause_until } };
});
