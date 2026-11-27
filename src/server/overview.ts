import "server-only";
import type { Db } from "./supabase";
import { loadAnswers, type UserCtx } from "./userdata";
import { bloatingDates, daysView, mealsOn, type DaysView } from "./days";
import { buildDoctorLine, type DoctorLine } from "@/lib/domain/doctorline";
import { addDays, analysisDate, diffDays, weekStart } from "@/lib/time";
import { doctorLine as doctorCfg, thresholds } from "@/lib/registry";

export async function doctorLineFor(db: Db, userId: string, u: UserCtx, view: DaysView, answers?: Record<string, unknown>): Promise<DoctorLine> {
  const a = answers ?? (await loadAnswers(db, userId));
  const { data: nudge } = await db.from("nudge_state").select("doctor_paused_until").eq("user_id", userId).maybeSingle();
  const days = bloatingDates(view.summaries, u.today, doctorCfg.window_days).length;
  return buildDoctorLine(days, a["ON-14"], a["ON-15"], (nudge?.doctor_paused_until as string | null) ?? null, u.today);
}

/** The honest progress counter (plan A04): real counts only, never a hint of any finding. */
export function progressCounter(u: UserCtx, view: DaysView) {
  const logged = loggedDates(u, view);
  const inRange = [...logged].filter((d) => d >= view.summaries[0]!.date && d <= u.today);
  const confirmed = view.summaries.filter((s) => s.status === "CONFIRMED").length;
  const needed = thresholds.comparison_min_each_group * 2;
  return { days_logged: inRange.length, confirmed_days: confirmed, confirmed_needed: needed };
}

/** The week containing today, Monday first: which days have anything logged. Later days are "future". */
export function weekStrip(u: UserCtx, view: DaysView) {
  const logged = loggedDates(u, view);
  const start = weekStart(u.today);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    return { date, logged: logged.has(date), future: date > u.today };
  });
}

function loggedDates(u: UserCtx, view: DaysView): Set<string> {
  const logged = new Set<string>();
  for (const s of view.summaries) {
    if (s.episodeCount > 0 || s.status !== "UNKNOWN") logged.add(s.date);
  }
  for (const m of view.data.meals) logged.add(analysisDate(Date.parse(m.eaten_at), u.periods));
  return logged;
}

export function historyFrom(u: UserCtx, days = 92): string {
  const created = analysisDate(Date.parse(u.profile.created_at), u.periods);
  const earliest = addDays(u.today, -(days - 1));
  // An account never shows days from before it existed (unless the clock is before its creation,
  // which only happens with the test clock).
  return diffDays(created, earliest) > 0 && created <= u.today ? created : earliest;
}

export function dayRows(u: UserCtx, view: DaysView) {
  return view.summaries.map((s) => ({
    date: s.date, status: s.status, score: s.score, highest_logged: s.highestLogged, provisional_zero: s.provisionalZero,
    episodes: s.episodeCount, meals: mealsOn(s.date, u, view.data).length, duration_ms: s.durationMs, duration_partial: s.durationPartial,
    coverage: s.coverage, conflict_reason: s.conflictReason,
  }));
}
