import { ok, route } from "@/server/http";
import { isPaused } from "@/lib/domain/plan";
import { loadUser } from "@/server/userdata";
import { prices, formatMoney } from "@/lib/registry";
import { checkoutEnabled } from "@/server/flags";

export const GET = route({}, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const e = ctx.entitlement;
  // Before any purchase the price shown follows the residence country; the charge itself follows
  // the payment method's country (plan 0.4).
  const p = prices(u.profile.residence_country);
  return ok({
    plan: ctx.plan, status: e?.status ?? "none", paused: isPaused(e, ctx.now), pause_until: e?.pause_until ?? null,
    interval: e?.billing_interval ?? null, renews_or_ends_at: e?.ends_at ?? null, billing_country: e?.billing_country ?? null,
    offer: e?.offer ?? null, recalled_check_offered: !!e?.recalled_check_offered_at, trial: null,
    checkout_enabled: await checkoutEnabled(ctx.db),
    prices: {
      currency: p.currency, tax: p.tax,
      annual: formatMoney(p.annual_minor, p.currency), three_month: formatMoney(p.three_month_minor, p.currency), monthly: formatMoney(p.monthly_minor, p.currency),
      annual_per_month: formatMoney(Math.round(p.annual_minor / 12), p.currency), three_month_per_month: formatMoney(Math.round(p.three_month_minor / 3), p.currency),
    },
  });
});
