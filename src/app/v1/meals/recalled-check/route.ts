import { z } from "zod";
import { ApiError, ok, route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { tx } from "@/server/db";
import { thresholds } from "@/lib/registry";
import { addDays, dayStartUtc } from "@/lib/time";

// RC-01 (plan 0.1): right after upgrading, the user may add ingredients to free-plan meals from
// the last 7 days. Offered once. Answers are saved with source "recalled" and labelled on results.
export const GET = route({ feature: "recalled_meal_check" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const from = new Date(dayStartUtc(addDays(u.today, -thresholds.recalled_check_days), u.zone)).toISOString();
  const { data } = await ctx.db.from("meals").select("id,dish_text,eaten_at,save_key,ai_check_status").eq("user_id", ctx.userId).eq("ai_check_status", "free_plan").gte("eaten_at", from).order("eaten_at");
  return ok({ offered: !!ctx.entitlement?.recalled_check_offered_at, meals: data ?? [] });
});

export const POST = route({ body: z.strictObject({ answer: z.enum(["yes_go_through_them", "not_now"]) }), mutation: true, feature: "recalled_meal_check" }, async (ctx) => {
  if (ctx.entitlement?.recalled_check_offered_at) throw new ApiError(409, "ALREADY_OFFERED", "This was already offered once.");
  // The entitlement row is server-owned; mark the one-time offer as used.
  await tx(ctx.userId, [{ op: "update", table: "entitlements", match: { user_id: ctx.userId }, set: { recalled_check_offered_at: new Date(ctx.now).toISOString() } }]);
  return ctx.commit([{ op: "insert", table: "product_events", row: { name: "recalled_check_answered", props: { accepted: ctx.body.answer === "yes_go_through_them" } } }], 200, { answer: ctx.body.answer });
});
