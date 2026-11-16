import { z } from "zod";
import { ApiError, route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { getExperiment } from "@/server/experiment-route";
import type { Op } from "@/server/db";

// XP-03: end early. "I felt worse" shows no numbers, shows the help link and goes to founder review.
export const POST = route({ body: z.strictObject({ reason: z.enum(["i_felt_worse", "too_hard_to_keep_up", "other"]) }), mutation: true, feature: "experiments_habit" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const e = await getExperiment(ctx.db, ctx.userId, ctx.params.id!, u.today);
  if (e.phase === "COMPLETED" || e.phase === "ENDED_EARLY") throw new ApiError(409, "ALREADY_ENDED", "This experiment has already ended.");
  const ops: Op[] = [{ op: "update", table: "experiments", match: { id: e.id }, set: { phase: "ENDED_EARLY", ended_on: u.today, end_reason: ctx.body.reason, paused_from: null } }];
  if (ctx.body.reason === "i_felt_worse") ops.push({ op: "insert", table: "review_queue", row: { kind: "experiment_felt_worse", ref: e.key } });
  return ctx.commit(ops, 200, { experiment_id: e.id, phase: "ENDED_EARLY", reason: ctx.body.reason, help_link: ctx.body.reason === "i_felt_worse" });
});
