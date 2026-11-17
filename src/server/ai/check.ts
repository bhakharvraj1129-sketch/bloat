import "server-only";
import { createHash } from "node:crypto";
import type { Db } from "../supabase";
import { srv, tx } from "../db";
import { env } from "../env";
import { configCheck, costMicros, PROMPT_VERSION, type AiInput, type AiProvider, type Purpose } from "./types";
import { runProvider, type CheckItem } from "./run";
import { MockProvider } from "./mock";
import { AnthropicProvider } from "./anthropic";
import { aiProtection } from "@/lib/registry";
import { AI_LIMITED_MESSAGE, AI_PAUSED_MESSAGE } from "@/lib/wording";

export type CheckStatus = "ok" | "abstained" | "failed" | "paused" | "limited" | "too_large";
export type { CheckItem };
export type CheckResult = {
  status: CheckStatus; dishes: string[]; items: CheckItem[]; message: string | null;
  provider_label: string; model: string | null; prompt_version: string; replayed: boolean;
};

let alertedBadModel = false;

/** The provider is chosen in configuration; the rest of the app never knows which one runs. */
export async function provider(): Promise<AiProvider | null> {
  const checked = configCheck(env.aiProvider, env.aiModel);
  if (!checked.ok) {
    // Refused before any call, with one alert to the founder (no user data).
    if (!alertedBadModel) {
      alertedBadModel = true;
      await srv("srv_alert", { p_kind: "ai_model_not_approved", p_detail: { model: env.aiModel, provider: env.aiProvider } }).catch(() => {});
    }
    return null;
  }
  const model = checked.model;
  if (env.aiProvider === "mock") return new MockProvider();
  if (!env.anthropicKey) return null;
  return new AnthropicProvider(model, env.anthropicKey);
}

type Gate = { enabled: boolean; month_spent_micros: number; monthly_limit_micros: number; hour_count: number; day_count: number };

const unavailable = (status: CheckStatus, message: string, label = "AI suggestion"): CheckResult => ({
  status, dishes: [], items: [], message, provider_label: label, model: null, prompt_version: PROMPT_VERSION, replayed: false,
});

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
  // A paused or limited result was never sent to the AI, so it may be tried again later.
  if (prior && prior.status !== "paused" && prior.status !== "limited") {
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
  // Remember why no check ran, so the meal can be saved with the honest status.
  const note = (status: "paused" | "limited") => tx(userId, [{
    op: "upsert", table: "food_suggestions", conflict: ["user_id", "save_key", "purpose"],
    row: { save_key: saveKey, purpose, input_hash: "not-sent", output: null, model: null, prompt_version: PROMPT_VERSION, latency_ms: null, status },
  }]).catch(() => {});
  if (!p || !gate.enabled || gate.month_spent_micros >= gate.monthly_limit_micros) {
    await note("paused");
    return unavailable("paused", AI_PAUSED_MESSAGE, p?.label);
  }
  if (gate.hour_count >= aiProtection.per_user_per_hour || gate.day_count >= aiProtection.per_user_per_day) {
    await note("limited");
    return unavailable("limited", AI_LIMITED_MESSAGE, p.label);
  }

  // Only the first 200 characters of the dish text go to the AI; the full text stays on the meal.
  const sent: AiInput = {
    purpose, language: "en",
    dish_text: input.dish_text?.slice(0, aiProtection.max_dish_text_chars),
    image: input.image,
  };
  const inputHash = createHash("sha256").update(sent.dish_text ?? "").update(sent.image?.base64 ?? "").digest("hex");

  const started = Date.now();
  // The call, its one retry and the validation are shared with the accuracy harness (ai/run.ts).
  const ran = await runProvider(p, sent);
  const status: CheckStatus = ran.status;
  const cleaned = { dishes: ran.dishes, items: ran.items };
  const { tokensIn, tokensOut, retried } = ran;
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
