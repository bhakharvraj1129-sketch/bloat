import { ApiError, route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { getExperiment } from "@/server/experiment-route";

export const POST = route({ mutation: true, feature: "experiments_swap" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const e = await getExperiment(ctx.db, ctx.userId, ctx.params.id!, u.today);
  if (e.phase !== "PAUSED") throw new ApiError(409, "NOT_PAUSED", "This experiment isn't paused.");
  const phase = e.paused_from ?? "RUNNING";
  return ctx.commit([{ op: "update", table: "experiments", match: { id: e.id }, set: { phase, paused_from: null } }], 200, { experiment_id: e.id, phase });
});
