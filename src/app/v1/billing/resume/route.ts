import { randomUUID } from "node:crypto";
import { ApiError, route } from "@/server/http";
import { addMonths, applyEvent } from "@/server/billing";

export const POST = route({}, async (ctx) => {
  const e = ctx.entitlement;
  if (!e || e.status !== "paused") throw new ApiError(409, "NOT_PAUSED", "Pro is not paused.");
  const months = e.billing_interval === "annual" ? 12 : e.billing_interval === "three_month" ? 3 : 1;
  await applyEvent({ provider: e.provider ?? "mock", event_id: `resume_${randomUUID()}`, user_id: ctx.userId, type: "resumed", occurred_at: new Date(ctx.now).toISOString(), ends_at: addMonths(ctx.now, months) });
  return { status: 200, data: { status: "active" } };
});
