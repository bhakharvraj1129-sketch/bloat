import "server-only";
import { createHash } from "node:crypto";
import type { Db } from "../supabase";
import { srv, tx } from "../db";
import { env } from "../env";
import { aiOutput, APPROVED_MODELS, costMicros, PROMPT_VERSION, type AiInput, type AiOutput, type AiProvider, type Purpose } from "./types";
import { MockProvider } from "./mock";
import { AnthropicProvider } from "./anthropic";
import { aiProtection } from "@/lib/registry";
import { deriveGroup } from "@/lib/food-keywords";
import { AI_LIMITED_MESSAGE, AI_PAUSED_MESSAGE } from "@/lib/wording";

export type CheckStatus = "ok" | "abstained" | "failed" | "paused" | "limited" | "too_large";
export type CheckItem = { name: string; food_group: string; confidence: string; source_label: "seen_in_photo" | "usually_in_recipe" };
export type CheckResult = {
  status: CheckStatus; dishes: string[]; items: CheckItem[]; message: string | null;
  provider_label: string; model: string | null; prompt_version: string; replayed: boolean;
};

let alertedBadModel = false;

/** The provider is chosen in configuration; the rest of the app never knows which one runs. */
export async function provider(): Promise<AiProvider | null> {
  const model = env.aiProvider === "mock" ? "mock-ingredients-1" : env.aiModel;
  if (!APPROVED_MODELS.includes(model) || (env.aiProvider !== "mock" && env.aiProvider !== "anthropic")) {
    if (!alertedBadModel) {
      alertedBadModel = true;
      await srv("srv_alert", { p_kind: "ai_model_not_approved", p_detail: { model, provider: env.aiProvider } }).catch(() => {});
    }
    return null;
  }
  if (env.aiProvider === "mock") return new MockProvider();
  if (!env.anthropicKey) return null;
  return new AnthropicProvider(model, env.anthropicKey);
}

type Gate = { enabled: boolean; month_spent_micros: number; monthly_limit_micros: number; hour_count: number; day_count: number };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const unavailable = (status: CheckStatus, message: string, label = "AI suggestion"): CheckResult => ({
  status, dishes: [], items: [], message, provider_label: label, model: null, prompt_version: PROMPT_VERSION, replayed: false,
});

function clean(output: AiOutput, typed: boolean): { dishes: string[]; items: CheckItem[] } {
  const seen = new Set<string>();
  const items: CheckItem[] = [];
  for (const it of output.items) {
    const name = it.name.trim().toLowerCase();
    // The server re-derives the group from its own keyword list; an item it cannot place is dropped.
    const group = deriveGroup(name, it.food_group);
    if (group === "other" || seen.has(name)) continue;
    seen.add(name);
    // Guesses never look like facts: every item of a typed dish is "Usually in this recipe".
    items.push({ name, food_group: group, confidence: it.confidence, source_label: typed ? "usually_in_recipe" : it.source_label });
  }
  return { dishes: output.dishes, items: items.slice(0, aiProtection.max_items_returned) };
}

/**
 * Run one ingredient check with every protection from plan 0.4: kill switch, monthly spending
 * limit, hourly and daily limits, size limit, one retry, and never the same meal twice.
 * It never throws for AI trouble: the caller can always save the meal.
 */
export async function runCheck(
  db: Db, userId: string, localDay: string, saveKey: string, purpose: Purpose,
  input: { dish_text?: string; image?: { base64: string; media_type: "image/jpeg" } },
): Promise<CheckResult> {
  const { data: prior } = await db.from("food_suggestions").select("*").eq("user_id", userId).eq("save_key", saveKey).eq("purpose", purpose).maybeSingle();
  if (prior) {
    const out = (prior.output ?? { dishes: [], items: [] }) as { dishes: string[]; items: CheckItem[]; provider_label?: string };
    return {
      status: prior.status as CheckStatus, dishes: out.dishes ?? [], items: out.items ?? [],
      message: prior.status === "paused" ? AI_PAUSED_MESSAGE : prior.status === "ok" || prior.status === "abstained" ? null : AI_LIMITED_MESSAGE,
      provider_label: out.provider_label ?? "AI suggestion", model: prior.model, prompt_version: prior.prompt_version ?? PROMPT_VERSION, replayed: true,
    };
  }

  const p = await provider();
  let gate: Gate;
  try {
    gate = await srv<Gate>("srv_ai_gate", { p_user: userId, p_local_day: localDay });
  } catch {
    return unavailable("paused", AI_PAUSED_MESSAGE);
  }
  if (!p || !gate.enabled || gate.month_spent_micros >= gate.monthly_limit_micros) return unavailable("paused", AI_PAUSED_MESSAGE, p?.label);
  if (gate.hour_count >= aiProtection.per_user_per_hour || gate.day_count >= aiProtection.per_user_per_day) {
    return unavailable("limited", AI_LIMITED_MESSAGE, p.label);
  }

  // Only the first 200 characters of the dish text go to the AI; the full text stays on the meal.
  const sent: AiInput = {
    purpose, language: "en",
    dish_text: input.dish_text?.slice(0, aiProtection.max_dish_text_chars),
    image: input.image,
  };
  const inputHash = createHash("sha256").update(sent.dish_text ?? "").update(sent.image?.base64 ?? "").digest("hex");

  let status: CheckStatus = "failed";
  let cleaned: { dishes: string[]; items: CheckItem[] } = { dishes: [], items: [] };
  let tokensIn = 0, tokensOut = 0, retried = false;
  const started = Date.now();
  for (let attempt = 0; attempt <= aiProtection.retries; attempt++) {
    if (attempt > 0) { retried = true; await sleep(aiProtection.retry_backoff_seconds * 1000); }
    try {
      const res = await p.run(sent);
      tokensIn += res.input_tokens; tokensOut += res.output_tokens;
      const parsed = aiOutput.safeParse(res.output);
      if (!parsed.success) continue; // malformed or with extra fields: rejected, one retry, then unknown
      cleaned = clean(parsed.data, !input.image);
      status = parsed.data.abstain || (cleaned.items.length === 0 && cleaned.dishes.length === 0) ? "abstained" : "ok";
      if (status === "abstained") cleaned = { dishes: [], items: [] };
      break;
    } catch {
      // provider error or timeout: one retry after a short wait, then ingredients unknown
    }
  }
  const latency = Date.now() - started;
  const cost = costMicros(p.model, tokensIn, tokensOut);
  // Usage log: model, purpose, tokens, cost, latency, retry, failure. No prompt text or user content.
  await srv("srv_ai_record", {
    p_user: userId,
    p_row: { local_day: localDay, purpose, model: p.model, input_tokens: tokensIn, output_tokens: tokensOut, cost_micros: cost, latency_ms: latency, retried, failed: status === "failed" },
  }).catch(() => {});
  await tx(userId, [{
    op: "upsert", table: "food_suggestions", conflict: ["user_id", "save_key", "purpose"],
    row: { save_key: saveKey, purpose, input_hash: inputHash, output: { ...cleaned, provider_label: p.label }, model: p.model, prompt_version: PROMPT_VERSION, latency_ms: latency, status },
  }]).catch(() => {});

  return {
    status, ...cleaned, message: status === "failed" ? AI_LIMITED_MESSAGE : null,
    provider_label: p.label, model: p.model, prompt_version: PROMPT_VERSION, replayed: false,
  };
}
