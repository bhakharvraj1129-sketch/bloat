// Food group and habit exposure per day (plan A10, fixes 0.1 and 0.2). Unknown always stays unknown.
import { addDays, analysisDate, localParts, zoneForDate, type ZonePeriod } from "../time";
import type { Episode, Exposure, FoodCoverage, Ingredient, Meal, Observation, Review, Sample } from "./types";

export type MealKnowledge = "contains" | "not_contains" | "unknown";

const COUNTED_SOURCES = new Set(["ai_confirmed", "user_added", "saved_dish", "recalled"]);
/** Activity taps that also mean a food group was had, without double counting (plan A12). */
export const ACTIVITY_TAG: Record<string, string> = { "ACT-22": "TAG-12", "ACT-24": "TAG-11" };

/** Does this meal have a confirmed ingredient list (so that an unlisted group can mean anything)? */
function hasConfirmedList(meal: Meal): boolean {
  return meal.ai_check_status === "checked" || meal.ai_check_status === "recalled" || (meal.source === "saved_dish" && meal.saved_dish_confirmed);
}

export function mealKnowledge(meal: Meal, ingredients: Ingredient[], group: string): MealKnowledge {
  const inGroup = ingredients.filter((i) => i.food_group === group);
  if (inGroup.some((i) => i.answer === "had" && COUNTED_SOURCES.has(i.source))) return "contains";
  if (inGroup.length > 0) {
    // Not sure, unknown, guesses, "I don't know", failed checks: unknown for this group only.
    if (inGroup.every((i) => i.answer === "didnt_have" && COUNTED_SOURCES.has(i.source))) return "not_contains";
    return "unknown";
  }
  // Group not listed. The AI can miss hidden ingredients, so this means "not present" only for
  // home-made meals and confirmed saved dishes (fix 0.2, tests Q149 and Q150).
  if (!hasConfirmedList(meal)) return "unknown";
  if (meal.origin === "home" || (meal.source === "saved_dish" && meal.saved_dish_confirmed)) return "not_contains";
  return "unknown";
}

export type ExposureContext = {
  periods: ZonePeriod[];
  meals: Meal[];
  ingredientsByMeal: Map<string, Ingredient[]>;
  episodes: Episode[];
  samples: Sample[];
};

/** Start of the day's strongest episode: highest reading, earliest start on a tie. */
export function strongestEpisodeStart(date: string, ctx: ExposureContext): number | null {
  let best: { strength: number; start: number } | null = null;
  for (const e of ctx.episodes) {
    const start = Date.parse(e.started_at);
    const end = e.ended_at ? Date.parse(e.ended_at) : start;
    const touches = analysisDate(start, ctx.periods) <= date && analysisDate(end, ctx.periods) >= date;
    if (!touches) continue;
    const strengths = ctx.samples.filter((s) => s.episode_id === e.id).map((s) => s.strength);
    const strength = strengths.length ? Math.max(...strengths) : 0;
    if (!best || strength > best.strength || (strength === best.strength && start < best.start)) best = { strength, start };
  }
  return best ? best.start : null;
}

/**
 * Meals that count for day D: meals on D plus meals from 18:00 on the day before, excluding meals
 * eaten after the start of D's strongest episode (those fall into D+1's window if from 18:00).
 */
export function windowMeals(date: string, ctx: ExposureContext): Meal[] {
  const prev = addDays(date, -1);
  const peak = strongestEpisodeStart(date, ctx);
  return ctx.meals.filter((m) => {
    const t = Date.parse(m.eaten_at);
    const d = analysisDate(t, ctx.periods);
    if (d === date) return peak === null || t <= peak;
    if (d === prev) {
      const hour = localParts(t, zoneForDate(prev, ctx.periods)).h;
      return hour >= 18 && (peak === null || t <= peak);
    }
    return false;
  });
}

export type GroupExposure = { exposure: Exposure; recalled: boolean; source: "meals" | "watched" | "activity" | "none" };

export function groupExposure(
  date: string, group: string, coverage: FoodCoverage, review: Review | null,
  observations: Observation[], ctx: ExposureContext,
): GroupExposure {
  // Keep an eye on it mode: an explicit KM-02 Yes or No sets the exposure for that group.
  const watched = review?.watched?.[group];
  if (watched === "yes") return { exposure: "PRESENT", recalled: false, source: "watched" };
  if (watched === "no") return { exposure: "ABSENT", recalled: false, source: "watched" };
  if (watched === "not_sure") return { exposure: "UNKNOWN", recalled: false, source: "watched" };

  for (const [act, tag] of Object.entries(ACTIVITY_TAG)) {
    if (tag === group && observations.some((o) => o.date === date && o.activity_id === act && o.answer === "yes")) {
      return { exposure: "PRESENT", recalled: false, source: "activity" };
    }
  }

  const meals = windowMeals(date, ctx);
  let anyUnknown = false;
  let recalled = false;
  for (const m of meals) {
    const ings = ctx.ingredientsByMeal.get(m.id) ?? [];
    const k = mealKnowledge(m, ings, group);
    if (k === "contains") {
      return { exposure: "PRESENT", recalled: ings.some((i) => i.food_group === group && i.source === "recalled"), source: "meals" };
    }
    if (k === "unknown") anyUnknown = true;
    if (ings.some((i) => i.source === "recalled")) recalled = true;
  }
  // Absence needs ALL coverage (a "Mostly" day could hide the food in the missed snack) and every
  // meal in the window known not to contain the group.
  if (coverage === "NO_INTAKE" && meals.every((m) => analysisDate(Date.parse(m.eaten_at), ctx.periods) !== date) && !anyUnknown) {
    return { exposure: "ABSENT", recalled, source: "meals" };
  }
  if (coverage === "ALL" && meals.length > 0 && !anyUnknown) return { exposure: "ABSENT", recalled, source: "meals" };
  return { exposure: "UNKNOWN", recalled: false, source: "none" };
}

/** Habit exposure: a tap is Yes; only followed habits ever get an explicit No. Untapped is unknown. */
export function habitExposure(date: string, activityId: string, observations: Observation[]): Exposure {
  const o = observations.find((x) => x.date === date && x.activity_id === activityId);
  if (!o) return "UNKNOWN";
  if (o.answer === "yes") return "PRESENT";
  if (o.answer === "no") return "ABSENT";
  return "UNKNOWN";
}

/** Large-meal days (ML-04 Large), compared like a habit (0.3 fix 19). Absence needs ALL coverage. */
export function largeMealExposure(date: string, coverage: FoodCoverage, ctx: ExposureContext): Exposure {
  const todays = ctx.meals.filter((m) => analysisDate(Date.parse(m.eaten_at), ctx.periods) === date);
  if (todays.some((m) => m.portion === "large")) return "PRESENT";
  if (coverage === "ALL" && todays.length > 0 && todays.every((m) => m.portion && m.portion !== "not_sure")) return "ABSENT";
  return "UNKNOWN";
}
