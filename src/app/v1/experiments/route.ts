import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ApiError, ok, route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { loadBundle } from "@/server/insights";
import { experimentOffers } from "@/server/experiments";
import { dayNumber, experimentDef, isNeverOffered } from "@/lib/domain/experiments";
import { helpline, thresholds } from "@/lib/registry";
import { addDays } from "@/lib/time";
import { KIWI_WARNING, STOP_IF_WORSE } from "@/lib/wording";

// Screen 31: the experiments on offer and the running one, if any.
export const GET = route({ feature: "experiments_habit" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const b = await loadBundle(ctx.db, ctx.userId, u, ctx.now, ctx.plan);
  const offers = await experimentOffers(ctx.db, ctx.userId, u, b);
  const { data: past } = await ctx.db.from("experiments").select("*").eq("user_id", ctx.userId).in("phase", ["COMPLETED", "ENDED_EARLY"]).order("started_on", { ascending: false });
  const active = offers.eligibility.active;
  return ok({
    active: active ? { ...active, name: experimentDef(active.key)?.name, ...dayNumber(active, u.today) } : null,
    prior_confirmed_days: offers.eligibility.priorConfirmed, prior_needed: thresholds.experiment_prior_confirmed_min,
    habit: offers.list.filter((x) => x.def.type === "habit").map((x) => ({ ...x.offer, instruction: x.def.instruction, source: x.def.source, days: x.def.days, warning: x.def.warning ?? null })),
    swap: offers.list.filter((x) => x.def.type === "swap").map((x) => ({ ...x.offer, instruction: x.def.instruction, source: x.def.source, swap: x.def.swap })),
    swap_check: { needed: !offers.eligibility.checkedRecently, passed: offers.eligibility.fxPassed && offers.eligibility.checkedRecently, blocked_by_condition: offers.eligibility.blockedByCondition },
    past: (past ?? []).map((p) => ({ id: p.id, key: p.key, name: experimentDef(p.key as string)?.name, phase: p.phase, started_on: p.started_on, ended_on: p.ended_on })),
    helpline: helpline(u.profile.residence_country), stop_line: STOP_IF_WORSE, kiwi_warning: KIWI_WARNING,
  });
});

const body = z.strictObject({ key: z.string().min(1).max(80), groups: z.array(z.string()).max(12).optional() });

// Start an experiment. Eligibility is decided here on the server, never only in the app.
export const POST = route({ capability: "recording", body, mutation: true, feature: "experiments_habit" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const def = experimentDef(ctx.body.key);
  // Wheat, grains, FODMAP and anything touching several groups is never offered (403 NOT_OFFERED).
  if (isNeverOffered(ctx.body.key, ctx.body.groups) || (!def && ctx.body.key.startsWith("swap"))) {
    throw new ApiError(403, "NOT_OFFERED", "Bloat doesn't offer this experiment.");
  }
  if (!def) throw new ApiError(422, "VALIDATION", "Unknown experiment.");
  const b = await loadBundle(ctx.db, ctx.userId, u, ctx.now, ctx.plan);
  const offers = await experimentOffers(ctx.db, ctx.userId, u, b);
  const e = offers.eligibility;
  if (e.active) throw new ApiError(409, "EXPERIMENT_RUNNING", "You already have an experiment running. Finish or end it first.", { experiment_id: e.active.id });
  const offer = offers.list.find((x) => x.def.key === def.key)!.offer;
  if (!offer.offered) {
    const limit = def.type === "swap" && e.swapsIn180 >= thresholds.swap_max_per_180_days && e.fxPassed && e.checkedRecently;
    throw new ApiError(limit ? 409 : 403, limit ? "SWAP_LIMIT" : "NOT_ELIGIBLE", offer.reason ?? "This experiment isn't open to you.", {
      habit_experiments_available: true, helpline: def.type === "swap" ? helpline(u.profile.residence_country) : null,
    });
  }
  if (e.priorConfirmed < thresholds.experiment_prior_confirmed_min) {
    throw new ApiError(422, "NOT_ENOUGH_DAYS", "Log normally for a few more days first. An experiment needs 4 confirmed days in the week before it starts.", { confirmed_days: e.priorConfirmed, needed: thresholds.experiment_prior_confirmed_min });
  }
  const id = randomUUID();
  const row = {
    id, type: def.type, key: def.key, food_group: def.food_group ?? null, phase: "RUNNING", started_on: u.today,
    // The swap step ends by itself after 2 weeks at most.
    swap_ends_on: def.type === "swap" ? addDays(u.today, thresholds.swap_max_weeks * 7 - 1) : null,
    created_at: new Date(ctx.now).toISOString(),
  };
  return ctx.commit(
    [{ op: "insert", table: "experiments", row }, { op: "insert", table: "product_events", row: { name: "experiment_started", props: { type: def.type } } }],
    201, { experiment: { ...row, name: def.name, instruction: def.instruction, warning: def.warning ?? null, stop_line: STOP_IF_WORSE } },
  );
});
