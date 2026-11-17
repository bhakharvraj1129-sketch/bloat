import { ApiError, route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { daysView } from "@/server/days";

// DY-05: a provisional zero for today only. Any later episode supersedes it; the review still decides.
export const POST = route({ capability: "recording", mutation: true, feature: "episodes" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const date = ctx.params.date!;
  if (date !== u.today) throw new ApiError(422, "NOT_TODAY", "This can only be saved for today.");
  const view = await daysView(ctx.db, ctx.userId, u, date, date, ctx.now);
  if (view.summaries[0]!.episodeCount > 0) {
    throw new ApiError(409, "BLOATING_LOGGED", "You have already logged bloating today.");
  }
  const at = new Date(ctx.now).toISOString();
  return ctx.commit(
    [{ op: "upsert", table: "day_marks", row: { date, no_bloating_at: at }, conflict: ["user_id", "date"] }],
    200, { date, status: "PROVISIONAL", provisional_zero: true },
  );
});
