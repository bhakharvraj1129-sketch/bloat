import { z } from "zod";
import { ApiError, route } from "@/server/http";
import { loadUser, resolveTime } from "@/server/userdata";
import { timeInput } from "@/server/schemas";
import { getEpisode, requirePro, samplesOf } from "@/server/episodes";
import { formatDuration } from "@/lib/time";

const body = z.strictObject({
  ended: z.union([timeInput, z.strictObject({ mode: z.literal("unknown") })]),
  eased: z.enum(["yes", "no", "didn_t_pass_any", "not_sure"]).optional(),
});

// End an episode honestly (EP-06). "I don't know" stores END_UNKNOWN and never a guessed end.
export const POST = route({ body, mutation: true, feature: "episodes" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const e = await getEpisode(ctx.db, ctx.userId, ctx.params.id!);
  if (e.state !== "OPEN") throw new ApiError(409, "EPISODE_CLOSED", "This bloating record has already ended.");
  if (ctx.body.eased !== undefined) requirePro(ctx.plan);
  const samples = await samplesOf(ctx.db, ctx.userId, e.id);
  const strongest = samples.length ? Math.max(...samples.map((s) => s.strength)) : null;

  let set: Record<string, unknown>;
  let lasted: string | null = null;
  if (ctx.body.ended.mode === "unknown") {
    set = { state: "END_UNKNOWN", ended_at: null, end_precision: "unknown" };
  } else {
    const t = resolveTime(ctx.body.ended, u, ctx.now);
    const start = Date.parse(e.started_at);
    const lastSample = samples.length ? Math.max(...samples.map((s) => Date.parse(s.observed_at))) : start;
    if (t.ms <= start) throw new ApiError(422, "END_BEFORE_START", "The end time is before the start time.");
    if (t.ms < lastSample) throw new ApiError(422, "END_BEFORE_READING", "The end time is before your last strength reading.");
    set = {
      state: t.precision === "approximate" ? "CLOSED_APPROXIMATE" : "CLOSED_REPORTED_TIME",
      ended_at: t.iso, end_precision: t.precision,
    };
    lasted = formatDuration(t.ms - start);
  }
  if (ctx.body.eased) set.eased = ctx.body.eased;
  set.revision = e.revision + 1;
  return ctx.commit(
    [{ op: "update", table: "episodes", match: { id: e.id, revision: e.revision }, set, require: true }],
    200, { episode: { ...e, ...set }, summary: { lasted, strongest } },
  );
});
