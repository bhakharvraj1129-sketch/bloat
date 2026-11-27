import { ApiError, ok, route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { loadBundle, triggersOf } from "@/server/insights";
import { experimentOffers } from "@/server/experiments";
import { experimentsOn, swapExperimentsOn } from "@/server/availability";
import { experimentDef } from "@/lib/domain/experiments";
import { COMPARISON_LINE, FOLLOWED_ONLY_NOTE, TRIGGERS_FOOTER } from "@/lib/wording";
import { addDays, diffDays, isDate } from "@/lib/time";

// Possible triggers (Pro). Free accounts get 403 with no Pro values in the answer.
export const GET = route({ feature: "possible_triggers" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const q = new URL(ctx.req.url).searchParams;
  const from = q.get("from"), to = q.get("to");
  let range: { from: string; to: string } | undefined;
  if (from || to) {
    if (!from || !to || !isDate(from) || !isDate(to) || from > to || diffDays(to, from) > 91) throw new ApiError(422, "VALIDATION", "That date range is not valid.");
    range = { from, to: to >= u.today ? addDays(u.today, -1) : to };
  }
  const b = await loadBundle(ctx.db, ctx.userId, u, ctx.now, ctx.plan, range);
  const t = triggersOf(b);
  const offers = await experimentOffers(ctx.db, ctx.userId, u, b);
  // "Try an experiment" only for experiments this deployment offers.
  const xOn = experimentsOn(), swapOn = swapExperimentsOn();
  const offerFor = (target: (typeof t.worth_watching)[number]["target"]) => {
    if (!xOn) return null;
    const hit = offers.forTarget(target);
    return hit && (swapOn || experimentDef(hit.key)?.type !== "swap") ? hit : null;
  };
  const decorate = (c: (typeof t.worth_watching)[number]) => ({
    ...c, with_dates: undefined, without_dates: undefined,
    experiment: offerFor(c.target), fixed_line: COMPARISON_LINE,
  });
  return ok({
    ...t, date_format: u.profile.date_format,
    worth_watching: t.worth_watching.map(decorate), no_clear_difference: t.no_clear_difference.map(decorate),
    not_enough_data: t.not_enough_data.map(decorate),
    daily_food: t.daily_food.map((c) => ({
      ...decorate(c),
      message: `You eat ${c.target.label.toLowerCase()} almost every day, so your records can't compare it.${swapOn ? " A short swap experiment can." : ""}`,
    })),
    followed_note: FOLLOWED_ONLY_NOTE, footer: TRIGGERS_FOOTER, comparison_line: COMPARISON_LINE,
    experiments_offered: xOn,
  });
});
