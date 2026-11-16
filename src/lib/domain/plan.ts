// Plan entitlement (plan A04, B05). Anything uncertain is Free: no assumed entitlement.
export type Entitlement = {
  user_id: string; plan: "free" | "pro"; status: string; billing_interval: string | null;
  started_at: string | null; ends_at: string | null; pause_until: string | null;
  billing_country: string | null; provider: string | null; pro_since: string | null;
  recalled_check_offered_at: string | null; offer: Record<string, unknown> | null;
};

export function effectivePlan(e: Entitlement | null, nowMs: number): "free" | "pro" {
  if (!e || e.plan !== "pro") return "free";
  if (e.ends_at && Date.parse(e.ends_at) <= nowMs) return "free";
  if (e.status === "active" || e.status === "grace") return "pro";
  // A cancelled plan keeps Pro until the paid period ends.
  if (e.status === "cancelled" && e.ends_at && Date.parse(e.ends_at) > nowMs) return "pro";
  return "free"; // paused, pending, failed, refunded, chargeback, none
}

export function isPaused(e: Entitlement | null, nowMs: number): boolean {
  return !!e && e.status === "paused" && (!e.pause_until || Date.parse(e.pause_until) > nowMs);
}
