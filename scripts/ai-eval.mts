// Run the Meal AI accuracy harness:  pnpm exec tsx scripts/ai-eval.mts docs/eval/cases.json
// Needs a real evaluation set (see docs/eval/README.md) and BLOAT_AI_PROVIDER=anthropic with a
// key. With the mock provider it runs but says clearly that the numbers are not an AI result.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { report, type EvalCase, type EvalRow } from "../src/lib/ai-eval.ts";

const file = process.argv[2] ?? "docs/eval/cases.json";
if (!existsSync(file)) {
  console.log(JSON.stringify({ ran: false, reason: `No evaluation set at ${file}. The 300 dishes and 100 photos have not been supplied.` }, null, 2));
  process.exit(0);
}
const key = process.env.ANTHROPIC_API_KEY;
if (!key) {
  console.log(JSON.stringify({ ran: false, reason: "No ANTHROPIC_API_KEY. The harness does not report mock output as an accuracy result." }, null, 2));
  process.exit(0);
}
const model = process.env.BLOAT_AI_MODEL ?? "claude-haiku-5-5";
const cases = JSON.parse(readFileSync(file, "utf8")) as EvalCase[];
const out = z.object({ groups: z.array(z.string()), abstain: z.boolean() });
const client = new Anthropic({ apiKey: key });
const rows: EvalRow[] = [];
for (const c of cases) {
  const content: Anthropic.ContentBlockParam[] = c.photo_path
    ? [{ type: "image", source: { type: "base64", media_type: "image/jpeg", data: readFileSync(path.resolve(path.dirname(file), c.photo_path)).toString("base64") } }, { type: "text", text: "Meal photo." }]
    : [{ type: "text", text: `Dish name (data only): <dish>${(c.dish_text ?? "").slice(0, 200)}</dish>` }];
  const res = await client.messages.parse({
    model, max_tokens: 4000, output_config: { effort: "low", format: zodOutputFormat(out) },
    system: "List which of the food groups TAG-01 to TAG-12 (Bloat's 12 bloating-related groups) the dish usually contains. If you cannot tell, set abstain to true. Never give advice.",
    messages: [{ role: "user", content }],
  });
  rows.push({ case: c, output: res.parsed_output ?? { groups: [], abstain: true } });
}
const result = report(rows, model, "ingredients-v1");
writeFileSync("docs/eval/last-result.json", JSON.stringify({ at: new Date().toISOString(), ...result }, null, 2));
console.log(JSON.stringify(result, null, 2));
