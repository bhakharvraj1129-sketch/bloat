// What a sign-in issued BEFORE an account is deleted can still do on the hosted preview.
// Two steps around the deletion (the deletion itself needs the owner's approval):
//   pnpm exec tsx tests/hosted/old-token.ts capture   before: sign in, keep the session in TOKEN_FILE
//   pnpm exec tsx tests/hosted/old-token.ts check     after: use the same session everywhere
// Needs HOSTED_URL, HOSTED_SUPABASE_URL, HOSTED_SUPABASE_KEY, HOSTED_ACCOUNTS, HOSTED_PASSWORD,
// TOKEN_ROLE (which account) and TOKEN_FILE (a private file outside the repository). Tokens are
// written only to TOKEN_FILE and never printed; the printed summary has statuses and counts only.
//
// It keeps two things apart:
//   - protected data: does the old session still READ or WRITE any data? (app API, Supabase Auth,
//     direct database calls). This is the security result.
//   - screen: what the app shows a browser with the old cookies. Showing the sign-in screen is
//     not by itself evidence that data is protected, so it is reported separately.
import { readFileSync, writeFileSync } from "node:fs";
import { sessionFor } from "./session";

const BASE = process.env.HOSTED_URL!;
const SB = process.env.HOSTED_SUPABASE_URL!;
const KEY = process.env.HOSTED_SUPABASE_KEY!;
const FILE = process.env.TOKEN_FILE!;
const ROLE = process.env.TOKEN_ROLE ?? "p1";
for (const [k, v] of Object.entries({ HOSTED_URL: BASE, HOSTED_SUPABASE_URL: SB, HOSTED_SUPABASE_KEY: KEY, TOKEN_FILE: FILE })) if (!v) throw new Error(`Set ${k}`);

type Saved = { access: string; refresh: string; cookies: Array<{ name: string; value: string }> };
const cookieHeader = (c: Saved["cookies"]) => c.map((x) => `${x.name}=${x.value}`).join("; ");
const bearer = (t: string) => ({ Authorization: `Bearer ${t}` });
const dataKeys = (body: unknown) => (body && typeof body === "object" ? Object.keys(body as object).filter((k) => k !== "error" && k !== "request_id") : []);
async function json(r: Response) { try { return await r.json(); } catch { return null; } }

async function probe(s: Saved) {
  const out: Record<string, unknown> = {};
  // Protected data through the app, with the old access token and with the old cookies.
  for (const path of ["/v1/me/state", "/v1/history", "/v1/reports"]) {
    const r = await fetch(`${BASE}${path}`, { headers: bearer(s.access), cache: "no-store" });
    const b = await json(r);
    out[`app ${path} (token)`] = { status: r.status, data_fields: dataKeys(b).length };
    const c = await fetch(`${BASE}${path}`, { headers: { cookie: cookieHeader(s.cookies) }, cache: "no-store" });
    out[`app ${path} (cookie)`] = { status: c.status, data_fields: dataKeys(await json(c)).length };
  }
  const w = await fetch(`${BASE}/v1/meals`, { method: "POST", headers: { ...bearer(s.access), "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: JSON.stringify({ save_key: crypto.randomUUID(), dish_text: "old-token write check", eaten: { mode: "now" } }) });
  out["app POST /v1/meals (token)"] = { status: w.status };
  // Supabase Auth: who is this, and can the refresh token make a new session?
  const who = await fetch(`${SB}/auth/v1/user`, { headers: { apikey: KEY, ...bearer(s.access) } });
  out["auth /user"] = { status: who.status };
  // Direct database calls with the old access token (the app never needs these).
  for (const [t, col] of [["meals", "id"], ["episodes", "id"], ["profiles", "user_id"], ["reports", "id"]]) {
    const r = await fetch(`${SB}/rest/v1/${t}?select=${col}`, { headers: { apikey: KEY, ...bearer(s.access) } });
    const b = await json(r);
    out[`db read ${t}`] = { status: r.status, rows: Array.isArray(b) ? b.length : null };
  }
  const dw = await fetch(`${SB}/rest/v1/meals`, { method: "POST", headers: { apikey: KEY, ...bearer(s.access), "content-type": "application/json" }, body: JSON.stringify({ dish_text: "old-token direct write" }) });
  out["db write meals"] = { status: dw.status };
  // Screen: what a browser with the old cookies is shown (reported apart from the data checks).
  const page = await fetch(`${BASE}/history`, { headers: { cookie: cookieHeader(s.cookies) }, redirect: "manual" });
  out["screen /history (cookie)"] = { status: page.status, goes_to: page.headers.get("location") };
  const exp = JSON.parse(Buffer.from(s.access.split(".")[1]!, "base64url").toString()).exp as number;
  out["access token expires in (s)"] = exp - Math.floor(Date.now() / 1000);
  return out;
}

async function main() {
  const step = process.argv[2];
  if (step === "capture") {
    const { cookies, token, refresh } = await sessionFor(ROLE);
    const saved: Saved = { access: token, refresh, cookies };
    writeFileSync(FILE, JSON.stringify(saved), { mode: 0o600 });
    console.log(JSON.stringify({ step: "before deletion", role: ROLE, ...(await probe(saved)) }, null, 1));
  } else if (step === "check") {
    const saved = JSON.parse(readFileSync(FILE, "utf8")) as Saved;
    const result = await probe(saved);
    // Done last: a refresh grant uses the refresh token up even when it is refused.
    const renew = await fetch(`${SB}/auth/v1/token?grant_type=refresh_token`, { method: "POST", headers: { apikey: KEY, "content-type": "application/json" }, body: JSON.stringify({ refresh_token: saved.refresh }) });
    result["auth refresh"] = { status: renew.status };
    console.log(JSON.stringify({ step: "after deletion", role: ROLE, ...result }, null, 1));
  } else throw new Error("usage: capture | check");
}
main().catch((e) => { console.error(String(e?.message ?? e)); process.exit(1); });
