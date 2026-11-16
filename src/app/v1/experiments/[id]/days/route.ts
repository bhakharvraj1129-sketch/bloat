import { z } from "zod";
import { ApiError, route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { getExperiment } from "@/server/experiment-route";

// XP-02: did you do it today? Yes / Partly / No.
export const POST = route({ body: z.strictObject({ answer: z.enum(["yes", "partly", "no"]), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }), mutation: true, feature: "experiments_habit" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const e = await getExperiment(ctx.db, ctx.userId, ctx.params.id!, u.today);
  if (e.phase !== "RUNNING") throw new ApiError(409, "NOT_RUNNING", "This experiment isn't running right now.");
  const date = ctx.body.date ?? u.today;
  if (date > u.today || date < e.started_on) throw new ApiError(422, "VALIDATION", "That day isn't part of this experiment.");
  return ctx.commit([{ op: "upsert", table: "experiment_days", row: { experiment_id: e.id, date, answer: ctx.body.answer }, conflict: ["experiment_id", "date"] }], 200, { experiment_id: e.id, date, answer: ctx.body.answer });
});
