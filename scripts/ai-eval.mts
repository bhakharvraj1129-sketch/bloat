// Meal AI accuracy harness (plan A11, tests Q147 and Q188).
//   pnpm test:ai-eval docs/eval/cases.json --confirm-paid-calls
//
// It runs every case through the SAME code the app uses: configCheck (approved models only),
// the provider class chosen by BLOAT_AI_PROVIDER / BLOAT_AI_MODEL, the app's prompt
// (PROMPT_VERSION), the app's output schema and group mapping (runProvider in src/server/ai/run.ts),
// and the app's 200-character limit on dish text.
//
// Paid calls are never made unless --confirm-paid-calls is given. With the mock provider it only
// proves the plumbing and says so: mock output is never reported as an accuracy result.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { report, setCounts, type EvalCase, type EvalRow } from "../src/lib/ai-eval.ts";
import { aiProtection, config } from "../src/lib/registry.ts";
import { AnthropicProvider } from "../src/server/ai/anthropic.ts";
import { MockProvider } from "../src/server/ai/mock.ts";
import { runProvider } from "../src/server/ai/run.ts";
import { configCheck, costMicros, PROMPT_VERSION, type AiProvider } from "../src/server/ai/types.ts";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--")) ?? "docs/eval/cases.json";
const confirmed = args.includes("--confirm-paid-calls");
const say = (o: unknown) => console.log(JSON.stringify(o, null, 2));

if (!existsSync(file)) { say({ ran: false, reason: `No evaluation set at ${file}.` }); process.exit(0); }
const cases = JSON.parse(readFileSync(file, "utf8")) as EvalCase[];
const sets = setCounts(cases);

const providerName = process.env.BLOAT_AI_PROVIDER ?? "mock";
const checked = configCheck(providerName, process.env.BLOAT_AI_MODEL ?? "claude-haiku-5-5");
if (!checked.ok) { say({ ran: false, reason: `Refused: ${checked.reason}. Only approved models run.` }); process.exit(1); }

let provider: AiProvider;
if (providerName === "mock") {
  provider = new MockProvider();
} else {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { say({ ran: false, reason: "No ANTHROPIC_API_KEY in the environment." }); process.exit(0); }
  if (!confirmed) {
    // Rough ceiling so the owner can approve the spend before any call is made.
    const estimate = costMicros(checked.model, cases.length * 2 * 1500, cases.length * 2 * 4000) / 1_000_000;
    say({ ran: false, reason: "Paid calls need --confirm-paid-calls.", cases: cases.length, model: checked.model, worst_case_cost_usd: Number(estimate.toFixed(2)), set_counts: sets.counts, set_complete: sets.complete });
    process.exit(0);
  }
  provider = new AnthropicProvider(checked.model, key);
}

/** The same photo preparation as the app (src/server/photo.ts): shrink, re-encode, no metadata. */
async function photo(p: string): Promise<string | null> {
  const limit = aiProtection.photo_max_mb * 1024 * 1024;
  for (const side of [config.ai.photo.max_side_px, 800]) {
    const out = await sharp(readFileSync(p)).rotate().resize({ width: side, height: side, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
    if (out.length <= limit) return out.toString("base64");
  }
  return null;
}

const rows: EvalRow[] = [];
let tokensIn = 0, tokensOut = 0, failed = 0;
for (const c of cases) {
  const image = c.photo_path ? await photo(path.resolve(path.dirname(file), c.photo_path)) : null;
  const r = await runProvider(provider, {
    purpose: c.photo_path ? "DISH_RECOGNITION_FROM_PHOTO" : "FOOD_GROUP_INGREDIENT_LIST", language: "en",
    dish_text: c.photo_path ? undefined : (c.dish_text ?? "").slice(0, aiProtection.max_dish_text_chars),
    image: image ? { base64: image, media_type: "image/jpeg" } : undefined,
  });
  tokensIn += r.tokensIn; tokensOut += r.tokensOut;
  if (r.status === "failed") failed++;
  // A failed or abstained check gives the user no items, exactly as in the app.
  rows.push({ case: c, output: { groups: [...new Set(r.items.map((i) => i.food_group))], abstain: r.status !== "ok" } });
}
const result = {
  at: new Date().toISOString(), provider: provider.label, ...report(rows, provider.model, PROMPT_VERSION),
  failed_calls: failed, cost_usd: costMicros(provider.model, tokensIn, tokensOut) / 1_000_000,
  ...(providerName === "mock" ? { note: "MOCK provider: this proves the harness runs. It is NOT an AI accuracy result.", pass: undefined } : {}),
};
if (providerName !== "mock") writeFileSync("docs/eval/last-result.json", JSON.stringify(result, null, 2));
say(result);
