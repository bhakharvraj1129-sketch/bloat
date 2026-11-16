import "server-only";
import type { Ctx } from "./http";
import type { UserCtx } from "./userdata";
import type { DaysView } from "./days";
import { sevenDayAverage } from "@/lib/domain/day";

/** Pro additions to History: the 7-day average (more is added by the insights slice). */
export async function historyExtras(_ctx: Ctx<unknown>, u: UserCtx, all: DaysView) {
  const completed = all.summaries.filter((s) => s.date < u.today).slice(-7);
  return { seven_day_average: sevenDayAverage(completed) };
}
