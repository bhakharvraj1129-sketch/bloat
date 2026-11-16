import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ApiError, route } from "@/server/http";
import { loadUser, resolveTime } from "@/server/userdata";
import { strength, timeInput } from "@/server/schemas";
import type { Op } from "@/server/db";
import { DbError } from "@/server/db";
import {
  assertStartFree, detailSchema, openEpisode, proDetailRequested, requirePro, symptomAdvice, symptomOps, validate, warningAdvice, warningOps,
} from "@/server/episodes";

const body = z.strictObject({ strength, started: timeInput, ...detailSchema });

// Start an episode (plan A08). Never a second open episode: 409 offers an update instead.
export const POST = route({ body, mutation: true, feature: "episodes" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const b = ctx.body;
  if (proDetailRequested(b)) requirePro(ctx.plan);
  const existing = await openEpisode(ctx.db, ctx.userId);
  if (existing) {
    throw new ApiError(409, "EPISODE_OPEN", "You already have bloating in progress. Update it instead.", { episode_id: existing.id });
  }
  const t = resolveTime(b.started, u, ctx.now);
  await assertStartFree(ctx.db, ctx.userId, t.iso);

  const id = randomUUID();
  const ops: Op[] = [
    {
      op: "insert", table: "episodes",
      row: { id, started_at: t.iso, start_zone: t.zone, start_offset_min: t.offset_min, start_precision: t.precision, state: "OPEN", feel: [] },
    },
    { op: "insert", table: "strength_samples", row: { episode_id: id, strength: b.strength, observed_at: t.iso } },
    ...warningOps(id, b.warning_signs),
  ];
  let advice = warningAdvice(b.warning_signs ?? [], u.profile.residence_country);
  if (b.feel) {
    validate("EP-03", b.feel);
    ops[0] = { ...ops[0]!, row: { ...(ops[0] as { row: Record<string, unknown> }).row, feel: b.feel.filter((f) => f !== "skip") } } as Op;
  }
  if (b.symptoms) {
    advice = [...advice, ...(await symptomAdvice(ctx.db, ctx.userId, u, b.symptoms))];
    ops.push(...symptomOps(id, b.symptoms));
  }
  if (b.suspicion) {
    ops.push({ op: "insert", table: "episode_suspicions", row: { episode_id: id, ...b.suspicion } });
  }
  ops.push({ op: "insert", table: "product_events", row: { name: "episode_started", props: {} } });
  try {
    return await ctx.commit(ops, 201, {
      episode: { id, state: "OPEN", started_at: t.iso, start_zone: t.zone, start_precision: t.precision, revision: 1 },
      advice,
    });
  } catch (e) {
    if (e instanceof DbError && e.isUnique && e.mentions("episodes_one_open")) {
      const again = await openEpisode(ctx.db, ctx.userId);
      throw new ApiError(409, "EPISODE_OPEN", "You already have bloating in progress. Update it instead.", { episode_id: again?.id });
    }
    throw e;
  }
});
