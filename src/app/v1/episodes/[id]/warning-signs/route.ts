import { z } from "zod";
import { route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { getEpisode, warningAdvice, warningOps } from "@/server/episodes";

// Warning signs are free for everyone. Each shows its NHS sentence; nothing pauses.
export const POST = route({ body: z.strictObject({ codes: z.array(z.string()).min(1).max(10) }), mutation: true, feature: "warning_signs" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const e = await getEpisode(ctx.db, ctx.userId, ctx.params.id!);
  return ctx.commit(warningOps(e.id, ctx.body.codes), 200, {
    episode_id: e.id, advice: warningAdvice(ctx.body.codes, u.profile.residence_country),
  });
});
