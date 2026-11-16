import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/time";
import { compare, possibleTriggers, targets, yourUsual, baselineMarker, cycleView, medicineViews, usualScore } from "@/lib/domain/insights";
import { groupExposure, mealKnowledge, windowMeals } from "@/lib/domain/exposure";
import { episode, meal, periods, rep, review, summary, world, type DaySpec } from "./build";
import { COMPARISON_LINE, TRIGGERS_FOOTER } from "@/lib/wording";

const S = "2026-06-01";
const fizzy = { kind: "food" as const, id: "TAG-09", label: "Fizzy drinks" };

describe("Possible triggers (plan A14)", () => {
  it("Q124 six days with: not shown as a comparison; '1 more day needed'. At 7 + 7: counts, means and the fixed wording", () => {
    const six = compare(fizzy, world(S, [...rep(6, { score: 6, with: true }), ...rep(7, { score: 3, with: false })]));
    expect(six.state).toBe("SPARSE");
    expect(six.section).toBe("not_enough_data");
    expect(six.needed_with).toBe(1);
    expect(six.mean_with).toBeNull(); // no numbers before both groups reach 7
    const seven = compare(fizzy, world(S, [...rep(7, { score: 6, with: true }), ...rep(7, { score: 3, with: false })]));
    expect(seven.state).toBe("DESCRIPTIVE_COMPARISON");
    expect(seven).toMatchObject({ with_days: 7, without_days: 7, mean_with: 6, mean_without: 3, difference: 3 });
    const t = possibleTriggers(world(S, [...rep(7, { score: 6, with: true }), ...rep(7, { score: 3, with: false })]));
    expect(t.header).toBe("13 groups examined; differences can appear by chance.");
    expect(COMPARISON_LINE).toBe("This is a difference in your records, not a medical measure.");
    expect(TRIGGERS_FOOTER).toBe("These are patterns in your own records, not proof of a cause.");
  });

  it("Q17 seven with, seven without and a zero difference: a descriptive result under 'no clear difference'", () => {
    const c = compare(fizzy, world(S, [...rep(7, { score: 4, with: true }), ...rep(7, { score: 4, with: false })]));
    expect(c).toMatchObject({ state: "DESCRIPTIVE_COMPARISON", difference: 0, section: "no_clear_difference" });
  });

  it("Q18 a negative difference keeps the same descriptive state with a signed number and no protective claim", () => {
    const alt: DaySpec[] = [];
    for (let i = 0; i < 14; i++) alt.push({ score: i % 2 ? 2 : 6, with: i % 2 === 1 });
    const c = compare(fizzy, world(S, alt));
    expect(c.state).toBe("DESCRIPTIVE_COMPARISON");
    expect(c.difference).toBe(-4);
    expect(c.first_half).toBeLessThan(0);
    expect(JSON.stringify(c).toLowerCase()).not.toMatch(/protect|safe|good for/);
  });

  it("Q19 only days with the food: counts only, no numbers and no advice", () => {
    const c = compare(fizzy, world(S, rep(10, { score: 5, with: true })));
    expect(c).toMatchObject({ state: "ONE_GROUP_ONLY", with_days: 10, without_days: 0, mean_with: null, difference: null });
  });

  it("Q136 results are grouped into three sections, alphabetical inside each, never sorted by size", () => {
    // fizzy drinks: +1.5; dairy: +4; both consistent. Dairy has the bigger difference but comes first only by name.
    const days: DaySpec[] = [];
    for (let i = 0; i < 28; i++) {
      const fz = i % 2 === 0, dairy = i % 4 < 2;
      days.push({ score: 2 + (fz ? 1.5 : 0) + (dairy ? 4 : 0), with: fz, extra: dairy ? [["milk", "TAG-01", "had"]] : [["milk", "TAG-01", "didnt_have"]] });
    }
    const t = possibleTriggers(world(S, days));
    expect(t.worth_watching.map((c) => c.target.label)).toEqual(["Fizzy drinks", "Milk and dairy with lactose"]);
    const labels = t.not_enough_data.map((c) => c.target.label);
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)));
    expect(t.worth_watching[0]!.difference).toBeLessThan(t.worth_watching[1]!.difference!);
  });

  it("Q137 a difference of 1.4 that points opposite ways in the two halves goes under 'no clear difference', with both halves shown", () => {
    const days: DaySpec[] = [];
    // first half: with 9, without 2 (+7). second half: with 3, without 7.2 (-4.2). overall about +1.4
    for (let i = 0; i < 10; i++) days.push({ score: i % 2 ? 9 : 2, with: i % 2 === 1 });
    for (let i = 0; i < 10; i++) days.push({ score: i % 2 ? 3 : 7.2, with: i % 2 === 1 });
    const c = compare(fizzy, world(S, days));
    expect(c.difference).toBe(1.4);
    expect(c.first_half).toBeGreaterThan(0);
    expect(c.second_half).toBeLessThan(0);
    expect(c.section).toBe("no_clear_difference");
  });

  it("Q138 a group on 85% of usable days after 21 days gets the daily-food message, not a comparison", () => {
    const days: DaySpec[] = [...rep(17, { score: 5, with: true }), ...rep(3, { score: 4, with: false }), ...rep(2, { score: 5, with: true })];
    const c = compare(fizzy, world(S, days));
    expect(c.section).toBe("daily_food");
    expect(c.share_of_usable_days).toBeGreaterThanOrEqual(0.8);
    const short = compare(fizzy, world(S, [...rep(9, { score: 5, with: true }), ...rep(1, { score: 4, with: false })]));
    expect(short.section).toBe("not_enough_data"); // fewer than 21 days: no daily-food message yet
  });

  it("Q13 and Q16: partial food coverage and late days are left out of comparisons", () => {
    const c = compare(fizzy, world(S, [
      ...rep(7, { score: 6, with: true }), ...rep(7, { score: 3, with: false }),
      ...rep(3, { score: 9, with: true, coverage: "SOME" }), ...rep(3, { score: 9, with: true, status: "LATE" }),
      ...rep(2, { score: 9, with: true, status: "PROVISIONAL" }),
    ]));
    expect(c).toMatchObject({ with_days: 7, without_days: 7, mean_with: 6 });
  });

  it("Q12 full meals without the group and a confirmed zero: an eligible 'without' day, zero kept", () => {
    const c = compare(fizzy, world(S, [{ score: 0, with: false }]));
    expect(c).toMatchObject({ without_days: 1, with_days: 0 });
    expect(c.without_dates).toEqual([S]);
  });

  it("Q135 and Q152: a 'Mostly' day can show a food was present, never that it was absent, and is counted and labelled", () => {
    const c = compare(fizzy, world(S, [...rep(3, { score: 6, with: true, coverage: "MOSTLY" }), ...rep(4, { score: 3, with: false, coverage: "MOSTLY" }), ...rep(2, { score: 3, with: false })]));
    expect(c.with_days).toBe(3);
    expect(c.mostly_days).toBe(3);
    expect(c.without_days).toBe(2); // the four Mostly days without it are unknown, not absent
  });

  it("a conflicting day must be corrected first", () => {
    const c = compare(fizzy, world(S, [...rep(7, { score: 6, with: true }), ...rep(7, { score: 3, with: false }), { score: null, with: true, status: "CONFLICT" }]));
    expect(c.state).toBe("NEEDS_CORRECTION");
    expect(c.conflict_dates).toEqual([addDays(S, 14)]);
    expect(c.difference).toBeNull();
  });

  it("Q146 only followed habits are compared; an unfollowed habit never becomes a target", () => {
    const days = rep(10, { score: 5, with: null, habit: "yes" as const });
    const none = targets({ followed: [] });
    expect(none.filter((t) => t.kind === "habit")).toHaveLength(0);
    const t = possibleTriggers(world(S, days, "TAG-09", { followed: [] }));
    expect([...t.worth_watching, ...t.no_clear_difference, ...t.not_enough_data].some((c) => c.target.kind === "habit")).toBe(false);
    const followed = compare({ kind: "habit", id: "ACT-08", label: "Walked after a meal" }, world(S, [...rep(7, { score: 3, habit: "yes" as const }), ...rep(7, { score: 5, habit: "no" as const }), ...rep(4, { score: 9, habit: "not_sure" as const }), ...rep(3, { score: 9 })], "TAG-09", { followed: ["ACT-08"] }));
    expect(followed).toMatchObject({ with_days: 7, without_days: 7, difference: -2 }); // not sure and untapped days are unknown
  });

  it("Q172 days with a large meal are compared like a habit", () => {
    const c = compare({ kind: "large_meal", id: "large_meal", label: "Days with a large meal" }, world(S, [...rep(7, { score: 6, with: false, large: true }), ...rep(7, { score: 4, with: false })]));
    expect(c).toMatchObject({ state: "DESCRIPTIVE_COMPARISON", with_days: 7, without_days: 7, difference: 2 });
  });

  it("Q174 confounding note: 'On 6 of these 9 days you also logged poor sleep.'", () => {
    const c = compare(fizzy, world(S, [...rep(6, { score: 6, with: true, taps: ["ACT-11"] }), ...rep(3, { score: 6, with: true }), ...rep(7, { score: 3, with: false })]));
    expect(c.confounding_note).toBe("On 6 of these 9 days you also logged poor sleep.");
    const none = compare(fizzy, world(S, [...rep(4, { score: 6, with: true, taps: ["ACT-11"] }), ...rep(5, { score: 6, with: true }), ...rep(7, { score: 3, with: false })]));
    expect(none.confounding_note).toBeNull();
  });

  it("Q20 two foods always together: the four counts are shown and the records can't separate them", () => {
    const days: DaySpec[] = [];
    for (let i = 0; i < 16; i++) days.push({ score: i % 2 ? 6 : 3, with: i % 2 === 1, extra: [["milk", "TAG-01", i % 2 ? "had" : "didnt_have"]] });
    const t = possibleTriggers(world(S, days));
    expect(t.co_occurrence).toHaveLength(1);
    expect(t.co_occurrence[0]).toMatchObject({ both: 8, a_only: 0, b_only: 0, neither: 8, separable: false });
    expect(t.co_occurrence[0]!.note).toContain("Your records can't separate them.");
    expect(t.co_occurrence[0]!.note).not.toMatch(/cause|winner|responsible/);
  });
});

describe("Food exposure (plan A10, fixes 0.1 and 0.2)", () => {
  const ctxOf = (meals: ReturnType<typeof meal>[], eps: ReturnType<typeof episode>[] = []) => ({
    periods, meals: meals.map((x) => x.m), ingredientsByMeal: new Map(meals.map((x) => [x.m.id, x.ingredients])), episodes: eps.map((x) => x.e), samples: eps.map((x) => x.s),
  });
  const D = "2026-06-10", PREV = "2026-06-09", NEXT = "2026-06-11";

  it("Q133 restaurant meal with onion 'Not sure' and dairy 'Didn't have': usable for dairy, unknown for onion only", () => {
    const m = meal(D, "13:00", { origin: "restaurant_or_takeaway", items: [["onion", "TAG-03", "not_sure"], ["cream", "TAG-01", "didnt_have"]] });
    expect(mealKnowledge(m.m, m.ingredients, "TAG-03")).toBe("unknown");
    expect(mealKnowledge(m.m, m.ingredients, "TAG-01")).toBe("not_contains");
    const ctx = ctxOf([m]);
    expect(groupExposure(D, "TAG-01", "ALL", review(D, 3), [], ctx).exposure).toBe("ABSENT");
    expect(groupExposure(D, "TAG-03", "ALL", review(D, 3), [], ctx).exposure).toBe("UNKNOWN");
  });

  it("Q149 restaurant curry where the AI missed garlic: listed groups present, every unlisted group unknown", () => {
    const m = meal(D, "13:00", { origin: "restaurant_or_takeaway", items: [["paneer", "TAG-01", "had"], ["chilli", "TAG-08", "had"]] });
    expect(mealKnowledge(m.m, m.ingredients, "TAG-01")).toBe("contains");
    expect(mealKnowledge(m.m, m.ingredients, "TAG-08")).toBe("contains");
    for (const g of ["TAG-03", "TAG-02", "TAG-09"]) expect(mealKnowledge(m.m, m.ingredients, g)).toBe("unknown");
  });

  it("Q150 home-made meal: the listed group is present and unlisted groups count as not present", () => {
    const m = meal(D, "13:00", { origin: "home", items: [["milk", "TAG-01", "had"]] });
    expect(mealKnowledge(m.m, m.ingredients, "TAG-01")).toBe("contains");
    expect(mealKnowledge(m.m, m.ingredients, "TAG-03")).toBe("not_contains");
    const unknownOrigin = meal(D, "13:00", { origin: null, items: [["milk", "TAG-01", "had"]] });
    expect(mealKnowledge(unknownOrigin.m, unknownOrigin.ingredients, "TAG-03")).toBe("unknown");
  });

  it("Q100, Q131: an untouched (Not sure) item makes only its own group unknown", () => {
    const m = meal(D, "13:00", { items: [["beans", "TAG-04", "had"], ["onion", "TAG-03", "not_sure"], ["cheese", "TAG-01", "didnt_have"]] });
    expect(mealKnowledge(m.m, m.ingredients, "TAG-04")).toBe("contains");
    expect(mealKnowledge(m.m, m.ingredients, "TAG-03")).toBe("unknown");
    expect(mealKnowledge(m.m, m.ingredients, "TAG-01")).toBe("not_contains");
    expect(mealKnowledge(m.m, m.ingredients, "TAG-09")).toBe("not_contains");
  });

  it("Q14, Q122, Q41: guesses, 'I don't know' and failed checks never count; a Free meal knows nothing", () => {
    const guess = meal(D, "13:00", { items: [["cheese", "TAG-01", "had", "guess"]] });
    expect(mealKnowledge(guess.m, guess.ingredients, "TAG-01")).toBe("unknown");
    const dk = meal(D, "13:00", { ai_check_status: "dont_know", items: [["cheese", "TAG-01", "unknown", "dont_know"]] });
    expect(mealKnowledge(dk.m, dk.ingredients, "TAG-01")).toBe("unknown");
    expect(mealKnowledge(dk.m, dk.ingredients, "TAG-09")).toBe("unknown");
    for (const status of ["free_plan", "failed", "paused", "not_requested", "manual"]) {
      const m = meal(D, "13:00", { ai_check_status: status });
      expect(mealKnowledge(m.m, m.ingredients, "TAG-09"), status).toBe("unknown");
    }
    // a saved dish built from a guess is not confirmed, so its unlisted groups stay unknown
    const dish = meal(D, "13:00", { source: "saved_dish", saved_dish_confirmed: false, ai_check_status: "manual", origin: null });
    expect(mealKnowledge(dish.m, dish.ingredients, "TAG-09")).toBe("unknown");
    const confirmed = meal(D, "13:00", { source: "saved_dish", saved_dish_confirmed: true, ai_check_status: "checked", origin: null });
    expect(mealKnowledge(confirmed.m, confirmed.ingredients, "TAG-09")).toBe("not_contains");
  });

  it("Q134 onion at 20:00 the evening before counts for the next day (window from 18:00)", () => {
    const evening = meal(PREV, "20:00", { items: [["onion", "TAG-03", "had"]] });
    const lunchPrev = meal(PREV, "13:00", { items: [["garlic", "TAG-03", "had"]] });
    const today = meal(D, "12:00", { items: [["rice", "TAG-08", "didnt_have"]] });
    expect(groupExposure(D, "TAG-03", "ALL", review(D, 4), [], ctxOf([evening, today])).exposure).toBe("PRESENT");
    // a meal before 18:00 the day before does not count
    expect(groupExposure(D, "TAG-03", "ALL", review(D, 4), [], ctxOf([lunchPrev, today])).exposure).toBe("ABSENT");
  });

  it("Q151 a meal eaten after the day's strongest episode started doesn't count for that day and moves to the next day's window", () => {
    const ep = episode(D, "11:00", "12:00", 7);
    const weak = episode(D, "08:00", "08:30", 2);
    const breakfast = meal(D, "09:00", { items: [["toast", "TAG-08", "didnt_have"]] });
    const dinner = meal(D, "20:00", { items: [["onion", "TAG-03", "had"]] });
    const ctx = ctxOf([breakfast, dinner], [ep, weak]);
    expect(windowMeals(D, ctx).map((m) => m.id)).toEqual([breakfast.m.id]);
    expect(groupExposure(D, "TAG-03", "ALL", review(D, 7), [], ctx).exposure).toBe("ABSENT");
    expect(windowMeals(NEXT, ctx).map((m) => m.id)).toEqual([dinner.m.id]);
    expect(groupExposure(NEXT, "TAG-03", "MOSTLY", review(NEXT, 2), [], ctx).exposure).toBe("PRESENT");
  });

  it("Q141 Keep an eye on it: an explicit No makes a 'without' day with no meals logged; Not sure stays unknown", () => {
    const ctx = ctxOf([]);
    expect(groupExposure(D, "TAG-01", "UNKNOWN", review(D, 2, { watched: { "TAG-01": "no" }, food_coverage: null }), [], ctx).exposure).toBe("ABSENT");
    expect(groupExposure(D, "TAG-01", "UNKNOWN", review(D, 2, { watched: { "TAG-01": "yes" } }), [], ctx).exposure).toBe("PRESENT");
    expect(groupExposure(D, "TAG-01", "ALL", review(D, 2, { watched: { "TAG-01": "not_sure" } }), [], ctx).exposure).toBe("UNKNOWN");
    const c = compare({ kind: "food", id: "TAG-01", label: "Dairy" }, {
      ...world(S, rep(14, { score: 3 })),
      reviews: Array.from({ length: 14 }, (_, i) => review(addDays(S, i), i < 7 ? 6 : 3, { food_coverage: null, watched: { "TAG-01": i < 7 ? "yes" : "no" } })),
      summaries: Array.from({ length: 14 }, (_, i) => summary(addDays(S, i), i < 7 ? 6 : 3, { coverage: "UNKNOWN" })),
    });
    expect(c).toMatchObject({ state: "DESCRIPTIVE_COMPARISON", with_days: 7, without_days: 7, difference: 3 });
  });

  it("no meals and no review answer about food: unknown, never absent", () => {
    expect(groupExposure(D, "TAG-01", "UNKNOWN", null, [], ctxOf([])).exposure).toBe("UNKNOWN");
    expect(groupExposure(D, "TAG-01", "ALL", review(D, 1), [], ctxOf([])).exposure).toBe("UNKNOWN");
    expect(groupExposure(D, "TAG-01", "NO_INTAKE", review(D, 1), [], ctxOf([])).exposure).toBe("ABSENT");
  });

  it("an alcohol or tea-and-coffee tap counts once for its food group (no double counting)", () => {
    const obs = [{ id: "o", date: D, activity_id: "ACT-22", answer: "yes" as const, detail: null, observed_at: null, source: "tap" as const }];
    const m = meal(D, "19:00", { items: [["wine", "TAG-12", "had"]] });
    const c = compare({ kind: "food", id: "TAG-12", label: "Alcohol" }, { ...world(D, [{ score: 4 }]), observations: obs, ctx: ctxOf([m]) });
    expect(c.with_days).toBe(1);
  });
});

describe("Your usual and baseline markers (0.3 fix 20, 0.4)", () => {
  const days = (scores: number[]) => scores.map((s, i) => summary(addDays(S, i), s));

  it("Q207 fewer than 14 confirmed days: no markers and no Your usual", () => {
    const s = days(Array(13).fill(4));
    expect(yourUsual(s, [], periods, addDays(S, 13), S, 0, null)).toEqual({ available: false, confirmed_days: 13, needed: 1 });
    expect(baselineMarker(8, 4, 13)).toBeNull();
  });

  it("Q207 after 14: usual is the median of the last 28 confirmed days; above and below mean 2 or more away; never better or worse", () => {
    const s = days([...Array(10).fill(9), ...Array(28).fill(4)]);
    expect(usualScore(s)).toBe(4); // only the last 28 confirmed days
    expect(baselineMarker(6, 4, 38)).toBe("above");
    expect(baselineMarker(5, 4, 38)).toBe("around");
    expect(baselineMarker(3, 4, 38)).toBe("around");
    expect(baselineMarker(2, 4, 38)).toBe("below");
    expect(baselineMarker(null, 4, 38)).toBeNull();
  });

  it("Q173 Your usual shows typical score, episodes per week, typical length, completeness and the first 30 days side by side, with no labels", () => {
    const s = days([...Array(40).fill(6), ...Array(30).fill(3)]);
    const eps = [episode(addDays(S, 60), "10:00", "11:00", 5).e, episode(addDays(S, 61), "10:00", "12:00", 5).e, episode(addDays(S, 62), "10:00", "13:00", 5).e];
    const u = yourUsual(s, eps, periods, addDays(S, 70), S, 9, "a_little");
    expect(u.available).toBe(true);
    if (!u.available) return;
    expect(u.recent).toMatchObject({ typical_score: 3, confirmed_days: 28, completeness: 100, typical_episode_minutes: 120, episodes_per_week: 0.8 });
    expect(u.first_30).toMatchObject({ typical_score: 6, days: 30 });
    expect(u).toMatchObject({ bloating_days_30: 9, weekly_impact: "a_little" });
    expect(JSON.stringify(u).toLowerCase()).not.toMatch(/better|worse|improv|good|bad/);
  });
});

describe("Your cycle (0.3 fix 17)", () => {
  const starts = (list: string[]) => list.flatMap((d) => [{ id: `s${d}`, kind: "start" as const, date: d, date_precision: "exact" }, { id: `e${d}`, kind: "end" as const, date: addDays(d, 4), date_precision: "exact" }]);
  const all = Array.from({ length: 120 }, (_, i) => summary(addDays("2026-05-01", i), 3));

  it("Q164 hidden without the cycle-context opt-in", () => {
    expect(cycleView([], starts(["2026-05-10"]), all, "2026-08-29")).toEqual({ state: "off" });
  });

  it("Q165 with 2 complete cycles: not enough data yet, no numbers", () => {
    const v = cycleView(["cycle_context"], starts(["2026-05-10", "2026-06-07", "2026-07-05"]), all, "2026-08-29");
    expect(v).toEqual({ state: "not_enough", cycles: 2, needed_cycles: 1 });
  });

  it("Q166 with 3+ cycles and 7+ usable days per window: three averages with counts and both halves", () => {
    const cyc = starts(["2026-05-10", "2026-06-07", "2026-07-05", "2026-08-02"]);
    const scored = all.map((s) => {
      const period = cyc.some((c) => c.kind === "start" && s.date >= c.date && s.date <= addDays(c.date, 4));
      const before = cyc.some((c) => c.kind === "start" && s.date < c.date && s.date >= addDays(c.date, -5));
      return { ...s, score: period ? 6 : before ? 5 : 3 };
    });
    const v = cycleView(["cycle_context"], cyc, scored, "2026-08-29");
    expect(v.state).toBe("ready");
    if (v.state !== "ready") return;
    expect(v.cycles).toBe(3);
    expect(v.before).toEqual({ mean: 5, days: 20 });
    expect(v.period).toEqual({ mean: 6, days: 20 });
    expect(v.other.mean).toBe(3);
    expect(v.before_vs_other).toMatchObject({ difference: 2, first_half: 2, second_half: 2 });
  });

  it("Q167 perimenopause or menopause: no cycle comparison is offered", () => {
    expect(cycleView(["perimenopause_or_menopause", "cycle_context"], starts(["2026-05-10", "2026-06-07", "2026-07-05", "2026-08-02"]), all, "2026-08-29")).toEqual({ state: "not_offered", reason: "perimenopause_or_menopause" });
  });
});

describe("Medicine before/after (0.3 fix 18)", () => {
  const med = { id: "m1", name: "Iron tablets", type: "supplement", med_group: "iron", started_on: "2026-06-15", started_precision: "exact", note: null };
  const day = (offset: number, score: number | null) => summary(addDays("2026-06-15", offset), score);

  it("Q168 nine usable days before and eight after within 14 days: both averages and day counts", () => {
    const s = [...Array.from({ length: 9 }, (_, i) => day(-9 + i, 6)), ...Array.from({ length: 8 }, (_, i) => day(i, 4))];
    const [v] = medicineViews([med], [], s, "2026-07-10");
    expect(v).toMatchObject({ state: "ready", before_days: 9, after_days: 8, before_mean: 6, after_mean: 4, event: "started", group: "iron" });
    expect(JSON.stringify(v).toLowerCase()).not.toMatch(/caus|because|thanks to|worked/);
  });

  it("Q169 only four usable days after: how many more days are needed, and no numbers", () => {
    const s = [...Array.from({ length: 9 }, (_, i) => day(-9 + i, 6)), ...Array.from({ length: 4 }, (_, i) => day(i, 4))];
    const [v] = medicineViews([med], [], s, "2026-07-10");
    expect(v).toMatchObject({ state: "not_enough", needed_after: 3, needed_before: 0, before_mean: null, after_mean: null });
  });

  it("a medicine without an MD-04 group, or with an unknown date, gets no before/after view", () => {
    expect(medicineViews([{ ...med, med_group: null }], [], [], "2026-07-10")).toEqual([]);
    expect(medicineViews([{ ...med, started_precision: "not_sure" }], [], [], "2026-07-10")).toEqual([]);
    const changes = [{ id: "c1", medicine_id: "m1", change: "stopped", date: "2026-07-01", date_precision: "exact" }];
    expect(medicineViews([med], changes, [], "2026-07-10").map((v) => v.event)).toEqual(["stopped", "started"]);
  });
});
