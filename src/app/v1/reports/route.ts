import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ApiError, ok, route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { doctorSnapshot, DOCTOR_SECTIONS, patternSnapshot, REPORT_VERSIONS } from "@/server/reports";
import { addDays, diffDays, isDate } from "@/lib/time";

const body = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("pattern"), week_of: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }),
  z.strictObject({
    kind: z.literal("doctor"), from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    questions: z.string().trim().max(600).optional(), // PD-01
    sections: z.partialRecord(z.enum(DOCTOR_SECTIONS), z.boolean()).optional(),
  }),
]);

export const GET = route({ feature: "pattern_report" }, async (ctx) => {
  const { data } = await ctx.db.from("reports").select("id,kind,range_from,range_to,stale,created_at").eq("user_id", ctx.userId).order("created_at", { ascending: false }).limit(40);
  return ok({ reports: data ?? [] });
});

// Make a report. Each one is stored as an immutable snapshot with the rule versions it used.
export const POST = route({ body, mutation: true, feature: "pattern_report" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const b = ctx.body;
  const id = randomUUID();
  if (b.kind === "pattern") {
    const snapshot = await patternSnapshot(ctx.db, ctx.userId, u, ctx.now, b.week_of);
    if (snapshot.to >= u.today) throw new ApiError(422, "WEEK_NOT_FINISHED", "The weekly report covers a finished week.");
    // One snapshot per week: an existing, still-valid one is returned as it was first made.
    const { data: prior } = await ctx.db.from("reports").select("id,snapshot,created_at").eq("user_id", ctx.userId).eq("kind", "pattern").eq("range_from", snapshot.from).eq("stale", false).maybeSingle();
    if (prior) return ok({ id: prior.id, snapshot: prior.snapshot, created_at: prior.created_at, reused: true });
    return ctx.commit([{ op: "insert", table: "reports", row: { id, kind: "pattern", range_from: snapshot.from, range_to: snapshot.to, snapshot, versions: REPORT_VERSIONS } }], 201, { id, snapshot, reused: false });
  }
  if (!isDate(b.from) || !isDate(b.to) || b.from > b.to || diffDays(b.to, b.from) > 91) throw new ApiError(422, "VALIDATION", "Choose a range of up to 92 days.");
  const to = b.to >= u.today ? addDays(u.today, -1) : b.to;
  if (to < b.from) throw new ApiError(422, "VALIDATION", "That range has no finished days yet.");
  const snapshot = await doctorSnapshot(ctx.db, ctx.userId, u, ctx.now, { from: b.from, to, questions: b.questions ?? null, sections: b.sections ?? {} });
  return ctx.commit([
    { op: "insert", table: "reports", row: { id, kind: "doctor", range_from: b.from, range_to: to, snapshot, versions: REPORT_VERSIONS } },
    { op: "insert", table: "product_events", row: { name: "doctor_report_made", props: {} } },
  ], 201, { id, snapshot, pdf_url: `/v1/reports/${id}/pdf` });
});
