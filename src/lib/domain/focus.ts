// Personal Focus (P1–P7) and next best log (plan A14). Fixed rules; each card says why it appeared.
// Suggestions are about logging only: they never name a condition and never give advice.
import { activity, tagLabel, thresholds } from "../registry";
import { addDays, analysisDate, localParts, zoneForDate, type ZonePeriod } from "../time";
import type { DaySummary } from "./day";
import type { Comparison } from "./insights";
import type { Episode, Meal, Observation } from "./types";

export type FocusCard = { rule: string; title: string; why: string; href?: string };
export type FocusInput = {
  today: string; periods: ZonePeriod[]; plan: "free" | "pro";
  summaries: DaySummary[]; episodes: Episode[]; meals: Meal[]; observations: Observation[];
  /** EP-08 symptom codes by local date. */
  symptomsByDate: Map<string, Set<string>>;
  bowelNoDates: string[]; bowelEntries: number; followed: string[]; comparisons: Comparison[];
  suspicions: number; cycleContext: boolean; menopause: boolean; cycleStarts: number;
  dismissed: Record<string, { until: string | null; count: number }>;
  /** Whether a dish can be saved on this deployment (it is saved from the ingredient step, which needs AI). Default: yes. */
  canSaveDishes?: boolean;
};

const last = (today: string, n: number) => ({ from: addDays(today, -n), to: addDays(today, -1) });

export function personalFocus(i: FocusInput): FocusCard[] {
  const cards: FocusCard[] = [];
  const w = last(i.today, 14);
  const inWin = (d: string) => d >= w.from && d <= w.to;
  const symptomDays = (codes: string[]) => [...i.symptomsByDate.entries()].filter(([d, set]) => inWin(d) && codes.some((c) => set.has(c))).length;
  const tapDays = (ids: string[]) => new Set(i.observations.filter((o) => inWin(o.date) && o.answer === "yes" && ids.includes(o.activity_id)).map((o) => o.date)).size;

  // P2: constipation, no bowel movement or diarrhoea on 3 or more of the last 14 completed dates.
  const p2 = new Set([
    ...[...i.symptomsByDate.entries()].filter(([d, s]) => inWin(d) && (s.has("constipation") || s.has("diarrhoea"))).map(([d]) => d),
    ...i.observations.filter((o) => inWin(o.date) && o.answer === "yes" && (o.activity_id === "ACT-14" || o.activity_id === "ACT-15")).map((o) => o.date),
    ...i.bowelNoDates.filter(inWin),
  ]).size;
  if (p2 >= 3) cards.push({ rule: "P2", title: "Track bowel movements", why: `You logged constipation, diarrhoea or no bowel movement on ${p2} of the last 14 days.`, href: "/today" });

  // P3: gas or burping on 3 or more of the last 14 dates.
  const p3 = symptomDays(["gas", "burping"]);
  if (p3 >= 3) cards.push({ rule: "P3", title: "Track eating speed, straws, gum and fizzy drinks", why: `You logged gas or burping on ${p3} of the last 14 days.`, href: "/today" });

  // P4: heartburn in the last 14 dates, or 5 or more starts with over half after 18:00.
  const starts = i.episodes.filter((e) => inWin(analysisDate(Date.parse(e.started_at), i.periods)));
  const evening = starts.filter((e) => { const ms = Date.parse(e.started_at); return localParts(ms, zoneForDate(analysisDate(ms, i.periods), i.periods)).h >= 18; }).length;
  const heartburn = symptomDays(["heartburn_or_reflux"]);
  if (heartburn >= 1) cards.push({ rule: "P4", title: "Log meal and sleep times", why: `You logged heartburn or reflux on ${heartburn} of the last 14 days.`, href: "/today" });
  else if (starts.length >= 5 && evening > starts.length / 2) cards.push({ rule: "P4", title: "Log meal and sleep times", why: `${evening} of your last ${starts.length} bloating records started after 18:00.`, href: "/today" });

  // P5: the user's own suspicion, offered as a check and labelled as theirs.
  if (i.suspicions > 0) cards.push({ rule: "P5", title: "Your suspicion", why: "You noted something you suspect. Possible triggers shows what your records say about it.", href: "/insights" });

  // P6: 10 or more ended episodes with a known start.
  const ended = i.episodes.filter((e) => e.ended_at || e.state === "END_UNKNOWN").length;
  if (ended >= 10) cards.push({ rule: "P6", title: "Time-of-day pattern", why: `You have ${ended} finished bloating records, enough to show when they tend to start.`, href: "/journey" });

  // P7: cycle or menopause context.
  if (i.menopause) cards.push({ rule: "P7", title: "Perimenopause or menopause is shaded on your charts", why: "You chose this context in your settings." });
  else if (i.cycleContext && i.cycleStarts > 0) cards.push({ rule: "P7", title: "Your cycle", why: `You logged ${i.cycleStarts} period ${i.cycleStarts === 1 ? "start" : "starts"}. A comparison appears after 3 complete cycles.`, href: "/journey" });

  // A frequently logged habit that is not followed (0.1): suggest following it.
  const unfollowed = unfollowedHabit(i);
  if (unfollowed) cards.push({ rule: `FOLLOW:${unfollowed.id}`, title: `Follow "${unfollowed.label}"`, why: `You logged it on ${unfollowed.days} of the last 14 days. Only followed habits can be compared.`, href: "/me" });

  void tapDays;
  return cards.filter((c) => !isDismissed(i, c.rule));
}

function isDismissed(i: Pick<FocusInput, "dismissed" | "today">, rule: string): boolean {
  const d = i.dismissed[rule];
  if (!d) return false;
  // Dismissed for 30 days, offered once more, then not again.
  if (d.count > thresholds.focus_dismiss_days / 30) return true;
  return !!d.until && d.until >= i.today;
}

function unfollowedHabit(i: FocusInput): { id: string; label: string; days: number } | null {
  const w = last(i.today, 14);
  const counts = new Map<string, Set<string>>();
  for (const o of i.observations) {
    if (o.answer !== "yes" || o.source !== "tap" || o.date < w.from || o.date > w.to || i.followed.includes(o.activity_id)) continue;
    counts.set(o.activity_id, (counts.get(o.activity_id) ?? new Set()).add(o.date));
  }
  const best = [...counts.entries()].map(([id, d]) => ({ id, days: d.size })).filter((x) => x.days >= 5).sort((a, b) => b.days - a.days || a.id.localeCompare(b.id))[0];
  return best ? { ...best, label: activity(best.id)?.label ?? best.id } : null;
}

export type NextBestLog = { id: string; text: string };

/** One suggestion at most, from fixed rules in a fixed order. */
export function nextBestLog(i: FocusInput): NextBestLog | null {
  const w14 = last(i.today, 14), w7 = last(i.today, 7);
  const out: NextBestLog[] = [];
  const mealsByDate = new Map<string, Meal[]>();
  for (const m of i.meals) { const d = analysisDate(Date.parse(m.eaten_at), i.periods); mealsByDate.set(d, [...(mealsByDate.get(d) ?? []), m]); }
  const unknownDays = [...mealsByDate.entries()].filter(([d, ms]) => d >= w14.from && d <= w14.to && ms.some((m) => ["failed", "paused", "limited", "dont_know", "not_requested", "abstained"].includes(m.ai_check_status))).length;
  if (unknownDays >= 9 && i.canSaveDishes !== false) out.push({ id: "save_dishes", text: "Try saving your usual dishes so meals are one tap." });

  const starts = i.episodes.filter((e) => { const d = analysisDate(Date.parse(e.started_at), i.periods); return d >= w14.from && d <= w14.to; });
  const eveningStarts = starts.filter((e) => { const ms = Date.parse(e.started_at); return localParts(ms, zoneForDate(analysisDate(ms, i.periods), i.periods)).h >= 18; });
  const dinnerDays = [...mealsByDate.entries()].filter(([d, ms]) => d >= w14.from && d <= w14.to && ms.some((m) => localParts(Date.parse(m.eaten_at), zoneForDate(d, i.periods)).h >= 17)).length;
  if (eveningStarts.length >= 5 && dinnerDays < 5) out.push({ id: "dinner_times", text: "Log dinner times for 7 days to see your evening pattern." });

  const someDays = i.summaries.filter((s) => s.date >= w7.from && s.date <= w7.to && s.coverage === "SOME").length;
  if (someDays >= 4) out.push({ id: "snacks", text: "Logging snacks and drinks makes more days usable." });

  const sparse = i.comparisons
    .filter((c) => c.state === "SPARSE" && c.section === "not_enough_data")
    .map((c) => ({ c, need: c.needed_with > 0 && c.needed_without === 0 ? c.needed_with : c.needed_without > 0 && c.needed_with === 0 ? c.needed_without : 99, side: c.needed_with > 0 ? "with" : "without" }))
    .filter((x) => x.need <= 3).sort((a, b) => a.c.target.label.localeCompare(b.c.target.label))[0];
  if (sparse) {
    const label = sparse.c.target.kind === "food" ? tagLabel(sparse.c.target.id).toLowerCase() : sparse.c.target.label.toLowerCase();
    out.push({ id: `sparse:${sparse.c.target.id}`, text: `${sparse.need} more ${sparse.need === 1 ? "day" : "days"} ${sparse.side} ${label} logged and you'll see a comparison.` });
  }

  const constipationDays = new Set([
    ...[...i.symptomsByDate.entries()].filter(([d, s]) => d >= w14.from && d <= w14.to && s.has("constipation")).map(([d]) => d),
    ...i.observations.filter((o) => o.date >= w14.from && o.date <= w14.to && o.answer === "yes" && o.activity_id === "ACT-14").map((o) => o.date),
  ]).size;
  if (i.bowelEntries === 0 && constipationDays >= 2) out.push({ id: "bowel_log", text: "Log bowel movements to see if they line up with your bloating." });

  const habit = unfollowedHabit(i);
  if (habit) out.push({ id: `follow:${habit.id}`, text: `You logged ${habit.label.toLowerCase()} on ${habit.days} days. Follow it to compare it with your bloating.` });

  return out.find((s) => !isDismissed(i, `NBL:${s.id}`)) ?? null;
}

/** Phase label on Today (0.3 fix 23). A label only: it never adds pressure. */
export function phase(mode: "full" | "keep_an_eye", proSince: string | null, today: string, hasWorthWatching: boolean, hasExperiment: boolean): "Discover" | "Understand" | "Maintain" {
  if (mode === "keep_an_eye") return "Maintain";
  const days = proSince ? Math.floor((Date.parse(`${today}T12:00:00Z`) - Date.parse(proSince)) / 86400000) : 0;
  if (hasWorthWatching || hasExperiment || days >= 28) return "Understand";
  return "Discover";
}

/** Shortcuts on Today, ordered by the personal goal (ON-16). The order is all that changes. */
export function shortcuts(goals: string[]): Array<{ href: string; label: string }> {
  const all: Record<string, { href: string; label: string }> = {
    triggers: { href: "/insights", label: "Possible triggers" }, journey: { href: "/journey", label: "Your journey" },
    doctor: { href: "/doctor", label: "Doctor report" }, experiments: { href: "/experiments", label: "Experiments" }, report: { href: "/report", label: "Weekly report" },
  };
  const first: Record<string, string[]> = {
    which_foods_affect_me: ["triggers", "experiments"], whether_timing_or_habits_matter: ["triggers", "journey"], whether_my_cycle_plays_a_part: ["journey", "triggers"],
    how_my_bloating_changes_over_time: ["journey", "report"], getting_ready_for_a_doctor_visit: ["doctor", "journey"], not_sure_yet: [],
  };
  const order = [...new Set([...goals.flatMap((g) => first[g] ?? []), "triggers", "journey", "report", "experiments", "doctor"])];
  return order.map((k) => all[k]!);
}

/** Adaptive logging (0.4): after 14 days of use, options not used in 30 days move under "More". */
export function adaptive(today: string, firstDay: string, observations: Observation[], symptomsByDate: Map<string, Set<string>>, allActivityIds: string[], allSymptoms: string[]) {
  if (Math.floor((Date.parse(today) - Date.parse(firstDay)) / 86400000) < 14) return { more_activities: [] as string[], more_symptoms: [] as string[] };
  const from = addDays(today, -30);
  const usedActs = new Set(observations.filter((o) => o.date >= from && o.source === "tap").map((o) => o.activity_id));
  const usedSymptoms = new Set([...symptomsByDate.entries()].filter(([d]) => d >= from).flatMap(([, s]) => [...s]));
  return { more_activities: allActivityIds.filter((a) => !usedActs.has(a)), more_symptoms: allSymptoms.filter((s) => !usedSymptoms.has(s) && s !== "none" && s !== "skip") };
}
