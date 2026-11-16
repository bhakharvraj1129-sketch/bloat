import "server-only";
import type { Db } from "./supabase";
import type { UserCtx } from "./userdata";
import type { Bundle } from "./insights";
import { tx } from "./db";
import { advance, BLOCKING_CONDITIONS, EXPERIMENTS, type Exp, type ExperimentDef } from "@/lib/domain/experiments";
import { thresholds } from "@/lib/registry";
import { addDays } from "@/lib/time";
import type { Target } from "@/lib/domain/insights";

export type Eligibility = {
  fxPassed: boolean; fx03No: boolean; checkedRecently: boolean; blockedByCondition: boolean; swapsIn180: number;
  active: Exp | null; priorConfirmed: number; constipationLogged: boolean;
};

/** Load the active experiment and move it forward by date before anything reads it. */
export async function activeExperiment(db: Db, userId: string, today: string): Promise<Exp | null> {
  const { data } = await db.from("experiments").select("*").eq("user_id", userId).in("phase", ["RUNNING", "ADDING_BACK", "PAUSED"]).maybeSingle();
  if (!data) return null;
  const e = data as Exp;
  const change = advance(e, today);
  if (!change) return e;
  await tx(userId, [{ op: "update", table: "experiments", match: { id: e.id }, set: change }]);
  const next = { ...e, ...change } as Exp;
  return next.phase === "COMPLETED" ? null : next;
}

export async function eligibility(db: Db, userId: string, u: UserCtx, b: Bundle): Promise<Eligibility> {
  const since = addDays(u.today, -180);
  const [active, check, conditions, swaps] = await Promise.all([
    activeExperiment(db, userId, u.today),
    db.from("experiment_checks").select("*").eq("user_id", userId).order("checked_at", { ascending: false }).limit(1),
    db.from("health_conditions").select("condition").eq("user_id", userId).in("condition", BLOCKING_CONDITIONS),
    db.from("experiments").select("id,created_at").eq("user_id", userId).eq("type", "swap").gte("started_on", since).order("created_at", { ascending: false }),
  ]);
  const latest = check.data?.[0] as { passed: boolean; fx03: string; checked_at: string } | undefined;
  const lastSwapAt = swaps.data?.[0]?.created_at as string | undefined;
  // FX is asked before each swap: the check must be newer than the last swap experiment.
  const fresh = !!latest && (!lastSwapAt || latest.checked_at > lastSwapAt);
  const prior = b.view.summaries.filter((s) => s.date >= addDays(u.today, -7) && s.date < u.today && s.status === "CONFIRMED").length;
  const constipation = [...b.symptomsByDate.values()].some((s) => s.has("constipation")) || b.view.data.observations.some((o) => o.activity_id === "ACT-14" && o.answer === "yes");
  return {
    fxPassed: !!latest?.passed, fx03No: latest?.fx03 === "no", checkedRecently: fresh, blockedByCondition: (conditions.data ?? []).length > 0,
    swapsIn180: (swaps.data ?? []).length, active, priorConfirmed: prior, constipationLogged: constipation,
  };
}

export type Offer = { key: string; name: string; type: "habit" | "swap"; offered: boolean; reason: string | null };

export function offerFor(def: ExperimentDef, e: Eligibility): Offer {
  let reason: string | null = null;
  if (def.type === "swap") {
    if (e.blockedByCondition) reason = "Swap experiments aren't offered with a condition in your health background.";
    else if (!e.checkedRecently) reason = "Answer the safety questions first.";
    else if (!e.fxPassed) reason = "Swap experiments aren't offered for you. Habit experiments are.";
    else if (e.swapsIn180 >= thresholds.swap_max_per_180_days) reason = "You have done 2 swap experiments in the last 180 days. Habit experiments are still open.";
  }
  if (def.needs_no_allergy) {
    if (e.blockedByCondition) reason = "This one isn't offered with a condition in your health background.";
    else if (!e.fx03No) reason = "Answer the safety question about allergies first.";
    else if (!e.constipationLogged) reason = "Offered once constipation has been logged.";
  }
  return { key: def.key, name: def.name, type: def.type, offered: reason === null, reason };
}

export async function experimentOffers(db: Db, userId: string, u: UserCtx, b: Bundle) {
  const e = await eligibility(db, userId, u, b);
  const list = EXPERIMENTS.map((d) => ({ def: d, offer: offerFor(d, e) }));
  return {
    eligibility: e, list,
    /** "Try an experiment" on a result: only when a matching experiment exists and is open to this user. */
    forTarget(t: Target): { key: string; name: string } | null {
      const hit = list.find((x) => x.def.target && x.def.target.id === t.id && x.offer.offered);
      return hit ? { key: hit.def.key, name: hit.def.name } : null;
    },
  };
}
