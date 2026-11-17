import { randomUUID } from "node:crypto";
import { z } from "zod";
import { route } from "@/server/http";
import { loadUser, resolveTime } from "@/server/userdata";
import { timeInput } from "@/server/schemas";
import { optionValues } from "@/lib/registry";

const body = z.strictObject({
  type: z.enum(optionValues("EX-01") as [string, ...string[]]),
  started: timeInput,
  minutes: z.number().int().min(1).max(1440),
  intensity: z.enum(["light", "moderate", "vigorous", "not_sure"]).optional(),
  meal_relation: z.enum(["before_a_meal", "after_a_meal", "not_near_a_meal", "not_sure"]).optional(),
  before_score: z.number().int().min(0).max(10).optional(),
  after_score: z.number().int().min(0).max(10).optional(),
});

// Exercise log (Pro). Minutes from the last meal and to the next are calculated from logged meals.
export const POST = route({ capability: "recording", body, mutation: true, feature: "exercise_log" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const b = ctx.body;
  const t = resolveTime(b.started, u, ctx.now);
  const end = new Date(t.ms + b.minutes * 60000).toISOString();
  const [{ data: before }, { data: after }] = await Promise.all([
    ctx.db.from("meals").select("eaten_at").eq("user_id", ctx.userId).lte("eaten_at", t.iso).order("eaten_at", { ascending: false }).limit(1),
    ctx.db.from("meals").select("eaten_at").eq("user_id", ctx.userId).gte("eaten_at", end).order("eaten_at").limit(1),
  ]);
  const fromLast = before?.[0] ? Math.round((t.ms - Date.parse(before[0].eaten_at)) / 60000) : null;
  const toNext = after?.[0] ? Math.round((Date.parse(after[0].eaten_at) - Date.parse(end)) / 60000) : null;
  const id = randomUUID();
  const row = {
    id, type: b.type, started_at: t.iso, zone: t.zone, offset_min: t.offset_min, time_precision: t.precision, minutes: b.minutes,
    intensity: b.intensity ?? null, meal_relation: b.meal_relation ?? null,
    minutes_from_last_meal: fromLast !== null && fromLast <= 1440 ? fromLast : null, minutes_to_next_meal: toNext !== null && toNext <= 1440 ? toNext : null,
  };
  const ops = [{ op: "insert" as const, table: "exercise_records", row }];
  const extra = b.before_score !== undefined || b.after_score !== undefined
    ? [{ op: "insert" as const, table: "activity_responses", row: { ref_kind: "exercise", ref_id: b.type, date: u.today, before_score: b.before_score ?? null, after_score: b.after_score ?? null } }]
    : [];
  return ctx.commit([...ops, ...extra], 201, { exercise: row });
});
