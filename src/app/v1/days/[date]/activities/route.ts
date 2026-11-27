import { z } from "zod";
import { ApiError, route } from "@/server/http";
import { loadAnswers, loadUser } from "@/server/userdata";
import type { Op } from "@/server/db";
import { activity, PRO_ACTIVITY_IDS } from "@/lib/registry";
import { diffDays, isDate } from "@/lib/time";
import { staleReportOps } from "@/server/meals";

const body = z.strictObject({
  taps: z.array(z.strictObject({
    activity_id: z.string().regex(/^ACT-\d{2}$/),
    detail: z.record(z.string(), z.union([z.string().max(40), z.number()])).optional(),
  })).max(24).default([]),
  remove: z.array(z.string().regex(/^ACT-\d{2}$/)).max(24).default([]),
  cycle: z.array(z.strictObject({
    kind: z.enum(["start", "end"]), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), precision: z.enum(["exact", "approximate"]),
  })).max(2).default([]),
});

// Habit taps (plan A13). A tap means Yes; anything not tapped stays unknown, never No.
export const PUT = route({ capability: "recording", body, mutation: true, feature: "habit_taps_basic" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const date = ctx.params.date!;
  if (!isDate(date) || date > u.today || diffDays(u.today, date) > 92) throw new ApiError(422, "VALIDATION", "That date is not valid.");
  const ops: Op[] = [];
  const at = new Date(ctx.now).toISOString();
  for (const t of ctx.body.taps) {
    if (!activity(t.activity_id)) throw new ApiError(422, "VALIDATION", "Unknown habit.");
    if (PRO_ACTIVITY_IDS.has(t.activity_id) && ctx.plan !== "pro") throw new ApiError(403, "PLAN_REQUIRED", "This is part of Bloat Buddy Pro.");
    ops.push({
      op: "upsert", table: "activity_observations",
      row: { date, activity_id: t.activity_id, answer: "yes", detail: t.detail ?? null, source: "tap", observed_at: date === u.today ? at : null },
      conflict: ["user_id", "date", "activity_id"],
    });
  }
  for (const id of ctx.body.remove) ops.push({ op: "delete", table: "activity_observations", match: { date, activity_id: id } });
  // Removing a habit corrects the day: stored reports covering it are flagged and their share links revoked.
  if (ctx.body.remove.length) ops.push(...(await staleReportOps(ctx.db, ctx.userId, date)));
  if (ctx.body.cycle.length) {
    // CY-01 / CY-02 are visible only after the ON-10 cycle-context opt-in.
    const answers = await loadAnswers(ctx.db, ctx.userId);
    const on10 = (answers["ON-10"] as string[] | undefined) ?? [];
    if (!on10.includes("cycle_context")) throw new ApiError(403, "CAPABILITY_OFF", "Period logging is off. Turn on cycle context in You first.");
    for (const c of ctx.body.cycle) {
      if (c.date > u.today) throw new ApiError(422, "FUTURE_TIME", "That date is in the future.");
      ops.push({ op: "upsert", table: "cycle_events", row: { kind: c.kind, date: c.date, date_precision: c.precision }, conflict: ["user_id", "kind", "date"] });
    }
  }
  ops.push({ op: "insert", table: "product_events", row: { name: "activities_logged", props: { count: ctx.body.taps.length } } });
  return ctx.commit(ops, 200, { date, saved: ctx.body.taps.map((t) => t.activity_id), removed: ctx.body.remove });
});
