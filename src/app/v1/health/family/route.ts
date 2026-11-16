import { z } from "zod";
import { ApiError, route } from "@/server/http";
import { checkAnswer, question, REGISTRY_VERSION } from "@/lib/registry";

// FH-01 family history (optional). Doctor PDF only: never cards, nudges, comparisons, AI or analytics.
export const PUT = route({ body: z.strictObject({ value: z.array(z.string()).max(8).nullable() }), mutation: true, feature: "family_history" }, async (ctx) => {
  if (ctx.body.value !== null) {
    const c = checkAnswer("FH-01", ctx.body.value);
    if (!c.ok) throw new ApiError(422, "VALIDATION", c.reason);
  }
  return ctx.commit([{
    op: "insert", table: "question_responses",
    row: { question_id: "FH-01", question_version: question("FH-01").version ?? REGISTRY_VERSION, value: ctx.body.value, status: ctx.body.value === null ? "skipped" : "answered", answered_at: new Date(ctx.now).toISOString() },
  }], 200, { family_history: ctx.body.value });
});
