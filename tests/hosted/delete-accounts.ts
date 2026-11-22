// Cleans up a hosted run's synthetic accounts through the app's own "Delete my account", the same
// path a person uses: sign in, POST /v1/account/delete with "DELETE". The app removes every row,
// the sign-in itself, and keeps only a SHA-256 hash of the account ID (a tombstone, so a restored
// backup cannot bring the account back).
//   pnpm exec tsx tests/hosted/delete-accounts.ts <role> [<role> ...]
// Needs HOSTED_URL, HOSTED_SUPABASE_URL, HOSTED_SUPABASE_KEY, HOSTED_ACCOUNTS, HOSTED_PASSWORD.
// Prints each address and the app's answer; tokens are never printed.
import { account, sessionFor } from "./session";

const BASE = process.env.HOSTED_URL!;
if (!BASE) throw new Error("Set HOSTED_URL");

async function main() {
  const roles = process.argv.slice(2);
  if (!roles.length) throw new Error("usage: delete-accounts.ts <role> [<role> ...]");
  let failed = 0;
  for (const role of roles) {
    const email = account(role);
    const { token } = await sessionFor(role);
    const r = await fetch(`${BASE}/v1/account/delete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
      body: JSON.stringify({ confirm: "DELETE" }),
    });
    const body = await r.json().catch(() => null);
    const ok = r.status === 200 && body?.deleted === true;
    if (!ok) failed++;
    // The same token must now be refused by the app.
    const after = await fetch(`${BASE}/v1/me/state`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    console.log(`${email}: delete ${r.status}${ok ? " deleted" : ""}; same token afterwards on /v1/me/state: ${after.status}`);
  }
  if (failed) { console.error(`${failed} deletion(s) failed`); process.exit(1); }
}
main().catch((e) => { console.error(String(e?.message ?? e)); process.exit(1); });
