import { ok, route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { getExperiment } from "@/server/experiment-route";
import { daysView } from "@/server/days";
import { doctorLineFor } from "@/server/overview";
import { dayNumber, experimentDef, result } from "@/lib/domain/experiments";
import { helpline } from "@/lib/registry";
import { addDays } from "@/lib/time";
import { KIWI_WARNING, STOP_IF_WORSE } from "@/lib/wording";

// Screen 33: progress and, when finished, the result in its fixed template.
export const GET = route({ feature: "experiments_habit" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const e = await getExperiment(ctx.db, ctx.userId, ctx.params.id!, u.today);
  const def = experimentDef(e.key);
  const [{ data: days }, { data: wb }] = await Promise.all([
    ctx.db.from("experiment_days").select("date,answer").eq("user_id", ctx.userId).eq("experiment_id", e.id).order("date"),
    ctx.db.from("wellbeing_checks").select("checked_at").eq("user_id", ctx.userId).eq("experiment_id", e.id).order("checked_at", { ascending: false }).limit(1),
  ]);
  const finished = e.phase === "COMPLETED" || e.phase === "ENDED_EARLY";
  let res = null;
  let doctorNote: string | null = null;
  if (finished) {
    const from = addDays(e.started_on, -7);
    const to = e.add_back_ends_on ?? e.ended_on ?? u.today;
    const view = await daysView(ctx.db, ctx.userId, u, from, to >= u.today ? addDays(u.today, -1) : to, ctx.now);
    res = result(e, view.summaries, (days ?? []).filter((d) => d.answer === "yes").length);
    // The doctor line's "after changing your diet" part also appears on a food result with no change.
    const n = res.numbers;
    if (res.kind === "food" && n && Math.abs((n.before ?? 0) - (n.during ?? 0)) < 1) {
      const recent = await daysView(ctx.db, ctx.userId, u, addDays(u.today, -29), u.today, ctx.now);
      doctorNote = (await doctorLineFor(ctx.db, ctx.userId, u, recent)).sentence;
    }
  }
  const lastWb = wb?.[0]?.checked_at as string | undefined;
  const wellbeingDue = e.type === "swap" && (e.phase === "RUNNING" || e.phase === "ADDING_BACK") && (!lastWb || Date.parse(lastWb) < ctx.now - 7 * 86400000) && u.today >= addDays(e.started_on, 6);
  return ok({
    experiment: { ...e, name: def?.name, instruction: def?.instruction, swap: def?.swap ?? null, source: def?.source, ...dayNumber(e, u.today) },
    days: days ?? [], answered_today: (days ?? []).some((d) => d.date === u.today), today: u.today,
    wellbeing_due: wellbeingDue, helpline: e.phase === "PAUSED" ? helpline(u.profile.residence_country) : null,
    stop_line: STOP_IF_WORSE, warning: def?.needs_no_allergy ? KIWI_WARNING : null,
    result: res, doctor_note: doctorNote, date_format: u.profile.date_format,
  });
});
