import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";

// External report, 23 Nov 2026:
//   B3: Patterns showed a backwards date range ("23 Nov to 22 Nov") for an account with no finished day.
//   B4: a day with a saved meal said "Nothing was logged and there is no review."

const HELP_VERSION = "nhs-bloating-2026-11-07";
type Api = (method: string, url: string, body?: unknown) => Promise<{ status: number; body: any }>;

function sql(query: string): string {
  return execFileSync("docker", ["exec", "supabase_db_bloat", "psql", "-U", "postgres", "-tAc", query], { encoding: "utf8" }).trim();
}

async function account(context: BrowserContext, pro: boolean): Promise<{ page: Page; api: Api; email: string; today: string }> {
  const page = await context.newPage();
  await page.goto("/");
  const email = `es-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
  expect((await page.request.post("/v1/auth/test-login", { data: { email, password: "synthetic-password-1", create: true } })).ok()).toBe(true);
  const api: Api = (method, url, body) => page.evaluate(async ({ method, url, body }) => {
    const r = await fetch(url, { method, headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store" });
    const text = await r.text();
    let parsed: unknown = null; try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
    return { status: r.status, body: parsed };
  }, { method, url, body });
  expect((await api("POST", "/v1/onboarding/commit", {
    age_18_or_older: "yes", country: "US", time_zone: "America/New_York", units: "us",
    help: { viewed_at: new Date().toISOString(), page_version: HELP_VERSION }, consents: ["terms_privacy", "health_data", "wellness_ack"],
    answers: [], medicines: [], followed: [],
  })).status).toBe(201);
  if (pro) expect((await api("POST", "/v1/billing/mock-purchase", { interval: "three_month" })).status).toBe(200);
  const today = (await api("GET", "/v1/me/state")).body.today.date as string;
  return { page, api, email, today };
}

// A range is backwards when its first date is after its last: "23 Nov to 22 Nov" or "Nov 23 to Nov 22".
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DATE = String.raw`(?:\d{1,2} [A-Z][a-z]{2}|[A-Z][a-z]{2} \d{1,2})`;
const RANGE = new RegExp(`(${DATE}) to (${DATE})`, "g");
const order = (d: string) => { const [x, y] = d.split(" ") as [string, string]; return /\d/.test(x) ? MONTHS.indexOf(y) * 100 + Number(x) : MONTHS.indexOf(x) * 100 + Number(y); };
function backwardsRanges(text: string): string[] {
  return [...text.matchAll(RANGE)].filter((m) => order(m[1]!) > order(m[2]!)).map((m) => m[0]);
}

test("B3: Patterns for an account with no finished day says so, with no backwards date range", async ({ context }) => {
  const { page } = await account(context, true);
  await page.goto("/insights");
  await expect(page.getByText("groups examined; differences can appear by chance.")).toBeVisible();
  await expect(page.getByText(/No finished days yet\./).first()).toBeVisible();
  expect(backwardsRanges(await page.locator("main").innerText())).toEqual([]);
});

test("B3: Your journey for an account with no finished day says so, with no backwards date range", async ({ context }) => {
  const { page } = await account(context, true);
  await page.goto("/journey");
  await expect(page.getByRole("heading", { name: "Your journey" })).toBeVisible();
  await expect(page.getByText(/No finished days yet\./).first()).toBeVisible();
  expect(backwardsRanges(await page.locator("main").innerText())).toEqual([]);
});

test("B3: once there are finished days, Patterns shows the range as before", async ({ context }) => {
  const { page, email } = await account(context, true);
  sql(`update public.profiles set created_at = now() - interval '10 days' where user_id = (select id from auth.users where email = '${email}')`);
  await page.goto("/insights");
  const caption = page.getByText("groups examined; differences can appear by chance.");
  await expect(caption).toBeVisible();
  await expect(caption).toContainText(new RegExp(`${DATE} to ${DATE}\\.`));
  await expect(page.getByText(/No finished days yet\./)).toHaveCount(0);
  expect(backwardsRanges(await page.locator("main").innerText())).toEqual([]);
});

test("B4: a day with a meal but no bloating says no bloating was logged, not that nothing was logged", async ({ context }) => {
  const { page, api, today } = await account(context, false);
  expect((await api("POST", "/v1/meals", { save_key: crypto.randomUUID(), dish_text: "es toast", eaten: { mode: "now" } })).status).toBe(201);
  await page.goto(`/day/${today}`);
  await expect(page.getByText("es toast")).toBeVisible();
  await expect(page.getByText("No bloating was logged and there is no review.")).toBeVisible();
  await expect(page.getByText("Nothing was logged and there is no review.")).toHaveCount(0);
});

test("B4: a day with nothing at all still says nothing was logged", async ({ context }) => {
  const { page, today } = await account(context, false);
  await page.goto(`/day/${today}`);
  await expect(page.getByText("Nothing was logged and there is no review.")).toBeVisible();
  await expect(page.getByText("Nothing logged this day")).toBeVisible();
});
