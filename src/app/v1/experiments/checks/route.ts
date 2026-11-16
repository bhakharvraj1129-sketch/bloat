import { z } from "zod";
import { route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { fxResult } from "@/lib/domain/experiments";

const fx = z.enum(["yes", "no", "not_sure", "prefer_not_to_say"]);

// Screen 32: the swap-experiment safety check (FX-01 to FX-04). "Prefer not to say" is never a No.
export const POST = route({ body: z.strictObject({ fx01: fx, fx02: fx, fx03: fx, fx04: fx }), mutation: true, feature: "experiments_swap" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const r = fxResult(ctx.body, u.profile.residence_country);
  return ctx.commit(
    [{ op: "insert", table: "experiment_checks", row: { ...ctx.body, passed: r.passed, checked_at: new Date(ctx.now).toISOString() } }],
    201, { passed: r.passed, notes: r.notes, habit_experiments_available: true },
  );
});
