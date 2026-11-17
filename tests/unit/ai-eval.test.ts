import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { report, score, setCounts, type EvalCase, type EvalRow } from "@/lib/ai-eval";

const c = (id: string, set: EvalCase["set"], expected: string[], extra: Partial<EvalCase> = {}): EvalCase => ({ id, set, expected_groups: expected, ...extra });

describe("Meal AI accuracy harness (plan A11)", () => {
  it("Q147 reports missed items, wrong items and correct abstentions separately, against the set pass marks", () => {
    const rows: EvalRow[] = [
      { case: c("1", "US", ["TAG-01", "TAG-03"]), output: { groups: ["TAG-01"], abstain: false } },            // 1 missed
      { case: c("2", "US", ["TAG-04"]), output: { groups: ["TAG-04", "TAG-09"], abstain: false } },             // 1 wrong
      { case: c("3", "photo", [], { unclear: true }), output: { groups: [], abstain: true } },                  // correct abstain
      { case: c("4", "photo", [], { unclear: true }), output: { groups: ["TAG-02"], abstain: false } },         // should have abstained
    ];
    expect(score(rows)).toEqual({ cases: 4, expected_items: 3, missed: 1, missed_rate: 0.333, suggested_items: 3, wrong: 1, wrong_rate: 0.333, unclear: 2, correct_abstain: 1, correct_abstain_rate: 0.5 });
    const r = report(rows, "test-model", "p1");
    expect(r.pass).toEqual({ missed: false, wrong: false, correct_abstain: false, all: false });
  });

  it("Q188 the regional Indian set is reported separately", () => {
    const rows: EvalRow[] = [
      { case: c("in-1", "IN", ["TAG-04"], { regional_indian: true, dish_text: "dal makhani" }), output: { groups: ["TAG-04"], abstain: false } },
      { case: c("in-2", "IN", ["TAG-02"], { regional_indian: true, dish_text: "pav bhaji (Jain)" }), output: { groups: [], abstain: false } },
      { case: c("us-1", "US", ["TAG-01"]), output: { groups: ["TAG-01"], abstain: false } },
    ];
    const r = report(rows, "m", "p");
    expect(r.regional_indian).toMatchObject({ cases: 2, expected_items: 2, missed: 1, missed_rate: 0.5 });
    expect(r.overall!.missed_rate).toBe(0.333);
    expect(r.by_set!.IN!.cases).toBe(2);
  });

  it("a perfect score on a partial set is still not a pass, and an empty run reports that nothing ran", () => {
    const rows: EvalRow[] = [{ case: c("1", "US", ["TAG-01"]), output: { groups: ["TAG-01"], abstain: false } }, { case: c("2", "photo", [], { unclear: true }), output: { groups: [], abstain: true } }];
    const r = report(rows, "m", "p");
    expect(r.pass).toEqual({ missed: true, wrong: true, correct_abstain: true, all: false });
    expect(r.set_complete).toBe(false);
    expect(report([], "m", "p")).toEqual({ ran: false, reason: "No evaluation cases were run." });
    const full: EvalCase[] = [...Array(100).fill(0).map((_, i) => c(`u${i}`, "US", [])), ...Array(100).fill(0).map((_, i) => c(`i${i}`, "IN", [], { regional_indian: i < 30 })), ...Array(100).fill(0).map((_, i) => c(`c${i}`, "CA_and_restaurant", [])), ...Array(100).fill(0).map((_, i) => c(`p${i}`, "photo", [], { unclear: i < 25 }))];
    expect(setCounts(full).complete).toBe(true);
  });
});

describe("The harness measures what the app runs (Priority 3)", () => {
  const root = path.resolve(__dirname, "../..");
  const script = readFileSync(path.join(root, "scripts/ai-eval.mts"), "utf8");
  const check = readFileSync(path.join(root, "src/server/ai/check.ts"), "utf8");

  it("harness and app share one call path: provider classes, model check, prompt version, validation and group mapping", () => {
    for (const shared of ["../src/server/ai/run.ts", "../src/server/ai/anthropic.ts", "../src/server/ai/mock.ts", "../src/server/ai/types.ts"]) expect(script).toContain(shared);
    for (const name of ["runProvider(", "configCheck(", "PROMPT_VERSION", "AnthropicProvider(", "aiProtection.max_dish_text_chars"]) expect(script, name).toContain(name);
    expect(check).toContain("runProvider(p, sent)");
    // The harness has no prompt, schema or client of its own.
    expect(script).not.toMatch(/system:|zodOutputFormat|new Anthropic\(|messages\.(parse|create)/);
  });

  it("no paid call is possible without the explicit flag, and mock output is never reported as a pass", () => {
    expect(script).toContain('args.includes("--confirm-paid-calls")');
    expect(script.indexOf("if (!confirmed)")).toBeLessThan(script.indexOf("new AnthropicProvider("));
    expect(script).toContain("It is NOT an AI accuracy result");
  });
});
