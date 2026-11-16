import { randomUUID } from "node:crypto";
import { ApiError, route } from "@/server/http";
import { applyEvent } from "@/server/billing";

// Cancel in two taps. Never deletes data or past reports; Pro runs to the end of the paid period.
export const POST = route({}, async (ctx) => {
  const e = ctx.entitlement;
  if (!e || e.plan !== "pro") throw new ApiError(409, "NOT_PRO", "There is no Pro plan to cancel.");
  await applyEvent({ provider: e.provider ?? "mock", event_id: `cancel_${randomUUID()}`, user_id: ctx.userId, type: "cancelled", occurred_at: new Date(ctx.now).toISOString(), ends_at: e.ends_at ?? new Date(ctx.now).toISOString() });
  return { status: 200, data: { status: "cancelled", pro_until: e.ends_at, data_kept: true } };
});
