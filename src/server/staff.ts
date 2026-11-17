import "server-only";
import { anonClient, cookieClient } from "./supabase";
import { env } from "./env";

// Founder tools sign-in (plan B03). A person gets in only when all of these hold:
//   1. they are signed in with a confirmed email address,
//   2. that address is on the staff list (BLOAT_STAFF_EMAILS), and
//   3. this session passed a second step with an authenticator app (assurance level "aal2").
// Anything uncertain is refused. There is no shared token.
export type StaffCheck = { state: "ok"; userId: string } | { state: "mfa_required" } | { state: "no" };

const TEST_DOMAIN = /@(example\.com|bloat\.test)$/;

export function staffEmails(): string[] {
  return env.staffEmails.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    // Synthetic addresses can be made by anyone on a test preview, so they only count in test mode.
    .filter((e) => env.testLogin || !TEST_DOMAIN.test(e));
}

function claims(token: string): Record<string, unknown> {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function staffCheck(req: Request): Promise<StaffCheck> {
  const list = staffEmails();
  if (list.length === 0) return { state: "no" };
  let token = "";
  const header = req.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) token = header.slice(7).trim();
  else token = (await (await cookieClient()).auth.getSession()).data.session?.access_token ?? "";
  if (!token) return { state: "no" };
  // getUser asks the auth server, so a forged, expired or signed-out token fails here.
  const { data, error } = await anonClient().auth.getUser(token);
  const user = data?.user;
  if (error || !user?.email || !user.email_confirmed_at) return { state: "no" };
  if (!list.includes(user.email.toLowerCase())) return { state: "no" };
  const verified = (user.factors ?? []).some((f) => f.factor_type === "totp" && f.status === "verified");
  if (!verified || claims(token).aal !== "aal2") return { state: "mfa_required" };
  return { state: "ok", userId: user.id };
}
