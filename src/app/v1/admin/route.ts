import { z } from "zod";
import { ApiError, errorResponse } from "@/server/http";
import { srv, tx } from "@/server/db";
import { staffCheck } from "@/server/staff";

// Founder tools. Off unless BLOAT_STAFF_EMAILS is set. Entry needs a staff account that has passed
// a second sign-in step (plan B03); see src/server/staff.ts. There is no health-record browser
// here: only spending, alerts, flags, event counts and the review queue (kind and reference only).
// Every read and change is written to the audit log as metadata only.
async function gate(req: Request, id: string): Promise<string | Response> {
  const who = await staffCheck(req);
  if (who.state === "ok") return who.userId;
  if (who.state === "mfa_required") return errorResponse(new ApiError(403, "MFA_REQUIRED", "A second sign-in step is needed."), id);
  return errorResponse(new ApiError(404, "NOT_FOUND", "Not found."), id); // never says whether founder tools exist
}
const audit = (userId: string, action: string, meta: Record<string, unknown>) =>
  tx(userId, [{ op: "insert", table: "audit_log", row: { action, meta } }]);

export async function GET(req: Request) {
  const id = crypto.randomUUID();
  const who = await gate(req, id);
  if (typeof who !== "string") return who;
  await audit(who, "admin_read", {});
  return Response.json(await srv("srv_admin_read", {}), { headers: { "cache-control": "no-store" } });
}

const body = z.discriminatedUnion("what", [
  z.strictObject({ what: z.literal("monthly_limit_usd"), value: z.number().min(0).max(10000) }),
  z.strictObject({ what: z.literal("capability"), country: z.enum(["US", "CA", "IN"]), feature: z.enum(["recording", "payments"]), status: z.enum(["not_reviewed", "review_in_progress", "ready", "suspended", "retired"]) }),
  z.strictObject({ what: z.literal("flag"), key: z.enum(["ai_enabled", "checkout_enabled"]), enabled: z.boolean() }),
]);

export async function POST(req: Request) {
  const id = crypto.randomUUID();
  const who = await gate(req, id);
  if (typeof who !== "string") return who;
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return errorResponse(new ApiError(422, "VALIDATION", "Not valid."), id);
  const b = parsed.data;
  if (b.what === "capability") {
    await srv("srv_capability_set", { p_country: b.country, p_feature: b.feature, p_status: b.status });
    await audit(who, "admin_set_capability", { country: b.country, feature: b.feature, status: b.status });
  } else if (b.what === "flag") {
    // Real payments stay off until Gate 2 and the owner's explicit yes: this switch cannot turn them on.
    if (b.key === "checkout_enabled" && b.enabled) return errorResponse(new ApiError(403, "CAPABILITY_OFF", "Checkout cannot be switched on before Gate 2."), id);
    await srv("srv_admin_set", { p_what: "flag", p_value: { key: b.key, enabled: b.enabled } });
    await audit(who, "admin_set_flag", { key: b.key, enabled: b.enabled });
  } else {
    await srv("srv_admin_set", { p_what: "monthly_limit_micros", p_value: Math.round(b.value * 1_000_000) });
    await audit(who, "admin_set_limit", { monthly_limit_usd: b.value });
  }
  return Response.json({ ok: true });
}
