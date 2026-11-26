import { z } from "zod";
import { ApiError, route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { staleReportOps } from "@/server/meals";
import { yesNoNotSure } from "@/server/schemas";
import type { Op } from "@/server/db";
import { daysView } from "@/server/days";
import { addDays, diffDays, isDate, weekStart } from "@/lib/time";
import { isLate } from "@/lib/domain/day";
import { FOOD_TAG_IDS, METRIC_VERSION, PRO_ACTIVITY_IDS } from "@/lib/registry";

const body = z.strictObject({
  // DY-01: 0–10 or "I cannot remember". 0 is a real zero.
  worst: z.union([z.number().int().min(0).max(10), z.literal("i_cannot_remember")]),
  // DY-02: always asked, never pre-filled. Missing = 422.
  whole_day: z.enum(["yes", "only_part_of_the_day", "not_sure"]),
  food_coverage: z.enum(["all", "mostly", "some", "none_recorded", "not_sure", "i_ate_and_drank_nothing"]).optional(),
  habits: z.record(z.string().regex(/^ACT-\d{2}$/), z.enum(["yes", "no", "not_sure", "skip"])).optional(),
  weekly_impact: z.enum(["not_at_all", "a_little", "a_lot", "skip"]).optional(),
  bowel: yesNoNotSure.optional(),
  watched: z.record(z.string(), yesNoNotSure).optional(),
  experiment_answer: z.enum(["yes", "partly", "no"]).optional(),
});

// The morning review sets the Bloat Score (plan A09). A skipped field stays unknown and never
// erases an earlier answer.
export const PUT = route({ capability: "recording", body, mutation: true, feature: "morning_review" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const date = ctx.params.date!;
  if (!isDate(date)) throw new ApiError(422, "VALIDATION", "That date is not valid.");
  if (date >= u.today) throw new ApiError(422, "DAY_NOT_FINISHED", "You can review a day once it has finished.");
  if (diffDays(u.today, date) > 92) throw new ApiError(422, "TOO_OLD", "This day is too old to change here.");
  const b = ctx.body;
  if ((b.bowel !== undefined || b.watched !== undefined || b.experiment_answer !== undefined) && ctx.plan !== "pro") {
    throw new ApiError(403, "PLAN_REQUIRED", "This is part of Bloat Pro.");
  }

  const { data: prior } = await ctx.db.from("day_reviews").select("*").eq("user_id", ctx.userId).eq("date", date).maybeSingle();
  const reviewedAt = new Date(ctx.now).toISOString();
  const late = isLate(date, ctx.now, u.periods);
  const row: Record<string, unknown> = {
    date,
    worst: b.worst === "i_cannot_remember" ? null : b.worst,
    cannot_remember: b.worst === "i_cannot_remember",
    whole_day: b.whole_day,
    reviewed_at: reviewedAt, late, metric_version: METRIC_VERSION,
    revision: (prior?.revision ?? 0) + 1,
  };
  if (b.food_coverage !== undefined) row.food_coverage = b.food_coverage;
  if (b.bowel !== undefined) row.bowel_answer = b.bowel;
  if (b.watched !== undefined) {
    const allowed = new Set(u.profile.watched_groups);
    for (const k of Object.keys(b.watched)) {
      if (!FOOD_TAG_IDS.includes(k) || !allowed.has(k)) throw new ApiError(422, "VALIDATION", "That food group is not one you are keeping an eye on.");
    }
    row.watched = { ...(prior?.watched ?? {}), ...b.watched };
  }
  const ops: Op[] = [{ op: "upsert", table: "day_reviews", row, conflict: ["user_id", "date"] }];
  // Changing an earlier review corrects the day: stored reports covering it are flagged and their share links revoked.
  if (prior) ops.push(...(await staleReportOps(ctx.db, ctx.userId, date)));

  if (b.habits) {
    const { data: followed } = await ctx.db.from("followed_activities").select("activity_id").eq("user_id", ctx.userId);
    const ids = new Set((followed ?? []).map((f) => f.activity_id as string));
    for (const [activity_id, answer] of Object.entries(b.habits)) {
      // Only followed habits get an explicit No, so only followed habits can be compared.
      if (!ids.has(activity_id)) throw new ApiError(422, "NOT_FOLLOWED", "Only habits you follow are asked in the review.");
      if (PRO_ACTIVITY_IDS.has(activity_id) && ctx.plan !== "pro") throw new ApiError(403, "PLAN_REQUIRED", "This is part of Bloat Pro.");
      if (answer === "skip") continue;
      ops.push({
        op: "upsert", table: "activity_observations",
        row: { date, activity_id, answer, source: "review", observed_at: null },
        conflict: ["user_id", "date", "activity_id"],
      });
    }
  }
  if (b.weekly_impact !== undefined) {
    // WK-01 is about the week that just finished; saved once for that week.
    const week = weekStart(addDays(weekStart(u.today), -1));
    ops.push({ op: "upsert", table: "weekly_impacts", row: { week_start: week, answer: b.weekly_impact, answered_at: reviewedAt }, conflict: ["user_id", "week_start"] });
  }
  if (b.experiment_answer !== undefined) {
    const { data: exp } = await ctx.db.from("experiments").select("id,phase").eq("user_id", ctx.userId).in("phase", ["RUNNING", "ADDING_BACK"]).maybeSingle();
    if (exp) ops.push({ op: "upsert", table: "experiment_days", row: { experiment_id: exp.id, date, answer: b.experiment_answer }, conflict: ["experiment_id", "date"] });
  }
  ops.push({ op: "insert", table: "product_events", row: { name: "morning_review_completed", props: { late } } });

  // The status shown on Finish is worked out from the same rules as everywhere else.
  const view = await daysView(ctx.db, ctx.userId, u, date, date, ctx.now);
  const bucket = view.summaries[0]!;
  const highest = bucket.highestLogged;
  let status: string;
  let conflictReason: string | null = null;
  if (row.cannot_remember || row.whole_day !== "yes") status = "PROVISIONAL";
  else if (highest !== null && (row.worst as number) < highest) { status = "CONFLICT"; conflictReason = "review_below_logged"; }
  else if (row.worst === 0 && bucket.episodeCount > 0) { status = "CONFLICT"; conflictReason = "zero_after_episode"; }
  else status = late ? "LATE" : "CONFIRMED";

  return ctx.commit(ops, 200, {
    date, status, conflict_reason: conflictReason, score: status === "CONFIRMED" || status === "LATE" ? row.worst : null,
    highest_logged: highest, revision: row.revision,
  });
});
