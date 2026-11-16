import { ok, route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { hourPattern, loadBundle } from "@/server/insights";

// Hour-of-day and weekday pattern, shown after 10 ended episodes with a known start (P6).
export const GET = route({ feature: "charts" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const b = await loadBundle(ctx.db, ctx.userId, u, ctx.now, ctx.plan);
  return ok(hourPattern(b.view.data.episodes, u.periods));
});
