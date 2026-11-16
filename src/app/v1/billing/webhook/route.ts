import { z } from "zod";
import { ApiError, errorResponse } from "@/server/http";
import { applyEvent, verifySignature, type BillingEvent } from "@/server/billing";

const event = z.strictObject({
  provider: z.string().min(1).max(40), event_id: z.string().min(1).max(200), user_id: z.uuid(),
  type: z.enum(["activated", "renewed", "resumed", "paused", "payment_failed", "grace", "cancelled", "refunded", "chargeback", "expired"]),
  occurred_at: z.iso.datetime(), interval: z.enum(["monthly", "three_month", "annual"]).optional(),
  ends_at: z.iso.datetime().optional(), pause_until: z.iso.datetime().optional(),
  billing_country: z.string().length(2).optional(), provider_ref: z.string().max(200).optional(),
  offer: z.record(z.string(), z.unknown()).optional(),
});

// Payment provider webhook: signature checked, events idempotent and ordered (a stale event never
// reverts a newer state; a duplicate never applies twice).
export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-bloat-signature"))) {
    return errorResponse(new ApiError(401, "BAD_SIGNATURE", "Signature check failed."), requestId);
  }
  let parsed;
  try {
    parsed = event.safeParse(JSON.parse(raw));
  } catch {
    return errorResponse(new ApiError(422, "VALIDATION", "Not valid JSON."), requestId);
  }
  if (!parsed.success) return errorResponse(new ApiError(422, "VALIDATION", "Event not valid."), requestId);
  try {
    const result = await applyEvent(parsed.data as BillingEvent);
    return Response.json({ received: true, ...result }, { headers: { "x-request-id": requestId } });
  } catch {
    return errorResponse(new ApiError(422, "EVENT_REJECTED", "The event could not be applied."), requestId);
  }
}
