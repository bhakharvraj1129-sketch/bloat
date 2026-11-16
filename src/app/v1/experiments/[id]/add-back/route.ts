import { ApiError, route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { getExperiment } from "@/server/experiment-route";
import { addDays } from "@/lib/time";
import { thresholds } from "@/lib/registry";

// Finish the swap step early and start the required 1-week add-back.
export const POST = route({ mutation: true, feature: "experiments_swap" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const e = await getExperiment(ctx.db, ctx.userId, ctx.params.id!, u.today);
  if (e.type !== "swap" || e.phase !== "RUNNING") throw new ApiError(409, "NOT_RUNNING", "Only a running swap can move to adding back.");
  const swapEnd = addDays(u.today, -1) < e.started_on ? e.started_on : addDays(u.today, -1);
  const addBackEnd = addDays(swapEnd, thresholds.swap_add_back_weeks * 7);
  return ctx.commit([{ op: "update", table: "experiments", match: { id: e.id }, set: { phase: "ADDING_BACK", swap_ends_on: swapEnd, add_back_ends_on: addBackEnd } }], 200, { experiment_id: e.id, phase: "ADDING_BACK", add_back_ends_on: addBackEnd });
});
