// Meal AI accuracy harness (plan A11, tests Q147 and Q188). It measures three things separately
// against the pass marks in the configuration: missed bloating ingredients, wrong suggestions and
// correct "can't tell" on unclear photos. The regional Indian set is also reported on its own.
// It never invents a result: with no evaluation set it reports that nothing was run.
import { thresholds } from "./registry";

export type EvalCase = {
  id: string; set: "US" | "IN" | "CA_and_restaurant" | "photo"; regional_indian?: boolean; unclear?: boolean;
  dish_text?: string; photo_path?: string;
  /** Food groups expected from published recipes and labels. Empty for unclear photos. */
  expected_groups: string[];
};
export type EvalOutput = { groups: string[]; abstain: boolean };
export type EvalRow = { case: EvalCase; output: EvalOutput };

export type EvalScore = {
  cases: number; expected_items: number; missed: number; missed_rate: number | null;
  suggested_items: number; wrong: number; wrong_rate: number | null;
  unclear: number; correct_abstain: number; correct_abstain_rate: number | null;
};

export function score(rows: EvalRow[]): EvalScore {
  let expected = 0, missed = 0, suggested = 0, wrong = 0, unclear = 0, abstained = 0;
  for (const r of rows) {
    if (r.case.unclear) { unclear++; if (r.output.abstain) abstained++; continue; }
    const exp = new Set(r.case.expected_groups), got = new Set(r.output.abstain ? [] : r.output.groups);
    expected += exp.size; suggested += got.size;
    for (const g of exp) if (!got.has(g)) missed++;
    for (const g of got) if (!exp.has(g)) wrong++;
  }
  const rate = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 1000 : null);
  return { cases: rows.length, expected_items: expected, missed, missed_rate: rate(missed, expected), suggested_items: suggested, wrong, wrong_rate: rate(wrong, suggested), unclear, correct_abstain: abstained, correct_abstain_rate: rate(abstained, unclear) };
}

export type EvalReport = {
  ran: boolean; reason?: string; model?: string; prompt_version?: string;
  overall?: EvalScore; regional_indian?: EvalScore; by_set?: Record<string, EvalScore>;
  pass?: { missed: boolean | null; wrong: boolean | null; correct_abstain: boolean | null; all: boolean };
  set_complete?: boolean; set_counts?: Record<string, number>;
};

/** The plan's set: 300 typed dishes (100 US, 100 Indian, 100 Canadian and restaurant) and 100 photos, 25 unclear. */
export function setCounts(cases: EvalCase[]) {
  const c = (f: (x: EvalCase) => boolean) => cases.filter(f).length;
  const counts = { US: c((x) => x.set === "US"), IN: c((x) => x.set === "IN"), CA_and_restaurant: c((x) => x.set === "CA_and_restaurant"), photos: c((x) => x.set === "photo"), unclear_photos: c((x) => x.set === "photo" && !!x.unclear), regional_indian: c((x) => !!x.regional_indian) };
  const want = thresholds.ai_test_set;
  const complete = counts.US >= want.typed.US && counts.IN >= want.typed.IN && counts.CA_and_restaurant >= want.typed.CA_and_restaurant && counts.photos >= want.photos && counts.unclear_photos >= want.unclear_photos && counts.regional_indian > 0;
  return { counts, complete };
}

export function report(rows: EvalRow[], model: string, promptVersion: string): EvalReport {
  if (!rows.length) return { ran: false, reason: "No evaluation cases were run." };
  const overall = score(rows);
  const marks = thresholds.ai_test_pass;
  const pass = {
    missed: overall.missed_rate === null ? null : overall.missed_rate <= marks.missed_max,
    wrong: overall.wrong_rate === null ? null : overall.wrong_rate <= marks.wrong_max,
    correct_abstain: overall.correct_abstain_rate === null ? null : overall.correct_abstain_rate >= marks.correct_abstain_min,
  };
  const sets = setCounts(rows.map((r) => r.case));
  const by_set: Record<string, EvalScore> = {};
  for (const s of ["US", "IN", "CA_and_restaurant", "photo"]) by_set[s] = score(rows.filter((r) => r.case.set === s));
  return {
    ran: true, model, prompt_version: promptVersion, overall, by_set,
    regional_indian: score(rows.filter((r) => r.case.regional_indian)),
    // A pass needs every mark met AND the full set from the plan; a partial set never passes.
    pass: { ...pass, all: pass.missed === true && pass.wrong === true && pass.correct_abstain === true && sets.complete },
    set_complete: sets.complete, set_counts: sets.counts,
  };
}
