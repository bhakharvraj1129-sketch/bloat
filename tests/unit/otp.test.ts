import { describe, expect, it } from "vitest";
import { codeRequestOutcome, OFFLINE_MESSAGE, retryAfterSeconds, SEND_FAILED_MESSAGE, SENT_MESSAGE, verifyMessage } from "@/lib/otp-messages";

describe("email code messages", () => {
  it("a sent code and an address with no account get the same answer (no account enumeration)", () => {
    expect(codeRequestOutcome(null)).toEqual({ kind: "sent", message: SENT_MESSAGE });
    for (const e of [{ status: 422, code: "otp_disabled", message: "Signups not allowed for otp" }, { status: 400, message: "Signups not allowed for otp" }, { status: 422, code: "signup_disabled" }]) {
      expect(codeRequestOutcome(e)).toEqual({ kind: "sent", message: SENT_MESSAGE });
    }
  });

  it("delivery failures, time-outs and a closed mail server are explained, never shown as sent", () => {
    for (const e of [{ status: 504, code: "request_timeout", message: "context deadline exceeded" }, { status: 500, message: "Error sending magic link email" }, { status: 400, code: "email_address_not_authorized" }]) {
      expect(codeRequestOutcome(e)).toEqual({ kind: "send_failed", message: SEND_FAILED_MESSAGE });
    }
    expect(codeRequestOutcome({ status: 0, name: "AuthRetryableFetchError" })).toEqual({ kind: "offline", message: OFFLINE_MESSAGE });
  });

  it("rate limits give the wait the server asked for", () => {
    expect(retryAfterSeconds("For security purposes, you can only request this after 42 seconds.")).toBe(42);
    expect(codeRequestOutcome({ status: 429, code: "over_email_send_rate_limit", message: "For security purposes, you can only request this after 42 seconds." })).toMatchObject({ kind: "rate_limited", retryAfter: 42 });
    expect(codeRequestOutcome({ status: 429, code: "over_email_send_rate_limit", message: "Email rate limit exceeded" })).toMatchObject({ kind: "rate_limited", retryAfter: null });
    expect(codeRequestOutcome({ status: 400, code: "email_address_invalid", message: "Email address is invalid" }).kind).toBe("invalid_email");
  });

  it("checking a code: wrong or expired, too many tries, no connection, server trouble", () => {
    expect(verifyMessage(null)).toBeNull();
    expect(verifyMessage({ status: 403, code: "otp_expired", message: "Token has expired or is invalid" })).toBe("That code is wrong or has expired. Check it, or ask for a new one.");
    expect(verifyMessage({ status: 429 })).toContain("Too many tries");
    expect(verifyMessage({ status: 0 })).toContain("connection");
    expect(verifyMessage({ status: 502 })).toContain("our side");
  });
});
