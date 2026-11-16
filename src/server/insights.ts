import "server-only";
import type { Db } from "./supabase";
import { loadAnswers, loadExtras, type UserCtx } from "./userdata";
import { bloatingDates, daysView, type DaysView } from "./days";
import { historyFrom } from "./overview";
import { possibleTriggers, yourUsual, cycleView, medicineViews, hourPattern, contextRanges, weeklyAverages, usualScore, type InsightInput, type Triggers } from "@/lib/domain/insights";
import { personalFocus, nextBestLog, adaptive, type FocusInput } from "@/lib/domain/focus";
import { activities, optionValues } from "@/lib/registry";
import { addDays, analysisDate } from "@/lib/time";
import type { Ingredient } from "@/lib/domain/types";

export type Bundle = {
  view: DaysView; input: InsightInput; answers: Record<string, unknown>; extras: Awaited<ReturnType<typeof loadExtras>>;
  followed: string[]; firstDay: string; symptomsByDate: Map<string, Set<string>>; focus: FocusInput; on10: string[];
};

/** Everything the insight rules need, loaded once per request for the last 92 days. */
export async function loadBundle(db: Db, userId: string, u: UserCtx, now: number, plan: "free" | "pro", range?: { from: string; to: string }): Promise<Bundle> {
  const firstDay = historyFrom(u);
  const view = await daysView(db, userId, u, firstDay, u.today, now);
  const [answers, extras, fol, sus, sym, focusRows, impacts] = await Promise.all([
    loadAnswers(db, userId), loadExtras(db, userId),
    db.from("followed_activities").select("activity_id,position").eq("user_id", userId).order("position"),
    db.from("episode_suspicions").select("kind,meal_id,activity_id").eq("user_id", userId),
    db.from("episode_symptoms").select("episode_id,code").eq("user_id", userId),
    db.from("focus_state").select("*").eq("user_id", userId),
    db.from("weekly_impacts").select("week_start,answer").eq("user_id", userId).order("week_start", { ascending: false }).limit(1),
  ]);
  const followed = (fol.data ?? []).map((f) => f.activity_id as string);
  const ingredientsByMeal = new Map<string, Ingredient[]>();
  for (const i of view.data.ingredients) ingredientsByMeal.set(i.meal_id, [...(ingredientsByMeal.get(i.meal_id) ?? []), i]);
  const suspicionGroups = new Set<string>(), suspicionActs = new Set<string>();
  for (const s of sus.data ?? []) {
    if (s.kind === "activity" && s.activity_id) suspicionActs.add(s.activity_id as string);
    if (s.kind === "meal" && s.meal_id) for (const i of ingredientsByMeal.get(s.meal_id as string) ?? []) if (i.answer === "had") suspicionGroups.add(i.food_group);
  }
  const epDate = new Map(view.data.episodes.map((e) => [e.id, analysisDate(Date.parse(e.started_at), u.periods)]));
  const symptomsByDate = new Map<string, Set<string>>();
  for (const s of sym.data ?? []) {
    const d = epDate.get(s.episode_id as string);
    if (d) symptomsByDate.set(d, (symptomsByDate.get(d) ?? new Set()).add(s.code as string));
  }
  const input: InsightInput = {
    from: range?.from ?? firstDay, to: range?.to ?? addDays(u.today, -1), today: u.today, periods: u.periods,
    summaries: view.summaries, reviews: view.data.reviews, observations: view.data.observations,
    ctx: { periods: u.periods, meals: view.data.meals, ingredientsByMeal, episodes: view.data.episodes, samples: view.data.samples },
    followed, cycle: extras.cycle, medicines: extras.medicines, medicineChanges: extras.medicineChanges,
    suspicions: { groups: [...suspicionGroups], activities: [...suspicionActs] },
  };
  const on10 = (answers["ON-10"] as string[] | undefined) ?? [];
  const dismissed: FocusInput["dismissed"] = {};
  for (const r of focusRows.data ?? []) dismissed[r.rule as string] = { until: r.dismissed_until as string | null, count: r.dismiss_count as number };
  const focus: FocusInput = {
    today: u.today, periods: u.periods, plan, summaries: view.summaries, episodes: view.data.episodes, meals: view.data.meals,
    observations: view.data.observations, symptomsByDate,
    bowelNoDates: view.data.reviews.filter((r) => r.bowel_answer === "no").map((r) => r.date), bowelEntries: extras.bowel.length,
    followed, comparisons: [], suspicions: (sus.data ?? []).filter((s) => s.kind !== "not_sure").length,
    cycleContext: on10.includes("cycle_context"), menopause: on10.includes("perimenopause_or_menopause"),
    cycleStarts: extras.cycle.filter((c) => c.kind === "start").length, dismissed,
  };
  void impacts;
  return { view, input, answers, extras, followed, firstDay, symptomsByDate, focus, on10 };
}

export function triggersOf(b: Bundle): Triggers {
  return possibleTriggers(b.input);
}

export async function weeklyImpact(db: Db, userId: string): Promise<string | null> {
  const { data } = await db.from("weekly_impacts").select("answer").eq("user_id", userId).neq("answer", "skip").order("week_start", { ascending: false }).limit(1);
  return (data?.[0]?.answer as string | undefined) ?? null;
}

export async function usualOf(db: Db, userId: string, u: UserCtx, b: Bundle) {
  const days30 = bloatingDates(b.view.summaries, u.today, 30).length;
  return yourUsual(b.view.summaries, b.view.data.episodes, u.periods, u.today, b.firstDay, days30, await weeklyImpact(db, userId));
}

export function focusOf(b: Bundle, t: Triggers) {
  const all = [...t.worth_watching, ...t.no_clear_difference, ...t.not_enough_data, ...t.daily_food];
  const input = { ...b.focus, comparisons: all };
  return { cards: personalFocus(input), next: nextBestLog(input) };
}

export function adaptiveOf(u: UserCtx, b: Bundle) {
  return adaptive(u.today, b.firstDay, b.view.data.observations, b.symptomsByDate, activities.map((a) => a.id), optionValues("EP-08"));
}

export function contextOf(b: Bundle) {
  return contextRanges(b.input, b.on10, b.firstDay, b.input.today);
}

export { cycleView, medicineViews, hourPattern, weeklyAverages, usualScore };
