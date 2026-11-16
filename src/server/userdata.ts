import "server-only";
import type { Db } from "./supabase";
import { ApiError } from "./http";
import { addDays, dayBoundsUtc, zoneForDate, zonedToUtc, offsetMinutes, isValidZone, analysisDate, type ZonePeriod } from "@/lib/time";
import type { Bowel, CycleEvent, Episode, Exercise, Ingredient, Mark, Meal, Medicine, MedicineChange, Observation, Review, Sample } from "@/lib/domain/types";

export type Profile = {
  user_id: string; residence_country: "US" | "CA" | "IN"; region: string | null; time_zone: string;
  analysis_time_zone: string; units: "us" | "metric"; date_format: "MM/DD" | "DD/MM"; cuisines: string[];
  subcuisines: string[]; food_preferences: string[]; goals: string[]; logging_mode: "full" | "keep_an_eye";
  watched_groups: string[]; keep_meal_photos: boolean; hide_charts: boolean; onboarding_completed_at: string | null;
  status: string; revision: number; created_at: string;
};

export type UserCtx = { profile: Profile; periods: ZonePeriod[]; today: string; zone: string };

function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new ApiError(500, "SERVER_ERROR", "Something went wrong. Nothing was saved.");
  return res.data as T;
}

export async function loadUser(db: Db, userId: string, now: number): Promise<UserCtx> {
  const [p, z] = await Promise.all([
    db.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    db.from("zone_periods").select("effective_from,zone").eq("user_id", userId),
  ]);
  const profile = must(p) as Profile | null;
  if (!profile) throw new ApiError(409, "ONBOARDING_PENDING", "Finish setting up your account first.");
  if (profile.status !== "active") throw new ApiError(403, "ACCOUNT_SUSPENDED", "This account is not active.");
  const periods = (must(z) as ZonePeriod[]) ?? [];
  if (periods.length === 0) periods.push({ effective_from: "1970-01-01", zone: profile.analysis_time_zone });
  const today = analysisDate(now, periods);
  return { profile, periods, today, zone: zoneForDate(today, periods) };
}

export type RangeData = {
  episodes: Episode[]; samples: Sample[]; reviews: Review[]; marks: Mark[]; meals: Meal[];
  ingredients: Ingredient[]; observations: Observation[];
};

/** Everything needed to describe the days from..to (inclusive), padded by a day on each side. */
export async function loadRange(db: Db, userId: string, u: UserCtx, from: string, to: string): Promise<RangeData> {
  const start = new Date(dayBoundsUtc(addDays(from, -1), zoneForDate(from, u.periods))[0]).toISOString();
  const end = new Date(dayBoundsUtc(addDays(to, 1), zoneForDate(to, u.periods))[1]).toISOString();
  const [ep, rv, mk, ml, ob] = await Promise.all([
    db.from("episodes").select("*").eq("user_id", userId).lte("started_at", end).or(`ended_at.gte.${start},ended_at.is.null`).order("started_at"),
    db.from("day_reviews").select("*").eq("user_id", userId).gte("date", from).lte("date", to),
    db.from("day_marks").select("*").eq("user_id", userId).gte("date", from).lte("date", to),
    db.from("meals").select("*").eq("user_id", userId).gte("eaten_at", start).lte("eaten_at", end).order("eaten_at"),
    db.from("activity_observations").select("*").eq("user_id", userId).gte("date", addDays(from, -1)).lte("date", to),
  ]);
  const episodes = (must(ep) as Episode[]).filter((e) => e.ended_at !== null || e.started_at >= start);
  const meals = must(ml) as Meal[];
  const epIds = episodes.map((e) => e.id);
  const mealIds = meals.map((m) => m.id);
  const [sm, ing] = await Promise.all([
    epIds.length ? db.from("strength_samples").select("*").eq("user_id", userId).in("episode_id", epIds).order("observed_at") : Promise.resolve({ data: [], error: null }),
    mealIds.length ? db.from("meal_ingredients").select("*").eq("user_id", userId).in("meal_id", mealIds) : Promise.resolve({ data: [], error: null }),
  ]);
  return {
    episodes, samples: must(sm) as Sample[], reviews: must(rv) as Review[], marks: must(mk) as Mark[], meals,
    ingredients: must(ing) as Ingredient[], observations: must(ob) as Observation[],
  };
}

export async function loadExtras(db: Db, userId: string) {
  const [cy, md, mc, bw, ex] = await Promise.all([
    db.from("cycle_events").select("*").eq("user_id", userId).order("date"),
    db.from("medicines").select("*").eq("user_id", userId).order("created_at"),
    db.from("medicine_changes").select("*").eq("user_id", userId).order("created_at"),
    db.from("bowel_movements").select("*").eq("user_id", userId).order("occurred_at"),
    db.from("exercise_records").select("*").eq("user_id", userId).order("started_at"),
  ]);
  return {
    cycle: must(cy) as CycleEvent[], medicines: must(md) as Medicine[], medicineChanges: must(mc) as MedicineChange[],
    bowel: must(bw) as Bowel[], exercise: must(ex) as Exercise[],
  };
}

/** Latest answer per onboarding or profile question. Skipped answers are unknown. */
export async function loadAnswers(db: Db, userId: string): Promise<Record<string, unknown>> {
  const rows = must(await db.from("question_responses").select("question_id,value,status,answered_at").eq("user_id", userId).order("answered_at"));
  const out: Record<string, unknown> = {};
  for (const r of rows as Array<{ question_id: string; value: unknown; status: string }>) {
    if (r.status === "answered") out[r.question_id] = r.value;
    else delete out[r.question_id];
  }
  return out;
}

export type TimeInput =
  | { mode: "now" }
  | { mode: "exact" | "approximate"; local: string; offset_min?: number; zone?: string };

export type ResolvedTime = { ms: number; iso: string; zone: string; offset_min: number; precision: "exact" | "approximate" };

/**
 * Turn a time answer into a stored instant (plan A03): future times are rejected, a clock time that
 * does not exist needs correcting, and an ambiguous one needs an explicit offset choice.
 */
export function resolveTime(input: TimeInput, u: UserCtx, now: number): ResolvedTime {
  const zone = "zone" in input && input.zone && isValidZone(input.zone) ? input.zone : u.profile.time_zone;
  if (input.mode === "now") {
    return { ms: now, iso: new Date(now).toISOString(), zone, offset_min: offsetMinutes(now, zone), precision: "exact" };
  }
  const candidates = zonedToUtc(input.local, zone);
  if (candidates.length === 0) {
    throw new ApiError(422, "NONEXISTENT_TIME", "That clock time did not exist that day (the clocks changed). Pick another time.");
  }
  let ms = candidates[0]!;
  if (candidates.length > 1) {
    const choice = candidates.find((c) => offsetMinutes(c, zone) === input.offset_min);
    if (choice === undefined) {
      throw new ApiError(422, "AMBIGUOUS_TIME", "That clock time happened twice that day (the clocks changed). Choose which one.", {
        choices: candidates.map((c) => ({ offset_min: offsetMinutes(c, zone) })),
      });
    }
    ms = choice;
  }
  if (ms > now + 60_000) throw new ApiError(422, "FUTURE_TIME", "That time is in the future.");
  return { ms, iso: new Date(ms).toISOString(), zone, offset_min: offsetMinutes(ms, zone), precision: input.mode };
}
