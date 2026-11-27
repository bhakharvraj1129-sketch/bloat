import { z } from "zod";
import { ApiError, route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { FOOD_TAG_IDS, thresholds } from "@/lib/registry";

const body = z.strictObject({
  mode: z.enum(["full", "keep_an_eye"]),
  watched_groups: z.array(z.string()).max(thresholds.keep_an_eye_offer.groups_max).optional(),
});

// Keep an eye on it mode (Pro): anyone on Pro can switch it on in Me; one tap returns to full logging.
export const PUT = route({ body, mutation: true }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const b = ctx.body;
  if (b.mode === "keep_an_eye") {
    if (ctx.plan !== "pro") throw new ApiError(403, "PLAN_REQUIRED", "This is part of Bloat Buddy Pro.");
    const groups = b.watched_groups ?? u.profile.watched_groups;
    if (!groups.length || groups.some((g) => !FOOD_TAG_IDS.includes(g)) || new Set(groups).size !== groups.length) {
      throw new ApiError(422, "VALIDATION", "Choose up to 5 food groups to keep an eye on.");
    }
    return ctx.commit([{ op: "update", table: "profiles", match: { user_id: ctx.userId }, set: { logging_mode: "keep_an_eye", watched_groups: groups, revision: u.profile.revision + 1 } }], 200, { logging_mode: "keep_an_eye", watched_groups: groups });
  }
  // Returning to full logging is never blocked by the plan.
  return ctx.commit([{ op: "update", table: "profiles", match: { user_id: ctx.userId }, set: { logging_mode: "full", revision: u.profile.revision + 1 } }], 200, { logging_mode: "full", watched_groups: u.profile.watched_groups });
});
