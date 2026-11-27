import "server-only";
import type { Db } from "./supabase";
import type { UserCtx } from "./userdata";
import { bloatingDates } from "./days";
import { doctorLineFor } from "./overview";
import { contextOf, focusOf, loadBundle, triggersOf, usualOf, weeklyImpact, type Bundle } from "./insights";
import { activeExperiment } from "./experiments";
import { experimentsOn } from "./availability";
import { cycleView, hourPattern, INSIGHTS_VERSION, medicineViews, weeklyAverages, type Comparison, type InsightInput, possibleTriggers } from "@/lib/domain/insights";
import { mean, median, round1, sevenDayAverage } from "@/lib/domain/day";
import { experimentDef, result as experimentResult, type Exp } from "@/lib/domain/experiments";
import { phase } from "@/lib/domain/focus";
import { activity, label, METRIC_VERSION, REGISTRY_VERSION, tagLabel } from "@/lib/registry";
import { addDays, analysisDate, localParts, weekStart, zoneForDate } from "@/lib/time";
import { COMPARISON_LINE, INTENDED_USE, MEDICINE_LINE, TRIGGERS_FOOTER } from "@/lib/wording";
import { DOCTOR_SECTIONS, privateDoctorSnapshot, type DoctorSection } from "@/lib/domain/report-privacy";

export const REPORT_VERSIONS = { metric: METRIC_VERSION, insights: INSIGHTS_VERSION, registry: REGISTRY_VERSION, report: "report_v1" };

const slim = (c: Comparison) => ({
  label: c.target.label, kind: c.target.kind, section: c.section, with_days: c.with_days, without_days: c.without_days,
  mean_with: c.mean_with, mean_without: c.mean_without, difference: c.difference, first_half: c.first_half, second_half: c.second_half,
  needed_with: c.needed_with, needed_without: c.needed_without, confounding_note: c.confounding_note, your_suspicion: c.your_suspicion,
});

function inRange<T extends { date: string }>(list: T[], from: string, to: string): T[] {
  return list.filter((x) => x.date >= from && x.date <= to);
}

async function pastExperiments(db: Db, userId: string, b: Bundle) {
  const { data } = await db.from("experiments").select("*").eq("user_id", userId).order("started_on", { ascending: false }).limit(20);
  const { data: days } = await db.from("experiment_days").select("experiment_id,answer").eq("user_id", userId);
  return (data ?? []).map((row) => {
    const e = row as Exp;
    const finished = e.phase === "COMPLETED" || e.phase === "ENDED_EARLY";
    const yes = (days ?? []).filter((d) => d.experiment_id === e.id && d.answer === "yes").length;
    return { id: e.id, name: experimentDef(e.key)?.name ?? e.key, type: e.type, phase: e.phase, started_on: e.started_on, ended_on: e.ended_on, result: finished ? experimentResult(e, b.view.summaries, yes).text : null };
  });
}

/** The weekly Personal Pattern Report (plan A18) for one Monday-to-Sunday week. */
export async function patternSnapshot(db: Db, userId: string, u: UserCtx, now: number, weekOf?: string) {
  const b = await loadBundle(db, userId, u, now, "pro");
  const from = weekOf ? weekStart(weekOf) : weekStart(addDays(weekStart(u.today), -1));
  const to = addDays(from, 6);
  const days = inRange(b.view.summaries, from, to);
  const dateOf = (iso: string) => analysisDate(Date.parse(iso), u.periods);
  const eps = b.view.data.episodes.filter((e) => { const d = dateOf(e.started_at); return d >= from && d <= to; });
  const startHours = eps.map((e) => { const ms = Date.parse(e.started_at); return localParts(ms, zoneForDate(dateOf(e.started_at), u.periods)).h; });
  const t = triggersOf(b);
  const { data: previous } = await db.from("reports").select("snapshot").eq("user_id", userId).eq("kind", "pattern").lt("range_from", from).order("range_from", { ascending: false }).limit(1);
  const before = new Map<string, string>(((previous?.[0]?.snapshot as { triggers?: Array<{ label: string; section: string }> } | undefined)?.triggers ?? []).map((x) => [x.label, x.section]));
  const all = [...t.worth_watching, ...t.no_clear_difference, ...t.not_enough_data, ...t.daily_food].map(slim);
  const changed = all.filter((c) => before.size > 0 && before.get(c.label) !== c.section && (c.section === "worth_watching" || before.get(c.label) === "worth_watching" || c.section === "no_clear_difference"));
  // With experiments switched off, a running experiment is kept but not reported as running.
  const exp = experimentsOn() ? await activeExperiment(db, userId, u.today) : null;
  const obs = b.view.data.observations.filter((o) => o.date >= from && o.date <= to && o.answer === "yes");
  const habitCounts = [...new Set(obs.map((o) => o.activity_id))].map((id) => ({ label: activity(id)?.label ?? id, days: obs.filter((o) => o.activity_id === id).length })).sort((a, b2) => a.label.localeCompare(b2.label));
  const bowel = b.extras.bowel.filter((x) => { const d = dateOf(x.occurred_at); return d >= from && d <= to; });
  const recent = { ...b.view, summaries: b.view.summaries };
  const line = await doctorLineFor(db, userId, u, recent, b.answers);
  return {
    kind: "pattern" as const, from, to, time_zone: u.profile.analysis_time_zone,
    days: days.map((d) => ({ date: d.date, status: d.status, score: d.score, highest_logged: d.highestLogged })),
    counts: { confirmed: days.filter((d) => d.status === "CONFIRMED").length, late: days.filter((d) => d.status === "LATE").length, missing: days.filter((d) => d.status === "UNKNOWN" || d.status === "PROVISIONAL" || d.status === "CONFLICT").length },
    seven_day_average: sevenDayAverage(days),
    episodes: {
      count: eps.length,
      reported_hours: round1(days.reduce((s, d) => s + d.durationMs, 0) / 3600_000), partial: days.some((d) => d.durationPartial),
      usual_start_hour: startHours.length ? Math.round(median(startHours)!) : null,
    },
    triggers: all.map((c) => ({ label: c.label, section: c.section })), triggers_changed: changed,
    worth_watching: all.filter((c) => c.section === "worth_watching"),
    experiment: exp ? { name: experimentDef(exp.key)?.name ?? exp.key, phase: exp.phase } : null,
    bowel: { entries: bowel.length, strained: bowel.filter((x) => x.strain === "yes").length, incomplete: bowel.filter((x) => x.complete === "no").length, no_days: inRange(b.view.data.reviews, from, to).filter((r) => r.bowel_answer === "no").length },
    habits: habitCounts,
    next_best_log: focusOf(b, t).next?.text ?? null,
    doctor_line: line.show ? line : null,
    footer: `${TRIGGERS_FOOTER} Bloat Buddy doesn't diagnose.`, comparison_line: COMPARISON_LINE,
    versions: REPORT_VERSIONS,
  };
}

/** Your journey (plan 0.4): the user's whole story on one screen. Sections are ordered by the goal. */
export async function journeySnapshot(db: Db, userId: string, u: UserCtx, now: number, proSince: string | null) {
  const b = await loadBundle(db, userId, u, now, "pro");
  const t = triggersOf(b);
  const done = b.view.summaries.filter((s) => s.date < u.today);
  const tracked = done.filter((s) => s.status !== "UNKNOWN").length;
  const confirmed = done.filter((s) => s.status === "CONFIRMED").length;
  const usual = await usualOf(db, userId, u, b);
  const exps = await pastExperiments(db, userId, b);
  const active = exps.find((e) => ["RUNNING", "ADDING_BACK", "PAUSED"].includes(e.phase)) ?? null;
  const ph = phase(u.profile.logging_mode, proSince, u.today, t.worth_watching.length > 0, !!active);
  const strengths = b.view.data.samples.map((s) => s.strength);
  const lengths = b.view.data.episodes.filter((e) => e.ended_at).map((e) => (Date.parse(e.ended_at!) - Date.parse(e.started_at)) / 60000);
  const line = await doctorLineFor(db, userId, u, b.view, b.answers);
  const missing: string[] = [];
  const unreviewed = done.filter((s) => s.status === "PROVISIONAL" || s.status === "UNKNOWN").length;
  if (unreviewed) missing.push(`${unreviewed} of ${done.length} days have no confirmed score.`);
  const conflicts = done.filter((s) => s.status === "CONFLICT").length;
  if (conflicts) missing.push(`${conflicts} ${conflicts === 1 ? "day needs" : "days need"} correcting before comparisons can run.`);
  if (t.not_enough_data.length) missing.push(`${t.not_enough_data.length} food groups or habits don't have enough days to compare yet.`);
  if (!b.followed.length) missing.push("You don't follow any habits, so no habit can be compared.");
  const xOn = experimentsOn();
  // The Understand step points to experiments; with experiments switched off it has no next step.
  const next = { Discover: "Keep logging. Possible triggers appear once a food group or habit has 7 days with it and 7 days without.", Understand: xOn ? "A short experiment can test one pattern at a time." : null, Maintain: "You are keeping an eye on a few food groups. One tap in You returns to full logging." }[ph];
  const goals = u.profile.goals;
  const order = ["since", "usual", "records", "tried", "phase", "missing", "monthly"];
  const front = goals.includes("getting_ready_for_a_doctor_visit") ? ["doctor"] : goals.includes("which_foods_affect_me") || goals.includes("whether_timing_or_habits_matter") ? ["records"] : goals.includes("whether_my_cycle_plays_a_part") ? ["records"] : goals.includes("how_my_bloating_changes_over_time") ? ["since", "usual"] : [];
  return {
    kind: "journey" as const, from: b.firstDay, to: addDays(u.today, -1), goals,
    section_order: [...new Set([...front, ...order])],
    since: {
      days_tracked: tracked, days: done.length, confirmed_days: confirmed, completeness: done.length ? Math.round((confirmed / done.length) * 100) : null,
      bloating_days_30: bloatingDates(b.view.summaries, u.today, 30).length,
      typical_strength: strengths.length ? round1(median(strengths)!) : null, strength_readings: strengths.length,
      typical_episode_minutes: lengths.length ? Math.round(median(lengths)!) : null, episodes_with_length: lengths.length,
      trend: weeklyAverages(b.view.summaries, u.today),
    },
    your_usual: usual,
    records: {
      worth_watching: t.worth_watching.map(slim), examined: t.examined, header: t.header,
      cycle: cycleView(b.on10, b.extras.cycle, b.view.summaries, u.today),
      medicines: medicineViews(b.extras.medicines, b.extras.medicineChanges, b.view.summaries, u.today),
    },
    tried: exps, experiments_offered: xOn,
    phase: { label: ph, next },
    missing,
    monthly: { hours: hourPattern(b.view.data.episodes, u.periods), coverage: { confirmed, late: done.filter((s) => s.status === "LATE").length, days: done.length }, context: contextOf(b) },
    doctor_line: line.show ? line : null,
    comparison_line: COMPARISON_LINE, medicine_line: MEDICINE_LINE, footer: TRIGGERS_FOOTER,
    versions: REPORT_VERSIONS,
  };
}

export type DoctorOptions = { from: string; to: string; questions: string | null; sections: Record<string, boolean> };
export { DOCTOR_SECTIONS };

/** The doctor report (0.3 fix 25): a one-page summary, then fixed sections. Everything is self-reported. */
export async function doctorSnapshot(db: Db, userId: string, u: UserCtx, now: number, o: DoctorOptions) {
  const b = await loadBundle(db, userId, u, now, "pro", { from: o.from, to: o.to });
  const input: InsightInput = { ...b.input, from: o.from, to: o.to };
  const t = possibleTriggers(input);
  const dateOf = (iso: string) => analysisDate(Date.parse(iso), u.periods);
  const days = inRange(b.view.summaries, o.from, o.to);
  const confirmed = days.filter((d) => d.status === "CONFIRMED");
  const eps = b.view.data.episodes.filter((e) => { const d = dateOf(e.started_at); return d >= o.from && d <= o.to; });
  const epIds = eps.map((e) => e.id);
  const strengths = b.view.data.samples.filter((s) => epIds.includes(s.episode_id)).map((s) => s.strength);
  const lengths = eps.filter((e) => e.ended_at).map((e) => (Date.parse(e.ended_at!) - Date.parse(e.started_at)) / 60000);
  const [warn, sym, cond, lact, tests, fam] = await Promise.all([
    epIds.length ? db.from("warning_signs").select("episode_id,code").eq("user_id", userId).in("episode_id", epIds) : Promise.resolve({ data: [] }),
    epIds.length ? db.from("episode_symptoms").select("episode_id,code").eq("user_id", userId).in("episode_id", epIds) : Promise.resolve({ data: [] }),
    db.from("health_conditions").select("condition,status,year").eq("user_id", userId),
    db.from("lactose_details").select("breath_test,after_dairy").eq("user_id", userId).maybeSingle(),
    db.from("health_tests").select("test,date,result_text").eq("user_id", userId).order("date"),
    db.from("question_responses").select("value,status").eq("user_id", userId).eq("question_id", "FH-01").order("answered_at", { ascending: false }).limit(1),
  ]);
  const tally = (rows: Array<{ code: unknown }>, q: string) => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(r.code as string, (m.get(r.code as string) ?? 0) + 1);
    return [...m.entries()].map(([code, times]) => ({ label: label(q, code), times })).sort((a, b2) => a.label.localeCompare(b2.label));
  };
  const feel = new Map<string, number>();
  for (const e of eps) for (const f of e.feel) feel.set(f, (feel.get(f) ?? 0) + 1);
  const meals = b.view.data.meals.filter((m) => { const d = dateOf(m.eaten_at); return d >= o.from && d <= o.to; });
  const mealIds = new Set(meals.map((m) => m.id));
  const groupDays = new Map<string, Set<string>>();
  const mealDate = new Map(meals.map((m) => [m.id, dateOf(m.eaten_at)]));
  for (const i of b.view.data.ingredients) {
    if (!mealIds.has(i.meal_id) || i.answer !== "had" || i.food_group === "other") continue;
    groupDays.set(i.food_group, (groupDays.get(i.food_group) ?? new Set()).add(mealDate.get(i.meal_id)!));
  }
  const obs = b.view.data.observations.filter((x) => x.date >= o.from && x.date <= o.to);
  const bowel = b.extras.bowel.filter((x) => { const d = dateOf(x.occurred_at); return d >= o.from && d <= o.to; });
  const exercise = b.extras.exercise.filter((x) => { const d = dateOf(x.started_at); return d >= o.from && d <= o.to; });
  const impact = await weeklyImpact(db, userId);
  const recentLine = await doctorLineFor(db, userId, u, b.view, b.answers);
  const exps = (await pastExperiments(db, userId, b)).filter((e) => e.started_on <= o.to && (e.ended_on ?? o.to) >= o.from);
  const on = (k: string) => o.sections[k] !== false;
  const on10 = b.on10;
  const missing: string[] = [];
  const noScore = days.length - confirmed.length - days.filter((d) => d.status === "LATE").length;
  if (noScore) missing.push(`${noScore} of ${days.length} days have no confirmed daily score.`);
  if (eps.some((e) => !e.ended_at)) missing.push("Some bloating records have no known end time, so time bloated is partial.");
  const freeMeals = meals.filter((m) => m.ai_check_status !== "checked" && m.ai_check_status !== "recalled").length;
  if (freeMeals) missing.push(`${freeMeals} of ${meals.length} meals have no confirmed ingredient list.`);
  missing.push("All entries are self-reported and have not been checked by anyone. Possible triggers are patterns in the records, not proof of a cause.");

  const snapshot = {
    kind: "doctor" as const, from: o.from, to: o.to, time_zone: u.profile.analysis_time_zone, generated_at: new Date(now).toISOString(),
    included: DOCTOR_SECTIONS.filter((k) => on(k)) as DoctorSection[],
    notice: "This report was made by the person named on it from their own Bloat Buddy diary. Everything in it is self-reported.",
    intended_use: INTENDED_USE,
    summary: {
      tracking_days: days.length, confirmed_days: confirmed.length, completeness: days.length ? Math.round((confirmed.length / days.length) * 100) : null,
      // Every field below comes from one section, and is left out when that section is off.
      bloating_days_30: on("symptoms") ? bloatingDates(b.view.summaries, u.today, 30).length : null,
      typical_strength: on("symptoms") && strengths.length ? round1(median(strengths)!) : null,
      average_daily_score: on("symptoms") && confirmed.length ? round1(mean(confirmed.map((d) => d.score!))!) : null,
      typical_episode_minutes: on("symptoms") && lengths.length ? Math.round(median(lengths)!) : null,
      how_long: on("symptoms") && b.answers["ON-08"] ? label("ON-08", b.answers["ON-08"] as string) : null,
      how_often: on("symptoms") && b.answers["ON-07"] ? label("ON-07", b.answers["ON-07"] as string) : null,
      weekly_impact: on("symptoms") && impact ? label("WK-01", impact) : null,
      patterns: t.worth_watching.map(slim).filter((p) => (p.kind === "habit" ? on("habits") : on("meals"))),
      medicines: !on("medicines") ? [] : b.extras.medicines.map((m) => ({
        name: m.name, type: m.type, group: m.med_group ? label("MD-04", m.med_group) : null, started_on: m.started_on,
        changes: b.extras.medicineChanges.filter((c) => c.medicine_id === m.id).map((c) => ({ change: c.change.replace(/_/g, " "), date: c.date })),
      })),
      context: !on("health") ? [] : [
        ...(on10.includes("perimenopause_or_menopause") ? ["Perimenopause or menopause"] : []), ...(on10.includes("pregnancy") ? ["Pregnancy"] : []),
        ...(on10.includes("breastfeeding") ? ["Breastfeeding"] : []), ...(on10.includes("cycle_context") ? [`Periods logged: ${b.extras.cycle.filter((c) => c.kind === "start" && c.date >= o.from && c.date <= o.to).length}`] : []),
        ...(b.answers["ON-14"] && b.answers["ON-14"] !== "prefer_not_to_say" ? [`Age range: ${label("ON-14", b.answers["ON-14"] as string)}`] : []),
      ],
      warning_signs: on("symptoms") ? tally((warn.data ?? []) as Array<{ code: unknown }>, "EP-08a") : [],
      doctor_line: on("symptoms") && recentLine.show ? { sentence: recentLine.sentence, ovarian: on("health") ? recentLine.ovarianSentence : null, source: recentLine.source, days: recentLine.days } : null,
      questions: o.questions,
    },
    sections: {
      symptoms: on("symptoms") ? {
        episodes: eps.length, days_with_bloating: new Set(eps.map((e) => dateOf(e.started_at))).size,
        feel: [...feel.entries()].map(([code, times]) => ({ label: label("EP-03", code), times })),
        other: tally((sym.data ?? []) as Array<{ code: unknown }>, "EP-08"),
        eased: eps.filter((e) => e.eased).length ? { yes: eps.filter((e) => e.eased === "yes").length, no: eps.filter((e) => e.eased === "no").length } : null,
        usually_worst: b.answers["ON-12"] ? (b.answers["ON-12"] as string[]).map((v) => label("ON-12", v)) : null,
        hours: hourPattern(eps, u.periods),
      } : null,
      meals: on("meals") ? { meals: meals.length, groups: [...groupDays.entries()].map(([g, set]) => ({ label: tagLabel(g), days: set.size })).sort((a, b2) => a.label.localeCompare(b2.label)), triggers: { examined: t.examined, no_clear_difference: t.no_clear_difference.map(slim), not_enough_data: t.not_enough_data.length } } : null,
      bowel: on("bowel") ? { entries: bowel.length, strained: bowel.filter((x) => x.strain === "yes").length, incomplete: bowel.filter((x) => x.complete === "no").length, days_without: inRange(b.view.data.reviews, o.from, o.to).filter((r) => r.bowel_answer === "no").length, descriptions: [...new Set(bowel.map((x) => x.stool_type).filter(Boolean))].map((s) => ({ label: label("BW-02", s!), times: bowel.filter((x) => x.stool_type === s).length })) } : null,
      habits: on("habits") ? { logged: [...new Set(obs.filter((x) => x.answer === "yes").map((x) => x.activity_id))].map((id) => ({ label: activity(id)?.label ?? id, days: obs.filter((x) => x.activity_id === id && x.answer === "yes").length })).sort((a, b2) => a.label.localeCompare(b2.label)), exercise: { sessions: exercise.length, minutes: exercise.reduce((s, x) => s + x.minutes, 0) } } : null,
      medicines: on("medicines") ? medicineViews(b.extras.medicines, b.extras.medicineChanges, b.view.summaries, u.today) : null,
      health: on("health") ? { conditions: (cond.data ?? []).map((c) => ({ label: label("HC-01", c.condition as string), status: c.status ? label("HC-02", c.status as string) : null, year: c.year })), lactose: lact.data ?? null } : null,
      family: on("family") && fam.data?.[0]?.status === "answered" ? (fam.data[0].value as string[]).map((v) => label("FH-01", v)) : null,
      tests: on("tests") ? (tests.data ?? []).map((x) => ({ label: label("HC-04", x.test as string) === x.test ? String(x.test).replace(/_/g, " ") : label("HC-04", x.test as string), date: x.date, result: x.result_text })) : null,
      experiments: on("experiments") ? exps : null,
      missing: on("missing") ? missing : null,
    },
    comparison_line: COMPARISON_LINE, medicine_line: on("medicines") ? MEDICINE_LINE : null, footer: TRIGGERS_FOOTER, versions: REPORT_VERSIONS,
  };
  return privateDoctorSnapshot(snapshot);
}
export type DoctorSnapshot = Awaited<ReturnType<typeof doctorSnapshot>>;
