import { createServerClient } from "@supabase/ssr";
import type { BrowserContext } from "@playwright/test";

// Signs a pre-made synthetic test account in through Supabase directly (not through the app,
// which has no password sign-in when test mode is off) and gives the browser the same session
// cookie the app would set. Accounts and their one-off password are made by the test operator
// for each run and deleted afterwards; nothing here is a real person's account.
export const SUPABASE_URL = process.env.HOSTED_SUPABASE_URL!;
export const SUPABASE_KEY = process.env.HOSTED_SUPABASE_KEY!;
export const PASSWORD = process.env.HOSTED_PASSWORD!;
const ACCOUNTS = Object.fromEntries((process.env.HOSTED_ACCOUNTS ?? "").split(",").filter(Boolean).map((pair) => pair.split("=") as [string, string]));

export function account(role: string): string {
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

export async function signInBrowser(context: BrowserContext, base: string, role: string) {
  const { cookies } = await sessionFor(role);
  const url = new URL(base);
  await context.addCookies(cookies.map((c) => ({ ...c, domain: url.hostname, path: "/", secure: url.protocol === "https:", sameSite: "Lax" as const, httpOnly: false })));
}
