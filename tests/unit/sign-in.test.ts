import { describe, expect, it } from "vitest";
import { NO_CONNECTION, passwordSignInMessage, SERVER_TROUBLE, TOO_MANY_TRIES, validateSignIn, WRONG_CREDENTIALS } from "@/lib/sign-in-messages";

describe("email and password sign-in messages", () => {
  it("a wrong password, an unknown address and an unconfirmed address get the same answer (no account enumeration)", () => {
    for (const e of [
      { status: 400, code: "invalid_credentials", message: "Invalid login credentials" },
      { status: 400, code: "email_not_confirmed", message: "Email not confirmed" },
      { status: 404, code: "user_not_found" },
      { status: 400, code: "user_banned" },
      { status: 422, code: "validation_failed" },
    ]) expect(passwordSignInMessage(e), JSON.stringify(e)).toBe(WRONG_CREDENTIALS);
  });

  it("too many tries, no connection and server trouble are explained", () => {
    expect(passwordSignInMessage(null)).toBeNull();
    expect(passwordSignInMessage({ status: 429, code: "over_request_rate_limit" })).toBe(TOO_MANY_TRIES);
    expect(passwordSignInMessage({ status: 0, name: "AuthRetryableFetchError" })).toBe(NO_CONNECTION);
    expect(passwordSignInMessage({ status: 503 })).toBe(SERVER_TROUBLE);
  });

  it("fields are checked before anything is sent, with messages that say what to do", () => {
    expect(validateSignIn({ email: "", password: "", needAdult: true, adult: false })).toEqual({
      email: "Enter your email address.", password: "Enter your password.", adult: "Bloat is for adults. Tick the box to confirm you are 18 or older.",
    });
    expect(validateSignIn({ email: "not-an-email", password: "x", needAdult: false, adult: false })).toEqual({ email: "Enter an email address like name@example.com." });
    expect(validateSignIn({ email: " tester@bloat.test ", password: "x", needAdult: true, adult: true })).toEqual({});
  });
});
