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
  // Added 26 Nov 2026 (defect X1): owner-visible but missing before. Share links you made, the
  // ingredient suggestions saved for your dishes, the product events about your account, and your exports.
  "report_shares", "food_suggestions", "product_events", "export_jobs",
] as const;

/** Columns left out of the file: hashes of link tokens are of no use to the person and stay on the server. */
const EXPORT_OMIT: Partial<Record<(typeof EXPORT_TABLES)[number], string[]>> = { report_shares: ["token_hash"], export_jobs: ["token_hash"] };

export const EXPORT_SCHEMA_VERSION = "bloat-export-2";

/**
 * Key columns per table, in order, leaving out user_id when the export already filters on it.
 * Rows are read in this order and each page continues after the last key seen (keyset paging),
 * so every row is read exactly once even if the person saves something during the export.
 */
const EXPORT_KEYS: Record<(typeof EXPORT_TABLES)[number], string[]> = {
  profiles: [], entitlements: [], lactose_details: [], nudge_state: [],
  zone_periods: ["effective_from"], followed_activities: ["activity_id"], hidden_cards: ["card_id"], health_conditions: ["condition"],
  day_marks: ["date"], day_reviews: ["date"], focus_state: ["rule"], weekly_impacts: ["week_start"],
  episode_suspicions: ["episode_id"], episode_symptoms: ["episode_id", "code"], warning_signs: ["episode_id", "code"],
  saved_dish_versions: ["dish_id", "version"], experiment_days: ["experiment_id", "date"],
  consents: ["id"], question_responses: ["id"], help_page_views: ["id"], episodes: ["id"], strength_samples: ["id"],
  meals: ["id"], meal_ingredients: ["id"], meal_photos: ["id"], saved_dishes: ["id"], activity_observations: ["id"],
  cycle_events: ["id"], exercise_records: ["id"], bowel_movements: ["id"], medicines: ["id"], medicine_changes: ["id"],
  health_tests: ["id"], reports: ["id"], experiments: ["id"], experiment_checks: ["id"], wellbeing_checks: ["id"],
  card_events: ["id"], activity_responses: ["id"],
  report_shares: ["id"], food_suggestions: ["id"], product_events: ["id"], export_jobs: ["id"],
};

export const EXPORT_PAGE_SIZE = 1000;

/** A table could not be read completely. Nothing is sent; the person can try again. */
export class ExportIncomplete extends Error {
  constructor(public table: string, public reason: "read_failed" | "duplicate_row") {
    super(`export incomplete: ${table} (${reason})`);
  }
}

const quote = (v: unknown) => `"${String(v).replace(/"/g, '\\"')}"`;

async function readTable(db: Db, userId: string, table: (typeof EXPORT_TABLES)[number], pageSize: number): Promise<Record<string, unknown>[]> {
  const keys = EXPORT_KEYS[table];
  const rows: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  let last: unknown[] | null = null;
  for (;;) {
    let q = db.from(table).select("*").eq("user_id", userId);
    for (const k of keys) q = q.order(k, { ascending: true });
    if (last && keys.length === 1) q = q.gt(keys[0]!, last[0] as string);
    if (last && keys.length === 2) q = q.or(`${keys[0]}.gt.${quote(last[0])},and(${keys[0]}.eq.${quote(last[0])},${keys[1]}.gt.${quote(last[1])})`);
    const { data, error } = await q.limit(pageSize);
    // A failed read is never treated as the end of the table.
    if (error || !Array.isArray(data)) throw new ExportIncomplete(table, "read_failed");
    for (const r of data as Record<string, unknown>[]) {
      const id = keys.length ? JSON.stringify(keys.map((k) => r[k])) : "only";
      if (seen.has(id)) throw new ExportIncomplete(table, "duplicate_row");
      seen.add(id);
      rows.push(r);
    }
    if (data.length < pageSize || keys.length === 0) break;
    const end = data[data.length - 1] as Record<string, unknown>;
    last = keys.map((k) => end[k]);
  }
  return rows;
}

/** Every owner-visible record, complete, or an ExportIncomplete error. Never a partial export. */
export async function buildExport(db: Db, userId: string, pageSize = EXPORT_PAGE_SIZE): Promise<Record<string, unknown[]>> {
  const out: Record<string, unknown[]> = {};
  for (const t of EXPORT_TABLES) {
    const omit = EXPORT_OMIT[t] ?? [];
    out[t] = (await readTable(db, userId, t, pageSize)).map((r) => {
      const { user_id: _omit, ...rest } = r;
      void _omit;
      for (const c of omit) delete rest[c];
      return rest;
    });
  }
  return out;
}

export const rowCounts = (data: Record<string, unknown[]>) => Object.fromEntries(Object.entries(data).map(([t, rows]) => [t, rows.length]));

function cell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(data: Record<string, unknown[]>): string {
  const parts: string[] = [`# ${EXPORT_SCHEMA_VERSION}`];
  for (const [table, rows] of Object.entries(data)) {
    parts.push("", `# table: ${table} (${rows.length} ${rows.length === 1 ? "row" : "rows"})`);
    if (!rows.length) continue;
    const cols = [...new Set(rows.flatMap((r) => Object.keys(r as object)))];
    parts.push(cols.join(","));
    for (const r of rows) parts.push(cols.map((c) => cell((r as Record<string, unknown>)[c])).join(","));
  }
  return parts.join("\n");
}
