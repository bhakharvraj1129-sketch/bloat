import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { srv } from "./db";
import { env } from "./env";
import { prices, type CountryCode } from "@/lib/registry";

export type BillingEvent = {
  provider: string; event_id: string; user_id: string;
  type: "activated" | "renewed" | "resumed" | "paused" | "payment_failed" | "grace" | "cancelled" | "refunded" | "chargeback" | "expired";
  occurred_at: string; interval?: "monthly" | "three_month" | "annual"; ends_at?: string; pause_until?: string;
  billing_country?: string; provider_ref?: string; offer?: Record<string, unknown>;
};

export function sign(rawBody: string): string {
  return createHmac("sha256", env.billingWebhookSecret).update(rawBody).digest("hex");
}

export function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!env.billingWebhookSecret || !signature) return false;
  const expected = Buffer.from(sign(rawBody));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** The webhook is authoritative: one idempotent, ordered entitlement change per provider event. */
export async function applyEvent(e: BillingEvent): Promise<{ duplicate: boolean; applied: boolean; stale?: boolean }> {
  return srv("srv_billing_event", { p_event: e });
}

const MONTHS = { monthly: 1, three_month: 3, annual: 12 } as const;

export function addMonths(ms: number, months: number): string {
  const d = new Date(ms);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString();
}

/**
 * The offer record kept with a purchase (plan A04): country, currency, amount in minor units,
 * interval, trial terms and version. The price follows the payment method's country, not the
 * country picked at sign-up; an invoice is never re-converted.
 */
export function offerFor(billingCountry: CountryCode, interval: keyof typeof MONTHS) {
  const p = prices(billingCountry);
  const amount = interval === "monthly" ? p.monthly_minor : interval === "three_month" ? p.three_month_minor : p.annual_minor;
  return { country: billingCountry, currency: p.currency, amount_minor: amount, interval, trial: null, tax: p.tax, version: "2026-11-08" };
}

/** MOCK purchase event for synthetic accounts. It is not a payment and no money moves. */
export function mockPurchase(userId: string, interval: keyof typeof MONTHS, billingCountry: CountryCode, now: number): BillingEvent {
  return {
    provider: "mock", event_id: `mock_${randomUUID()}`, user_id: userId, type: "activated",
    occurred_at: new Date(now).toISOString(), interval, ends_at: addMonths(now, MONTHS[interval]),
    billing_country: billingCountry, provider_ref: `mock_sub_${userId.slice(0, 8)}`, offer: offerFor(billingCountry, interval),
  };
}
