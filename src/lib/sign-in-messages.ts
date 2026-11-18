// Plain messages for email-and-password sign-in (the temporary testing method; see
// DEPLOYMENT.md, "Sign-in method"). Rules:
// 1. A wrong password, an unknown address and an unconfirmed address all get the SAME message,
//    so nobody can learn whether an account exists.
// 2. Connection, rate-limit and server trouble are explained, so a person is not left guessing.
import type { AuthErrorLike } from "./otp-messages";

export const WRONG_CREDENTIALS = "Email or password is incorrect.";
export const TOO_MANY_TRIES = "Too many tries. Wait a few minutes, then try again.";
export const NO_CONNECTION = "We couldn't reach Bloat. Check your connection and try again.";
export const SERVER_TROUBLE = "Something went wrong on our side. Try again in a moment.";

export function passwordSignInMessage(error: AuthErrorLike): string | null {
  if (!error) return null;
  const status = error.status ?? 0;
  if (status === 429 || error.code === "over_request_rate_limit") return TOO_MANY_TRIES;
  if (status === 0) return NO_CONNECTION;
  if (status >= 500) return SERVER_TROUBLE;
  // invalid_credentials, email_not_confirmed, user_not_found, validation errors, banned users:
  // one answer for all of them.
  return WRONG_CREDENTIALS;
}

export type FieldErrors = { email?: string; password?: string; adult?: string };

/** Checks before anything is sent. Messages say what to do, not what went wrong. */
export function validateSignIn(v: { email: string; password: string; needAdult: boolean; adult: boolean }): FieldErrors {
  const errors: FieldErrors = {};
  const email = v.email.trim();
  if (!email) errors.email = "Enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter an email address like name@example.com.";
  if (!v.password) errors.password = "Enter your password.";
  if (v.needAdult && !v.adult) errors.adult = "Bloat is for adults. Tick the box to confirm you are 18 or older.";
  return errors;
}
