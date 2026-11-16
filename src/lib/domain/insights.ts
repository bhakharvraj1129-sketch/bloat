// The insights engine (plan A14, fixes 0.1–0.4). Deterministic, versioned rules over the user's
// own records. AI never writes a result, and unknown is never counted as "without".
import { activity, FOOD_TAG_IDS, tagLabel, thresholds } from "../registry";
import { addDays, analysisDate, diffDays, localParts, weekStart, weekday, zoneForDate, type ZonePeriod } from "../time";
import { mean, median, round1, type DaySummary } from "./day";
import { groupExposure, habitExposure, largeMealExposure, type ExposureContext } from "./exposure";
import type { CycleEvent, Episode, Medicine, MedicineChange, Observation, Review, Sample } from "./types";

export const INSIGHTS_VERSION = "insights_v1";

export type Target = { kind: "food" | "habit" | "large_meal"; id: string; label: string };
export type ComparisonState = "NEEDS_CORRECTION" | "NO_ELIGIBLE_DATA" | "ONE_GROUP_ONLY" | "SPARSE" | "DESCRIPTIVE_COMPARISON";
export type Section = "worth_watching" | "no_clear_difference" | "not_enough_data" | "daily_food";

export type Comparison = {
  target: Target; state: ComparisonState; section: Section;
  with_days: number; without_days: number; mean_with: number | null; mean_without: number | null; difference: number | null;
  first_half: number | null; second_half: number | null;
  needed_with: number; needed_without: number; mostly_days: number; recalled_days: number;
  share_of_usable_days: number | null; confounding_note: string | null; conflict_dates: string[];
  with_dates: string[]; without_dates: string[]; your_suspicion: boolean; metric_version: string;
};

export type InsightInput = {
  from: string; to: string; today: string; periods: ZonePeriod[];
  summaries: DaySummary[]; reviews: Review[]; observations: Observation[]; ctx: ExposureContext;
  followed: string[]; cycle: CycleEvent[]; medicines: Medicine[]; medicineChanges: MedicineChange[];
  suspicions?: { groups: string[]; activities: string[] };
};

const MIN = thresholds.comparison_min_each_group;

export function targets(input: Pick<InsightInput, "followed">): Target[] {
  return [
    ...FOOD_TAG_IDS.map((id) => ({ kind: "food" as const, id, label: tagLabel(id) })),
    ...input.followed.map((id) => ({ kind: "habit" as const, id, label: activity(id)?.label ?? id })),
    { kind: "large_meal" as const, id: "large_meal", label: "Days with a large meal" },
  ];
}

/** Period days: each start up to its end (or the start day alone when no end was logged). */
export function periodDates(cycle: CycleEvent[]): Set<string> {
  const starts = cycle.filter((c) => c.kind === "start").map((c) => c.date).sort();
  const ends = cycle.filter((c) => c.kind === "end").map((c) => c.date).sort();
  const out = new Set<string>();
  starts.forEach((s, i) => {
    const next = starts[i + 1];
    const end = ends.find((e) => e >= s && (!next || e < next) && diffDays(e, s) <= 14);
    for (let d = s; d <= (end ?? s); d = addDays(d, 1)) out.add(d);
  });
  return out;
}

function medicineChangeDates(meds: Medicine[], changes: MedicineChange[]): Set<string> {
  const out = new Set<string>();
  for (const m of meds) if (m.started_on) out.add(m.started_on);
  for (const c of changes) if (c.date) out.add(c.date);
  return out;
}

const CONFOUNDERS: Array<[string, string]> = [
  ["ACT-11", "poor sleep"], ["ACT-12", "stress"], ["ACT-18", "feeling unwell"], ["ACT-20", "travelling"],
];

/** 0.3 fix 21: if half or more of the "with" days share another logged context, say so with counts. */
export function confoundingNote(withDates: string[], input: InsightInput, target: Target): string | null {
  if (!withDates.length) return null;
  const candidates: Array<[number, string]> = [];
  for (const [act, label] of CONFOUNDERS) {
    if (target.id === act) continue;
    candidates.push([withDates.filter((d) => input.observations.some((o) => o.date === d && o.activity_id === act && o.answer === "yes")).length, label]);
  }
  const periods = periodDates(input.cycle);
  candidates.push([withDates.filter((d) => periods.has(d)).length, "a period"]);
  const med = medicineChangeDates(input.medicines, input.medicineChanges);
  candidates.push([withDates.filter((d) => med.has(d)).length, "a medicine change"]);
  const [count, label] = candidates.sort((a, b) => b[0] - a[0])[0]!;
  if (count / withDates.length < thresholds.confounding_note_share) return null;
  return `On ${count} of these ${withDates.length} days you also logged ${label}.`;
}

export function compare(target: Target, input: InsightInput): Comparison {
  const reviewBy = new Map(input.reviews.map((r) => [r.date, r]));
  const withScores: Array<[string, number]> = [];
  const withoutScores: Array<[string, number]> = [];
  const conflicts: string[] = [];
  let mostly = 0, recalled = 0;

  for (const s of input.summaries) {
    if (s.date < input.from || s.date > input.to || s.date >= input.today) continue;
    if (s.status === "CONFLICT") { conflicts.push(s.date); continue; }
    // Eligible day: a confirmed, timely score. Late, provisional and unknown days are left out.
    if (s.status !== "CONFIRMED" || s.score === null) continue;
    const review = reviewBy.get(s.date) ?? null;
    let exposure: "PRESENT" | "ABSENT" | "UNKNOWN";
    if (target.kind === "habit") {
      exposure = habitExposure(s.date, target.id, input.observations);
    } else if (target.kind === "large_meal") {
      exposure = largeMealExposure(s.date, s.coverage, input.ctx);
      if (exposure === "PRESENT" && s.coverage !== "ALL" && s.coverage !== "MOSTLY") exposure = "UNKNOWN";
    } else {
      const ge = groupExposure(s.date, target.id, s.coverage, review, input.observations, input.ctx);
      exposure = ge.exposure;
      // Both-sided coverage policy: a food day needs ALL coverage, or MOSTLY for presence only.
      // An explicit Keep an eye on it answer is definitive by itself.
      if (ge.source !== "watched" && exposure === "PRESENT" && s.coverage !== "ALL" && s.coverage !== "MOSTLY") exposure = "UNKNOWN";
      if (exposure !== "UNKNOWN" && ge.recalled) recalled++;
      if (exposure === "PRESENT" && s.coverage === "MOSTLY" && ge.source !== "watched") mostly++;
    }
    if (exposure === "PRESENT") withScores.push([s.date, s.score]);
    else if (exposure === "ABSENT") withoutScores.push([s.date, s.score]);
  }

  const nW = withScores.length, nO = withoutScores.length;
  const mW = mean(withScores.map((x) => x[1])), mO = mean(withoutScores.map((x) => x[1]));
  let state: ComparisonState;
  if (conflicts.length) state = "NEEDS_CORRECTION";
  else if (nW + nO === 0) state = "NO_ELIGIBLE_DATA";
  else if (nW === 0 || nO === 0) state = "ONE_GROUP_ONLY";
  else if (nW < MIN || nO < MIN) state = "SPARSE";
  else state = "DESCRIPTIVE_COMPARISON";

  // Both halves of the date range, decided before looking at the numbers.
  const mid = addDays(input.from, Math.floor(diffDays(input.to, input.from) / 2));
  const half = (first: boolean) => {
    const pick = (list: Array<[string, number]>) => list.filter(([d]) => (first ? d <= mid : d > mid)).map((x) => x[1]);
    const a = mean(pick(withScores)), b = mean(pick(withoutScores));
    return a === null || b === null ? null : round1(a - b);
  };
  const descriptive = state === "DESCRIPTIVE_COMPARISON";
  const difference = descriptive ? round1(mW! - mO!) : null;
  const firstHalf = descriptive ? half(true) : null;
  const secondHalf = descriptive ? half(false) : null;

  const usable = nW + nO;
  const share = usable ? nW / usable : null;
  const spanDays = diffDays(input.to, input.from) + 1;
  const dailyFood = target.kind === "food" && state !== "NEEDS_CORRECTION" && spanDays >= thresholds.daily_food_notice.after_days &&
    usable >= MIN && share !== null && share >= thresholds.daily_food_notice.share_of_usable_days && !descriptive;

  let section: Section = "not_enough_data";
  if (dailyFood) section = "daily_food";
  else if (descriptive) {
    const sameDirection = firstHalf !== null && secondHalf !== null && difference !== null && difference !== 0 &&
      Math.sign(firstHalf) === Math.sign(difference) && Math.sign(secondHalf) === Math.sign(difference);
    section = Math.abs(difference!) >= thresholds.worth_watching_min_difference && sameDirection ? "worth_watching" : "no_clear_difference";
  }

  const suspicion = target.kind === "food" ? !!input.suspicions?.groups.includes(target.id) : target.kind === "habit" ? !!input.suspicions?.activities.includes(target.id) : false;
  return {
    target, state, section, with_days: nW, without_days: nO,
    mean_with: descriptive ? round1(mW!) : null, mean_without: descriptive ? round1(mO!) : null, difference,
    first_half: firstHalf, second_half: secondHalf,
    needed_with: Math.max(0, MIN - nW), needed_without: Math.max(0, MIN - nO), mostly_days: mostly, recalled_days: recalled,
    share_of_usable_days: share === null ? null : Math.round(share * 100) / 100,
    confounding_note: descriptive ? confoundingNote(withScores.map((x) => x[0]), input, target) : null,
    conflict_dates: conflicts, with_dates: withScores.map((x) => x[0]), without_dates: withoutScores.map((x) => x[0]),
    your_suspicion: suspicion, metric_version: INSIGHTS_VERSION,
  };
}

export type CoOccurrence = { a: string; b: string; both: number; a_only: number; b_only: number; neither: number; separable: boolean; note: string };

/** Two items that usually appear together: show all four counts and say when they can't be separated. */
export function coOccurrences(list: Comparison[]): CoOccurrence[] {
  const out: CoOccurrence[] = [];
  const usable = list.filter((c) => c.with_days >= MIN);
  for (let i = 0; i < usable.length; i++) {
    for (let j = i + 1; j < usable.length; j++) {
      const A = usable[i]!, B = usable[j]!;
      const aW = new Set(A.with_dates), aO = new Set(A.without_dates), bW = new Set(B.with_dates), bO = new Set(B.without_dates);
      const days = [...new Set([...A.with_dates, ...A.without_dates])].filter((d) => bW.has(d) || bO.has(d));
      const both = days.filter((d) => aW.has(d) && bW.has(d)).length;
      const aOnly = days.filter((d) => aW.has(d) && bO.has(d)).length;
      const bOnly = days.filter((d) => aO.has(d) && bW.has(d)).length;
      const neither = days.filter((d) => aO.has(d) && bO.has(d)).length;
      const either = both + aOnly + bOnly;
      if (!either || both / either < 0.8) continue;
      const separable = aOnly >= MIN && bOnly >= MIN;
      out.push({
        a: A.target.label, b: B.target.label, both, a_only: aOnly, b_only: bOnly, neither, separable,
        note: `${A.target.label} and ${B.target.label} usually appear together in your records: both on ${both} days, only the first on ${aOnly}, only the second on ${bOnly}, neither on ${neither}.` +
          (separable ? "" : " Your records can't separate them."),
      });
    }
  }
  return out;
}

export type Triggers = {
  from: string; to: string; examined: number; header: string;
  worth_watching: Comparison[]; no_clear_difference: Comparison[]; not_enough_data: Comparison[]; daily_food: Comparison[];
  needs_correction: string[]; recalled_days: number; mostly_days: number; co_occurrence: CoOccurrence[]; metric_version: string;
};

export function possibleTriggers(input: InsightInput): Triggers {
  const all = targets(input).map((t) => compare(t, input));
  // Alphabetical inside each section; never sorted by the size of the difference.
  const sec = (s: Section) => all.filter((c) => c.section === s).sort((a, b) => a.target.label.localeCompare(b.target.label));
  const conflicts = [...new Set(all.flatMap((c) => c.conflict_dates))].sort();
  return {
    from: input.from, to: input.to, examined: all.length,
    header: `${all.length} groups examined; differences can appear by chance.`,
    worth_watching: sec("worth_watching"), no_clear_difference: sec("no_clear_difference"), not_enough_data: sec("not_enough_data"), daily_food: sec("daily_food"),
    needs_correction: conflicts,
    recalled_days: Math.max(0, ...all.map((c) => c.recalled_days)), mostly_days: Math.max(0, ...all.map((c) => c.mostly_days)),
    co_occurrence: coOccurrences(all), metric_version: INSIGHTS_VERSION,
  };
}

// ---- Your usual and baseline markers (0.3 fix 20, 0.4) ----------------------------------------

export type UsualFigures = {
  days: number; confirmed_days: number; typical_score: number | null; episodes_per_week: number | null;
  typical_episode_minutes: number | null; completeness: number | null;
};
export type YourUsual = { available: true; recent: UsualFigures; first_30: UsualFigures | null; bloating_days_30: number; weekly_impact: string | null; usual: number }
  | { available: false; confirmed_days: number; needed: number };

function figures(summaries: DaySummary[], episodes: Episode[], periods: ZonePeriod[], from: string, to: string): UsualFigures {
  const days = summaries.filter((s) => s.date >= from && s.date <= to);
  const confirmed = days.filter((s) => s.status === "CONFIRMED" && s.score !== null);
  const eps = episodes.filter((e) => { const d = analysisDate(Date.parse(e.started_at), periods); return d >= from && d <= to; });
  const lengths = eps.filter((e) => e.ended_at).map((e) => (Date.parse(e.ended_at!) - Date.parse(e.started_at)) / 60000);
  const med = median(confirmed.map((s) => s.score!));
  const medLen = median(lengths);
  return {
    days: days.length, confirmed_days: confirmed.length, typical_score: med === null ? null : round1(med),
    episodes_per_week: days.length ? round1((eps.length / days.length) * 7) : null,
    typical_episode_minutes: medLen === null ? null : Math.round(medLen),
    completeness: days.length ? Math.round((confirmed.length / days.length) * 100) : null,
  };
}

/** Your usual = the median daily score of the last 28 confirmed days. Never "better" or "worse". */
export function usualScore(summaries: DaySummary[]): number | null {
  const confirmed = summaries.filter((s) => s.status === "CONFIRMED" && s.score !== null).slice(-28);
  return median(confirmed.map((s) => s.score!));
}

export function yourUsual(
  summaries: DaySummary[], episodes: Episode[], periods: ZonePeriod[], today: string, firstDay: string, bloatingDays30: number, weeklyImpact: string | null,
): YourUsual {
  const done = summaries.filter((s) => s.date < today);
  const confirmedAll = done.filter((s) => s.status === "CONFIRMED" && s.score !== null);
  const min = thresholds.your_usual_min_confirmed_days;
  if (confirmedAll.length < min) return { available: false, confirmed_days: confirmedAll.length, needed: min - confirmedAll.length };
  const to = addDays(today, -1);
  const from = addDays(to, -27);
  const firstEnd = addDays(firstDay, 29);
  return {
    available: true, usual: round1(usualScore(done)!),
    recent: figures(done, episodes, periods, from < firstDay ? firstDay : from, to),
    first_30: firstEnd < from ? figures(done, episodes, periods, firstDay, firstEnd) : null,
    bloating_days_30: bloatingDays30, weekly_impact: weeklyImpact,
  };
}

/** After 14 confirmed days each finished day is above, around or below your usual (2 or more over or under). */
export function baselineMarker(score: number | null, usual: number | null, confirmedDays: number): "above" | "around" | "below" | null {
  if (score === null || usual === null || confirmedDays < thresholds.your_usual_min_confirmed_days) return null;
  if (score - usual >= 2) return "above";
  if (usual - score >= 2) return "below";
  return "around";
}

// ---- Your cycle (0.3 fix 17) --------------------------------------------------------------------

export type CycleView =
  | { state: "off" } | { state: "not_offered"; reason: "perimenopause_or_menopause" }
  | { state: "not_enough"; cycles: number; needed_cycles: number; windows?: Record<string, number> }
  | { state: "ready"; cycles: number; before: { mean: number; days: number }; period: { mean: number; days: number }; other: { mean: number; days: number };
      before_vs_other: { difference: number; first_half: number | null; second_half: number | null }; period_vs_other: { difference: number; first_half: number | null; second_half: number | null } };

export function cycleView(on10: string[], cycle: CycleEvent[], summaries: DaySummary[], today: string): CycleView {
  if (on10.includes("perimenopause_or_menopause")) return { state: "not_offered", reason: "perimenopause_or_menopause" };
  if (!on10.includes("cycle_context")) return { state: "off" };
  const cfg = thresholds.cycle;
  const starts = cycle.filter((c) => c.kind === "start").map((c) => c.date).sort();
  const complete = Math.max(0, starts.length - 1); // a cycle is complete when the next period has started
  if (complete < cfg.min_cycles) return { state: "not_enough", cycles: complete, needed_cycles: cfg.min_cycles - complete };
  const period = periodDates(cycle);
  const before = new Set<string>();
  for (const s of starts) for (let i = 1; i <= cfg.before_period_days; i++) { const d = addDays(s, -i); if (!period.has(d)) before.add(d); }
  const first = addDays(starts[0]!, -cfg.before_period_days), last = starts[starts.length - 1]!;
  const groups = { before: [] as Array<[string, number]>, period: [] as Array<[string, number]>, other: [] as Array<[string, number]> };
  for (const s of summaries) {
    if (s.status !== "CONFIRMED" || s.score === null || s.date < first || s.date >= today) continue;
    if (period.has(s.date)) groups.period.push([s.date, s.score]);
    else if (before.has(s.date)) groups.before.push([s.date, s.score]);
    else if (s.date <= addDays(last, 35)) groups.other.push([s.date, s.score]);
  }
  const counts = { before: groups.before.length, period: groups.period.length, other: groups.other.length };
  if (Object.values(counts).some((n) => n < cfg.min_usable_days_per_window)) return { state: "not_enough", cycles: complete, needed_cycles: 0, windows: counts };
  const mid = addDays(first, Math.floor(diffDays(addDays(today, -1), first) / 2));
  const m = (l: Array<[string, number]>) => mean(l.map((x) => x[1]))!;
  const halves = (a: Array<[string, number]>, b: Array<[string, number]>) => {
    const h = (firstHalf: boolean) => {
      const f = (l: Array<[string, number]>) => l.filter(([d]) => (firstHalf ? d <= mid : d > mid)).map((x) => x[1]);
      const x = mean(f(a)), y = mean(f(b));
      return x === null || y === null ? null : round1(x - y);
    };
    return { difference: round1(m(a) - m(b)), first_half: h(true), second_half: h(false) };
  };
  return {
    state: "ready", cycles: complete,
    before: { mean: round1(m(groups.before)), days: counts.before }, period: { mean: round1(m(groups.period)), days: counts.period }, other: { mean: round1(m(groups.other)), days: counts.other },
    before_vs_other: halves(groups.before, groups.other), period_vs_other: halves(groups.period, groups.other),
  };
}

// ---- Medicine before/after (0.3 fix 18) --------------------------------------------------------

export type MedicineView = {
  medicine: string; group: string; event: string; date: string;
  state: "ready" | "not_enough"; before_days: number; after_days: number; before_mean: number | null; after_mean: number | null;
  needed_before: number; needed_after: number;
};

export function medicineViews(meds: Medicine[], changes: MedicineChange[], summaries: DaySummary[], today: string): MedicineView[] {
  const cfg = thresholds.medicine_before_after;
  const out: MedicineView[] = [];
  const events: Array<{ m: Medicine; event: string; date: string }> = [];
  for (const m of meds) {
    if (!m.med_group) continue; // the before/after view needs an MD-04 group
    if (m.started_on && m.started_precision !== "not_sure") events.push({ m, event: "started", date: m.started_on });
    for (const c of changes.filter((x) => x.medicine_id === m.id && x.date && x.date_precision !== "not_sure")) events.push({ m, event: c.change, date: c.date! });
  }
  for (const e of events) {
    const usable = (from: string, to: string) => summaries.filter((s) => s.date >= from && s.date <= to && s.date < today && s.status === "CONFIRMED" && s.score !== null).map((s) => s.score!);
    const before = usable(addDays(e.date, -cfg.days_each_side), addDays(e.date, -1));
    const after = usable(e.date, addDays(e.date, cfg.days_each_side - 1));
    const ready = before.length >= cfg.min_usable_days_each_side && after.length >= cfg.min_usable_days_each_side;
    out.push({
      medicine: e.m.name, group: e.m.med_group!, event: e.event, date: e.date, state: ready ? "ready" : "not_enough",
      before_days: before.length, after_days: after.length,
      // No numbers until both sides have enough days.
      before_mean: ready ? round1(mean(before)!) : null, after_mean: ready ? round1(mean(after)!) : null,
      needed_before: Math.max(0, cfg.min_usable_days_each_side - before.length), needed_after: Math.max(0, cfg.min_usable_days_each_side - after.length),
    });
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

// ---- Time-of-day pattern (P6) ---------------------------------------------------------------------

export function hourPattern(episodes: Episode[], periods: ZonePeriod[]): { available: boolean; episodes: number; hours: number[]; weekdays: number[] } {
  const ended = episodes.filter((e) => e.ended_at || e.state === "END_UNKNOWN");
  const hours = Array<number>(24).fill(0), weekdays = Array<number>(7).fill(0);
  for (const e of ended) {
    const ms = Date.parse(e.started_at);
    const date = analysisDate(ms, periods);
    hours[localParts(ms, zoneForDate(date, periods)).h]!++;
    weekdays[weekday(date)]!++;
  }
  return { available: ended.length >= 10, episodes: ended.length, hours, weekdays };
}

// ---- Context periods shaded on charts ------------------------------------------------------------

export function contextRanges(input: Pick<InsightInput, "cycle" | "medicines" | "medicineChanges" | "observations">, on10: string[], from: string, to: string) {
  const out: Array<{ from: string; to: string; kind: string }> = [];
  const push = (dates: string[], kind: string) => {
    const sorted = [...new Set(dates)].filter((d) => d >= from && d <= to).sort();
    let start: string | null = null, prev: string | null = null;
    for (const d of sorted) {
      if (start && prev && diffDays(d, prev) === 1) { prev = d; continue; }
      if (start && prev) out.push({ from: start, to: prev, kind });
      start = d; prev = d;
    }
    if (start && prev) out.push({ from: start, to: prev, kind });
  };
  push([...periodDates(input.cycle)], "Period");
  push([...medicineChangeDates(input.medicines, input.medicineChanges)], "Medicine change");
  push(input.observations.filter((o) => o.answer === "yes" && o.activity_id === "ACT-18").map((o) => o.date), "Unwell");
  push(input.observations.filter((o) => o.answer === "yes" && o.activity_id === "ACT-20").map((o) => o.date), "Travelling");
  if (on10.includes("perimenopause_or_menopause")) out.push({ from, to, kind: "Perimenopause or menopause" });
  return out;
}

// ---- Weekly averages for the trend line ----------------------------------------------------------

export function weeklyAverages(summaries: DaySummary[], today: string) {
  const byWeek = new Map<string, number[]>();
  for (const s of summaries) {
    if (s.date >= today || (s.status !== "CONFIRMED" && s.status !== "LATE") || s.score === null) continue;
    const w = weekStart(s.date);
    byWeek.set(w, [...(byWeek.get(w) ?? []), s.score]);
  }
  const first = summaries[0]?.date;
  if (!first) return [];
  const out: Array<{ week_start: string; value: number | null; days: number }> = [];
  for (let w = weekStart(first); w < today; w = addDays(w, 7)) {
    const v = byWeek.get(w) ?? [];
    out.push({ week_start: w, value: v.length ? round1(mean(v)!) : null, days: v.length });
  }
  return out;
}

export type { Sample };
