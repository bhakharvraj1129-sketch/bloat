// Builders for rule tests: synthetic records only.
import type { DaySummary } from "@/lib/domain/day";
import type { ExposureContext } from "@/lib/domain/exposure";
import type { InsightInput } from "@/lib/domain/insights";
import type { Episode, Ingredient, Meal, Observation, Review, Sample } from "@/lib/domain/types";
import { addDays } from "@/lib/time";

export const ZONE = "America/New_York";
export const periods = [{ effective_from: "1970-01-01", zone: ZONE }];
let n = 0;
const id = () => `id-${++n}`;

/** A wall-clock time in New York winter time (UTC-5) or summer time (UTC-4) as an ISO instant. */
export const ny = (date: string, time: string, offset = "-04:00") => new Date(`${date}T${time}:00${offset}`).toISOString();

export function meal(date: string, time: string, o: Partial<Meal> & { items?: Array<[string, string, Ingredient["answer"], Ingredient["source"]?]> } = {}) {
  const m: Meal = {
    id: id(), eaten_at: ny(date, time), zone: ZONE, offset_min: -240, time_precision: "exact", dish_text: "meal", portion: null, amount_count: null,
    amount_unit: null, pace: null, origin: "home", source: "typed", saved_dish_id: null, saved_dish_confirmed: false, ai_check_status: "checked", revision: 1, ...o,
  };
  const ingredients: Ingredient[] = (o.items ?? []).map(([name, group, answer, source]) => ({
    id: id(), meal_id: m.id, name, food_group: group, answer, source: source ?? "ai_confirmed", source_label: "usually_in_recipe", ai_listed: true,
  }));
  return { m, ingredients };
}

export function review(date: string, worst: number | null, o: Partial<Review> = {}): Review {
  return {
    date, worst, cannot_remember: false, whole_day: "yes", food_coverage: "all", bowel_answer: null, watched: {},
    reviewed_at: ny(addDays(date, 1), "08:00"), late: false, metric_version: "daily_worst_v1", revision: 1, ...o,
  };
}

export function episode(date: string, start: string, end: string | null, strength: number): { e: Episode; s: Sample } {
  const e: Episode = {
    id: id(), started_at: ny(date, start), start_zone: ZONE, start_offset_min: -240, start_precision: "exact",
    ended_at: end ? ny(date, end) : null, end_precision: end ? "exact" : null, state: end ? "CLOSED_REPORTED_TIME" : "OPEN", feel: [], eased: null, revision: 1,
  };
  return { e, s: { id: id(), episode_id: e.id, strength, observed_at: e.started_at } };
}

export function summary(date: string, score: number | null, o: Partial<DaySummary> = {}): DaySummary {
  return {
    date, status: score === null ? "UNKNOWN" : "CONFIRMED", score, highestLogged: null, provisionalZero: false, conflictReason: null,
    coverage: "ALL", episodeCount: 0, durationMs: 0, durationPartial: false, ...o,
  };
}

export type DaySpec = {
  score: number | null; with?: boolean | null; coverage?: DaySummary["coverage"]; status?: DaySummary["status"]; habit?: "yes" | "no" | "not_sure" | null;
  origin?: string; extra?: Array<[string, string, Ingredient["answer"], Ingredient["source"]?]>; large?: boolean; taps?: string[];
};

/**
 * Build an insight input from one spec per day. `with` true = a home-made lunch whose confirmed
 * list contains the group; false = a home-made lunch whose list does not; null = no meals.
 */
export function world(start: string, days: DaySpec[], group = "TAG-09", o: { followed?: string[]; habitId?: string } = {}): InsightInput {
  const summaries: DaySummary[] = [], reviews: Review[] = [], meals: Meal[] = [], observations: Observation[] = [];
  const ingredientsByMeal = new Map<string, Ingredient[]>();
  days.forEach((d, i) => {
    const date = addDays(start, i);
    const coverage = d.coverage ?? "ALL";
    summaries.push(summary(date, d.score, { coverage, status: d.status ?? (d.score === null ? "UNKNOWN" : "CONFIRMED") }));
    const cov = { ALL: "all", MOSTLY: "mostly", SOME: "some", NONE: "none_recorded", UNKNOWN: "not_sure", NO_INTAKE: "i_ate_and_drank_nothing" }[coverage] as Review["food_coverage"];
    if (d.score !== null) reviews.push(review(date, d.score, { food_coverage: cov }));
    if (d.with !== null && d.with !== undefined) {
      const items: Array<[string, string, Ingredient["answer"], Ingredient["source"]?]> = [...(d.extra ?? [])];
      if (d.with) items.push(["item", group, "had"]);
      else items.push(["rice-side", "TAG-08", "didnt_have"]);
      const built = meal(date, "12:30", { origin: d.origin ?? "home", items, portion: d.large ? "large" : "medium" });
      meals.push(built.m);
      ingredientsByMeal.set(built.m.id, built.ingredients);
    }
    if (d.habit) observations.push({ id: id(), date, activity_id: o.habitId ?? "ACT-08", answer: d.habit, detail: null, observed_at: null, source: d.habit === "yes" ? "tap" : "review" });
    for (const t of d.taps ?? []) observations.push({ id: id(), date, activity_id: t, answer: "yes", detail: null, observed_at: null, source: "tap" });
  });
  const ctx: ExposureContext = { periods, meals, ingredientsByMeal, episodes: [], samples: [] };
  const to = addDays(start, days.length - 1);
  return {
    from: start, to, today: addDays(to, 1), periods, summaries, reviews, observations, ctx, followed: o.followed ?? [], cycle: [], medicines: [], medicineChanges: [],
  };
}

export const rep = (count: number, spec: DaySpec): DaySpec[] => Array.from({ length: count }, () => ({ ...spec }));
