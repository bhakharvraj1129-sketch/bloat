import { z } from "zod";
import { ApiError, route } from "@/server/http";
import type { Op } from "@/server/db";
import { DbError } from "@/server/db";
import { checkAnswer, country as countryCfg, COUNTRIES, optionValues, PRO_ACTIVITY_IDS, question, REGISTRY_VERSION, activity } from "@/lib/registry";
import { isValidZone } from "@/lib/time";
import { CONSENT_VERSION, HELP_PAGE_VERSION } from "@/lib/wording";

const ONBOARDING_IDS = ["ON-03", "ON-04", "ON-05", "ON-06", "ON-07", "ON-08", "ON-09", "ON-10", "ON-11", "ON-12", "ON-14", "ON-15", "ON-16"];

const body = z.strictObject({
  age_18_or_older: z.enum(["yes", "no"]),
  country: z.string().length(2),
  region: z.string().trim().max(80).optional(),
  time_zone: z.string().max(64),
  units: z.enum(["us", "metric"]),
  help: z.strictObject({ viewed_at: z.iso.datetime(), page_version: z.literal(HELP_PAGE_VERSION) }),
  consents: z.array(z.enum(["terms_privacy", "health_data", "wellness_ack"])),
  answers: z.array(z.strictObject({
    question_id: z.string(), value: z.unknown().optional(), skipped: z.boolean().optional(), answered_at: z.iso.datetime(),
  })).max(40),
  subcuisines: z.array(z.string().max(40)).max(10).optional(),
  medicines: z.array(z.strictObject({
    name: z.string().trim().min(1).max(120), type: z.enum(["medicine", "supplement"]), med_group: z.string().optional(),
  })).max(20).default([]),
  followed: z.array(z.string().regex(/^ACT-\d{2}$/)).max(3).default([]),
});

// One atomic commit for onboarding (plan A07): profile, answers with their original answer times,
// consents with versions and the help-page acknowledgement. Retrying with the same key replays it.
export const POST = route({ body, mutation: true }, async (ctx) => {
  const b = ctx.body;
  if (b.age_18_or_older !== "yes") throw new ApiError(422, "UNDER_18", "Bloat Buddy is for adults aged 18 or older.");
  if (!COUNTRIES.includes(b.country as never)) throw new ApiError(403, "CAPABILITY_OFF", "Bloat Buddy isn't available in your country yet.");
  if (!isValidZone(b.time_zone)) throw new ApiError(422, "VALIDATION", "That time zone is not valid.");
  for (const c of ["terms_privacy", "health_data", "wellness_ack"] as const) {
    if (!b.consents.includes(c)) throw new ApiError(422, "CONSENT_REQUIRED", "All three agreements are needed to continue.");
  }
  const { data: existing } = await ctx.db.from("profiles").select("user_id").eq("user_id", ctx.userId).maybeSingle();
  if (existing) throw new ApiError(409, "ALREADY_ONBOARDED", "This account is already set up.");

  const cfg = countryCfg(b.country)!;
  const now = new Date(ctx.now).toISOString();
  const profile: Record<string, unknown> = {
    residence_country: b.country, region: b.region ?? null, time_zone: b.time_zone, analysis_time_zone: b.time_zone,
    units: b.units, date_format: cfg.date_format, cuisines: [], subcuisines: b.subcuisines ?? [], food_preferences: [], goals: [],
    onboarding_completed_at: now,
  };
  const ops: Op[] = [];
  const responses: Op[] = [];
  const seen = new Set<string>();
  for (const a of b.answers) {
    if (!ONBOARDING_IDS.includes(a.question_id) || seen.has(a.question_id)) throw new ApiError(422, "VALIDATION", `Unexpected question ${a.question_id}.`);
    seen.add(a.question_id);
    const skipped = a.skipped || a.value === undefined || a.value === null;
    if (!skipped) {
      const c = checkAnswer(a.question_id, a.value);
      if (!c.ok) throw new ApiError(422, "VALIDATION", c.reason);
      if (a.question_id === "ON-04") profile.cuisines = a.value;
      if (a.question_id === "ON-05") profile.food_preferences = a.value;
      if (a.question_id === "ON-16") profile.goals = a.value;
    }
    // A skipped answer is stored as skipped: unknown, never "No".
    responses.push({
      op: "insert", table: "question_responses",
      row: { question_id: a.question_id, question_version: question(a.question_id).version ?? REGISTRY_VERSION, value: skipped ? null : a.value, status: skipped ? "skipped" : "answered", answered_at: a.answered_at },
    });
  }
  const on10 = (b.answers.find((a) => a.question_id === "ON-10")?.value as string[] | undefined) ?? [];
  const on16 = (profile.goals as string[]) ?? [];
  if (on16.includes("whether_my_cycle_plays_a_part") && !on10.includes("cycle_context")) {
    throw new ApiError(422, "VALIDATION", "That goal needs cycle context to be on.");
  }
  ops.push({ op: "insert", table: "profiles", row: profile });
  ops.push({ op: "insert", table: "zone_periods", row: { effective_from: "1970-01-01", zone: b.time_zone } });
  ops.push({ op: "insert", table: "entitlements", row: { plan: "free", status: "none" } }); // no trial: Free is the trial
  ops.push(...responses);
  for (const type of ["terms_privacy", "health_data", "wellness_ack"]) {
    ops.push({ op: "insert", table: "consents", row: { type, version: CONSENT_VERSION, granted_at: now } });
  }
  ops.push({ op: "insert", table: "help_page_views", row: { page_version: b.help.page_version, viewed_at: b.help.viewed_at, acknowledged: true } });
  const groups = optionValues("MD-04");
  for (const m of b.medicines) {
    if (m.med_group && !groups.includes(m.med_group)) throw new ApiError(422, "VALIDATION", "Unknown medicine type.");
    ops.push({ op: "insert", table: "medicines", row: { name: m.name, type: m.type, med_group: m.med_group ?? null, started_precision: "not_sure" } });
  }
  b.followed.forEach((id, i) => {
    if (!activity(id)) throw new ApiError(422, "VALIDATION", "Unknown habit.");
    // New accounts are Free, so Pro habits cannot be followed here.
    if (PRO_ACTIVITY_IDS.has(id)) throw new ApiError(403, "PLAN_REQUIRED", "This habit is part of Bloat Buddy Pro.");
    ops.push({ op: "insert", table: "followed_activities", row: { activity_id: id, position: i + 1 } });
  });
  ops.push({ op: "insert", table: "product_events", row: { name: "onboarding_completed", props: {} } });
  try {
    return await ctx.commit(ops, 201, { onboarded: true, plan: "free" });
  } catch (e) {
    if (e instanceof DbError && e.isUnique && e.mentions("profiles")) throw new ApiError(409, "ALREADY_ONBOARDED", "This account is already set up.");
    throw e;
  }
});
