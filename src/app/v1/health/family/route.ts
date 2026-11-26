import { z } from "zod";
import { ApiError, route } from "@/server/http";
import { checkAnswer, question, REGISTRY_VERSION } from "@/lib/registry";
import { loadAnswers } from "@/server/userdata";
import { staleDoctorReportOps } from "@/server/meals";

// FH-01 family history (optional). Doctor PDF only: never cards, nudges, comparisons, AI or analytics.
export const PUT = route({ body: z.strictObject({ value: z.array(z.string()).max(8).nullable() }), mutation: true, feature: "family_history" }, async (ctx) => {
  if (ctx.body.value !== null) {
    const c = checkAnswer("FH-01", ctx.body.value);
    if (!c.ok) throw new ApiError(422, "VALIDATION", c.reason);
  }
  // Changing an earlier answer corrects the record: stored doctor reports are flagged and their share
  // links revoked (plan B05).
  const prior = (await loadAnswers(ctx.db, ctx.userId))["FH-01"];
  const changed = prior !== undefined && prior !== null && JSON.stringify(prior) !== JSON.stringify(ctx.body.value);
  return ctx.commit([{
    op: "insert", table: "question_responses",
    row: { question_id: "FH-01", question_version: question("FH-01").version ?? REGISTRY_VERSION, value: ctx.body.value, status: ctx.body.value === null ? "skipped" : "answered", answered_at: new Date(ctx.now).toISOString() },
  }, ...(changed ? await staleDoctorReportOps(ctx.db, ctx.userId) : [])], 200, { family_history: ctx.body.value });
});
