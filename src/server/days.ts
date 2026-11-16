import "server-only";
import type { Db } from "./supabase";
import { loadRange, type RangeData, type UserCtx } from "./userdata";
import { bucketDays, summarizeDay, type DaySummary } from "@/lib/domain/day";
import { addDays, analysisDate } from "@/lib/time";

export type DaysView = { data: RangeData; summaries: DaySummary[] };

export async function daysView(db: Db, userId: string, u: UserCtx, from: string, to: string, now: number): Promise<DaysView> {
  const data = await loadRange(db, userId, u, from, to);
  const buckets = bucketDays(from, to, u.periods, data);
  const summaries = [...buckets.values()].map((b) => summarizeDay(b, u.periods, now));
  return { data, summaries };
}

export function mealsOn(date: string, u: UserCtx, data: RangeData) {
  return data.meals.filter((m) => analysisDate(Date.parse(m.eaten_at), u.periods) === date);
}

/** Dates in the last `window` days (ending today) on which bloating was logged. */
export function bloatingDates(summaries: DaySummary[], today: string, window: number): string[] {
  const from = addDays(today, -(window - 1));
  return summaries
    .filter((s) => s.date >= from && s.date <= today)
    .filter((s) => s.episodeCount > 0 || (s.highestLogged ?? 0) > 0 || (s.score ?? 0) > 0)
    .map((s) => s.date);
}
