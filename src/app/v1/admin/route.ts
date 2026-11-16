import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { ApiError, errorResponse } from "@/server/http";
import { srv } from "@/server/db";
import { env } from "@/server/env";

// Founder tools. Off unless BLOAT_ADMIN_TOKEN is set. There is no health-record browser here:
// only spending, alerts, flags, event counts and the review queue (kind and reference only).
// Before any real user: put this behind a staff account with MFA (plan B03); see DECISIONS.md.
function allowed(req: Request): boolean {
  const token = env.adminToken;
  const given = req.headers.get("x-admin-token") ?? "";
  if (!token || token.length < 16 || given.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(token));
}

export async function GET(req: Request) {
  const id = crypto.randomUUID();
  if (!allowed(req)) return errorResponse(new ApiError(404, "NOT_FOUND", "Not found."), id);
  return Response.json(await srv("srv_admin_read", {}), { headers: { "cache-control": "no-store" } });
}

const body = z.discriminatedUnion("what", [
  z.strictObject({ what: z.literal("monthly_limit_usd"), value: z.number().min(0).max(10000) }),
  z.strictObject({ what: z.literal("flag"), key: z.enum(["ai_enabled", "checkout_enabled"]), enabled: z.boolean() }),
]);

export async function POST(req: Request) {
  const id = crypto.randomUUID();
  if (!allowed(req)) return errorResponse(new ApiError(404, "NOT_FOUND", "Not found."), id);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return errorResponse(new ApiError(422, "VALIDATION", "Not valid."), id);
  const b = parsed.data;
  if (b.what === "flag") {
    // Real payments stay off until Gate 2 and the owner's explicit yes: this switch cannot turn them on.
    if (b.key === "checkout_enabled" && b.enabled) return errorResponse(new ApiError(403, "CAPABILITY_OFF", "Checkout cannot be switched on before Gate 2."), id);
    await srv("srv_admin_set", { p_what: "flag", p_value: { key: b.key, enabled: b.enabled } });
  } else {
    await srv("srv_admin_set", { p_what: "monthly_limit_micros", p_value: Math.round(b.value * 1_000_000) });
  }
  return Response.json({ ok: true });
}
