# Meal AI accuracy test

The plan (A11) asks for 300 typed dishes (100 US, 100 Indian, 100 Canadian and restaurant) and 100 photos, 25 of them deliberately unclear, with expected ingredients taken from published recipes and labels. The regional Indian set is reported separately.

**Status: not run.** No accuracy number exists, and none is claimed.

## Reference examples

| Set | Needed | Available | Still to source and human-check |
|---|---|---|---|
| US dishes | 100 | 0 | 100 |
| Indian dishes (regional set reported separately) | 100 | 0 | 100 |
| Canadian and restaurant dishes | 100 | 0 | 100 |
| Photos, clear | 75 | 0 | 75 |
| Photos, deliberately unclear | 25 | 0 | 25 |

Nothing in this folder is a reference example. Cases must come from published recipes or labels, with the source noted, and a person must check each one. They are never written by the AI being tested.

## The harness uses the app's own code

At the last review the script had its own prompt and its own answer format. That is fixed. `scripts/ai-eval.mts` now imports the same pieces the app uses:

| Piece | Shared code |
|---|---|
| Provider choice, model, approved-model list | `configCheck()` and the providers in `src/server/ai/` |
| Prompt and prompt version | `AnthropicProvider` in `src/server/ai/anthropic.ts` (`PROMPT_VERSION`) |
| Answer format and validation, one retry, server-side group mapping | `runProvider()` in `src/server/ai/run.ts`, the function `check.ts` calls |
| Dish text limit (200 characters) and photo preparation | the same helpers as the meal route |

`tests/unit/ai-eval.test.ts` checks this: the harness and the app call the same function, and the script holds no prompt text of its own.

## Running it

Put the cases in `docs/eval/cases.json` (and photos next to it) in this shape:

```json
[{ "id": "us-001", "set": "US", "source": "https://...", "dish_text": "chicken burrito with beans", "expected_groups": ["TAG-01", "TAG-02", "TAG-03", "TAG-04"] },
 { "id": "in-017", "set": "IN", "regional_indian": true, "dish_text": "pav bhaji (Jain)", "expected_groups": ["TAG-02", "TAG-07", "TAG-10"] },
 { "id": "ph-090", "set": "photo", "unclear": true, "photo_path": "photos/ph-090.jpg", "expected_groups": [] }]
```

Then run `pnpm exec tsx scripts/ai-eval.mts docs/eval/cases.json`.

- With the mock provider it only proves the plumbing. The output is labelled "NOT an AI accuracy result" and nothing is saved.
- With the real provider it costs money. It refuses to start without `--confirm-paid-calls`. **Do not use that flag until the owner has approved the key setup and spending limits.**

It reports missed items, wrong items and correct "can't tell" separately against the pass marks (missed 10% or less, wrong 15% or less, correct abstain 80% or more). A pass also needs the full set.
