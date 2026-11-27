import { ok, route } from "@/server/http";
import { loadAnswers, loadUser } from "@/server/userdata";
import { daysView, mealsOn } from "@/server/days";
import { historyFrom, progressCounter, weekStrip } from "@/server/overview";
import { addDays, analysisDate, weekStart, weekday } from "@/lib/time";
import { isPaused } from "@/lib/domain/plan";
import { thresholds, activity } from "@/lib/registry";
import { ApiError } from "@/server/http";
import { todayExtras } from "@/server/today";
import { featuresOff } from "@/server/availability";
import { CONSENT_RECONFIRM } from "@/lib/wording";

// Everything Today needs in one answer: open episode, pending review, plan, flags.
export const GET = route({}, async (ctx) => {
  let u;
  try {
    u = await loadUser(ctx.db, ctx.userId, ctx.now);
  } catch (e) {
    if (e instanceof ApiError && e.code === "ONBOARDING_PENDING") {
      return ok({ onboarded: false, plan: ctx.plan });
    }
    throw e;
  }
  const from = historyFrom(u);
  const view = await daysView(ctx.db, ctx.userId, u, from, u.today, ctx.now);
  const today = view.summaries[view.summaries.length - 1]!;
  const yesterday = addDays(u.today, -1);
  const ySummary = view.summaries.find((s) => s.date === yesterday);
  const open = view.data.episodes.find((e) => e.state === "OPEN") ?? null;
  const { data: openRow } = open ? { data: open } : await ctx.db.from("episodes").select("*").eq("user_id", ctx.userId).eq("state", "OPEN").maybeSingle();
  let openEpisode = null;
  if (openRow) {
    const { data: samples } = await ctx.db.from("strength_samples").select("strength,observed_at").eq("user_id", ctx.userId).eq("episode_id", openRow.id).order("observed_at");
    const openMs = ctx.now - Date.parse(openRow.started_at);
    openEpisode = {
      id: openRow.id, started_at: openRow.started_at, start_precision: openRow.start_precision, revision: openRow.revision,
      samples: samples ?? [], current_strength: samples?.length ? samples[samples.length - 1]!.strength : null,
      // EP-07: asked on app open once an episode has been open 8 hours. The timer alone proves nothing.
      ask_still_happening: openMs >= thresholds.still_happening_after_hours * 3600_000,
    };
  }
  const [{ data: followed }, { data: reviewRow }, answers, { data: impact }, { data: consentRows }] = await Promise.all([
    ctx.db.from("followed_activities").select("activity_id,position").eq("user_id", ctx.userId).order("position"),
    ctx.db.from("day_reviews").select("date").eq("user_id", ctx.userId).eq("date", yesterday).maybeSingle(),
    loadAnswers(ctx.db, ctx.userId),
    ctx.db.from("weekly_impacts").select("week_start").eq("user_id", ctx.userId).eq("week_start", weekStart(addDays(weekStart(u.today), -1))).maybeSingle(),
    ctx.db.from("consents").select("type,version,granted_at,created_at").eq("user_id", ctx.userId).in("type", Object.keys(CONSENT_RECONFIRM)).order("created_at"),
  ]);
  // A required consent given with wording that has since changed (D33) is asked again once.
  const latestConsent = new Map<string, { version: string; granted_at: string | null }>();
  for (const c of consentRows ?? []) latestConsent.set(c.type as string, { version: c.version as string, granted_at: c.granted_at as string | null });
  const consentsDue = (Object.entries(CONSENT_RECONFIRM) as Array<[string, string]>)
    .filter(([type, from]) => { const c = latestConsent.get(type); return !!c?.granted_at && c.version < from; })
    .map(([type]) => type);

  const timeline = [
    ...mealsOn(u.today, u, view.data).map((m) => ({ kind: "meal" as const, id: m.id, at: m.eaten_at, text: m.dish_text })),
    ...view.data.episodes.filter((e) => analysisDate(Date.parse(e.started_at), u.periods) === u.today).map((e) => {
      const strengths = view.data.samples.filter((s) => s.episode_id === e.id).map((s) => s.strength);
      return { kind: "episode" as const, id: e.id, at: e.started_at, text: "Bloating", strongest: strengths.length ? Math.max(...strengths) : null, open: e.state === "OPEN" };
    }),
    ...view.data.observations.filter((o) => o.date === u.today && o.answer === "yes").map((o) => ({
      kind: "activity" as const, id: o.id, at: o.observed_at ?? null, text: activity(o.activity_id)?.label ?? o.activity_id,
    })),
  ].sort((a, b) => String(a.at ?? "").localeCompare(String(b.at ?? "")));

  const on10 = (answers["ON-10"] as string[] | undefined) ?? [];
  const extras = await todayExtras(ctx, u, view, answers);
  return ok({
    onboarded: true,
    plan: ctx.plan,
    // Features this deployment does not offer (invited beta): screens hide their buttons and links.
    unavailable: featuresOff(),
    paused: isPaused(ctx.entitlement, ctx.now),
    profile: {
      country: u.profile.residence_country, region: u.profile.region, time_zone: u.profile.time_zone, analysis_time_zone: u.profile.analysis_time_zone,
      units: u.profile.units, date_format: u.profile.date_format, logging_mode: u.profile.logging_mode,
      watched_groups: u.profile.watched_groups, goals: u.profile.goals, cuisines: u.profile.cuisines,
      keep_meal_photos: u.profile.keep_meal_photos, hide_charts: u.profile.hide_charts, revision: u.profile.revision,
    },
    today: {
      date: u.today,
      // Today never shows a confirmed Bloat Score: only the highest reading logged so far.
      highest_logged: today.highestLogged, provisional_zero: today.provisionalZero,
      episodes: today.episodeCount, duration_ms: today.durationMs, duration_partial: today.durationPartial,
    },
    open_episode: openEpisode,
    pending_review: !reviewRow && yesterday >= from ? { date: yesterday, highest_logged: ySummary?.highestLogged ?? null } : null,
    weekly_impact_due: weekday(u.today) === 1 && !impact,
    followed: (followed ?? []).map((f) => f.activity_id),
    cycle_context: on10.includes("cycle_context"),
    progress: progressCounter(u, view),
    consents_due: consentsDue,
    // This week, Monday first: which days have anything logged (no scores, no judgement).
    week: weekStrip(u, view),
    timeline,
    ...extras,
  });
});
