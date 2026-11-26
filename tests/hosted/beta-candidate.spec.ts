import { expect, test, type Browser, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { account, PASSWORD, SUPABASE_KEY, SUPABASE_URL } from "./session";

// The beta candidate on the PUBLIC preview (26 Nov 2026), with the run's synthetic accounts:
//   "beta" (Free) and "pro" (pro-tester@bloat.test, Pro without a purchase; set up by preview.spec.ts).
// Run after the four core files. Checks what the owner asked to see on the final deployed build:
//   - the Today fixes (save messages, empty-time hint) and habit deletion (unknown, not No);
//   - AI, Learn and daily cards are not offered (BLOAT_AI_PROVIDER=off, BLOAT_OFF_FEATURES);
//   - a corrected or deleted record revokes the shared reports that cover it, a signed-out visitor
//     cannot open a revoked link, and a report outside the affected dates still opens;
//   - an invited tester can change the temporary password, and sign in with the new one.
// Synthetic, made-up entries only. The password is never printed.
const BASE = process.env.HOSTED_URL!;
test.beforeAll(() => { if (!BASE) throw new Error("Set HOSTED_URL"); });
test.describe.configure({ mode: "serial" });

const ZONE = "America/New_York";
type Api = (method: string, url: string, body?: unknown, ifMatch?: number) => Promise<{ status: number; body: any }>;

async function signIn(page: Page, role: string, password = PASSWORD) {
  await page.goto("/sign-in", { waitUntil: "load" });
  await page.getByLabel("Email").fill(account(role));
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(/\/(today|setup)/, { timeout: 30000 });
}
function apiFor(page: Page): Api {
  return (method, url, body, ifMatch) => page.evaluate(async ({ method, url, body, ifMatch }) => {
    const headers: Record<string, string> = { "content-type": "application/json", "idempotency-key": crypto.randomUUID() };
    if (ifMatch !== undefined) headers["If-Match"] = String(ifMatch);
    const r = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store" });
    return { status: r.status, body: await r.json().catch(() => null) };
  }, { method, url, body, ifMatch });
}
async function ready(page: Page, api: Api) {
  const st = (await api("GET", "/v1/me/state")).body;
  if (!st.onboarded) {
    const r = await api("POST", "/v1/onboarding/commit", {
      age_18_or_older: "yes", country: "US", time_zone: ZONE, units: "us",
      help: { viewed_at: new Date().toISOString(), page_version: "nhs-bloating-2026-11-07" }, consents: ["terms_privacy", "health_data", "wellness_ack"],
      answers: [], medicines: [], followed: [],
    });
    expect(r.status, JSON.stringify(r.body)).toBe(201);
  }
  return (await api("GET", "/v1/me/state")).body;
}
/** What a signed-out visitor sees at a link: a fresh browser with no cookies. */
async function signedOut(browser: Browser, url: string): Promise<string> {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto(`${BASE}${url}`, { waitUntil: "load" });
  const text = await p.locator("body").innerText();
  await ctx.close();
  return text;
}
const notice = (page: Page, where: "bloating" | "add") =>
  page.locator("section", { has: where === "add" ? page.getByRole("heading", { name: "Add to today" }) : page.getByText("Highest logged so far") }).getByRole("status").last();
const AI = ["ai_ingredient_check", "meal_photos", "recalled_meal_check", "ai_source_labels"];

test("beta (Free): Today says what was saved, an empty time cannot be sent, a habit is deleted to unknown, and no AI or Learn is offered", async ({ page }) => {
  test.skip(!process.env.HOSTED_PASSWORD, "needs the run's synthetic accounts");
  await signIn(page, "beta");
  const api = apiFor(page);
  const st = await ready(page, api);
  expect([...st.unavailable].sort()).toEqual([...AI, "daily_cards", "learn_library"].sort());
  expect((await api("GET", "/v1/library")).body?.error?.code).toBe("NOT_AVAILABLE");
  expect((await api("POST", "/v1/food-suggestions", { save_key: crypto.randomUUID(), dish_text: "toast" })).body?.error?.code).toBe("NOT_AVAILABLE");

  await page.goto("/today");
  await page.getByRole("button", { name: "I feel bloated" }).click();
  const log = page.getByRole("dialog", { name: "Log bloating" });
  await log.getByRole("radio", { name: "4", exact: true }).click();
  await log.getByRole("button", { name: "Save" }).click();
  await expect(log).toBeHidden({ timeout: 30000 });
  await expect(notice(page, "bloating")).toHaveText("Bloating saved.");

  await page.getByRole("button", { name: "Add meal" }).click();
  const meal = page.getByRole("dialog", { name: "Add meal" });
  await expect(meal.getByLabel("What did you have?")).toBeVisible();
  await expect(meal.getByText("Photo and ingredient check")).toHaveCount(0);
  await meal.getByLabel("What did you have?").fill("Beta check toast (synthetic)");
  await meal.getByRole("radio", { name: "Choose time" }).click();
  await meal.locator('input[type="datetime-local"]').fill("");
  await expect(meal.getByText("Choose a date and time to save.")).toBeVisible();
  await expect(meal.getByRole("button", { name: "Save" })).toBeDisabled();
  await meal.getByRole("radio", { name: "Now" }).click();
  await meal.getByRole("button", { name: "Save" }).click();
  await expect(meal).toBeHidden({ timeout: 30000 });
  await expect(notice(page, "add")).toHaveText("Meal saved.");

  await page.getByRole("button", { name: "Add activity" }).click();
  const act = page.getByRole("dialog", { name: "Add activity" });
  await act.getByRole("checkbox", { name: "Ate quickly" }).click();
  await act.getByRole("button", { name: "Save", exact: true }).click();
  await expect(act).toBeHidden({ timeout: 30000 });
  await expect(notice(page, "add")).toHaveText("Activity saved.");
  await page.goto(`/day/${st.today.date}`);
  const habits = page.locator("section", { has: page.getByRole("heading", { name: "Habits" }) });
  await habits.getByRole("button", { name: "Delete Ate quickly" }).click();
  const confirm = page.getByRole("dialog", { name: "Delete this?" });
  await expect(confirm.getByText("It becomes unknown, not No.")).toBeVisible();
  await confirm.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(confirm).toBeHidden({ timeout: 30000 });
  await page.reload();
  await expect(page.getByText("Beta check toast (synthetic)")).toBeVisible();
  await expect(page.getByText("Ate quickly")).toHaveCount(0);
  const day = (await api("GET", `/v1/days/${st.today.date}`)).body;
  expect(day.activities.filter((a: { activity_id: string }) => a.activity_id === "ACT-01")).toEqual([]); // removed, not stored as No
});

test("beta (Free): an invited tester changes the temporary password and signs in with the new one", async ({ page }) => {
  test.skip(!process.env.HOSTED_PASSWORD, "needs the run's synthetic accounts");
  const fresh = randomBytes(12).toString("base64url"); // one-off, never printed
  let changed = false;
  try {
    await signIn(page, "beta");
    await page.goto("/me");
    await page.getByRole("button", { name: "Change password" }).click();
    const sheet = page.getByRole("dialog", { name: "Change password" });
    await sheet.getByLabel("New password", { exact: true }).fill("short");
    await sheet.getByLabel("New password again").fill("short");
    await sheet.getByRole("button", { name: "Change password" }).click();
    await expect(sheet.getByText("Use at least 10 characters.")).toBeVisible();
    await sheet.getByLabel("New password", { exact: true }).fill(fresh);
    await sheet.getByLabel("New password again").fill(fresh);
    await sheet.getByRole("button", { name: "Change password" }).click();
    await expect(sheet.getByText("Password changed. Use the new one next time you sign in.")).toBeVisible({ timeout: 30000 });
    changed = true;
    await sheet.getByRole("button", { name: "Done" }).click();
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL((u) => !u.pathname.startsWith("/me"), { timeout: 30000 });
    // The old password no longer works; the new one does.
    await page.goto("/sign-in", { waitUntil: "load" });
    await page.getByLabel("Email").fill(account("beta"));
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByText("Email or password is incorrect.")).toBeVisible({ timeout: 30000 });
    await signIn(page, "beta", fresh);
    await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible({ timeout: 30000 });
    // The sign-in screen tells a tester what to do if they forget it.
    const out = await page.context().browser()!.newContext();
    const p2 = await out.newPage();
    await p2.goto(`${BASE}/sign-in`, { waitUntil: "load" });
    await expect(p2.getByText(/Forgot your password\? Ask the person who invited you/)).toBeVisible();
    await out.close();
  } finally {
    // Put the run's password back, so the account is deleted through the app like the others.
    if (changed) {
      const c = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
      const s = await c.auth.signInWithPassword({ email: account("beta"), password: fresh });
      if (!s.error) await c.auth.updateUser({ password: PASSWORD });
      await c.auth.signOut();
    }
  }
});

test("pro: a corrected or deleted record revokes the shared reports covering it; a signed-out visitor cannot open them; other reports still open", async ({ page, browser }) => {
  test.skip(!process.env.HOSTED_PASSWORD, "needs the run's synthetic accounts");
  await signIn(page, "pro");
  const api = apiFor(page);
  const st = await ready(page, api);
  expect(st.plan).toBe("pro");
  // Pro without AI: the meal sheet offers only Save, and Today shows no daily card.
  await page.goto("/today");
  await expect(page.getByText("Today's card")).toHaveCount(0);
  await page.getByRole("button", { name: "Add meal" }).click();
  const meal = page.getByRole("dialog", { name: "Add meal" });
  await meal.getByLabel("What did you have?").fill("Pro beta soup (synthetic)");
  await expect(meal.getByRole("button", { name: "Next: check ingredients" })).toHaveCount(0);
  await expect(meal.getByRole("button", { name: /Take a photo/ })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Close without saving" }).click();

  const d = (k: number) => new Date(Date.parse(`${st.today.date}T12:00:00Z`) - k * 86400000).toISOString().slice(0, 10);
  const episode = async (date: string) => {
    const s = await api("POST", "/v1/episodes", { strength: 5, started: { mode: "exact", local: `${date}T09:00`, zone: ZONE } });
    expect(s.status, JSON.stringify(s.body)).toBe(201);
    expect((await api("POST", `/v1/episodes/${s.body.episode.id}/end`, { ended: { mode: "exact", local: `${date}T10:00`, zone: ZONE } })).status).toBe(200);
  };
  await episode(d(2));
  await episode(d(1));
  const share = async (from: string, to: string) => {
    const r = await api("POST", "/v1/reports", { kind: "doctor", from, to });
    expect(r.status, JSON.stringify(r.body)).toBe(201);
    const s = await api("POST", `/v1/reports/${r.body.id}/shares`, { recipient: "Synthetic GP", purpose: "beta check", expires_in_days: 7, consent: true });
    expect(s.status, JSON.stringify(s.body)).toBe(201);
    expect(await signedOut(browser, s.body.url)).toContain("Bloating diary summary"); // opens before the change
    return { id: r.body.id as string, url: s.body.url as string };
  };
  const a = await share(d(2), d(2));
  const b = await share(d(1), d(1));

  // Deleting yesterday's record revokes B; A, which does not cover yesterday, still opens.
  const ep1 = (await api("GET", `/v1/days/${d(1)}`)).body.episodes[0];
  expect((await api("DELETE", `/v1/episodes/${ep1.id}`, undefined, ep1.revision)).status).toBe(204);
  expect(await signedOut(browser, b.url)).toContain("This link no longer works");
  expect(await signedOut(browser, a.url)).toContain("Bloating diary summary");
  // A flagged report cannot be shared again until it is made anew.
  expect((await api("POST", `/v1/reports/${b.id}/shares`, { recipient: "Synthetic GP", purpose: "again", expires_in_days: 7, consent: true })).status).toBe(409);

  // Correcting the other day's time revokes A.
  const ep2 = (await api("GET", `/v1/days/${d(2)}`)).body.episodes[0];
  expect((await api("PATCH", `/v1/episodes/${ep2.id}`, { started: { mode: "exact", local: `${d(2)}T08:30`, zone: ZONE } }, ep2.revision)).status).toBe(200);
  expect(await signedOut(browser, a.url)).toContain("This link no longer works");

  // A record without a date (a medicine): deleting it revokes every shared doctor report.
  const med = await api("POST", "/v1/medicines", { name: "Synthetic test medicine", type: "supplement", started_precision: "not_sure" });
  expect(med.status).toBe(201);
  const c = await share(d(2), d(1));
  expect((await api("DELETE", `/v1/medicines/${med.body.medicine.id}`)).status).toBe(204);
  expect(await signedOut(browser, c.url)).toContain("This link no longer works");
});
