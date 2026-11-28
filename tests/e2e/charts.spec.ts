import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";

// The chart system (owner, 28 Nov 2026: "master my app in charts and graphs and all patterns diagrams";
// DECISIONS.md choice 36). Charts show only what the server already works out, every chart has its
// numbers in text or a table twin, Hide charts hides them, and charts are Pro. LOCAL stack, synthetic
// accounts only; past days are logged through the real API with the test clock.

const HELP_VERSION = "nhs-bloating-2026-11-07";
const PASSWORD = "synthetic-password-1";
type Api = (method: string, url: string, body?: unknown, at?: string) => Promise<{ status: number; body: any }>;
type Ctx = { page: Page; api: Api; email: string; today: string };

const sql = (q: string) => execFileSync("docker", ["exec", "supabase_db_bloat", "psql", "-U", "postgres", "-tAc", q], { encoding: "utf8" }).trim();
const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const atNY = (date: string, time: string) => new Date(`${date}T${time}:00-05:00`).toISOString();

async function account(context: BrowserContext, pro = true): Promise<Ctx> {
  const page = await context.newPage();
  await page.goto("/");
  const email = `charts-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
  expect((await page.request.post("/v1/auth/test-login", { data: { email, password: PASSWORD, create: true } })).ok()).toBe(true);
  const api: Api = (method, url, body, at) => page.evaluate(async ({ method, url, body, at }) => {
    const headers: Record<string, string> = { "content-type": "application/json", "idempotency-key": crypto.randomUUID() };
    if (at) headers["x-bloat-test-now"] = at;
    const r = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store" });
    return { status: r.status, body: await r.json().catch(() => null) };
  }, { method, url, body, at });
  expect((await api("POST", "/v1/onboarding/commit", {
    age_18_or_older: "yes", country: "US", time_zone: "America/New_York", units: "us",
    help: { viewed_at: new Date().toISOString(), page_version: HELP_VERSION }, consents: ["terms_privacy", "health_data", "wellness_ack"],
    answers: [], medicines: [], followed: ["ACT-01"],
  })).status).toBe(201);
  if (pro) expect((await api("POST", "/v1/billing/mock-purchase", { interval: "three_month" })).status).toBe(200);
  sql(`update public.profiles set created_at = now() - interval '30 days' where user_id = (select id from auth.users where email = '${email}')`);
  const today = (await api("GET", "/v1/me/state")).body.today.date as string;
  return { page, api, email, today };
}

/** One finished day: bloating with a strength, the habit answered, and the next morning's review. */
async function logDay(c: Ctx, date: string, score: number, ateQuickly: boolean, reviewDaysLater = 1) {
  const evening = atNY(date, "23:30");
  const s = await c.api("POST", "/v1/episodes", { strength: score, started: { mode: "exact", local: `${date}T13:10`, zone: "America/New_York" } }, evening);
  expect(s.status, JSON.stringify(s.body)).toBe(201);
  expect((await c.api("POST", `/v1/episodes/${s.body.episode.id}/end`, { ended: { mode: "exact", local: `${date}T14:40`, zone: "America/New_York" } }, evening)).status).toBe(200);
  const r = await c.api("PUT", `/v1/days/${date}/review`, { worst: score, whole_day: "yes", food_coverage: "all", habits: { "ACT-01": ateQuickly ? "yes" : "no" } }, atNY(addDays(date, reviewDaysLater), "08:00"));
  expect(r.status, JSON.stringify(r.body)).toBe(200);
}

test.describe("charts", () => {
  test("Patterns and Your journey: with and without bars, the halves check, the trend and coverage; Hide charts keeps the numbers", async ({ context }) => {
    test.setTimeout(120_000);
    const c = await account(context);
    for (let k = 14; k >= 1; k--) await logDay(c, addDays(c.today, -k), k % 2 ? 7 : 2, k % 2 === 1);

    await c.page.goto("/insights");
    const bars = c.page.getByRole("list", { name: "Average Bloat Score with and without Ate quickly" });
    await expect(bars).toBeVisible({ timeout: 20000 });
    await expect(bars.getByRole("listitem")).toHaveCount(2);
    await expect(bars.getByRole("listitem").first()).toContainText("7.0 · 7 days");
    await expect(bars.getByRole("listitem").last()).toContainText("2.0 · 7 days");
    await expect(c.page.getByText("Difference in each half of the period")).toBeVisible();
    await expect(c.page.getByText("Both halves point the same way.")).toBeVisible();

    await c.page.goto("/journey");
    await expect(c.page.getByRole("img", { name: /Weekly average Bloat Score/ })).toBeVisible({ timeout: 20000 });
    await expect(c.page.getByRole("img", { name: /^Your finished days: Confirmed 14/ })).toBeVisible();
    await c.page.getByRole("button", { name: "Show as a table" }).first().click();
    await expect(c.page.getByRole("table", { name: "Weekly average Bloat Score" })).toBeVisible();

    // Hide charts (You): the charts go, every number stays as text.
    expect((await c.api("PATCH", "/v1/me/profile", { hide_charts: true })).status).toBeLessThan(300);
    await c.page.goto("/insights");
    await expect(c.page.getByText(/Average 7\.0 on 7 days with, 2\.0 on 7 days without/)).toBeVisible({ timeout: 20000 });
    await expect(c.page.getByRole("list", { name: "Average Bloat Score with and without Ate quickly" })).toHaveCount(0);
    await expect(c.page.getByText("Difference in each half of the period")).toHaveCount(0);
    await c.page.goto("/journey");
    await expect(c.page.getByText("Days tracked")).toBeVisible({ timeout: 20000 });
    await expect(c.page.getByRole("img", { name: /Weekly average Bloat Score/ })).toHaveCount(0);
  });

  test("History: the month calendar prints each day's number, rings today and marks a late review; the table twin and the chart's details work", async ({ context }) => {
    const c = await account(context);
    await logDay(c, addDays(c.today, -6), 6, true);
    await logDay(c, addDays(c.today, -5), 3, false, 3); // reviewed three days later: a late review
    await c.page.goto("/history");
    const cal = c.page.getByRole("list", { name: /^Days in / });
    await expect(cal).toBeVisible({ timeout: 20000 });
    // Early in a month the two days can sit in the month before: step back once if needed.
    if (await cal.getByRole("link", { name: /: Bloat Score 6$/ }).count() === 0) await c.page.getByRole("button", { name: "Previous month" }).click();
    await expect(cal.getByRole("link", { name: /: Bloat Score 6$/ })).toHaveCount(1);
    const late = cal.getByRole("link", { name: /: Bloat Score 3, late review$/ });
    await expect(late).toHaveCount(1);
    await expect(late.locator("svg")).toHaveCount(1); // the small clock
    // The table twin: one tap away, a real table.
    const card = cal.locator("xpath=..");
    await card.getByRole("button", { name: "Show as a table" }).click();
    await expect(card.getByRole("table")).toContainText("Late review");
    await card.getByRole("button", { name: "Hide the table" }).click();
    await expect(card.getByRole("table")).toHaveCount(0);
    // The daily chart: pointing at a day shows its details card.
    const plot = c.page.getByRole("img", { name: /^Daily Bloat Score for/ });
    const marks = plot.locator(".recharts-bar-rectangle path");
    await expect(marks).toHaveCount(2); // the two finished days; days without a score are a "?", not a bar
    await marks.first().hover();
    await expect(c.page.locator(".recharts-tooltip-wrapper")).toContainText("Confirmed");
    // Tapping a bar names the day and links to it.
    await marks.first().click();
    await expect(c.page.getByRole("status").filter({ hasText: "Bloat Score 6" })).toContainText("Open this day");
  });

  test("Day: the day at a glance draws the day's entries for Pro, and is not offered on Free", async ({ context, browser }) => {
    const c = await account(context);
    const y = addDays(c.today, -1);
    await logDay(c, y, 5, true);
    expect((await c.api("POST", "/v1/meals", { save_key: crypto.randomUUID(), dish_text: "Sample lunch", eaten: { mode: "exact", local: `${y}T12:30`, zone: "America/New_York" } }, atNY(y, "23:00"))).status).toBe(201);
    await c.page.goto(`/day/${y}`);
    const glance = c.page.getByRole("img", { name: /^The day from midnight to midnight: Bloating 1, Meals 1/ });
    await expect(glance).toBeVisible({ timeout: 20000 });
    await c.page.getByRole("region", { name: "The day at a glance" }).getByRole("button", { name: "Show as a table" }).click();
    await expect(c.page.getByRole("table", { name: "This day's entries in time order" })).toContainText("Sample lunch");

    const freeCtx = await browser.newContext();
    const f = await account(freeCtx, false);
    await logDay(f, y, 5, true);
    await f.page.goto(`/day/${y}`);
    await expect(f.page.getByRole("heading", { name: "Bloating", exact: true })).toBeVisible({ timeout: 20000 });
    await expect(f.page.getByText("The day at a glance")).toHaveCount(0);
    await freeCtx.close();
  });

  test("How it works: the comparison diagram's sample numbers are exact", async ({ page }) => {
    await page.goto("/how-bloat-works");
    const fig = page.getByRole("figure").filter({ hasText: "How a comparison works" });
    await expect(fig).toBeVisible();
    await expect(fig.getByRole("list", { name: "14 sample days" }).getByRole("listitem")).toHaveCount(14);
    await expect(fig).toContainText("6.0 − 3.0 = +3.0");
    await expect(fig).toContainText("First half +3.0 · second half +3.0");
    await expect(fig).toContainText("not proof that the habit caused anything");
  });
});
