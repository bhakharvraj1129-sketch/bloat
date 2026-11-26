import { describe, expect, it } from "vitest";
import { AI_FEATURES, featuresOffFrom } from "@/lib/availability";
import { config } from "@/lib/registry";
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
