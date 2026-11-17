// Plain messages for email sign-in codes. Two rules:
// 1. Never say whether an address has an account. "No account" and "sign-ups not allowed" answers
//    look exactly like a sent code.
// 2. Never pretend a code was sent when it was not. Delivery, connection and rate-limit failures
//    are explained, so a person is not left waiting for an email that will not come.

export type AuthErrorLike = { status?: number; code?: string; message?: string; name?: string } | null | undefined;

export type CodeRequestOutcome =
  | { kind: "sent"; message: string }
  | { kind: "rate_limited"; message: string; retryAfter: number | null }
  | { kind: "invalid_email" | "offline" | "send_failed"; message: string };

export const SENT_MESSAGE = "If that address can sign in, a code is on its way. It can take a minute to arrive. Check your spam folder too.";
export const SEND_FAILED_MESSAGE = "We couldn't send the email just now. The problem is on our side, not with your address. Please try again in a few minutes.";
export const OFFLINE_MESSAGE = "We couldn't reach Bloat. Check your connection and try again. No code was sent.";

/** Seconds from "For security purposes, you can only request this after 42 seconds." */
export function retryAfterSeconds(message: string | undefined): number | null {
  const m = /after (\d+) seconds?/i.exec(message ?? "");
  return m ? Number(m[1]) : null;
}

export function codeRequestOutcome(error: AuthErrorLike): CodeRequestOutcome {
  if (!error) return { kind: "sent", message: SENT_MESSAGE };
  const code = error.code ?? "";
  const status = error.status ?? 0;
  const text = (error.message ?? "").toLowerCase();
  // An address with no account, when sign-up is not allowed here: answer as if a code was sent.
  if (["otp_disabled", "signup_disabled", "user_not_found"].includes(code) || text.includes("signups not allowed")) {
    return { kind: "sent", message: SENT_MESSAGE };
  }
  if (status === 429 || code === "over_email_send_rate_limit" || code === "over_request_rate_limit") {
    const wait = retryAfterSeconds(error.message);
    return {
      kind: "rate_limited", retryAfter: wait,
      message: wait ? `A code was asked for very recently. You can ask for another in ${wait} seconds.` : "Too many codes have been asked for. Wait a few minutes, then try again.",
    };
  }
  if (code === "email_address_invalid" || (status === 400 && text.includes("email"))) {
    return { kind: "invalid_email", message: "Check the email address and try again." };
  }
  if (status === 0) return { kind: "offline", message: OFFLINE_MESSAGE };
  return { kind: "send_failed", message: SEND_FAILED_MESSAGE };
}

export function verifyMessage(error: AuthErrorLike): string | null {
  if (!error) return null;
  const status = error.status ?? 0;
  if (status === 429 || error.code === "over_request_rate_limit") return "Too many tries. Wait a few minutes, then ask for a new code.";
  if (status === 0) return "We couldn't reach Bloat. Check your connection and try again.";
  if (status >= 500) return "Something went wrong on our side. Try again in a moment.";
  return "That code is wrong or has expired. Check it, or ask for a new one.";
}

/** Seconds between code requests. Supabase's hosted default is 60; the server's own answer wins. */
export const CODE_COOLDOWN_SECONDS = 60;
