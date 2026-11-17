import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { SUPABASE_KEY, SUPABASE_URL, sessionFor, signInBrowser } from "./session";

// Browser and API checks against the PUBLIC preview and its database, with synthetic accounts
// made for this run (see DEPLOYMENT.md, "Hosted test run"). Kept apart from the local suites.
//   HOSTED_URL                 the public preview
//   HOSTED_SUPABASE_URL/_KEY   its Supabase project URL and publishable key
//   HOSTED_ACCOUNTS            role=email pairs: public, p1, diary, iso_a, iso_b, pro, export
//   HOSTED_PASSWORD            the one-off password of those accounts (never committed)
const BASE = process.env.HOSTED_URL!;
const stamp = Date.now();

test.beforeAll(() => {
  for (const k of ["HOSTED_URL", "HOSTED_SUPABASE_URL", "HOSTED_SUPABASE_KEY", "HOSTED_ACCOUNTS", "HOSTED_PASSWORD"]) if (!process.env[k]) throw new Error(`Set ${k}`);
});

/** A brand-new account: help page first (as the app requires), then the session, then setup. */
async function onboard(context: BrowserContext, role: string): Promise<Page> {
  const page = await context.newPage();
  await page.goto("/start");
  await page.getByRole("radio", { name: "United States" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "I've read this" }).click();
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  await signInBrowser(context, BASE, role);
  await page.goto("/setup");
  const consent = page.getByRole("heading", { name: "Consent" });
  const today = page.getByRole("heading", { name: "Today" });
  await expect(consent.or(today)).toBeVisible({ timeout: 30000 });
  if (await today.isVisible()) return page; // already set up in an earlier run
  for (const box of await page.getByRole("checkbox").all()) await box.check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("checkbox", { name: "This is right" }).click();
  for (let i = 0; i < 7; i++) await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Go to Today" }).click();
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible({ timeout: 30000 });
  return page;
}

async function addMeal(page: Page, dish: string) {
  await page.getByRole("button", { name: "Add meal" }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByLabel("What did you have?").fill(dish);
  await sheet.getByRole("button", { name: /^Save( without the check)?$/ }).click();
  await expect(page.getByText(dish)).toBeVisible({ timeout: 20000 });
}

function pdfText(bytes: Buffer): string {
  const dir = mkdtempSync(path.join(tmpdir(), "bloat-hosted-pdf-"));
  const file = path.join(dir, "r.pdf");
  writeFileSync(file, bytes);
  return execFileSync("pdftotext", ["-layout", file, "-"], { encoding: "utf8" }).replace(/\s+/g, " ");
}

test("public: a fresh signed-out browser opens the preview with no Vercel login, sees the app, and private screens send it to the app's own sign-in", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const res = await page.goto(BASE);
  expect(res!.status()).toBe(200);
  expect(new URL(page.url()).host).toBe(new URL(BASE).host); // no redirect to vercel.com
  await expect(page.getByRole("link", { name: "Get started" }).first()).toBeVisible();
  await page.goto("/today");
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByRole("button", { name: "Send code" })).toBeVisible();
  await context.close();
});

test("public: test-only switches are off (no password sign-in, no mock purchase, no test clock) and real payments stay off", async ({ browser, request }) => {
  const login = await request.post(`${BASE}/v1/auth/test-login`, { data: { email: `x-${stamp}@example.com`, password: "synthetic-password-1", create: true } });
  expect(login.status()).toBe(404);
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/sign-in");
  await expect(page.getByRole("button", { name: "Send code" })).toBeVisible();
  await expect(page.getByText(/Test password|Test sign-in/)).toHaveCount(0);
  const p = await onboard(context, "public");
  for (const screen of ["/me", "/upgrade"]) {
    await p.goto(screen);
    await expect(p.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(p.getByText(/Mock purchase/)).toHaveCount(0);
  }
  const out = await p.evaluate(async () => {
    const h = { "content-type": "application/json", "idempotency-key": crypto.randomUUID() };
    const buy = await fetch("/v1/billing/mock-purchase", { method: "POST", headers: h, body: JSON.stringify({ interval: "monthly" }) });
    const clock = await (await fetch("/v1/me/state", { headers: { "x-bloat-test-now": "2020-01-01T12:00:00Z" }, cache: "no-store" })).json();
    const ent = await (await fetch("/v1/billing/entitlement", { cache: "no-store" })).json();
    return { buy: buy.status, today: (clock.today?.date ?? clock.today) as string, plan: ent.plan, checkout: ent.checkout_enabled };
  });
  expect(out.buy).toBe(404);
  expect(out.today).not.toMatch(/^2020-01-01/);
  expect(out.plan).toBe("free");
  expect(out.checkout).toBe(false);
  await context.close();
});

test("public: signed-out requests and direct database calls cannot read or change private records", async ({ request }) => {
  for (const pathName of ["/v1/history", "/v1/me/state", "/v1/days/2026-11-01", "/v1/reports", `/v1/export/${crypto.randomUUID()}?token=x`]) {
    expect((await request.get(`${BASE}${pathName}`)).status(), pathName).toBe(401);
  }
  expect((await request.post(`${BASE}/v1/meals`, { headers: { "idempotency-key": crypto.randomUUID() }, data: { save_key: crypto.randomUUID(), dish_text: "x", eaten: { mode: "now" } } })).status()).toBe(401);
  expect((await request.get(`${BASE}/v1/admin`)).status()).toBe(404);
  const rest = (table: string, init?: RequestInit) => fetch(`${SUPABASE_URL}/rest/v1/${table}${init?.method ? "" : "?select=*"}`, { ...init, headers: { apikey: SUPABASE_KEY, "content-type": "application/json", ...(init?.headers ?? {}) } });
  for (const table of ["meals", "episodes", "profiles", "reports", "health_conditions", "medicines"]) {
    const body = await (await rest(table)).json();
    // Either nothing at all, or refused outright ("permission denied"): never a row.
    expect(Array.isArray(body) ? body : body.code, table).toEqual(Array.isArray(body) ? [] : "42501");
  }
  const write = await rest("meals", { method: "POST", body: JSON.stringify({ dish_text: "intruder" }) });
  expect([401, 403]).toContain(write.status);
});

test("Priority 1: a signed-in synthetic user saves a meal and still sees it in History after a refresh", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await onboard(context, "p1");
  const dish = `Hosted dosa ${stamp}`;
  await addMeal(page, dish);
  await page.getByRole("link", { name: "History" }).click();
  await expect(page.getByRole("heading", { name: "History" })).toBeVisible();
  await expect(page.getByText("1 meal").first()).toBeVisible({ timeout: 20000 });
  await page.reload();
  await expect(page.getByText("1 meal").first()).toBeVisible({ timeout: 20000 });
  await page.getByText("· today").click();
  await expect(page.getByText(dish)).toBeVisible({ timeout: 20000 });
  await page.reload();
  await expect(page.getByText(dish)).toBeVisible({ timeout: 20000 });
  await context.close();
});

test("Priority 2a: the diary flow (bloating with a warning sign, refresh, end, meal, sign out, sign back in)", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await onboard(context, "diary");
  await page.getByRole("button", { name: "I feel bloated" }).click();
  const log = page.getByRole("dialog", { name: "Log bloating" });
  await log.getByRole("radio", { name: "6", exact: true }).click();
  await log.getByRole("checkbox", { name: "Vomiting", exact: true }).click();
  await expect(log.getByText("Contact a doctor today or go to urgent care.")).toBeVisible();
  await expect(log.getByText("Adapted from NHS, Bloating")).toBeVisible();
  await log.getByRole("button", { name: "Save" }).click();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("button", { name: /Bloating ongoing/ })).toBeVisible({ timeout: 20000 });
  await page.reload();
  await page.getByRole("button", { name: /Bloating ongoing/ }).click();
  await page.getByRole("dialog", { name: "Bloating now" }).getByRole("button", { name: "Bloating gone" }).click();
  const end = page.getByRole("dialog", { name: "Bloating ended" });
  await end.getByRole("button", { name: "Save" }).click();
  await expect(end.getByText(/Lasted/)).toBeVisible({ timeout: 20000 });
  await end.getByRole("button", { name: "Done" }).click();
  await addMeal(page, `Diary lunch ${stamp}`);
  await page.goto("/me");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).not.toHaveURL(/\/me/, { timeout: 20000 });
  await page.goto("/today");
  await expect(page).toHaveURL(/sign-in/);
  await signInBrowser(context, BASE, "diary");
  await page.goto("/today");
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByText(`Diary lunch ${stamp}`)).toBeVisible({ timeout: 20000 });
  await expect(page.getByText(/1 episode/)).toBeVisible();
  await context.close();
});

test("Priority 2b: two synthetic accounts cannot see or change each other's records, through the app or the database", async ({ browser }) => {
  const ctxA = await browser.newContext();
  const a = await onboard(ctxA, "iso_a");
  const secret = `Private meal A ${stamp}`;
  await addMeal(a, secret);
  const mine = await a.evaluate(async () => (await (await fetch("/v1/history", { cache: "no-store" })).json()).today as string);
  const dayA = await a.evaluate(async (d) => (await fetch(`/v1/days/${d}`, { cache: "no-store" })).json(), mine);
  const mealId = dayA.meals[0].id as string;

  const ctxB = await browser.newContext();
  const b = await onboard(ctxB, "iso_b");
  const seen = await b.evaluate(async ({ d, id }) => {
    const day = await (await fetch(`/v1/days/${d}`, { cache: "no-store" })).json();
    const patch = await fetch(`/v1/meals/${id}`, { method: "PATCH", headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID(), "if-match": "1" }, body: JSON.stringify({ dish_text: "taken over" }) });
    const del = await fetch(`/v1/meals/${id}`, { method: "DELETE", headers: { "idempotency-key": crypto.randomUUID() } });
    const exp = await (await fetch("/v1/export", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: JSON.stringify({ format: "json" }) })).json();
    const file = await (await fetch(exp.download_url)).text();
    return { meals: day.meals.length, patch: patch.status, del: del.status, file };
  }, { d: mine, id: mealId });
  expect(seen.meals).toBe(0);
  expect(seen.patch).toBe(404);
  expect(seen.del).toBe(404);
  expect(seen.file).not.toContain(secret);
  // B's own session against the database directly: no rows of A, and no writes at all.
  const { token } = await sessionFor("iso_b");
  const h = { apikey: SUPABASE_KEY, authorization: `Bearer ${token}`, "content-type": "application/json" };
  expect(await (await fetch(`${SUPABASE_URL}/rest/v1/meals?id=eq.${mealId}&select=*`, { headers: h })).json()).toEqual([]);
  const upd = await fetch(`${SUPABASE_URL}/rest/v1/meals?id=eq.${mealId}`, { method: "PATCH", headers: { ...h, prefer: "return=representation" }, body: JSON.stringify({ dish_text: "taken over" }) });
  expect(upd.status === 401 || upd.status === 403 || (upd.ok && (await upd.json()).length === 0)).toBe(true);
  await a.reload();
  const again = await a.evaluate(async (d) => (await fetch(`/v1/days/${d}`, { cache: "no-store" })).json(), mine);
  expect(again.meals.map((m: { dish_text: string }) => m.dish_text)).toEqual([secret]);
  await ctxA.close(); await ctxB.close();
});

test("Priority 2c and report privacy: a designated Pro test account makes a doctor report with Medicines and Health off; the preview, PDF and shared page leave them out; the share link opens for anyone, then stops after revoke", async ({ browser }) => {
  test.setTimeout(240_000);
  const context = await browser.newContext();
  const page = await onboard(context, "pro");
  const MED = `Zorvatrin-${stamp}`;
  const send = (method: string, url: string, body: unknown) => page.evaluate(async ({ method, url, body }) => (await fetch(url, { method, headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: JSON.stringify(body) })).status, { method, url, body });
  expect(await send("POST", "/v1/medicines", { name: MED, type: "supplement", started_precision: "not_sure" })).toBe(201);
  expect(await send("PATCH", "/v1/me/profile", { answers: { "ON-10": ["pregnancy"] } })).toBe(200);
  expect(await send("PUT", "/v1/health/conditions", { conditions: [{ condition: "reflux", status: "diagnosed_by_a_doctor", year: 2019 }] })).toBe(200);
  await page.goto("/doctor");
  await expect(page.getByRole("heading", { name: "Doctor report" })).toBeVisible({ timeout: 30000 });
  await page.getByLabel("Questions you want to ask your doctor").fill(`Synthetic question QZ-${stamp}`);
  await page.getByRole("checkbox", { name: "Medicines", exact: true }).click();
  await page.getByRole("checkbox", { name: "Health background" }).click();
  await page.getByRole("button", { name: "Preview report" }).click();
  const preview = page.getByRole("region", { name: /Preview: everything/ });
  await expect(preview.getByText(`QZ-${stamp}`)).toBeVisible({ timeout: 30000 });
  const previewText = (await preview.innerText()).toLowerCase();
  for (const leak of [MED, "Pregnancy", "Reflux"]) expect(previewText, leak).not.toContain(leak.toLowerCase());
  const pdfHref = await page.getByRole("link", { name: "Download PDF" }).getAttribute("href");
  const pdf = await page.request.get(pdfHref!);
  expect(pdf.status()).toBe(200);
  const pdfTextLower = pdfText(Buffer.from(await pdf.body())).toLowerCase();
  for (const leak of [MED, "pregnancy", "reflux"]) expect(pdfTextLower, `pdf: ${leak}`).not.toContain(leak.toLowerCase());
  expect(pdfTextLower).toContain(`qz-${stamp}`);

  await page.getByLabel("Who is it for?").fill("Test doctor");
  await page.getByLabel("What is it for?").fill("Hosted test");
  await page.getByRole("checkbox").last().check();
  await page.getByRole("button", { name: "Create share link" }).click();
  await expect(page.getByText("Link ready")).toBeVisible({ timeout: 30000 });
  const link = (await page.locator("p.break-all").innerText()).trim();
  // Anyone with the link can read it: a fresh browser with no session.
  const stranger = await browser.newContext();
  const reader = await stranger.newPage();
  await reader.goto(link);
  await expect(reader.getByRole("heading", { name: "Bloating diary summary" })).toBeVisible({ timeout: 30000 });
  const shared = (await reader.locator("main").innerText()).toLowerCase();
  for (const leak of [MED, "Pregnancy", "Reflux"]) expect(shared, `shared: ${leak}`).not.toContain(leak.toLowerCase());
  expect(shared).toContain(`qz-${stamp}`);
  await page.getByRole("button", { name: "Revoke link" }).click();
  await expect(page.getByText("The link has been revoked.")).toBeVisible({ timeout: 20000 });
  await reader.reload();
  await expect(reader.getByRole("heading", { name: "This link no longer works" })).toBeVisible({ timeout: 30000 });
  await expect(reader.getByText(`QZ-${stamp}`)).toHaveCount(0);
  await stranger.close();
  await context.close();
});

test("exports on the hosted preview: JSON and CSV downloads are complete for a signed-in user and refused to anyone else", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await onboard(context, "export");
  const out = await page.evaluate(async () => {
    const get = async (format: string) => {
      const job = await (await fetch("/v1/export", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: JSON.stringify({ format }) })).json();
      const res = await fetch(job.download_url);
      return { status: res.status, text: await res.text(), url: job.download_url as string };
    };
    return { json: await get("json"), csv: await get("csv") };
  });
  expect(out.json.status).toBe(200);
  const j = JSON.parse(out.json.text);
  expect(j.row_counts.profiles).toBe(1);
  expect(j.tables.meals.length).toBe(j.row_counts.meals);
  expect(out.csv.status).toBe(200);
  expect(out.csv.text).toContain("# table: profiles (1 row)");
  const stranger = await browser.newContext();
  expect((await stranger.request.get(`${BASE}${out.json.url}`)).status()).toBe(401);
  await stranger.close();
  await context.close();
});
