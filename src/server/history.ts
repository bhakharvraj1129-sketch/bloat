import "server-only";
import type { Ctx } from "./http";
import type { UserCtx } from "./userdata";
import type { DaysView } from "./days";
import { sevenDayAverage } from "@/lib/domain/day";
import { baselineMarker, contextRanges, usualScore } from "@/lib/domain/insights";
import { loadAnswers, loadExtras } from "./userdata";
import { experimentsOn } from "./availability";

/** Pro additions to History: 7-day average, baseline markers and shaded context periods. */
export async function historyExtras(ctx: Ctx<unknown>, u: UserCtx, all: DaysView) {
  const done = all.summaries.filter((s) => s.date < u.today);
  const confirmed = done.filter((s) => s.status === "CONFIRMED").length;
  const usual = usualScore(done);
  const [answers, extras] = await Promise.all([loadAnswers(ctx.db, ctx.userId), loadExtras(ctx.db, ctx.userId)]);
  const on10 = (answers["ON-10"] as string[] | undefined) ?? [];
  const baseline: Record<string, "above" | "around" | "below"> = {};
  for (const s of done) {
    const m = baselineMarker(s.status === "CONFIRMED" || s.status === "LATE" ? s.score : null, usual, confirmed);
    if (m) baseline[s.date] = m;
  }
  return {
    seven_day_average: sevenDayAverage(done.slice(-7)),
    hide_charts: u.profile.hide_charts,
    experiments_offered: experimentsOn(),
    baseline,
    context: contextRanges({ cycle: extras.cycle, medicines: extras.medicines, medicineChanges: extras.medicineChanges, observations: all.data.observations }, on10, all.summaries[0]?.date ?? u.today, u.today),
  };
}
