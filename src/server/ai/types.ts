import { z } from "zod";
import { FOOD_TAG_IDS, config } from "@/lib/registry";

export const PROMPT_VERSION = "ingredients-v1";
export type Purpose = "DISH_RECOGNITION_FROM_PHOTO" | "FOOD_GROUP_INGREDIENT_LIST";

/** The fixed input: dish text or one photo, plus the interface language. Nothing else is ever sent. */
export type AiInput = {
  purpose: Purpose;
  dish_text?: string;
  image?: { base64: string; media_type: "image/jpeg" };
  language: "en";
};

// The fixed output (plan A11). Unknown fields, unknown tags, malformed JSON and oversize lists are rejected.
export const aiOutput = z.strictObject({
  dishes: z.array(z.string().min(1).max(120)).max(8),
  items: z.array(z.strictObject({
    name: z.string().min(1).max(60),
    food_group: z.enum(FOOD_TAG_IDS as [string, ...string[]]),
    confidence: z.enum(["low", "med", "high"]),
    source_label: z.enum(["seen_in_photo", "usually_in_recipe"]),
  })).max(config.ai.output_max_ingredients),
  abstain: z.boolean(),
});
export type AiOutput = z.infer<typeof aiOutput>;

export type AiResult = { output: AiOutput; input_tokens: number; output_tokens: number; model: string };

export interface AiProvider {
  /** Shown to people wherever the result is used, so a mock is never mistaken for the real service. */
  readonly label: string;
  readonly model: string;
  run(input: AiInput): Promise<AiResult>;
}

// Only these models may be used; anything else is refused before any call (plan 0.4).
export const APPROVED_MODELS = ["claude-haiku-5-5", "mock-ingredients-1"];
export const MAX_OUTPUT_TOKENS = 4000;
/** US$ per million tokens for cost tracking: Claude Haiku 5.5 with prompts under 100K tokens. */
export const PRICE_PER_MTOK: Record<string, { input: number; output: number }> = {
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
  "mock-ingredients-1": { input: 0.1, output: 0.5 },
};

export function costMicros(model: string, inputTokens: number, outputTokens: number): number {
  const p = PRICE_PER_MTOK[model] ?? { input: 0, output: 0 };
  return Math.round(inputTokens * p.input + outputTokens * p.output);
}

/** Start-up check for the configured provider and model (plan 0.4): only approved models run. */
export function configCheck(providerName: string, model: string): { ok: true; model: string } | { ok: false; reason: string } {
  if (providerName !== "mock" && providerName !== "anthropic") return { ok: false, reason: "unknown provider" };
  const effective = providerName === "mock" ? "mock-ingredients-1" : model;
  if (!APPROVED_MODELS.includes(effective)) return { ok: false, reason: "model not approved" };
  return { ok: true, model: effective };
}
