// One provider call with Bloat's retry rule and output validation. This is the single code path
// used by the app (check.ts) and by the accuracy harness (scripts/ai-eval.mts), so the harness
// measures exactly what users get: same provider, model, prompt, schema and group mapping.
// No "server-only" import here on purpose: the harness runs it from the command line.
import { aiOutput, type AiInput, type AiOutput, type AiProvider } from "./types";
import { aiProtection } from "@/lib/registry";
import { deriveGroup } from "@/lib/food-keywords";

export type CheckItem = { name: string; food_group: string; confidence: string; source_label: "seen_in_photo" | "usually_in_recipe" };
export type RunResult = {
  status: "ok" | "abstained" | "failed"; dishes: string[]; items: CheckItem[];
  tokensIn: number; tokensOut: number; retried: boolean;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function clean(output: AiOutput, typed: boolean): { dishes: string[]; items: CheckItem[] } {
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

/** Call the provider: one retry after a short wait, then "failed". Malformed output counts as a failure. */
export async function runProvider(p: AiProvider, input: AiInput, backoffMs = aiProtection.retry_backoff_seconds * 1000): Promise<RunResult> {
  let status: RunResult["status"] = "failed";
  let cleaned: { dishes: string[]; items: CheckItem[] } = { dishes: [], items: [] };
  let tokensIn = 0, tokensOut = 0, retried = false;
  for (let attempt = 0; attempt <= aiProtection.retries; attempt++) {
    if (attempt > 0) { retried = true; await sleep(backoffMs); }
    try {
      const res = await p.run(input);
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
  return { status, ...cleaned, tokensIn, tokensOut, retried };
}
