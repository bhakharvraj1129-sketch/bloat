import "server-only";
import { env } from "./env";

// Which sign-in methods the Supabase project has switched on. Read from Supabase's public
// settings endpoint, so a button is only shown for a method that really works. Fails closed:
// if the settings cannot be read, Google is treated as off (email codes always show).
let cached: { at: number; google: boolean } | null = null;

export async function googleSignInEnabled(): Promise<boolean> {
  if (cached && Date.now() - cached.at < 5 * 60_000) return cached.google;
  let google = false;
  try {
    const res = await fetch(`${env.supabaseUrl}/auth/v1/settings`, { headers: { apikey: env.supabaseKey }, signal: AbortSignal.timeout(3000), cache: "no-store" });
    if (res.ok) google = (await res.json())?.external?.google === true;
  } catch {
    google = false;
  }
  cached = { at: Date.now(), google };
  return google;
}

/**
 * Which sign-in the app offers (BLOAT_SIGN_IN_METHOD). "password": email and password for
 * owner-provisioned test accounts only (the temporary testing method on the preview, while email
 * delivery is limited). "email_code" (the default): email codes, the method for real users.
 * Only one is ever shown, so there is never a confusing second sign-in. The email-code screens
 * and code stay in the app for a controlled restoration (DEPLOYMENT.md, "Sign-in method").
 */
export type SignInMethod = "password" | "email_code";
export function signInMethod(): SignInMethod {
  return process.env.BLOAT_SIGN_IN_METHOD === "password" ? "password" : "email_code";
}
