import { z } from "zod";
import { ApiError, route } from "@/server/http";
import { loadUser, resolveTime } from "@/server/userdata";
import { ifMatch, timeInput } from "@/server/schemas";
import { assertStartFree, getEpisode, samplesOf } from "@/server/episodes";
import { DbError } from "@/server/db";
import { staleReportOps } from "@/server/meals";
import { analysisDate } from "@/lib/time";

const body = z.strictObject({
  started: timeInput.optional(),
  ended: z.union([timeInput, z.strictObject({ mode: z.literal("unknown") })]).optional(),
});

// Correct an episode (plan A08): a new revision; If-Match is required; overlaps are rejected.
export const PATCH = route({ body, mutation: true, feature: "edit_delete" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const e = await getEpisode(ctx.db, ctx.userId, ctx.params.id!);
  const rev = ifMatch(ctx.req);
  if (rev === null) throw new ApiError(422, "IF_MATCH_REQUIRED", "Send the record's revision in If-Match.");
  if (rev !== e.revision) throw new ApiError(409, "REVISION_CONFLICT", "This record changed somewhere else. Reload and try again.", { revision: e.revision });

  const set: Record<string, unknown> = { revision: e.revision + 1 };
  let startMs = Date.parse(e.started_at);
  if (ctx.body.started) {
    const t = resolveTime(ctx.body.started, u, ctx.now);
    await assertStartFree(ctx.db, ctx.userId, t.iso, e.id);
    Object.assign(set, { started_at: t.iso, start_zone: t.zone, start_offset_min: t.offset_min, start_precision: t.precision });
    startMs = t.ms;
  }
  let endMs = e.ended_at ? Date.parse(e.ended_at) : null;
  if (ctx.body.ended) {
    if (ctx.body.ended.mode === "unknown") {
      Object.assign(set, { state: "END_UNKNOWN", ended_at: null, end_precision: "unknown" });
      endMs = null;
    } else {
      const t = resolveTime(ctx.body.ended, u, ctx.now);
      Object.assign(set, {
        state: t.precision === "approximate" ? "CLOSED_APPROXIMATE" : "CLOSED_REPORTED_TIME", ended_at: t.iso, end_precision: t.precision,
      });
      endMs = t.ms;
    }
  }
  if (endMs !== null && endMs <= startMs) throw new ApiError(422, "END_BEFORE_START", "The end time is before the start time.");
  const samples = await samplesOf(ctx.db, ctx.userId, e.id);
  const day = (ms: number | null) => (ms === null ? "" : analysisDate(ms, u.periods));
  const stale = await staleReportOps(ctx.db, ctx.userId, day(Date.parse(e.started_at)), day(e.ended_at ? Date.parse(e.ended_at) : null), day(startMs), day(endMs));
  const ops = [{ op: "update" as const, table: "episodes", match: { id: e.id, revision: e.revision }, set, require: true }, ...stale];
  // Keep the first reading on the start time when the start is corrected.
  const first = samples[0];
  const extra = ctx.body.started && first
    ? [{ op: "update" as const, table: "strength_samples", match: { id: first.id }, set: { observed_at: set.started_at } }]
    : [];
  try {
    return await ctx.commit([...ops, ...extra], 200, { episode: { ...e, ...set } });
  } catch (err) {
    if (err instanceof DbError && err.isNoMatch) throw new ApiError(409, "REVISION_CONFLICT", "This record changed somewhere else. Reload and try again.");
    throw err;
  }
});

// Delete removes the record and all its revisions and readings.
// Stored reports that used it are flagged for regeneration and their share links revoked.
export const DELETE = route({ mutation: true, feature: "edit_delete" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const e = await getEpisode(ctx.db, ctx.userId, ctx.params.id!);
  const rev = ifMatch(ctx.req);
  if (rev !== null && rev !== e.revision) throw new ApiError(409, "REVISION_CONFLICT", "This record changed somewhere else. Reload and try again.");
  const stale = await staleReportOps(ctx.db, ctx.userId, analysisDate(Date.parse(e.started_at), u.periods), e.ended_at ? analysisDate(Date.parse(e.ended_at), u.periods) : "");
  return ctx.commit([{ op: "delete", table: "episodes", match: { id: e.id }, require: true }, ...stale], 204, null);
});
