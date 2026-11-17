# Meal AI accuracy test

The plan (A11) asks for 300 typed dishes (100 US, 100 Indian, 100 Canadian and restaurant) and 100 photos, 25 of them deliberately unclear, with expected ingredients taken from published recipes and labels. The regional Indian set is reported separately.

**Status: not run.** The evaluation set has not been supplied and there is no AI key. No accuracy number exists yet, and none is claimed.

To run it, put the cases in `docs/eval/cases.json` (and photos next to it) in this shape:

```json
[{ "id": "us-001", "set": "US", "dish_text": "chicken burrito with beans", "expected_groups": ["TAG-01", "TAG-02", "TAG-03", "TAG-04"] },
 { "id": "in-017", "set": "IN", "regional_indian": true, "dish_text": "pav bhaji (Jain)", "expected_groups": ["TAG-02", "TAG-07", "TAG-10"] },
 { "id": "ph-090", "set": "photo", "unclear": true, "photo_path": "photos/ph-090.jpg", "expected_groups": [] }]
```

Then run `pnpm exec tsx scripts/ai-eval.mts docs/eval/cases.json`. It reports missed items, wrong items and correct "can't tell" separately against the pass marks (missed 10% or less, wrong 15% or less, correct abstain 80% or more). A pass also needs the full set.
