import { ApiError, ok, route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { daysView, mealsOn } from "@/server/days";
import { diffDays, isDate, analysisDate } from "@/lib/time";
import { activity, tagLabel } from "@/lib/registry";
import { episodeDates } from "@/lib/domain/day";

// Day detail: status, score, the day's timeline and the review answers, for correcting any record.
export const GET = route({ feature: "history_list" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const date = ctx.params.date!;
  if (!isDate(date) || date > u.today) throw new ApiError(422, "VALIDATION", "That date is not valid.");
  if (diffDays(u.today, date) > 3650) throw new ApiError(422, "VALIDATION", "That date is not valid.");
  const view = await daysView(ctx.db, ctx.userId, u, date, date, ctx.now);
  const s = view.summaries[0]!;
  const on = (iso: string) => analysisDate(Date.parse(iso), u.periods) === date;
  // The same rule the day's summary uses (episodeDates): a finished record is on every local date it
  // overlaps, so a Monday-to-Wednesday record is also on Tuesday, and one that ends exactly at
  // midnight is not on the next day; an open or unknown-end record is on its start date only.
  const episodes = view.data.episodes.filter((e) => episodeDates(e, u.periods).includes(date));
  const epIds = episodes.map((e) => e.id);
  const [{ data: warnings }, { data: symptoms }, { data: bowel }, { data: exercise }] = await Promise.all([
    epIds.length ? ctx.db.from("warning_signs").select("episode_id,code").eq("user_id", ctx.userId).in("episode_id", epIds) : Promise.resolve({ data: [] }),
    epIds.length ? ctx.db.from("episode_symptoms").select("episode_id,code").eq("user_id", ctx.userId).in("episode_id", epIds) : Promise.resolve({ data: [] }),
    ctx.db.from("bowel_movements").select("*").eq("user_id", ctx.userId).order("occurred_at"),
    ctx.db.from("exercise_records").select("*").eq("user_id", ctx.userId).order("started_at"),
  ]);
  const meals = mealsOn(date, u, view.data);
  return ok({
    date, today: u.today, plan: ctx.plan, date_format: u.profile.date_format, units: u.profile.units, zone: u.zone,
    status: s.status, score: s.score, highest_logged: s.highestLogged, provisional_zero: s.provisionalZero,
    conflict_reason: s.conflictReason, duration_ms: s.durationMs, duration_partial: s.durationPartial,
    review: view.data.reviews[0] ?? null,
    episodes: episodes.map((e) => ({
      ...e,
      samples: view.data.samples.filter((x) => x.episode_id === e.id),
      warning_signs: (warnings ?? []).filter((w) => w.episode_id === e.id).map((w) => w.code),
      symptoms: (symptoms ?? []).filter((w) => w.episode_id === e.id).map((w) => w.code),
    })),
    meals: meals.map((m) => ({
      ...m,
      ingredients: view.data.ingredients.filter((i) => i.meal_id === m.id).map((i) => ({
        name: i.name, food_group: i.food_group, group_label: tagLabel(i.food_group), answer: i.answer, source: i.source, source_label: i.source_label,
      })),
    })),
    activities: view.data.observations.filter((o) => o.date === date).map((o) => ({ ...o, label: activity(o.activity_id)?.label ?? o.activity_id })),
    bowel: (bowel ?? []).filter((b) => on(b.occurred_at)),
    exercise: (exercise ?? []).filter((x) => on(x.started_at)),
  });
});
