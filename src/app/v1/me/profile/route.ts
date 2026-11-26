import { z } from "zod";
import { staleDoctorReportOps } from "@/server/meals";
import { ApiError, route } from "@/server/http";
import { loadAnswers, loadUser } from "@/server/userdata";
import { ifMatch } from "@/server/schemas";
import type { Op } from "@/server/db";
import { addDays, isValidZone, localDate } from "@/lib/time";
import { checkAnswer, question, REGISTRY_VERSION } from "@/lib/registry";

const body = z.strictObject({
  units: z.enum(["us", "metric"]).optional(),
  region: z.string().trim().max(80).nullable().optional(),
  // Zone change: send preview=true first to see when it takes effect; history never moves.
  analysis_time_zone: z.string().max(64).optional(),
  preview: z.boolean().optional(),
  goals: z.array(z.string()).max(2).optional(),
  cuisines: z.array(z.string()).max(11).optional(),
  food_preferences: z.array(z.string()).max(6).optional(),
  keep_meal_photos: z.boolean().optional(),
  hide_charts: z.boolean().optional(),
  // Optional context answers changeable in Me (ON-10, ON-14, ON-15). null deletes the answer.
  answers: z.partialRecord(z.enum(["ON-10", "ON-14", "ON-15"]), z.unknown()).optional(),
});

export const PATCH = route({ body, mutation: true }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const b = ctx.body;
  const rev = ifMatch(ctx.req);
  if (rev !== null && rev !== u.profile.revision) throw new ApiError(409, "REVISION_CONFLICT", "Your settings changed somewhere else. Reload and try again.");
  const set: Record<string, unknown> = {};
  const ops: Op[] = [];
  if (b.units) set.units = b.units;
  if (b.region !== undefined) set.region = b.region;
  if (b.keep_meal_photos !== undefined) {
    if (b.keep_meal_photos && ctx.plan !== "pro") throw new ApiError(403, "PLAN_REQUIRED", "This is part of Bloat Pro.");
    set.keep_meal_photos = b.keep_meal_photos;
  }
  if (b.hide_charts !== undefined) set.hide_charts = b.hide_charts;
  for (const [key, id] of [["goals", "ON-16"], ["cuisines", "ON-04"], ["food_preferences", "ON-05"]] as const) {
    const v = b[key];
    if (v === undefined) continue;
    const c = checkAnswer(id, v);
    if (!c.ok) throw new ApiError(422, "VALIDATION", c.reason);
    set[key] = v;
  }
  const answers = await loadAnswers(ctx.db, ctx.userId);
  const on10 = ((b.answers?.["ON-10"] as string[] | undefined) ?? (answers["ON-10"] as string[] | undefined)) ?? [];
  if ((b.goals ?? []).includes("whether_my_cycle_plays_a_part") && !on10.includes("cycle_context")) {
    throw new ApiError(422, "VALIDATION", "That goal needs cycle context to be on.");
  }
  let corrected = false;
  for (const [id, value] of Object.entries(b.answers ?? {})) {
    if (value !== null) {
      const c = checkAnswer(id, value);
      if (!c.ok) throw new ApiError(422, "VALIDATION", c.reason);
    }
    // ON-10, ON-14 and ON-15 appear in the doctor report: changing an earlier answer is a correction.
    if (answers[id] !== undefined && answers[id] !== null && JSON.stringify(answers[id]) !== JSON.stringify(value)) corrected = true;
    ops.push({
      op: "insert", table: "question_responses",
      row: { question_id: id, question_version: question(id).version ?? REGISTRY_VERSION, value, status: value === null ? "skipped" : "answered", answered_at: new Date(ctx.now).toISOString() },
    });
  }
  let zonePreview = null;
  if (b.analysis_time_zone && b.analysis_time_zone !== u.profile.analysis_time_zone) {
    if (!isValidZone(b.analysis_time_zone)) throw new ApiError(422, "VALIDATION", "That time zone is not valid.");
    // The new zone starts with tomorrow's day in that zone. Days already recorded keep their dates.
    const effective = addDays(localDate(ctx.now, b.analysis_time_zone), 1);
    zonePreview = { from: u.profile.analysis_time_zone, to: b.analysis_time_zone, effective_from: effective, history_moves: false };
    if (b.preview) return { status: 200, data: { preview: zonePreview } };
    set.analysis_time_zone = b.analysis_time_zone;
    set.time_zone = b.analysis_time_zone;
    ops.push({ op: "upsert", table: "zone_periods", row: { effective_from: effective, zone: b.analysis_time_zone }, conflict: ["user_id", "effective_from"] });
  }
  set.revision = u.profile.revision + 1;
  set.updated_at = new Date(ctx.now).toISOString();
  ops.unshift({ op: "update", table: "profiles", match: { user_id: ctx.userId }, set });
  // Stored doctor reports that show the corrected answer are flagged and their share links revoked (plan B05).
  if (corrected) ops.push(...(await staleDoctorReportOps(ctx.db, ctx.userId)));
  return ctx.commit(ops, 200, { profile: { ...u.profile, ...set }, zone_change: zonePreview });
});
