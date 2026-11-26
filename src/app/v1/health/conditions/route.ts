import { z } from "zod";
import { staleDoctorReportOps } from "@/server/meals";
import { ApiError, ok, route } from "@/server/http";
import type { Op } from "@/server/db";
import { optionValues } from "@/lib/registry";

const body = z.strictObject({
  conditions: z.array(z.strictObject({
    condition: z.string(),
    status: z.enum(["diagnosed_by_a_doctor", "i_suspect_it", "tested_ruled_out", "not_sure", "prefer_not_to_say"]).optional(),
    year: z.number().int().min(1900).max(2100).optional(),
  })).max(24),
});

// Health background (Pro): a record only. Used for swap-experiment eligibility, published
// exclusions and the doctor PDF. Never used to suggest a condition.
export const GET = route({ feature: "health_background" }, async (ctx) => {
  const [c, l, t, f] = await Promise.all([
    ctx.db.from("health_conditions").select("condition,status,year").eq("user_id", ctx.userId),
    ctx.db.from("lactose_details").select("breath_test,after_dairy").eq("user_id", ctx.userId).maybeSingle(),
    ctx.db.from("health_tests").select("id,test,date,date_precision,result_text").eq("user_id", ctx.userId).order("created_at"),
    ctx.db.from("question_responses").select("value,status").eq("user_id", ctx.userId).eq("question_id", "FH-01").order("answered_at", { ascending: false }).limit(1),
  ]);
  return ok({ conditions: c.data ?? [], lactose: l.data ?? null, tests: t.data ?? [], family_history: f.data?.[0]?.status === "answered" ? f.data[0].value : null });
});

export const PUT = route({ body, mutation: true, feature: "health_background" }, async (ctx) => {
  const allowed = new Set(optionValues("HC-01"));
  const seen = new Set<string>();
  for (const c of ctx.body.conditions) {
    if (!allowed.has(c.condition) || seen.has(c.condition)) throw new ApiError(422, "VALIDATION", "Unknown item.");
    seen.add(c.condition);
  }
  const ops: Op[] = [{ op: "delete", table: "health_conditions", match: {} }];
  for (const c of ctx.body.conditions) ops.push({ op: "insert", table: "health_conditions", row: { condition: c.condition, status: c.status ?? null, year: c.year ?? null } });
  if (!seen.has("lactose_intolerance")) ops.push({ op: "delete", table: "lactose_details", match: {} });
  // A condition removed or changed (not just added) corrects the record: stored doctor reports are
  // flagged and their share links revoked (plan B05).
  const { data: prior } = await ctx.db.from("health_conditions").select("condition,status,year").eq("user_id", ctx.userId);
  const key = (c: { condition: string; status?: string | null; year?: number | null }) => `${c.condition}|${c.status ?? ""}|${c.year ?? ""}`;
  const now = new Set(ctx.body.conditions.map(key));
  const { data: lactose } = await ctx.db.from("lactose_details").select("user_id").eq("user_id", ctx.userId).maybeSingle();
  if ((prior ?? []).some((c) => !now.has(key(c))) || (lactose && !seen.has("lactose_intolerance"))) ops.push(...(await staleDoctorReportOps(ctx.db, ctx.userId)));
  return ctx.commit(ops, 200, { conditions: ctx.body.conditions });
});
