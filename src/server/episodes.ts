import "server-only";
import { z } from "zod";
import type { Db } from "./supabase";
import { ApiError, notFound } from "./http";
import type { Op } from "./db";
import { checkAnswer, question } from "@/lib/registry";
import { COMMON_SYMPTOM_LEVEL, commonSymptomSentence, levelSentence, NHS_SOURCE_LABEL, type HelpLevel } from "@/lib/wording";
import type { Episode, Sample } from "@/lib/domain/types";
import { dayBoundsUtc } from "@/lib/time";
import type { UserCtx } from "./userdata";

export const detailSchema = {
  warning_signs: z.array(z.string()).max(10).optional(),
  feel: z.array(z.string()).max(4).optional(),
  symptoms: z.array(z.string()).max(12).optional(),
  suspicion: z.strictObject({
    kind: z.enum(["meal", "activity", "not_sure"]),
    meal_id: z.uuid().optional(),
    activity_id: z.string().regex(/^ACT-\d{2}$/).optional(),
  }).optional(),
};

export function validate(id: string, value: unknown) {
  const c = checkAnswer(id, value);
  if (!c.ok) throw new ApiError(422, "VALIDATION", c.reason);
}

export async function getEpisode(db: Db, userId: string, id: string): Promise<Episode> {
  const { data } = await db.from("episodes").select("*").eq("user_id", userId).eq("id", id).maybeSingle();
  if (!data) notFound("Bloating record");
  return data as Episode;
}

export async function openEpisode(db: Db, userId: string): Promise<Episode | null> {
  const { data } = await db.from("episodes").select("*").eq("user_id", userId).eq("state", "OPEN").maybeSingle();
  return (data as Episode | null) ?? null;
}

export async function samplesOf(db: Db, userId: string, episodeId: string): Promise<Sample[]> {
  const { data } = await db.from("strength_samples").select("*").eq("user_id", userId).eq("episode_id", episodeId).order("observed_at");
  return (data ?? []) as Sample[];
}

/** A new start must not fall inside a closed episode. Closed-vs-closed overlap is a database constraint. */
export async function assertStartFree(db: Db, userId: string, startIso: string, exceptId?: string) {
  let q = db.from("episodes").select("id").eq("user_id", userId).lte("started_at", startIso).gt("ended_at", startIso);
  if (exceptId) q = q.neq("id", exceptId);
  const { data } = await q.limit(1);
  if (data && data.length) throw new ApiError(422, "OVERLAP", "This overlaps another bloating record.");
}

export type Advice = { code: string; level: HelpLevel; sentence: string; source: string };

/** Warning chips: the exact NHS sentence for the chip's level, shown inline. Nothing is paused. */
export function warningAdvice(codes: string[], country: string): Advice[] {
  const levels = question("EP-08a").nhs_level ?? {};
  return codes.filter((c) => c !== "none").map((code) => {
    const level = levels[code] as HelpLevel;
    return { code, level, sentence: levelSentence(level, country), source: NHS_SOURCE_LABEL };
  });
}

export function warningOps(episodeId: string, codes: string[] | undefined): Op[] {
  if (!codes) return [];
  validate("EP-08a", codes);
  return codes.filter((c) => c !== "none").map((code) => ({
    op: "upsert" as const, table: "warning_signs", row: { episode_id: episodeId, code }, conflict: ["episode_id", "code"],
  }));
}

/** EP-08 common symptoms: the NHS sentence shows at most once per sign per day. */
export async function symptomAdvice(db: Db, userId: string, u: UserCtx, codes: string[]): Promise<Advice[]> {
  const wanted = codes.filter((c) => c in COMMON_SYMPTOM_LEVEL);
  if (!wanted.length) return [];
  // "Today" means episodes that started on the user's current day (not when the row was written).
  const [start, end] = dayBoundsUtc(u.today, u.zone);
  const { data: todays } = await db.from("episodes").select("id").eq("user_id", userId)
    .gte("started_at", new Date(start).toISOString()).lt("started_at", new Date(end).toISOString());
  const ids = (todays ?? []).map((e) => e.id as string);
  const { data } = ids.length
    ? await db.from("episode_symptoms").select("code").eq("user_id", userId).in("code", wanted).in("episode_id", ids)
    : { data: [] as Array<{ code: string }> };
  const seen = new Set((data ?? []).map((r) => r.code as string));
  return wanted.filter((c) => !seen.has(c)).map((code) => ({
    code, level: COMMON_SYMPTOM_LEVEL[code]!, sentence: commonSymptomSentence(code)!, source: NHS_SOURCE_LABEL,
  }));
}

export function symptomOps(episodeId: string, codes: string[] | undefined): Op[] {
  if (!codes) return [];
  validate("EP-08", codes);
  return codes.filter((c) => c !== "none" && c !== "skip").map((code) => ({
    op: "upsert" as const, table: "episode_symptoms", row: { episode_id: episodeId, code }, conflict: ["episode_id", "code"],
  }));
}

export function proDetailRequested(body: { feel?: unknown; symptoms?: unknown; suspicion?: unknown; eased?: unknown }): boolean {
  return body.feel !== undefined || body.symptoms !== undefined || body.suspicion !== undefined || body.eased !== undefined;
}

export function requirePro(plan: string) {
  if (plan !== "pro") throw new ApiError(403, "PLAN_REQUIRED", "This is part of Bloat Buddy Pro.");
}
