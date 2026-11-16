// Bloat Score and day status (plan A09, A10). Deterministic and versioned: metric daily_worst_v1.
import { addDays, analysisDate, dayBoundsUtc, splitByDate, zoneForDate, type ZonePeriod } from "../time";
import { thresholds } from "../registry";
import type { DayStatus, Episode, FoodCoverage, Mark, Review, Sample } from "./types";

export type DayInput = {
  date: string;
  review: Review | null;
  mark: Mark | null;
  /** Episodes that touch this date. */
  episodes: Episode[];
  /** Strength samples observed on this date. */
  samples: Sample[];
};

export type DaySummary = {
  date: string;
  status: DayStatus;
  /** Confirmed daily worst (0–10). Only for CONFIRMED and LATE. */
  score: number | null;
  /** Highest strength reading logged on the date, or null. */
  highestLogged: number | null;
  provisionalZero: boolean;
  conflictReason: "review_below_logged" | "zero_after_episode" | null;
  coverage: FoodCoverage;
  episodeCount: number;
  durationMs: number;
  durationPartial: boolean;
};

const COVERAGE: Record<string, FoodCoverage> = {
  all: "ALL", mostly: "MOSTLY", some: "SOME", none_recorded: "NONE", not_sure: "UNKNOWN", i_ate_and_drank_nothing: "NO_INTAKE",
};

export function coverageOf(review: Review | null): FoodCoverage {
  if (!review?.food_coverage) return "UNKNOWN";
  return COVERAGE[review.food_coverage] ?? "UNKNOWN";
}

/** A review is timely when entered by the end of the following analysis-zone day; later is LATE. */
export function isLate(date: string, reviewedAtMs: number, periods: ZonePeriod[]): boolean {
  const next = addDays(date, 1);
  const [, deadline] = dayBoundsUtc(next, zoneForDate(next, periods));
  return reviewedAtMs >= deadline;
}

export function summarizeDay(input: DayInput, periods: ZonePeriod[], nowMs: number): DaySummary {
  const { date, review, mark, episodes, samples } = input;
  const highestLogged = samples.length ? Math.max(...samples.map((s) => s.strength)) : null;
  const hasEpisode = episodes.length > 0;

  let status: DayStatus;
  let score: number | null = null;
  let conflictReason: DaySummary["conflictReason"] = null;

  if (!review) {
    status = hasEpisode || highestLogged !== null || mark ? "PROVISIONAL" : "UNKNOWN";
  } else if (review.cannot_remember || review.worst === null || review.whole_day !== "yes") {
    // Part of the day, not sure, or "I can't remember": never a confirmed score.
    status = "PROVISIONAL";
  } else if (highestLogged !== null && review.worst < highestLogged) {
    status = "CONFLICT";
    conflictReason = "review_below_logged";
  } else if (review.worst === 0 && hasEpisode) {
    status = "CONFLICT";
    conflictReason = "zero_after_episode";
  } else {
    status = review.late ? "LATE" : "CONFIRMED";
    score = review.worst;
  }

  // Reported duration: disjoint timed episodes per date; partial when any end is unknown or still open.
  let durationMs = 0;
  let durationPartial = false;
  const zone = zoneForDate(date, periods);
  const [dayStart, dayEnd] = dayBoundsUtc(date, zone);
  for (const e of episodes) {
    const start = Date.parse(e.started_at);
    if (e.ended_at) {
      const end = Date.parse(e.ended_at);
      durationMs += Math.max(0, Math.min(end, dayEnd) - Math.max(start, dayStart));
    } else {
      durationPartial = true;
      if (e.state === "OPEN") {
        // Open-record timer only: time so far, clearly partial. Never imputed after the fact.
        durationMs += Math.max(0, Math.min(nowMs, dayEnd) - Math.max(start, dayStart));
      }
    }
  }

  return {
    date, status, score, highestLogged,
    provisionalZero: !review && !hasEpisode && highestLogged === null && !!mark,
    conflictReason, coverage: coverageOf(review), episodeCount: episodes.length, durationMs, durationPartial,
  };
}

/** Which local dates an episode touches. Open and unknown-end episodes touch only their start date. */
export function episodeDates(e: Episode, periods: ZonePeriod[]): string[] {
  const start = Date.parse(e.started_at);
  if (!e.ended_at) return [analysisDate(start, periods)];
  return Object.keys(splitByDate(start, Date.parse(e.ended_at), periods));
}

export type DayBuckets = Map<string, DayInput>;

/** Group raw records into per-date inputs for a date range (inclusive). */
export function bucketDays(
  from: string, to: string, periods: ZonePeriod[],
  data: { reviews: Review[]; marks: Mark[]; episodes: Episode[]; samples: Sample[] },
): DayBuckets {
  const out: DayBuckets = new Map();
  for (let d = from; d <= to; d = addDays(d, 1)) out.set(d, { date: d, review: null, mark: null, episodes: [], samples: [] });
  for (const r of data.reviews) { const b = out.get(r.date); if (b) b.review = r; }
  for (const m of data.marks) { const b = out.get(m.date); if (b) b.mark = m; }
  for (const e of data.episodes) for (const d of episodeDates(e, periods)) out.get(d)?.episodes.push(e);
  for (const s of data.samples) out.get(analysisDate(Date.parse(s.observed_at), periods))?.samples.push(s);
  return out;
}

export type Average = { available: true; value: number; days: number; late: number; label: string } | { available: false; days: number; needed: number };

/** 7-day average: the last 7 completed dates, confirmed and late only, at least 4 usable (plan A09). */
export function sevenDayAverage(summaries: DaySummary[]): Average {
  const usable = summaries.filter((s) => s.status === "CONFIRMED" || s.status === "LATE");
  const min = thresholds.seven_day_average_min;
  if (usable.length < min) return { available: false, days: usable.length, needed: min - usable.length };
  const late = usable.filter((s) => s.status === "LATE").length;
  const value = Math.round((usable.reduce((a, s) => a + (s.score ?? 0), 0) / usable.length) * 10) / 10;
  return { available: true, value, days: usable.length, late, label: `Average of ${usable.length} days (${late} late)` };
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

export function mean(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export const round1 = (n: number) => Math.round(n * 10) / 10;
