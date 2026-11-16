import { z } from "zod";
import { ApiError, route } from "@/server/http";
import { getEpisode } from "@/server/episodes";

// EP-07: Yes and Not sure keep the episode open; No asks for the end time. Never a made-up end.
export const POST = route({ body: z.strictObject({ answer: z.enum(["yes", "no", "not_sure"]) }), mutation: true }, async (ctx) => {
  const e = await getEpisode(ctx.db, ctx.userId, ctx.params.id!);
  if (e.state !== "OPEN") throw new ApiError(409, "EPISODE_CLOSED", "This bloating record has already ended.");
  return ctx.commit(
    [{ op: "insert", table: "product_events", row: { name: "still_happening_answered", props: {} } }],
    200, { episode_id: e.id, state: "OPEN", next: ctx.body.answer === "no" ? "ask_end_time" : "stay_open" },
  );
});
