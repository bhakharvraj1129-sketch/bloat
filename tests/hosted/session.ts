import { createServerClient } from "@supabase/ssr";

// Accounts for one hosted test run. The browser tests sign in through the app's own email-and-
// password form; sessionFor() signs in through Supabase directly only to check the database from
// the outside (isolation) and that sign-out revokes other sessions. Accounts and their one-off
// password are made by the test operator for each run and deleted afterwards (DEPLOYMENT.md,
// "Hosted test run"); nothing here is a real person's account.
export const SUPABASE_URL = process.env.HOSTED_SUPABASE_URL!;
export const SUPABASE_KEY = process.env.HOSTED_SUPABASE_KEY!;
export const PASSWORD = process.env.HOSTED_PASSWORD!;
const ACCOUNTS = Object.fromEntries((process.env.HOSTED_ACCOUNTS ?? "").split(",").filter(Boolean).map((pair) => pair.split("=") as [string, string]));

export function account(role: string): string {
  if (!PASSWORD) throw new Error("Set HOSTED_PASSWORD (this check needs the run's synthetic accounts)");
  const email = ACCOUNTS[role];
  if (!email) throw new Error(`HOSTED_ACCOUNTS has no "${role}" account`);
  return email;
}

export async function sessionFor(role: string): Promise<{ cookies: Array<{ name: string; value: string }>; token: string }> {
  const jar = new Map<string, string>();
  const client = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (list) => { for (const c of list) jar.set(c.name, c.value); } },
  });
  const { data, error } = await client.auth.signInWithPassword({ email: account(role), password: PASSWORD });
  if (error || !data.session) throw new Error(`sign-in for ${role} failed: ${error?.message}`);
  await new Promise((r) => setTimeout(r, 50));
  return { cookies: [...jar].filter(([, v]) => v).map(([name, value]) => ({ name, value })), token: data.session.access_token };
}
