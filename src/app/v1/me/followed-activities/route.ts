import { z } from "zod";
import { ApiError, route } from "@/server/http";
import type { Op } from "@/server/db";
import { activity, PRO_ACTIVITY_IDS } from "@/lib/registry";

const body = z.strictObject({ activity_ids: z.array(z.string().regex(/^ACT-\d{2}$/)).max(3) });

// Up to 3 followed habits are asked Yes / No / Not sure each morning; only these can be compared.
export const PUT = route({ body, mutation: true, feature: "habit_taps_basic" }, async (ctx) => {
  const ids = ctx.body.activity_ids;
  if (new Set(ids).size !== ids.length) throw new ApiError(422, "VALIDATION", "A habit can be followed once.");
  for (const id of ids) {
    if (!activity(id)) throw new ApiError(422, "VALIDATION", "Unknown habit.");
    if (PRO_ACTIVITY_IDS.has(id) && ctx.plan !== "pro") throw new ApiError(403, "PLAN_REQUIRED", "This habit is part of Bloat Pro.");
  }
  const ops: Op[] = [{ op: "delete", table: "followed_activities", match: {} }];
  ids.forEach((activity_id, i) => ops.push({ op: "insert", table: "followed_activities", row: { activity_id, position: i + 1 } }));
  return ctx.commit(ops, 200, { followed: ids });
});
