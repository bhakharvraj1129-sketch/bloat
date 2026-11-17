import { z } from "zod";
import { ApiError, route } from "@/server/http";
import { env } from "@/server/env";
import { applyEvent, mockPurchase } from "@/server/billing";
import { loadUser } from "@/server/userdata";

// TEST ONLY (synthetic accounts): a labelled mock purchase so Pro screens can be built and tested.
// No payment provider is involved and no money moves. Off unless BLOAT_TEST_LOGIN=1.
export const POST = route({ capability: "payments", body: z.strictObject({ interval: z.enum(["monthly", "three_month", "annual"]), card_country: z.enum(["US", "CA", "IN"]).optional() }) }, async (ctx) => {
  if (!env.testLogin || env.billingProvider !== "mock") throw new ApiError(404, "NOT_FOUND", "Not found.");
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const e = mockPurchase(ctx.userId, ctx.body.interval, ctx.body.card_country ?? u.profile.residence_country, ctx.now);
  const result = await applyEvent(e);
  return { status: 200, data: { mock: true, ...result, ends_at: e.ends_at, offer: e.offer } };
});
