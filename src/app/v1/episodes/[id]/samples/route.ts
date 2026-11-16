import { z } from "zod";
import { ApiError, route } from "@/server/http";
import { strength } from "@/server/schemas";
import { getEpisode } from "@/server/episodes";

// A new strength reading is appended; earlier readings are never overwritten.
export const POST = route({ body: z.strictObject({ strength }), mutation: true, feature: "episodes" }, async (ctx) => {
  const e = await getEpisode(ctx.db, ctx.userId, ctx.params.id!);
  if (e.state !== "OPEN") throw new ApiError(409, "EPISODE_CLOSED", "This bloating record has already ended.");
  const observed_at = new Date(ctx.now).toISOString();
  return ctx.commit(
    [{ op: "insert", table: "strength_samples", row: { episode_id: e.id, strength: ctx.body.strength, observed_at } }],
    201, { sample: { episode_id: e.id, strength: ctx.body.strength, observed_at } },
  );
});
