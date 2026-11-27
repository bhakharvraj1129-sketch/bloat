import { expect, test, type BrowserContext, type Page } from "@playwright/test";

// Invited beta without AI (26 Nov 2026). LOCAL stack, synthetic accounts only.
//
// The local server runs with the mock AI. A deployment switches features off with BLOAT_AI_PROVIDER=off
// and BLOAT_OFF_FEATURES; the server then lists them in the state's "unavailable" and answers 404 for
// them (checked against a server started with those settings, and on the hosted preview). Here the
// state answer is changed in the browser to check what each screen does with that list.
//
// A1  Pro given for testing (no purchase) said "Renews on the end of the period." and offered Pause and
//     Cancel, though there is no subscription.

const HELP_VERSION = "nhs-bloating-2026-11-07";
const PASSWORD = "synthetic-password-1";
const AI_OFF = ["ai_ingredient_check", "meal_photos", "recalled_meal_check", "ai_source_labels"];
type Api = (method: string, url: string, body?: unknown) => Promise<{ status: number; body: any }>;

async function account(context: BrowserContext, opts: { pro?: boolean; email?: string } = {}): Promise<{ page: Page; api: Api }> {
  const page = await context.newPage();
  await page.goto("/");
  const email = opts.email ?? `beta-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
  expect((await page.request.post("/v1/auth/test-login", { data: { email, password: PASSWORD, create: true } })).ok()).toBe(true);
  const api: Api = (method, url, body) => page.evaluate(async ({ method, url, body }) => {
    const r = await fetch(url, { method, headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store" });
    return { status: r.status, body: await r.json().catch(() => null) };
  }, { method, url, body });
  const commit = await api("POST", "/v1/onboarding/commit", {
    age_18_or_older: "yes", country: "US", time_zone: "America/New_York", units: "us",
    help: { viewed_at: new Date().toISOString(), page_version: HELP_VERSION }, consents: ["terms_privacy", "health_data", "wellness_ack"],
    answers: [], medicines: [], followed: [],
  });
  expect([201, 409], JSON.stringify(commit.body)).toContain(commit.status); // 409: an earlier run already set it up
  if (opts.pro) expect((await api("POST", "/v1/billing/mock-purchase", { interval: "three_month" })).status).toBe(200);
  return { page, api };
}

/** The state answer as a deployment with these features switched off would send it. */
async function switchedOff(page: Page, keys: string[]) {
  await page.route("**/v1/me/state", async (route) => {
    try {
      const res = await route.fetch();
      const json = await res.json();
      await route.fulfill({ response: res, json: { ...json, unavailable: keys } });
    } catch {
      // A reload still in flight when the test ends: nothing to check.
    }
  });
}

test.describe("invited beta: switched-off features are not offered", () => {
  test("AI off, Pro: no ingredient check, no photo, no consent step; the meal saves as a plain meal", async ({ context }) => {
    const { page, api } = await account(context, { pro: true });
    await switchedOff(page, AI_OFF);
    await page.goto("/today");
    await page.getByRole("button", { name: "Add meal" }).click();
    const meal = page.getByRole("dialog", { name: "Add meal" });
    await meal.getByLabel("What did you have?").fill("beta soup");
    await expect(meal.getByRole("button", { name: /Take a photo/ })).toHaveCount(0);
    await expect(meal.getByRole("button", { name: "Next: check ingredients" })).toHaveCount(0);
    await expect(meal.getByRole("button", { name: "Save without the check" })).toHaveCount(0);
    await meal.getByRole("button", { name: "Save", exact: true }).click();
    await expect(meal).toBeHidden({ timeout: 20000 });
    await expect(page.getByText("Meal saved.")).toBeVisible();
    const state = (await api("GET", "/v1/me/state")).body;
    const day = (await api("GET", `/v1/days/${state.today.date}`)).body;
    expect(day.meals.map((m: { dish_text: string; ai_check_status: string }) => `${m.dish_text}:${m.ai_check_status}`)).toEqual(["beta soup:not_requested"]);
    // You: no "Keep my meal photos" when there is no photo check. Upgrade: no recalled-meals offer request.
    await page.goto("/me");
    await expect(page.getByText("Keep an eye on it mode")).toBeVisible(); // the Pro card has loaded
    await expect(page.getByText("Keep my meal photos")).toHaveCount(0);
  });

  test("AI off, Free: the meal sheet and the Pro page do not advertise the AI check", async ({ context }) => {
    const { page } = await account(context);
    await switchedOff(page, AI_OFF);
    await page.goto("/today");
    await page.getByRole("button", { name: "Add meal" }).click();
    const meal = page.getByRole("dialog", { name: "Add meal" });
    await expect(meal.getByLabel("What did you have?")).toBeVisible();
    await expect(meal.getByText("Photo and ingredient check")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(meal).toBeHidden();
    await page.waitForTimeout(300); // the sheet's history entry is undone as it closes
    await page.goto("/upgrade");
    await expect(page.getByText(/Possible triggers, with day counts/)).toBeVisible(); // the list has loaded; non-AI Pro features stay listed
    await expect(page.getByText(/Ingredient check for typed dishes and photos/)).toHaveCount(0);
  });

  test("Learn and daily cards off: no Learn row in You and no Learn line on the Pro page", async ({ context }) => {
    const { page } = await account(context);
    await switchedOff(page, ["learn_library", "daily_cards"]);
    await page.goto("/me");
    await expect(page.getByText("Doctor PDF")).toBeVisible(); // the Pro rows have loaded, and the other rows stay
    await expect(page.getByText("Learn library")).toHaveCount(0);
    await page.goto("/upgrade");
    await expect(page.getByText(/Possible triggers, with day counts/)).toBeVisible(); // the list has loaded
    await expect(page.getByText(/One card a day and the Learn library/)).toHaveCount(0);
  });

  test("control: with nothing switched off, the AI check, photo and Learn row are offered as before", async ({ context }) => {
    const { page } = await account(context, { pro: true });
    await page.goto("/today");
    await page.getByRole("button", { name: "Add meal" }).click();
    const meal = page.getByRole("dialog", { name: "Add meal" });
    await expect(meal.getByRole("button", { name: /Take a photo/ })).toBeVisible();
    await meal.getByLabel("What did you have?").fill("control soup");
    await expect(meal.getByRole("button", { name: "Next: check ingredients" })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Close without saving" }).click();
    await expect(meal).toBeHidden();
    await page.waitForTimeout(300); // the sheet's history entry is undone as it closes
    await page.goto("/me");
    await expect(page.getByText("Keep an eye on it mode")).toBeVisible();
    await expect(page.getByText("Learn library")).toBeVisible();
    await expect(page.getByText("Keep my meal photos")).toBeVisible();
  });
});

test("A1: Pro given for testing shows no renewal and no Pause or Cancel; a bought plan still does", async ({ context }) => {
  // pro-tester@bloat.test is on the local server's Pro test list (.env.local).
  const { page } = await account(context, { email: "pro-tester@bloat.test" });
  await page.goto("/me");
  const plan = page.locator("section", { has: page.getByText("Plan", { exact: true }) });
  await expect(plan.getByText("Bloat Buddy Pro", { exact: true })).toBeVisible();
  await expect(plan.getByText("Switched on for testing. There is no subscription, so nothing renews and nothing is charged.")).toBeVisible();
  await expect(plan.getByText(/Renews on/)).toHaveCount(0);
  await expect(plan.getByRole("button", { name: "Pause Pro" })).toHaveCount(0);
  await expect(plan.getByRole("button", { name: "Cancel" })).toHaveCount(0);

  const bought = await account(context, { pro: true });
  await bought.page.goto("/me");
  const p2 = bought.page.locator("section", { has: bought.page.getByText("Plan", { exact: true }) });
  await expect(p2.getByText(/Renews on/)).toBeVisible();
  await expect(p2.getByRole("button", { name: "Pause Pro" })).toBeVisible();
});

test("A1, Pro page: Pro given for testing is not described as a subscription to manage; a bought plan still is", async ({ context }) => {
  // The Pro page (/upgrade) said "Manage, pause or cancel in Me." to an account with Pro given for
  // testing, although there is no subscription and You offers neither (found 27 Nov 2026).
  const { page } = await account(context, { email: "pro-tester@bloat.test" });
  await page.goto("/upgrade");
  await expect(page.getByRole("heading", { name: "You have Pro" })).toBeVisible();
  await expect(page.getByText("Switched on for testing. There is no subscription, so nothing renews and nothing is charged.")).toBeVisible();
  await expect(page.getByText(/pause or cancel/i)).toHaveCount(0);

  const bought = await account(context, { pro: true });
  await bought.page.goto("/upgrade");
  await expect(bought.page.getByRole("heading", { name: "You have Pro" })).toBeVisible();
  await expect(bought.page.getByText("Manage, pause or cancel in Me.")).toBeVisible();
});
