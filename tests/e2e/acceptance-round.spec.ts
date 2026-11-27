import { expect, test, type BrowserContext, type Page } from "@playwright/test";

// First invited acceptance round (owner's decision, 27 Nov 2026): experiments switched off with the
// existing feature switch. Screens must not offer or link to experiments; a direct visit says
// "Not available"; every other non-AI Pro screen still opens.
//
// Needs a local server started with the round's settings (the normal test server has nothing off):
//   BLOAT_AI_PROVIDER=off BLOAT_OFF_FEATURES=learn_library,daily_cards,experiments_habit,experiments_swap \
//     pnpm exec next start -p 3200
//   E2E_PORT=3200 pnpm exec playwright test tests/e2e/acceptance-round.spec.ts
// On a server without those settings every check here is skipped (the first step says why).

const HELP_VERSION = "nhs-bloating-2026-11-07";
const PASSWORD = "synthetic-password-1";

async function account(context: BrowserContext, pro: boolean): Promise<Page> {
  const page = await context.newPage();
  await page.goto("/");
  const email = `xoff-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
  expect((await page.request.post("/v1/auth/test-login", { data: { email, password: PASSWORD, create: true } })).ok()).toBe(true);
  const commit = await page.request.post("/v1/onboarding/commit", {
    headers: { "idempotency-key": crypto.randomUUID() },
    data: {
      age_18_or_older: "yes", country: "US", time_zone: "America/New_York", units: "us",
      help: { viewed_at: new Date().toISOString(), page_version: HELP_VERSION }, consents: ["terms_privacy", "health_data", "wellness_ack"],
      answers: [], medicines: [], followed: [],
    },
  });
  expect(commit.status()).toBe(201);
  if (pro) expect((await page.request.post("/v1/billing/mock-purchase", { headers: { "idempotency-key": crypto.randomUUID() }, data: { interval: "three_month" } })).status()).toBe(200);
  await requireOff(page);
  return page;
}

/** Skips (saying why) on a server that does not have experiments switched off. */
async function requireOff(page: Page) {
  const off: string[] = (await (await page.request.get("/v1/me/state")).json()).unavailable ?? [];
  test.skip(!off.includes("experiments_habit"), "This server has experiments switched on; start one with the round's settings (see the top of this file).");
}

test("Pro: Today, History, Patterns and Your journey do not link to experiments; a direct visit says Not available", async ({ context }) => {
  const page = await account(context, true);
  const experimentLinks = () => page.locator('a[href^="/experiments"]');

  await page.goto("/today");
  await expect(page.getByRole("button", { name: "I feel bloated" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Possible triggers" }).first()).toBeVisible(); // the Pro shortcuts are there
  await expect(experimentLinks()).toHaveCount(0);

  await page.goto("/history");
  await expect(page.getByRole("navigation", { name: "Reports" }).getByRole("link", { name: "Weekly report" })).toBeVisible();
  await expect(experimentLinks()).toHaveCount(0);

  await page.goto("/insights");
  await expect(page.getByRole("link", { name: "Your journey" })).toBeVisible();
  await expect(experimentLinks()).toHaveCount(0);
  await expect(page.getByText(/Try an experiment/)).toHaveCount(0);

  await page.goto("/journey");
  await expect(page.getByRole("heading", { name: "Your journey" })).toBeVisible();
  await expect(page.getByText("What you have tried")).toHaveCount(0);
  await expect(experimentLinks()).toHaveCount(0);

  for (const path of ["/experiments", "/experiments?start=eat_more_slowly", `/experiments/${crypto.randomUUID()}`]) {
    await page.goto(path);
    await expect(page.getByText("Not available", { exact: true }), path).toBeVisible();
    await expect(page.getByText("This isn't part of this version of Bloat Buddy.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to Today" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Choose" })).toHaveCount(0);
  }
});

test("Pro: the other non-AI Pro screens still open", async ({ context }) => {
  const page = await account(context, true);
  const screens: Array<[string, RegExp | string]> = [
    ["/insights", "Possible triggers"], ["/journey", "Your journey"], ["/report", "Weekly report"], ["/doctor", "Doctor report"],
    ["/health", "Health background"], ["/me", "You"],
  ];
  for (const [path, heading] of screens) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading, exact: typeof heading === "string" }).first(), path).toBeVisible();
    await expect(page.getByText("Not available", { exact: true }), path).toHaveCount(0);
    await expect(page.getByText("This is part of Bloat Buddy Pro."), path).toHaveCount(0);
  }
  await page.goto("/today");
  await expect(page.getByRole("button", { name: "Log bowel movement" })).toBeVisible();
  await page.getByRole("button", { name: "Add activity" }).click();
  await expect(page.getByRole("button", { name: "Log a walk or exercise in detail" })).toBeVisible();
});

test("Free and signed out: the Pro page and the start page do not list experiments or the ingredient check", async ({ context }) => {
  const page = await account(context, false);
  await page.goto("/upgrade");
  await expect(page.getByText("Possible triggers, with day counts on every result")).toBeVisible();
  await expect(page.getByText("Habit and food-swap experiments")).toHaveCount(0);
  await expect(page.getByText(/Ingredient check/)).toHaveCount(0);

  const visitor = await context.browser()!.newPage();
  await visitor.goto(page.url().replace(/\/upgrade.*$/, "/"));
  await expect(visitor.getByRole("heading", { name: "Patterns in your records", exact: true })).toBeVisible();
  await expect(visitor.getByText(/experiments/i)).toHaveCount(0);
  await expect(visitor.getByText("Ingredient check and saved dishes")).toHaveCount(0);
  await visitor.close();
});
