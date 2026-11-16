import { ok, route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { contextOf, cycleView, hourPattern, loadBundle, medicineViews, triggersOf, usualOf, weeklyAverages, focusOf } from "@/server/insights";
import { sevenDayAverage } from "@/lib/domain/day";
import { COMPARISON_LINE, MEDICINE_LINE } from "@/lib/wording";

// Pro summary: 7-day average, Your usual, Your cycle, medicine before/after, context periods.
export const GET = route({ feature: "charts" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const b = await loadBundle(ctx.db, ctx.userId, u, ctx.now, ctx.plan);
  const t = triggersOf(b);
  return ok({
    seven_day_average: sevenDayAverage(b.view.summaries.filter((s) => s.date < u.today).slice(-7)),
    your_usual: await usualOf(ctx.db, ctx.userId, u, b),
    your_cycle: cycleView(b.on10, b.extras.cycle, b.view.summaries, u.today),
    medicines: medicineViews(b.extras.medicines, b.extras.medicineChanges, b.view.summaries, u.today),
    weekly: weeklyAverages(b.view.summaries, u.today),
    context: contextOf(b), focus: focusOf(b, t).cards,
    comparison_line: COMPARISON_LINE, medicine_line: MEDICINE_LINE,
    worth_watching: t.worth_watching.map((c) => ({ label: c.target.label, with_days: c.with_days, without_days: c.without_days, mean_with: c.mean_with, mean_without: c.mean_without })),
    hours: hourPattern(b.view.data.episodes, u.periods),
  });
});
