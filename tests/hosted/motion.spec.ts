import { expect, test, type Page } from "@playwright/test";
import { account, PASSWORD } from "./session";

// The motion and design pass (owner's spec, 27 Nov 2026) on the PUBLIC preview, with one synthetic
// account (role "motion", Free, set up in India). Checks what only the deployed build can show:
//   - the PIN code lookup works there (its data file is in Vercel's server bundle) and fills in the state;
//   - sheets are the new bottom drawers (250ms), focus moves into them, and a save ends with a toast;
//   - the start page's sections end fully visible after their scroll reveal.
// Synthetic, made-up entries only. The password is never printed.
const BASE = process.env.HOSTED_URL!;
test.beforeAll(() => { if (!BASE) throw new Error("Set HOSTED_URL"); });
test.describe.configure({ mode: "serial" });

const api = (page: Page, method: string, url: string, body?: unknown) => page.evaluate(async ({ method, url, body }) => {
  const r = await fetch(url, { method, headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store" });
  return { status: r.status, body: await r.json().catch(() => null) };
}, { method, url, body });

async function signIn(page: Page) {
  await page.goto("/sign-in", { waitUntil: "load" });
  await page.getByLabel("Email").fill(account("motion"));
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(/\/(today|setup)/, { timeout: 30000 });
  const st = (await api(page, "GET", "/v1/me/state")).body;
  if (!st.onboarded) {
    const r = await api(page, "POST", "/v1/onboarding/commit", {
      age_18_or_older: "yes", country: "IN", time_zone: "Asia/Kolkata", units: "metric",
      help: { viewed_at: new Date().toISOString(), page_version: "nhs-bloating-2026-11-07" }, consents: ["terms_privacy", "health_data", "wellness_ack"],
      answers: [], medicines: [], followed: [],
    });
    expect(r.status, JSON.stringify(r.body)).toBe(201);
  }
}

test("hosted: the PIN code lookup works on the deployed build and fills in the state; the PIN code is not saved", async ({ page }) => {
  test.skip(!PASSWORD, "needs the run's synthetic accounts");
  await signIn(page);
  const found = await api(page, "GET", "/v1/places/pincode/380001");
  expect(found.status, JSON.stringify(found.body)).toBe(200);
  expect(found.body).toEqual({ state: "Gujarat", city: "Ahmadabad" });
  expect((await api(page, "GET", "/v1/places/pincode/999999")).status).toBe(404);
  expect((await api(page, "GET", "/v1/places/pincode/012345")).status).toBe(422);

  await page.goto("/me");
  const pin = page.getByLabel("PIN code (optional)");
  await pin.fill("560001");
  await expect(page.getByText("Bengaluru Urban, Karnataka")).toBeVisible({ timeout: 30000 });
  const state = page.getByRole("button", { name: /^State or union territory \(optional\)/ });
  await expect(state).toHaveAccessibleName("State or union territory (optional) Karnataka", { timeout: 30000 });
  await expect.poll(async () => (await api(page, "GET", "/v1/me/state")).body.profile.region, { timeout: 30000 }).toBe("Karnataka");
  const profile = (await api(page, "GET", "/v1/me/state")).body.profile;
  expect(JSON.stringify(profile)).not.toContain("560001");
  await page.reload();
  await expect(page.getByRole("button", { name: /^State or union territory \(optional\)/ })).toHaveAccessibleName("State or union territory (optional) Karnataka");
});

test("hosted: a sheet slides up over 250ms with focus inside, and a save ends with a tick and a toast", async ({ page }) => {
  test.skip(!PASSWORD, "needs the run's synthetic accounts");
  await signIn(page);
  await page.goto("/today");
  await page.getByRole("button", { name: "Add meal" }).click();
  const sheet = page.getByRole("dialog", { name: "Add meal" });
  await expect(sheet).toBeVisible();
  expect(await page.locator("[data-vaul-drawer]").evaluate((el) => getComputedStyle(el).animationDuration)).toBe("0.25s");
  await expect.poll(() => sheet.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  await sheet.getByLabel("What did you have?").fill("Made-up test meal");
  await sheet.getByRole("button", { name: "Save" }).click();
  const toast = page.locator('[data-sonner-toast][data-front="true"]');
  await expect(toast).toHaveText("Meal saved.", { timeout: 30000 });
  await expect(toast.locator("svg")).toHaveCount(1);
  await expect(page.locator("section[aria-live='polite']", { has: toast })).toHaveCount(1);
  await expect(sheet).toBeHidden();
});

test("hosted: the start page's sections end fully visible after scrolling", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await expect(page.locator("h1[data-hero]")).toBeVisible();
  const cards = page.locator("[data-reveal-group] > li");
  await cards.last().scrollIntoViewIfNeeded();
  await expect.poll(() => cards.last().evaluate((el) => getComputedStyle(el).opacity), { timeout: 5000 }).toBe("1");
  await ctx.close();
});
