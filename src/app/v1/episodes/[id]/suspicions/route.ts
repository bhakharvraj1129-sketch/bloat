import { z } from "zod";
import { route, notFound } from "@/server/http";
import { getEpisode } from "@/server/episodes";

const body = z.strictObject({
  kind: z.enum(["meal", "activity", "not_sure"]),
  meal_id: z.uuid().optional(),
  activity_id: z.string().regex(/^ACT-\d{2}$/).optional(),
});

// EP-04: the user's own suspicion. Stored as a suspicion, never as a cause.
export const POST = route({ body, mutation: true, feature: "episode_detail" }, async (ctx) => {
  const e = await getEpisode(ctx.db, ctx.userId, ctx.params.id!);
  if (ctx.body.kind === "meal") {
    const { data } = await ctx.db.from("meals").select("id").eq("user_id", ctx.userId).eq("id", ctx.body.meal_id ?? "").maybeSingle();
    if (!data) notFound("Meal"); // another user's meal ID answers like a missing one
  }
  return ctx.commit(
    [{ op: "upsert", table: "episode_suspicions", row: { episode_id: e.id, kind: ctx.body.kind, meal_id: ctx.body.meal_id ?? null, activity_id: ctx.body.activity_id ?? null }, conflict: ["episode_id"] }],
    200, { episode_id: e.id, suspicion: ctx.body },
  );
});
