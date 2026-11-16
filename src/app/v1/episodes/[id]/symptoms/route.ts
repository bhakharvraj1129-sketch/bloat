import { z } from "zod";
import { route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { getEpisode, symptomAdvice, symptomOps, validate } from "@/server/episodes";
import type { Op } from "@/server/db";

const body = z.strictObject({ symptoms: z.array(z.string()).max(12).optional(), feel: z.array(z.string()).max(4).optional() });

// Pro episode detail: feel (EP-03) and other symptoms (EP-08).
export const POST = route({ body, mutation: true, feature: "episode_detail" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const e = await getEpisode(ctx.db, ctx.userId, ctx.params.id!);
  const ops: Op[] = symptomOps(e.id, ctx.body.symptoms);
  const advice = ctx.body.symptoms ? await symptomAdvice(ctx.db, ctx.userId, u, ctx.body.symptoms) : [];
  if (ctx.body.feel) {
    validate("EP-03", ctx.body.feel);
    ops.push({ op: "update", table: "episodes", match: { id: e.id }, set: { feel: ctx.body.feel.filter((f) => f !== "skip") } });
  }
  return ctx.commit(ops, 200, { episode_id: e.id, advice });
});
