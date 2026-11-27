import "server-only";
import type { Ctx } from "./http";
import type { UserCtx } from "./userdata";
import type { DaysView } from "./days";
import { adaptiveOf, focusOf, loadBundle, triggersOf } from "./insights";
import { activeExperiment } from "./experiments";
import { experimentsOn, featureOff } from "./availability";
import { cardForToday } from "./cards";
import { dayNumber, experimentDef } from "@/lib/domain/experiments";
import { phase, shortcuts } from "@/lib/domain/focus";
import { addDays, analysisDate } from "@/lib/time";

/** Recent dishes for Add meal, and the adaptive "More" lists (everyone, plan 0.4). */
function recents(u: UserCtx, view: DaysView) {
  const from = addDays(u.today, -30);
  const recent = view.data.meals.filter((m) => analysisDate(Date.parse(m.eaten_at), u.periods) >= from);
  const counts = new Map<string, number>();
  for (const m of recent) counts.set(m.dish_text, (counts.get(m.dish_text) ?? 0) + 1);
  const frequent = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 5).map(([d]) => d);
  const latest = [...new Set([...recent].reverse().map((m) => m.dish_text))].slice(0, 5);
  return { frequent, latest };
}

export async function todayExtras(ctx: Ctx<unknown>, u: UserCtx, view: DaysView, _answers: Record<string, unknown> = {}) {
  const r = recents(u, view);
  const b = await loadBundle(ctx.db, ctx.userId, u, ctx.now, ctx.plan);
  const adaptiveLists = adaptiveOf(u, b);
  if (ctx.plan !== "pro") {
    // Free: recent dishes and adaptive logging only. No Pro value of any kind.
    return { pro: null, recent_dishes: r.frequent.length ? r.frequent : r.latest, adaptive: adaptiveLists };
  }
  const t = triggersOf(b);
  const f = focusOf(b, t);
  // With experiments switched off, a running experiment is kept as it is but not shown or asked about.
  const xOn = experimentsOn();
  const exp = xOn ? await activeExperiment(ctx.db, ctx.userId, u.today) : null;
  const [card, { data: dishes }, { data: xpDay }] = await Promise.all([
    featureOff("daily_cards") ? Promise.resolve(null) : cardForToday(ctx.db, ctx.userId, u, b),
    ctx.db.from("saved_dishes").select("id,name,place").eq("user_id", ctx.userId).eq("archived", false).order("created_at", { ascending: false }).limit(12),
    exp ? ctx.db.from("experiment_days").select("date").eq("user_id", ctx.userId).eq("experiment_id", exp.id).eq("date", u.today) : Promise.resolve({ data: [] }),
  ]);
  return {
    recent_dishes: r.latest, adaptive: adaptiveLists,
    pro: {
      phase: { label: phase(u.profile.logging_mode, ctx.entitlement?.pro_since ?? null, u.today, t.worth_watching.length > 0, !!exp) },
      experiment: exp ? { id: exp.id, name: experimentDef(exp.key)?.name ?? exp.key, phase: exp.phase, ...dayNumber(exp, u.today), answered_today: (xpDay ?? []).length > 0 } : null,
      card: card ? { id: card.card.id, title: card.card.title, kind: card.card.kind } : null,
      next_best_log: f.next, shortcuts: shortcuts(u.profile.goals).filter((s) => xOn || s.href !== "/experiments"),
      // Add meal shows saved dishes and the 5 most frequent dishes of the last 30 days first.
      frequent_dishes: r.frequent, saved_dishes: dishes ?? [],
    },
  };
}
