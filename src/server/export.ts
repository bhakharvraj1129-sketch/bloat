import "server-only";
import type { Db } from "./supabase";

// Every owner-visible table (plan B04: export all owner-visible records, with schema versions).
export const EXPORT_TABLES = [
  "profiles", "zone_periods", "consents", "entitlements", "question_responses", "help_page_views", "episodes",
  "strength_samples", "episode_symptoms", "warning_signs", "episode_suspicions", "day_reviews", "day_marks",
  "weekly_impacts", "meals", "meal_ingredients", "meal_photos", "saved_dishes", "saved_dish_versions",
  "followed_activities", "activity_observations", "cycle_events", "exercise_records", "bowel_movements",
  "medicines", "medicine_changes", "health_conditions", "lactose_details", "health_tests", "reports",
  "experiments", "experiment_days", "experiment_checks", "wellbeing_checks", "card_events", "hidden_cards",
  "activity_responses", "focus_state", "nudge_state",
] as const;

export const EXPORT_SCHEMA_VERSION = "bloat-export-1";

export async function buildExport(db: Db, userId: string): Promise<Record<string, unknown[]>> {
  const out: Record<string, unknown[]> = {};
  for (const t of EXPORT_TABLES) {
    const rows: unknown[] = [];
    // Export is unlimited: page through everything.
    for (let from = 0; ; from += 1000) {
      const { data, error } = await db.from(t).select("*").eq("user_id", userId).range(from, from + 999);
      if (error || !data) break;
      rows.push(...data);
      if (data.length < 1000) break;
    }
    out[t] = rows.map((r) => {
      const { user_id: _omit, ...rest } = r as Record<string, unknown>;
      void _omit;
      return rest;
    });
  }
  return out;
}

function cell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(data: Record<string, unknown[]>): string {
  const parts: string[] = [`# ${EXPORT_SCHEMA_VERSION}`];
  for (const [table, rows] of Object.entries(data)) {
    parts.push("", `# table: ${table}`);
    if (!rows.length) continue;
    const cols = [...new Set(rows.flatMap((r) => Object.keys(r as object)))];
    parts.push(cols.join(","));
    for (const r of rows) parts.push(cols.map((c) => cell((r as Record<string, unknown>)[c])).join(","));
  }
  return parts.join("\n");
}
