// The question registry and configuration, loaded only from the JSON files extracted from the
// Master Plan PDF (v4.3 file names, v4.5 content). Nothing here is re-typed from memory.
import questionsFile from "@data/Bloat_Questions_v4.3.json";
import configFile from "@data/Bloat_Config_v4.3.json";

export type Option = { value: string; label: string; exclusive?: boolean; plan?: string };
export type Question = {
  id: string;
  version: string;
  prompt: string;
  scope: string;
  plan: "free" | "pro" | "all";
  required: boolean;
  input: {
    type: string;
    options?: Option[];
    min?: number;
    max?: number;
    max_chars?: number;
    anchors?: Record<string, string>;
    special_options?: Option[];
    [k: string]: unknown;
  };
  behaviour?: string;
  nhs_level?: Record<string, "emergency" | "urgent" | "see_doctor">;
  subcuisines?: Record<string, unknown>;
};

export const REGISTRY_VERSION = questionsFile.version;
export const questions = questionsFile.questions as unknown as Question[];
export const config = configFile;

const byId = new Map(questions.map((q) => [q.id, q]));

export function question(id: string): Question {
  const q = byId.get(id);
  if (!q) throw new Error(`Unknown question ${id}`);
  return q;
}

export function options(id: string): Option[] {
  return question(id).input.options ?? [];
}

export function optionValues(id: string): string[] {
  return options(id).map((o) => o.value);
}

export function label(id: string, value: string): string {
  return options(id).find((o) => o.value === value)?.label ?? value;
}

export type AnswerCheck = { ok: true } | { ok: false; reason: string };

/** Validate an answer against its registry definition (single, multi with exclusive options, integer). */
export function checkAnswer(id: string, value: unknown): AnswerCheck {
  const q = question(id);
  const t = q.input.type;
  const allowed = new Set(optionValues(id));
  if (t === "single" || t === "action") {
    if (typeof value !== "string" || !allowed.has(value)) return { ok: false, reason: `${id}: not an allowed option` };
    return { ok: true };
  }
  if (t === "multi") {
    if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) return { ok: false, reason: `${id}: expected a list` };
    const list = value as string[];
    if (new Set(list).size !== list.length) return { ok: false, reason: `${id}: duplicate option` };
    if (allowed.size > 0 && list.some((v) => !allowed.has(v))) return { ok: false, reason: `${id}: not an allowed option` };
    const exclusive = new Set(options(id).filter((o) => o.exclusive).map((o) => o.value));
    if (list.length > 1 && list.some((v) => exclusive.has(v))) {
      return { ok: false, reason: `${id}: an exclusive option cannot be combined with another` };
    }
    if (typeof q.input.max === "number" && list.length > q.input.max) return { ok: false, reason: `${id}: too many options` };
    return { ok: true };
  }
  if (t === "integer") {
    const special = new Set((q.input.special_options ?? []).map((o) => o.value));
    if (typeof value === "string" && special.has(value)) return { ok: true };
    if (typeof value !== "number" || !Number.isInteger(value)) return { ok: false, reason: `${id}: expected a whole number` };
    if (value < (q.input.min ?? -Infinity) || value > (q.input.max ?? Infinity)) return { ok: false, reason: `${id}: out of range` };
    return { ok: true };
  }
  if (t === "text") {
    if (typeof value !== "string") return { ok: false, reason: `${id}: expected text` };
    if (value.length > (q.input.max_chars ?? 1000)) return { ok: false, reason: `${id}: too long` };
    return { ok: true };
  }
  return { ok: true };
}

// ---- Configuration helpers -------------------------------------------------

export type CountryCode = "US" | "CA" | "IN";
export const COUNTRIES = config.countries.map((c) => c.code) as CountryCode[];

export function country(code: string | null | undefined) {
  return config.countries.find((c) => c.code === code) ?? null;
}

/** The emergency number for a country, or null. Never guessed (tests Q38, Q161). */
export function emergencyNumber(code: string | null | undefined): string | null {
  return country(code)?.emergency_number ?? null;
}

export function helpline(code: string | null | undefined): string | null {
  return country(code)?.eating_disorder_helpline ?? null;
}

export const activities = config.activities as Array<{
  id: string; group: string; label: string; detail?: string; visible_if?: string; links?: string; dedupe?: boolean;
}>;
export const PRO_ACTIVITY_IDS = new Set<string>(config.plans.habit_taps_pro_only);
export const ACTIVITY_GROUP_LABELS: Record<string, string> = {
  eating_habits: "Eating habits", movement: "Movement", sleep_feelings: "Sleep and feelings",
  body: "Body", routine: "Routine", other: "Other",
};
export function activity(id: string) {
  return activities.find((a) => a.id === id) ?? null;
}

export const foodTags = config.food_tags as Array<{ id: string; label: string; source: string }>;
export const FOOD_TAG_IDS = foodTags.map((t) => t.id);
export function tagLabel(id: string): string {
  return foodTags.find((t) => t.id === id)?.label ?? "Other";
}

export const thresholds = config.thresholds;
export const aiProtection = config.ai_protection;
export const doctorLine = config.doctor_line;
export const METRIC_VERSION = config.metrics.metric_version;

export type FeatureKey = keyof typeof config.features;
export function featurePlan(key: FeatureKey): "free" | "pro" | "future" {
  return config.features[key].plan as "free" | "pro" | "future";
}
export function isProFeature(key: FeatureKey): boolean {
  return featurePlan(key) === "pro";
}

export const pricing = config.pricing_hypotheses;
export function prices(code: CountryCode) {
  return pricing[code];
}

export function formatMoney(minor: number, currency: string): string {
  const major = minor / 100;
  if (currency === "INR") return `₹${major.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  const sym = currency === "CAD" ? "CA$" : "US$";
  return `${sym}${major.toFixed(2)}`;
}
