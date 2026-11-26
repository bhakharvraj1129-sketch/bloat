import "server-only";
import { z } from "zod";
import type { Db } from "./supabase";
import { ApiError, notFound } from "./http";
import type { Op } from "./db";
import { deriveGroup } from "@/lib/food-keywords";
import type { CheckItem } from "./ai/check";
import { PROMPT_VERSION } from "./ai/types";
import type { Meal } from "@/lib/domain/types";

export const ingredientInput = z.strictObject({
  name: z.string().trim().min(1).max(60),
  // ML-03: Had / Didn't have / Not sure. An untouched item arrives as not_sure.
  answer: z.enum(["had", "didnt_have", "not_sure"]),
  kind: z.enum(["listed", "added"]),
});

export const ingredientsBody = {
  // marked = ML-03 answers; dont_know = ML-10; assume_usual = ML-11
  mode: z.enum(["marked", "dont_know", "assume_usual"]).optional(),
  ingredients: z.array(ingredientInput).max(30).optional(),
  save_as_dish: z.strictObject({ place: z.string().trim().max(80).optional() }).optional(),
};

export async function getMeal(db: Db, userId: string, id: string): Promise<Meal> {
  const { data } = await db.from("meals").select("*").eq("user_id", userId).eq("id", id).maybeSingle();
  if (!data) notFound("Meal");
  return data as Meal;
}

export type Suggestion = { status: string; model: string | null; items: CheckItem[] } | null;

export async function loadSuggestion(db: Db, userId: string, saveKey: string): Promise<Suggestion> {
  const { data } = await db.from("food_suggestions").select("status,model,output").eq("user_id", userId).eq("save_key", saveKey);
  if (!data || !data.length) return null;
  const items = data.flatMap((d) => ((d.output as { items?: CheckItem[] } | null)?.items ?? []));
  const okRow = data.find((d) => d.status === "ok") ?? data[0]!;
  return { status: okRow.status as string, model: okRow.model as string | null, items };
}

/**
 * Turn the user's answers into ingredient rows using the plan's answer mapping (A11). Listed items
 * must come from the stored AI result for this save key; the food group is always derived by the
 * server, and anything the client says about groups is ignored.
 */
export function ingredientOps(
  mealId: string, mode: "marked" | "dont_know" | "assume_usual",
  inputs: Array<z.infer<typeof ingredientInput>>, suggestion: Suggestion, recalled: boolean,
): { ops: Op[]; rows: Array<Record<string, unknown>> } {
  const listed = new Map((suggestion?.items ?? []).map((i) => [i.name.toLowerCase(), i]));
  const rows: Array<Record<string, unknown>> = [];
  const seen = new Set<string>();
  const push = (r: Record<string, unknown>) => {
    const key = String(r.name).toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({ meal_id: mealId, ...r });
  };

  if (mode === "dont_know" || mode === "assume_usual") {
    for (const it of listed.values()) {
      push({
        name: it.name, food_group: it.food_group, ai_listed: true, source_label: it.source_label,
        answer: mode === "dont_know" ? "unknown" : "had", source: mode === "dont_know" ? "dont_know" : "guess",
        model_version: suggestion?.model ?? null, prompt_version: PROMPT_VERSION,
      });
    }
  }
  for (const input of inputs) {
    const name = input.name.toLowerCase();
    if (input.kind === "listed") {
      if (mode !== "marked") continue;
      const it = listed.get(name);
      if (!it) throw new ApiError(422, "NOT_IN_SUGGESTION", "That ingredient was not in the list for this meal.");
      push({
        name: it.name, food_group: it.food_group, ai_listed: true, source_label: it.source_label,
        answer: input.answer, source: recalled ? "recalled" : "ai_confirmed",
        model_version: suggestion?.model ?? null, prompt_version: PROMPT_VERSION,
      });
    } else {
      // ML-09: an added ingredient is always "had"; its group comes from the fixed keyword list.
      push({ name, food_group: deriveGroup(name), ai_listed: false, source_label: null, answer: "had", source: recalled ? "recalled" : "user_added" });
    }
  }
  if (mode === "marked") {
    // Any listed item the client left out is untouched: Not sure, never Didn't have.
    for (const it of listed.values()) {
      push({
        name: it.name, food_group: it.food_group, ai_listed: true, source_label: it.source_label,
        answer: "not_sure", source: recalled ? "recalled" : "ai_confirmed",
        model_version: suggestion?.model ?? null, prompt_version: PROMPT_VERSION,
      });
    }
  }
  return { ops: rows.map((row) => ({ op: "insert" as const, table: "meal_ingredients", row })), rows };
}

export function checkStatusFor(mode: "marked" | "dont_know" | "assume_usual" | undefined, suggestion: Suggestion, hasAdded: boolean, recalled = false): string {
  if (mode === "dont_know") return "dont_know";
  if (suggestion && (suggestion.status === "ok" || suggestion.status === "abstained")) {
    if (suggestion.status === "ok" && mode) return recalled ? "recalled" : "checked";
    return hasAdded ? "manual" : "abstained";
  }
  if (hasAdded) return "manual";
  if (suggestion) return suggestion.status === "paused" ? "paused" : suggestion.status === "limited" ? "limited" : "failed";
  return "not_requested";
}

export async function hasAiConsent(db: Db, userId: string): Promise<boolean> {
  const { data } = await db.from("consents").select("granted_at,withdrawn_at,created_at").eq("user_id", userId).eq("type", "ai_meal").order("created_at", { ascending: false }).limit(1);
  const last = data?.[0];
  return !!last && !!last.granted_at && !last.withdrawn_at;
}


/**
 * A record was deleted or corrected (plan B05, "Record deleted or corrected: recompute; flag dependent
 * reports; revoke shares"): stored reports whose range overlaps the days it touched become stale and
 * their share links are revoked. Used by every delete and correction, not only meals.
 */
export async function staleReportOps(db: Db, userId: string, ...dates: string[]): Promise<Op[]> {
  const days = dates.filter(Boolean).sort();
  if (!days.length) return [];
  const { data } = await db.from("reports").select("id").eq("user_id", userId).lte("range_from", days[days.length - 1]!).gte("range_to", days[0]!).eq("stale", false);
  const at = new Date().toISOString();
  return (data ?? []).flatMap((r) => [
    { op: "update" as const, table: "reports", match: { id: r.id }, set: { stale: true } },
    { op: "update" as const, table: "report_shares", match: { report_id: r.id }, set: { revoked_at: at } },
  ]);
}

