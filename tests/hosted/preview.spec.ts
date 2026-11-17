import { expect, test, type BrowserContext, type Page } from "@playwright/test";

// These run against the HOSTED preview and the hosted bloat-test database, with synthetic
// @example.com accounts only. They are separate from the local suites on purpose.
const BASE = process.env.HOSTED_URL!;
const SHARE = process.env.HOSTED_SHARE_URL!;
const PASSWORD = "synthetic-password-1";
const stamp = Date.now();
const email = (tag: string) => `hosted-${tag}-${stamp}@example.com`;

test.beforeAll(() => {
  if (!BASE || !SHARE) throw new Error("Set HOSTED_URL and HOSTED_SHARE_URL");
});

/** An approved tester: the Vercel share link sets the access cookie for this browser. */
async function approved(context: BrowserContext): Promise<Page> {
  const page = await context.newPage();
  await page.goto(SHARE);
  await expect(page.getByRole("link", { name: "Get started" }).first()).toBeVisible({ timeout: 30000 });
  return page;
}

async function signUp(page: Page, who: string) {
  await page.goto("/start");
  await page.getByRole("radio", { name: "United States" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "I've read this" }).click();
  await page.getByLabel("Email").fill(who);
  await page.getByLabel("I am 18 or older").check();
  await page.getByLabel("Test password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in with test password" }).click();
  await expect(page.getByRole("heading", { name: "Consent" })).toBeVisible({ timeout: 30000 });
  for (const box of await page.getByRole("checkbox").all()) await box.check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("checkbox", { name: "This is right" }).click();
  for (let i = 0; i < 7; i++) await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Go to Today" }).click();
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible({ timeout: 30000 });
}

async function addMeal(page: Page, dish: string) {
  await page.getByRole("button", { name: "Add meal" }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByLabel("What did you have?").fill(dish);
  await sheet.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText(dish)).toBeVisible({ timeout: 20000 });
}

test("Priority 1a: a signed-out visitor meets Vercel deployment protection, not the app", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const first = await context.request.get(BASE, { maxRedirects: 0 });
  expect([302, 307, 401]).toContain(first.status());
  if (first.status() !== 401) expect(first.headers().location).toContain("vercel.com/sso-api");
  // In the browser the visitor is sent to Vercel's sign-in and never sees a Bloat screen.
  await page.goto(BASE).catch(() => {}); // the redirect target (vercel.com) is outside this test network
  expect(new URL(page.url()).host).not.toBe(new URL(BASE).host);
  await expect(page.getByText("Track your bloating")).toHaveCount(0);
  const api = await context.request.get(`${BASE}/v1/help?country=US`, { maxRedirects: 0 });
  expect(api.status()).not.toBe(200); // the API is behind the same wall
  await context.close();
});

test("Priority 1b: an approved synthetic user saves a meal and still sees it in History after a refresh", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await approved(context);
  await signUp(page, email("p1"));
  const dish = `Hosted dosa ${stamp}`;
  await addMeal(page, dish);
  await page.getByRole("link", { name: "History" }).click();
  await expect(page.getByRole("heading", { name: "History" })).toBeVisible();
  await expect(page.getByText("1 meal").first()).toBeVisible({ timeout: 20000 });
  await page.reload();
  await expect(page.getByText("1 meal").first()).toBeVisible({ timeout: 20000 });
  await page.getByText("· today").click();
  await expect(page.getByText(dish)).toBeVisible({ timeout: 20000 });
  await page.reload(); // the meal comes back from the hosted database, not from memory
  await expect(page.getByText(dish)).toBeVisible({ timeout: 20000 });
  await context.close();
});

test("Priority 2a: the diary flow on the hosted preview (bloating, warning sign, end, meal, review entry point, sign out and back in)", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await approved(context);
  const who = email("diary");
  await signUp(page, who);
  await page.getByRole("button", { name: "I feel bloated" }).click();
  const log = page.getByRole("dialog", { name: "Log bloating" });
  await log.getByRole("radio", { name: "6", exact: true }).click();
  await log.getByRole("checkbox", { name: "Vomiting", exact: true }).click();
  await expect(log.getByText("Contact a doctor today or go to urgent care.")).toBeVisible();
  await log.getByRole("button", { name: "Save" }).click();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("button", { name: /Bloating ongoing/ })).toBeVisible({ timeout: 20000 });
  await page.reload(); // the open episode survives a refresh
  await page.getByRole("button", { name: /Bloating ongoing/ }).click();
  await page.getByRole("dialog", { name: "Bloating now" }).getByRole("button", { name: "Bloating gone" }).click();
  const end = page.getByRole("dialog", { name: "Bloating ended" });
  await end.getByRole("button", { name: "Save" }).click();
  await expect(end.getByText(/Lasted/)).toBeVisible({ timeout: 20000 });
  await end.getByRole("button", { name: "Done" }).click();
  await addMeal(page, `Diary lunch ${stamp}`);
  // sign out, then sign back in with the same synthetic account: the records are still there
  await page.goto("/me");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 20000 });
  await page.goto("/today");
  await expect(page).toHaveURL(/sign-in/);
  await page.getByLabel("Email").fill(who);
  await page.getByLabel("Test password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in with test password" }).click();
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByText(`Diary lunch ${stamp}`)).toBeVisible({ timeout: 20000 });
  await expect(page.getByText(/1 episode/)).toBeVisible();
  await context.close();
});

test("Priority 2b: two synthetic accounts cannot see or change each other's records", async ({ browser }) => {
  const ctxA = await browser.newContext();
  const a = await approved(ctxA);
  await signUp(a, email("iso-a"));
  const secret = `Private meal A ${stamp}`;
  await addMeal(a, secret);
  const mine = await a.evaluate(async () => (await (await fetch("/v1/history", { cache: "no-store" })).json()).today as string);
  const dayA = await a.evaluate(async (d) => (await fetch(`/v1/days/${d}`, { cache: "no-store" })).json(), mine);
  const mealId = dayA.meals[0].id as string;
  expect(dayA.meals[0].dish_text).toBe(secret);

  const ctxB = await browser.newContext();
  const b = await approved(ctxB);
  await signUp(b, email("iso-b"));
  await b.goto("/history");
  await expect(b.getByRole("heading", { name: "History" })).toBeVisible();
  await expect(b.getByText("No days yet")).toBeVisible({ timeout: 20000 });
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
  expect(seen.file).not.toContain(secret); // B's own export holds nothing of A's
  // A's meal is untouched.
  await a.reload();
  const again = await a.evaluate(async (d) => (await fetch(`/v1/days/${d}`, { cache: "no-store" })).json(), mine);
  expect(again.meals.map((m: { dish_text: string }) => m.dish_text)).toEqual([secret]);
  await ctxA.close(); await ctxB.close();
});

test("Priority 2c: a doctor-report share link opens, then stops working once revoked (billing mocked)", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await approved(context);
  await signUp(page, email("share"));
  await page.goto("/upgrade");
  await page.getByRole("button", { name: "Mock purchase" }).click();
  await expect(page.getByRole("heading", { name: "You have Pro" })).toBeVisible({ timeout: 30000 });
  await page.goto("/doctor");
  await expect(page.getByRole("heading", { name: "Doctor report" })).toBeVisible();
  await page.getByLabel("Questions you want to ask your doctor").fill("Synthetic question for the hosted test");
  await page.getByRole("button", { name: "Preview report" }).click();
  await expect(page.getByText("Preview: page 1 summary")).toBeVisible({ timeout: 30000 });
  await page.getByLabel("Who is it for?").fill("Test doctor");
  await page.getByLabel("What is it for?").fill("Hosted test");
  await page.getByRole("checkbox").last().check();
  await page.getByRole("button", { name: "Create share link" }).click();
  await expect(page.getByText("Link ready")).toBeVisible({ timeout: 30000 });
  const link = (await page.locator("p.break-all").innerText()).trim();
  expect(link).toContain("/share/");
  // Open it in the same approved browser (the preview itself sits behind Vercel protection).
  const reader = await context.newPage();
  await reader.goto(link);
  await expect(reader.getByRole("heading", { name: "Bloating diary summary" })).toBeVisible({ timeout: 30000 });
  await expect(reader.getByText("Synthetic question for the hosted test")).toBeVisible();
  await page.getByRole("button", { name: "Revoke link" }).click();
  await expect(page.getByText("The link has been revoked.")).toBeVisible({ timeout: 20000 });
  await reader.reload();
  await expect(reader.getByRole("heading", { name: "This link no longer works" })).toBeVisible({ timeout: 30000 });
  await expect(reader.getByText("Synthetic question for the hosted test")).toHaveCount(0);
  await context.close();
});
