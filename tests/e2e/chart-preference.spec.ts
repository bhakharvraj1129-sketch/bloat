import { expect, test, type Browser, type Page, type Route } from "@playwright/test";

// "Hide charts" belongs to one account (review of 28 Nov 2026, finding 2). The preference is kept in
// the page between screens, so these checks change account in the SAME tab without a full reload
// (sign out and sign in are client-side navigations): one account's choice must never show for the
// next, a late answer for the previous account must not change the current one, charts stay hidden
// while the preference is unknown, a temporary loading failure recovers, and a failed save goes back.
// LOCAL stack, synthetic accounts only. The account switches sign in through the password form, so
// they need the server with password sign-in (E2E_SIGN_IN=password; the beta-settings gate runs them).

const HELP_VERSION = "nhs-bloating-2026-11-07";
const PASSWORD = "synthetic-password-1";
const PASSWORD_SERVER = process.env.E2E_SIGN_IN === "password";

async function makeAccount(browser: Browser, opts: { hide: boolean; bloating?: boolean }) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto("/");
  const email = `chartpref-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
  expect((await page.request.post("/v1/auth/test-login", { data: { email, password: PASSWORD, create: true } })).ok()).toBe(true);
  const api = (method: string, url: string, body?: unknown) => page.evaluate(async ({ method, url, body }) => {
    const r = await fetch(url, { method, headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: body === undefined ? undefined : JSON.stringify(body) });
    return r.status;
  }, { method, url, body });
  expect(await api("POST", "/v1/onboarding/commit", {
    age_18_or_older: "yes", country: "US", time_zone: "America/New_York", units: "us",
    help: { viewed_at: new Date().toISOString(), page_version: HELP_VERSION }, consents: ["terms_privacy", "health_data", "wellness_ack"],
    answers: [], medicines: [], followed: [],
  })).toBe(201);
  expect(await api("POST", "/v1/billing/mock-purchase", { interval: "three_month" })).toBe(200);
  if (opts.hide) expect(await api("PATCH", "/v1/me/profile", { hide_charts: true })).toBeLessThan(300);
  if (opts.bloating !== false) expect(await api("POST", "/v1/episodes", { strength: 4, started: { mode: "now" } })).toBe(201);
  const today = await page.evaluate(async () => (await (await fetch("/v1/me/state")).json()).today.date as string);
  await ctx.close();
  return { email, today };
}

// The day picture uses the shared preference (History's own charts follow its server answer instead).
const chart = (page: Page) => page.getByRole("region", { name: "The day at a glance" });
const dayLoaded = (page: Page) => expect(page.getByRole("heading", { name: "Bloating", exact: true })).toBeVisible({ timeout: 20000 });
/** Open today's day in-page: History tab, then today's row. */
async function openToday(page: Page, today: string) {
  await tab(page, "History").click();
  await page.locator(`a[href="/day/${today}"]:visible`).first().click();
  await dayLoaded(page);
}
const tab = (page: Page, name: "Today" | "History" | "Patterns" | "You") => page.getByRole("link", { name, exact: true }).first();

async function signInByForm(page: Page, email: string) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/today$/, { timeout: 20000 });
}

/** Sign out from You and sign in again from the start page, all in-page (no reload). */
async function switchAccount(page: Page, email: string) {
  await tab(page, "You").click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 20000 });
  // The start page shows Sign in directly when sign-ups are closed; otherwise it is in the Menu.
  const direct = page.getByRole("link", { name: "Sign in" });
  if (!(await direct.first().isVisible())) await page.getByRole("button", { name: "Menu" }).click();
  await direct.first().click();
  await expect(page).toHaveURL(/\/sign-in/, { timeout: 20000 });
  await signInByForm(page, email);
}

test.describe("Hide charts is per account", () => {
  test("account A hid charts; after A signs out and B signs in in the same tab, B's charts show", async ({ page, browser }) => {
    test.skip(!PASSWORD_SERVER, "signs in through the password form (E2E_SIGN_IN=password)");
    test.setTimeout(120_000);
    const a = await makeAccount(browser, { hide: true });
    const b = await makeAccount(browser, { hide: false });
    await page.goto("/sign-in");
    await page.evaluate(() => { (window as unknown as { __sameTab: number }).__sameTab = 1; });
    await signInByForm(page, a.email);
    await openToday(page, a.today);
    await page.waitForTimeout(1000);
    await expect(chart(page)).toHaveCount(0); // A's own choice

    await switchAccount(page, b.email);
    await openToday(page, b.today);
    await expect(chart(page)).toBeVisible({ timeout: 20000 }); // B never chose Hide charts

    await switchAccount(page, a.email);
    await openToday(page, a.today);
    await page.waitForTimeout(1000);
    await expect(chart(page)).toHaveCount(0); // and back to A's choice
    expect(await page.evaluate(() => (window as unknown as { __sameTab?: number }).__sameTab), "no full reload happened").toBe(1);
  });

  test("a late answer for A, arriving after B has signed in, does not change B's preference", async ({ page, browser }) => {
    test.skip(!PASSWORD_SERVER, "signs in through the password form (E2E_SIGN_IN=password)");
    test.setTimeout(120_000);
    const a = await makeAccount(browser, { hide: false });
    const b = await makeAccount(browser, { hide: true });
    let release!: () => void;
    const gate = new Promise<void>((r) => { release = r; });
    let phase: "A" | "B" = "A";
    let held = 0;
    // Hold back the preference answers asked for on A's day screen (the only screen part that asks
    // for it there) until B is signed in. Other screens' requests pass straight through.
    await page.route("**/v1/me/state", async (route: Route) => {
      if (phase !== "A" || !page.url().includes("/day/")) return route.continue();
      held++;
      const answer = await route.fetch(); // A's real answer: charts shown
      await gate;
      await route.fulfill({ response: answer }).catch(() => {});
    });
    await page.goto("/sign-in");
    await signInByForm(page, a.email);
    await openToday(page, a.today);
    await expect.poll(() => held).toBeGreaterThan(0);
    await expect(chart(page)).toHaveCount(0); // unknown while A's answer is held: hidden

    phase = "B";
    await switchAccount(page, b.email);
    await openToday(page, b.today);
    release();
    await page.waitForTimeout(1500);
    await expect(chart(page)).toHaveCount(0); // still B's own choice
  });

  test("charts stay hidden while the preference is unknown; after a temporary loading failure they come back without a reload", async ({ page, browser }) => {
    const { email, today } = await makeAccount(browser, { hide: false });
    await page.goto("/");
    expect((await page.request.post("/v1/auth/test-login", { data: { email, password: PASSWORD } })).ok()).toBe(true);
    let failing = true;
    let asked = 0;
    await page.route("**/v1/me/state", async (route) => {
      asked++;
      if (failing) return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { code: "UNAVAILABLE", message: "Try again." } }) });
      return route.continue();
    });
    await page.goto(`/day/${today}`);
    await dayLoaded(page);
    await expect.poll(() => asked).toBeGreaterThan(0);
    await page.waitForTimeout(800);
    await expect(chart(page)).toHaveCount(0); // unknown: hidden
    failing = false;
    await expect(chart(page)).toBeVisible({ timeout: 20000 }); // it tries again by itself
  });

  test("a failed Hide charts save goes back: the box stays unticked and the charts stay", async ({ page, browser }) => {
    const { email, today } = await makeAccount(browser, { hide: false });
    await page.goto("/");
    expect((await page.request.post("/v1/auth/test-login", { data: { email, password: PASSWORD } })).ok()).toBe(true);
    await page.goto(`/day/${today}`);
    await expect(chart(page)).toBeVisible({ timeout: 20000 });
    await page.route("**/v1/me/profile", (route) => route.request().method() === "PATCH"
      ? route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: { code: "ERROR", message: "Something went wrong. Nothing was saved." } }) })
      : route.continue());
    await tab(page, "You").click();
    const box = page.getByRole("checkbox", { name: "Hide charts" });
    await box.click(); // (not check(): the refused save can untick it before Playwright looks)
    await expect(page.getByText("Something went wrong. Nothing was saved.").first()).toBeVisible({ timeout: 20000 });
    await expect(box).not.toBeChecked();
    await openToday(page, today);
    await expect(chart(page)).toBeVisible({ timeout: 20000 });
  });
});
