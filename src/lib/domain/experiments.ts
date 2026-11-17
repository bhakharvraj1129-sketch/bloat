// Experiments (plan A15): seven habit experiments and five like-for-like swaps. Fixed instructions,
// fixed result templates, and cautious eligibility. Wheat and multi-group programmes are never offered.
import { config, helpline, thresholds } from "../registry";
import { addDays, diffDays } from "../time";
import { mean, round1, type DaySummary } from "./day";

export type ExperimentDef = {
  key: string; type: "habit" | "swap"; name: string; instruction: string; source: string; days: number;
  food_group?: string; swap?: string; target?: { kind: "food" | "habit"; id: string }; needs_no_allergy?: boolean; warning?: string;
  /** Set while an experiment is under review: it is shown as not offered and the server refuses to start it. */
  paused?: string;
};

export const PAUSED_FOR_REVIEW = "Paused for now while its instructions are reviewed.";

const swapText = (group: string) => config.swap_experiments.find((s) => s.group === group)!.swap;

export const EXPERIMENTS: ExperimentDef[] = [
  { key: "eat_more_slowly", type: "habit", name: "Eat more slowly", instruction: "Sit down for main meals; fork down between bites; about 20 minutes per meal.", source: "NIDDK", days: 7, target: { kind: "habit", id: "ACT-01" } },
  { key: "no_gum_or_hard_candy", type: "habit", name: "No gum or hard candy", instruction: "None for the week.", source: "NIDDK", days: 7, target: { kind: "habit", id: "ACT-03" } },
  { key: "no_straws", type: "habit", name: "No straws", instruction: "Drink from the glass or cup.", source: "NIDDK", days: 7, target: { kind: "habit", id: "ACT-04" } },
  { key: "fewer_fizzy_drinks", type: "habit", name: "Fewer fizzy drinks", instruction: "Swap soda, sparkling water and energy drinks for still drinks.", source: "NIDDK, NHS", days: 7, target: { kind: "food", id: "TAG-09" } },
  { key: "walk_after_meals", type: "habit", name: "Walk after meals", instruction: "Gentle 10–15 minutes after main meals, if comfortable.", source: "NHS; 2021 RCT", days: 7, target: { kind: "habit", id: "ACT-08" } },
  { key: "slow_breathing", type: "habit", name: "Slow breathing", instruction: "3 minutes diaphragmatic breathing, 3 times a day.", source: "2025 RCT; NHS", days: 7 },
  // Paused 18 Nov 2026 at the owner's request: its source link was broken, and the BDA guideline
  // (PMC12623288) describes 2-3 kiwifruit a day for at least 4 weeks, not 7 days. Proposed
  // correction in docs/content/proposed-corrections-2026-11-18.md. Not offered until approved.
  { key: "kiwifruit_for_regularity", type: "habit", name: "Kiwifruit for regularity", instruction: "2 whole kiwifruit a day.", source: "BDA 2025", days: 7, needs_no_allergy: true, warning: "Don't try this if you're allergic to kiwi", paused: PAUSED_FOR_REVIEW },
  { key: "swap_lactose_free_dairy", type: "swap", name: "Swap: lactose-free dairy", instruction: `Swap milk and soft dairy for: ${swapText("TAG-01")}.`, source: "NIDDK", days: 14, food_group: "TAG-01", swap: swapText("TAG-01"), target: { kind: "food", id: "TAG-01" } },
  { key: "swap_onion_and_garlic", type: "swap", name: "Swap: onion and garlic", instruction: `Swap onion and garlic for: ${swapText("TAG-03")}.`, source: "Monash", days: 14, food_group: "TAG-03", swap: swapText("TAG-03"), target: { kind: "food", id: "TAG-03" } },
  { key: "swap_beans_and_lentils", type: "swap", name: "Swap: beans and lentils", instruction: `Swap beans and lentils for: ${swapText("TAG-04")}.`, source: "NIDDK, NHS", days: 14, food_group: "TAG-04", swap: swapText("TAG-04"), target: { kind: "food", id: "TAG-04" } },
  { key: "swap_sugar_free_sweets_and_gum", type: "swap", name: "Swap: sugar-free sweets and gum", instruction: `Swap sugar-free sweets and gum for: ${swapText("TAG-06")}.`, source: "NIDDK", days: 14, food_group: "TAG-06", swap: swapText("TAG-06"), target: { kind: "food", id: "TAG-06" } },
  { key: "swap_apples_pears_and_honey", type: "swap", name: "Swap: apples, pears and honey", instruction: `Swap apples, pears and honey for: ${swapText("TAG-05")}.`, source: "NIDDK", days: 14, food_group: "TAG-05", swap: swapText("TAG-05"), target: { kind: "food", id: "TAG-05" } },
];

export const experimentDef = (key: string) => EXPERIMENTS.find((e) => e.key === key) ?? null;

/** Keys that look like a wheat, grain, FODMAP or multi-group programme: always NOT_OFFERED. */
export function isNeverOffered(key: string, groups?: string[]): boolean {
  if (groups && groups.length > 1) return true;
  if (groups?.includes("TAG-02")) return true;
  return /wheat|grain|gluten|fodmap|multi|elimination|tag-?02/i.test(key);
}

export type FxAnswers = { fx01: string; fx02: string; fx03: string; fx04: string };
// HC-01 conditions that close swap experiments whatever the FX answers say.
export const BLOCKING_CONDITIONS = ["coeliac_disease", "food_allergy", "crohn_s_or_ulcerative_colitis"];

/** Anything other than No on any FX question means swaps are not offered. Habit experiments stay open. */
export function fxResult(a: FxAnswers, country: string) {
  const passed = [a.fx01, a.fx02, a.fx03, a.fx04].every((x) => x === "no");
  const notes: Array<{ text: string; helpline?: string | null; help_link?: boolean }> = [];
  if (!passed) {
    notes.push({ text: "Swap experiments aren't offered for you. Habit experiments and all your recording are still here." });
    // FX-02: the country helpline is shown.
    if (a.fx02 !== "no") notes.push({ text: "If food or eating is a worry, support is available.", helpline: helpline(country) });
    if (a.fx04 === "yes") notes.push({ text: "Losing weight without trying is worth raising with a doctor.", help_link: true });
  }
  return { passed, notes };
}

export type Exp = {
  id: string; type: "habit" | "swap"; key: string; food_group: string | null;
  phase: "RUNNING" | "ADDING_BACK" | "PAUSED" | "COMPLETED" | "ENDED_EARLY"; paused_from: "RUNNING" | "ADDING_BACK" | null;
  started_on: string; swap_ends_on: string | null; add_back_ends_on: string | null; ended_on: string | null; end_reason: string | null;
  result: Record<string, unknown> | null; created_at?: string;
};

/**
 * Move an experiment forward by date. A swap step ends by itself after 2 weeks and the 1-week
 * add-back is required before any result; a habit experiment completes after its 7 days.
 */
export function advance(e: Exp, today: string): Partial<Exp> | null {
  if (e.phase === "RUNNING" && e.type === "habit") {
    const last = addDays(e.started_on, 6);
    if (today > last) return { phase: "COMPLETED", ended_on: last };
  }
  if (e.phase === "RUNNING" && e.type === "swap" && e.swap_ends_on && today > e.swap_ends_on) {
    const addBackEnd = addDays(e.swap_ends_on, thresholds.swap_add_back_weeks * 7);
    if (today > addBackEnd) return { phase: "COMPLETED", add_back_ends_on: addBackEnd, ended_on: addBackEnd };
    return { phase: "ADDING_BACK", add_back_ends_on: addBackEnd };
  }
  if (e.phase === "ADDING_BACK" && e.add_back_ends_on && today > e.add_back_ends_on) return { phase: "COMPLETED", ended_on: e.add_back_ends_on };
  return null;
}

export function dayNumber(e: Exp, today: string): { day: number; of: number } {
  if (e.type === "habit") return { day: Math.min(7, diffDays(today, e.started_on) + 1), of: 7 };
  if (e.phase === "ADDING_BACK" && e.swap_ends_on) return { day: Math.min(7, diffDays(today, e.swap_ends_on)), of: 7 };
  const of = e.swap_ends_on ? diffDays(e.swap_ends_on, e.started_on) + 1 : 14;
  return { day: Math.min(of, diffDays(today, e.started_on) + 1), of };
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const stats = (summaries: DaySummary[], from: string, to: string) => {
  const scores = summaries.filter((s) => s.date >= from && s.date <= to && s.status === "CONFIRMED" && s.score !== null).map((s) => s.score!);
  return { n: scores.length, avg: scores.length ? round1(mean(scores)!) : null, total: Math.max(0, diffDays(to, from) + 1) };
};

export type ExpResult = { kind: "felt_worse" | "not_enough" | "habit" | "food"; text: string; help_link: boolean; numbers: Record<string, number | null> | null };

/** Fixed result templates (plan A15). Enough data = 4+ confirmed days in each period and 4+ "Yes" days. */
export function result(e: Exp, summaries: DaySummary[], yesDays: number): ExpResult {
  const def = experimentDef(e.key);
  if (e.end_reason === "i_felt_worse") {
    return { kind: "felt_worse", text: "You ended this experiment because you felt worse. If symptoms are severe or worrying, see When to get medical help.", help_link: true, numbers: null };
  }
  const min = thresholds.experiment_prior_confirmed_min;
  const before = stats(summaries, addDays(e.started_on, -7), addDays(e.started_on, -1));
  const duringEnd = e.type === "swap" ? (e.swap_ends_on ?? e.ended_on ?? e.started_on) : (e.ended_on ?? addDays(e.started_on, 6));
  const during = stats(summaries, e.started_on, duringEnd);
  const notEnough = (n: number, total: number): ExpResult => ({
    kind: "not_enough", help_link: false, numbers: null,
    text: `There aren't enough days to compare yet. You logged a confirmed score on ${n} of ${total} days.`,
  });
  if (yesDays < thresholds.experiment_yes_days_min || during.n < min || before.n < min) return notEnough(during.n, during.total);
  if (e.type === "habit") {
    return {
      kind: "habit", help_link: false, numbers: { during: during.avg, during_days: during.n, before: before.avg, before_days: before.n },
      text: `During the experiment your average Bloat Score was ${fmt(during.avg!)} (${during.n} days). In the 7 days before it was ${fmt(before.avg!)} (${before.n} days). This is a pattern in your own records, not proof that the change caused it.`,
    };
  }
  const after = e.swap_ends_on && e.add_back_ends_on ? stats(summaries, addDays(e.swap_ends_on, 1), e.add_back_ends_on) : { n: 0, avg: null, total: 7 };
  if (after.n < min) return notEnough(after.n, after.total);
  const group = (def?.name ?? "the food").replace(/^Swap: /, "");
  return {
    kind: "food", help_link: false, numbers: { before: before.avg, before_days: before.n, during: during.avg, during_days: during.n, after: after.avg, after_days: after.n },
    text: `Before: ${fmt(before.avg!)} (${before.n} days). While swapping ${group}: ${fmt(during.avg!)} (${during.n} days). After adding it back: ${fmt(after.avg!)} (${after.n} days). This is a pattern in your own records, not proof that the food caused it. Keep eating foods that didn't make a difference.`,
  };
}
