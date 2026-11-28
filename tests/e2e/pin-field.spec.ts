import { expect, test, type Browser, type Page, type Route } from "@playwright/test";

// The PIN code lookup in You (India accounts) answers only for the PIN on screen now (review of 28
// Nov 2026, finding 3). An older, slower answer must not replace the newer one; a pending answer must
// not apply after the field is cleared or changed, after the person picks a state themselves, or after
// they leave the screen (in You a found state is saved at once). The PIN code is never kept in the
// profile or the browser's storage. LOCAL stack, synthetic accounts; the answers are the real ones,
// only delayed in the browser.

const HELP_VERSION = "nhs-bloating-2026-11-07";
const PASSWORD = "synthetic-password-1";

async function indiaAccount(browser: Browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto("/");
  const email = `pin-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
  expect((await page.request.post("/v1/auth/test-login", { data: { email, password: PASSWORD, create: true } })).ok()).toBe(true);
  const status = await page.evaluate(async (help) => (await fetch("/v1/onboarding/commit", {
    method: "POST", headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
    body: JSON.stringify({ age_18_or_older: "yes", country: "IN", time_zone: "Asia/Kolkata", units: "metric", help: { viewed_at: new Date().toISOString(), page_version: help }, consents: ["terms_privacy", "health_data", "wellness_ack"], answers: [], medicines: [], followed: [] }),
  })).status, HELP_VERSION);
  expect(status).toBe(201);
  await ctx.close();
  return email;
}

/** The PIN a lookup asked for, whether it travels in the address or in the body. */
function pinOf(route: Route): string {
  const fromPath = /\/pincode\/(\d+)/.exec(route.request().url())?.[1];
  if (fromPath) return fromPath;
  try { return String((route.request().postDataJSON() as { pin?: string }).pin ?? ""); } catch { return ""; }
}

/** Delay the answer for one PIN until released; every other lookup answers at once. */
async function delayPin(page: Page, slow: string) {
  let release!: () => void;
  const gate = new Promise<void>((r) => { release = r; });
  let answered = false;
  await page.route("**/v1/places/pincode**", async (route) => {
    if (pinOf(route) !== slow) return route.continue();
    const answer = await route.fetch();
    await gate;
    await route.fulfill({ response: answer }).catch(() => {});
    answered = true;
  });
  return { release, answered: () => answered };
}

const savedRegion = (page: Page) => page.evaluate(async () => (await (await fetch("/v1/me/state", { cache: "no-store" })).json()).profile.region as string | null);
const stateButton = (page: Page) => page.getByRole("button", { name: /^State or union territory \(optional\)/ });

async function openYou(page: Page, browser: Browser) {
  const email = await indiaAccount(browser);
  await page.goto("/");
  expect((await page.request.post("/v1/auth/test-login", { data: { email, password: PASSWORD } })).ok()).toBe(true);
  await page.goto("/me");
  await expect(page.getByLabel("PIN code (optional)")).toBeVisible({ timeout: 20000 });
}

async function noPinKept(page: Page, ...pins: string[]) {
  const kept = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
  const profile = JSON.stringify((await page.evaluate(async () => (await (await fetch("/v1/me/state", { cache: "no-store" })).json()).profile)));
  for (const pin of pins) { expect(kept).not.toContain(pin); expect(profile).not.toContain(pin); }
}

test.describe("PIN code lookup answers only for the PIN on screen", () => {
  test("an older, slower answer does not replace the newer one", async ({ page, browser }) => {
    await openYou(page, browser);
    const slow = await delayPin(page, "380001"); // Gujarat, held back
    const pin = page.getByLabel("PIN code (optional)");
    await pin.fill("380001");
    await pin.fill("560001"); // Karnataka, answers first
    await expect(page.getByText("Bengaluru Urban, Karnataka")).toBeVisible({ timeout: 20000 });
    await expect.poll(() => savedRegion(page), { timeout: 20000 }).toBe("Karnataka");
    slow.release();
    await expect.poll(slow.answered).toBe(true);
    await page.waitForTimeout(1500);
    await expect(page.getByText("Ahmadabad, Gujarat")).toHaveCount(0);
    await expect(stateButton(page)).toHaveAccessibleName("State or union territory (optional) Karnataka");
    expect(await savedRegion(page)).toBe("Karnataka");
    await noPinKept(page, "380001", "560001");
  });

  test("clearing the field drops a pending answer", async ({ page, browser }) => {
    await openYou(page, browser);
    const slow = await delayPin(page, "380001");
    const pin = page.getByLabel("PIN code (optional)");
    await pin.fill("380001");
    await pin.fill("");
    slow.release();
    await expect.poll(slow.answered).toBe(true);
    await page.waitForTimeout(1500);
    await expect(page.getByText("Ahmadabad, Gujarat")).toHaveCount(0);
    expect(await savedRegion(page)).toBeNull();
  });

  test("a state chosen by hand while a lookup is on its way is kept", async ({ page, browser }) => {
    await openYou(page, browser);
    const slow = await delayPin(page, "380001");
    await page.getByLabel("PIN code (optional)").fill("380001");
    await stateButton(page).click();
    await page.getByRole("combobox", { name: "Search states and union territories" }).fill("Kerala");
    await page.getByRole("option", { name: /Kerala/ }).click();
    await expect.poll(() => savedRegion(page), { timeout: 20000 }).toBe("Kerala");
    slow.release();
    await expect.poll(slow.answered).toBe(true);
    await page.waitForTimeout(1500);
    expect(await savedRegion(page)).toBe("Kerala");
    await expect(stateButton(page)).toHaveAccessibleName("State or union territory (optional) Kerala");
  });

  test("leaving the screen drops a pending answer: nothing is saved afterwards", async ({ page, browser }) => {
    await openYou(page, browser);
    const slow = await delayPin(page, "380001");
    await page.getByLabel("PIN code (optional)").fill("380001");
    await page.getByRole("link", { name: "Today", exact: true }).first().click();
    await expect(page).toHaveURL(/\/today$/);
    slow.release();
    await expect.poll(slow.answered).toBe(true);
    await page.waitForTimeout(1500);
    expect(await savedRegion(page)).toBeNull();
    await noPinKept(page, "380001");
  });
});
