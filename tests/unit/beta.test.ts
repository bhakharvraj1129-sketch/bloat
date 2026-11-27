import { describe, expect, it } from "vitest";
import { AI_FEATURES, experimentsOffered, featuresOffFrom, swapExperimentsOffered } from "@/lib/availability";
import { config } from "@/lib/registry";
import { nextBestLog, type FocusInput } from "@/lib/domain/focus";
import type { Meal } from "@/lib/domain/types";
import { MIN_NEW_PASSWORD, newPasswordProblem, passwordChangeMessage } from "@/lib/sign-in-messages";

const known = Object.keys(config.features);

describe("invited beta: which features a deployment does not offer", () => {
  it("nothing is off unless a deployment says so", () => {
    expect(featuresOffFrom("", "mock", known)).toEqual([]);
    expect(featuresOffFrom("", "anthropic", known)).toEqual([]);
  });
  it("BLOAT_AI_PROVIDER=off switches off every AI feature, and only those", () => {
    expect(featuresOffFrom("", "off", known).sort()).toEqual([...AI_FEATURES].sort());
    for (const k of AI_FEATURES) expect(known).toContain(k);
    // Manual meal logging, saved dishes and Patterns are not AI features.
    for (const k of ["meals_basic", "saved_dishes", "possible_triggers", "charts", "doctor_pdf"]) expect(featuresOffFrom("", "off", known)).not.toContain(k);
  });
  it("listed keys are switched off; unknown keys, spaces and repeats are ignored", () => {
    expect(featuresOffFrom(" learn_library , daily_cards,not_a_feature,learn_library", "mock", known)).toEqual(["learn_library", "daily_cards"]);
    expect(featuresOffFrom("learn_library,daily_cards", "off", known).sort()).toEqual(["daily_cards", "learn_library", ...AI_FEATURES].sort());
  });
});

describe("first acceptance round: experiments switched off", () => {
  const round = featuresOffFrom("learn_library,daily_cards,experiments_habit,experiments_swap", "off", known);
  it("the round's settings switch off both kinds of experiment, and nothing else of Pro's non-AI features", () => {
    expect(experimentsOffered(round)).toBe(false);
    expect(swapExperimentsOffered(round)).toBe(false);
    for (const k of ["possible_triggers", "charts", "seven_day_average", "pattern_report", "your_journey", "doctor_pdf", "bowel_log", "exercise_log", "keep_an_eye_mode", "health_background", "family_history", "medicines", "saved_dishes"]) expect(round).not.toContain(k);
  });
  it("experiments are offered unless a deployment switches them off", () => {
    expect(experimentsOffered([])).toBe(true);
    expect(swapExperimentsOffered([])).toBe(true);
    expect(experimentsOffered(featuresOffFrom("learn_library,daily_cards", "off", known))).toBe(true);
  });
  it("swap experiments need both keys; habit experiments need experiments_habit", () => {
    expect(experimentsOffered(["experiments_swap"])).toBe(true);
    expect(swapExperimentsOffered(["experiments_swap"])).toBe(false);
    expect(experimentsOffered(["experiments_habit"])).toBe(false);
    expect(swapExperimentsOffered(["experiments_habit"])).toBe(false);
  });
});

describe("invited beta: no suggestion to save dishes when no dish can be saved (AI off)", () => {
  // 10 days of typed meals without an ingredient check, as every meal is while AI is off.
  const meals: Meal[] = Array.from({ length: 10 }, (_, i) => ({
    id: `m${i}`, eaten_at: `2026-10-${String(10 + i).padStart(2, "0")}T17:00:00.000Z`, zone: "America/New_York", offset_min: -240,
    time_precision: "exact", dish_text: "soup", portion: null, amount_count: null, amount_unit: null, pace: null, origin: null,
    source: "typed", saved_dish_id: null, saved_dish_confirmed: false, ai_check_status: "not_requested", revision: 1,
  }));
  const input = (canSaveDishes?: boolean): FocusInput => ({
    today: "2026-10-20", periods: [{ effective_from: "2026-01-01", zone: "America/New_York" }], plan: "pro",
    summaries: [], episodes: [], meals, observations: [], symptomsByDate: new Map(), bowelNoDates: [], bowelEntries: 0,
    followed: [], comparisons: [], suspicions: 0, cycleContext: false, menopause: false, cycleStarts: 0, dismissed: {},
    ...(canSaveDishes === undefined ? {} : { canSaveDishes }),
  });
  it("suggests saving usual dishes where a dish can be saved (as before)", () => {
    expect(nextBestLog(input())?.id).toBe("save_dishes");
    expect(nextBestLog(input(true))?.id).toBe("save_dishes");
  });
  it("does not suggest it where no dish can be saved", () => {
    expect(nextBestLog(input(false))?.id).not.toBe("save_dishes");
  });
});

describe("invited beta: changing the temporary password", () => {
  it("checks the new password before anything is sent", () => {
    expect(newPasswordProblem("", "")).toBe("Enter a new password.");
    expect(newPasswordProblem("short", "short")).toBe(`Use at least ${MIN_NEW_PASSWORD} characters.`);
    expect(newPasswordProblem("long enough one", "long enough two")).toBe("The two passwords don't match.");
    expect(newPasswordProblem("long enough one", "long enough one")).toBeNull();
  });
  it("says plainly whether the password changed", () => {
    expect(passwordChangeMessage(null)).toBeNull();
    expect(passwordChangeMessage({ status: 422, code: "same_password" })).toBe("That is your current password. Choose a different one.");
    expect(passwordChangeMessage({ status: 422, code: "weak_password" })).toBe("Choose a longer password that is harder to guess.");
    expect(passwordChangeMessage({ status: 0 })).toBe("No connection. Your password has not changed. Try again.");
    expect(passwordChangeMessage({ status: 401 })).toBe("You were signed out. Sign in again, then change your password.");
    expect(passwordChangeMessage({ status: 500 })).toBe("That didn't work. Your password has not changed. Try again.");
  });
});
