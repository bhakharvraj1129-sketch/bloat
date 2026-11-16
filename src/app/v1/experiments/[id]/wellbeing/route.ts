import { z } from "zod";
import { ApiError, route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { getExperiment } from "@/server/experiment-route";
import type { Op } from "@/server/db";
import { helpline } from "@/lib/registry";

const yn = z.enum(["yes", "no"]);

// WB-01 / WB-02: weekly during a swap. A Yes pauses the swap and shows the country helpline.
export const POST = route({ body: z.strictObject({ wb01: yn, wb02: yn }), mutation: true, feature: "experiments_swap" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const e = await getExperiment(ctx.db, ctx.userId, ctx.params.id!, u.today);
  if (e.type !== "swap" || (e.phase !== "RUNNING" && e.phase !== "ADDING_BACK")) throw new ApiError(409, "NOT_RUNNING", "This check belongs to a running swap experiment.");
  const pause = ctx.body.wb01 === "yes" || ctx.body.wb02 === "yes";
  const ops: Op[] = [{ op: "insert", table: "wellbeing_checks", row: { experiment_id: e.id, wb01: ctx.body.wb01, wb02: ctx.body.wb02, checked_at: new Date(ctx.now).toISOString() } }];
  if (pause) {
    ops.push({ op: "update", table: "experiments", match: { id: e.id }, set: { phase: "PAUSED", paused_from: e.phase } });
    ops.push({ op: "insert", table: "review_queue", row: { kind: "wellbeing_pause", ref: e.key } }); // founder review queue
  }
  return ctx.commit(ops, 200, {
    experiment_id: e.id, phase: pause ? "PAUSED" : e.phase, paused: pause,
    helpline: pause ? helpline(u.profile.residence_country) : null,
    message: pause ? "Your swap experiment is paused. You can end it or come back to it later. Support is available if food is a worry." : null,
  });
});
