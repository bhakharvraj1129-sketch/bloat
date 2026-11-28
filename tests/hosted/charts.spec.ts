import { expect, test, type Page } from "@playwright/test";
import { account, PASSWORD } from "./session";

// The chart system (owner, 28 Nov 2026; DECISIONS.md choice 36) on the PUBLIC preview. Runs with the
// run's Pro test account (role "pro"), after reported-fixes, so nothing after it uses that account.
// Checks what only the deployed build can show: the charts render there, their table twins open,
// the day timeline draws today's entries, "Hide charts" in You hides them and keeps the numbers,
// and the How it works diagram's sample numbers. Synthetic, made-up entries only. The password is
// never printed.
const BASE = process.env.HOSTED_URL!;
const ZONE = "Asia/Kolkata";
test.beforeAll(() => { if (!BASE) throw new Error("Set HOSTED_URL"); });
test.describe.configure({ mode: "serial" });

const api = (page: Page, method: string, url: string, body?: unknown) => page.evaluate(async ({ method, url, body }) => {
  const r = await fetch(url, { method, headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store" });
  return { status: r.status, body: await r.json().catch(() => null) };
}, { method, url, body });

test("hosted: the How it works diagram shows one comparison with exact sample numbers", async ({ page }) => {
  await page.goto("/how-bloat-works");
  const fig = page.getByRole("figure").filter({ hasText: "How a comparison works" });
  await expect(fig).toBeVisible({ timeout: 30000 });
  await expect(fig.getByRole("list", { name: "14 sample days" }).getByRole("listitem")).toHaveCount(14);
  await expect(fig).toContainText("6.0 − 3.0 = +3.0");
  await expect(fig).toContainText("First half +3.0 · second half +3.0");
  await expect(fig).toContainText("not proof that the habit caused anything");
});

test("hosted: Pro charts render (day timeline, month calendar, daily chart, table twins) and Hide charts hides them", async ({ page }) => {
  test.skip(!PASSWORD, "needs the run's synthetic accounts");
  test.setTimeout(180_000);
  await page.goto("/sign-in", { waitUntil: "load" });
  await page.getByLabel("Email").fill(account("pro"));
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(/\/(today|setup)/, { timeout: 30000 });
  let st = (await api(page, "GET", "/v1/me/state")).body;
  if (!st.onboarded) {
    const r = await api(page, "POST", "/v1/onboarding/commit", {
      age_18_or_older: "yes", country: "IN", time_zone: ZONE, units: "metric",
      help: { viewed_at: new Date().toISOString(), page_version: "nhs-bloating-2026-11-07" }, consents: ["terms_privacy", "health_data", "wellness_ack"],
      answers: [], medicines: [], followed: [],
    });
    expect(r.status, JSON.stringify(r.body)).toBe(201);
    st = (await api(page, "GET", "/v1/me/state")).body;
  }
  expect(st.plan, "the run's Pro test account is Pro").toBe("pro");
  const today = st.today.date as string;
  if (st.profile?.hide_charts) expect((await api(page, "PATCH", "/v1/me/profile", { hide_charts: false })).status).toBeLessThan(300);

  // Today's made-up entries: a meal and a bloating record with one reading, ended at once.
  expect((await api(page, "POST", "/v1/meals", { save_key: crypto.randomUUID(), dish_text: "SYNTHETIC chart check lunch", eaten: { mode: "now" } })).status).toBe(201);
  const ep = await api(page, "POST", "/v1/episodes", { strength: 4, started: { mode: "now" } });
  expect(ep.status, JSON.stringify(ep.body)).toBe(201);
  expect((await api(page, "POST", `/v1/episodes/${ep.body.episode.id}/end`, { ended: { mode: "now" } })).status).toBe(200);

  // The day at a glance (Pro): a 24-hour picture with its table twin.
  await page.goto(`/day/${today}`);
  const glance = page.getByRole("region", { name: "The day at a glance" });
  // At least these two entries (reported-fixes, run before this, also logs a meal today).
  await expect(glance.getByRole("img", { name: /^The day from midnight to midnight: Bloating [1-9]\d*, Meals [1-9]\d*/ })).toBeVisible({ timeout: 30000 });
  await glance.getByRole("button", { name: "Show as a table" }).click();
  await expect(glance.getByRole("table")).toContainText("SYNTHETIC chart check lunch");

  // History: the daily chart and the month calendar, today ringed and labelled.
  await page.goto("/history");
  const cal = page.getByRole("list", { name: /^Days in / });
  await expect(cal).toBeVisible({ timeout: 30000 });
  await expect(cal.getByRole("link", { name: /: Highest logged 4, not confirmed$/ })).toHaveCount(1);
  await expect(page.getByRole("img", { name: /^Daily Bloat Score for/ })).toBeVisible();
  const card = cal.locator("xpath=..");
  await card.getByRole("button", { name: "Show as a table" }).click();
  await expect(card.getByRole("table")).toContainText("Not yet confirmed");

  // Hide charts, through You: the charts go, the numbers stay.
  await page.goto("/me");
  const hide = page.getByLabel("Hide charts");
  await hide.check();
  await expect.poll(async () => (await api(page, "GET", "/v1/me/state")).body.profile.hide_charts, { timeout: 30000 }).toBe(true);
  await page.goto("/history");
  await expect(page.getByText("7-day average")).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("list", { name: /^Days in / })).toHaveCount(0);
  await expect(page.getByRole("img", { name: /^Daily Bloat Score for/ })).toHaveCount(0);
  await page.goto(`/day/${today}`);
  await expect(page.getByText("SYNTHETIC chart check lunch").first()).toBeVisible({ timeout: 30000 });
  await expect(page.getByText("The day at a glance")).toHaveCount(0);

  // And back on.
  await page.goto("/me");
  await page.getByLabel("Hide charts").uncheck();
  await expect.poll(async () => (await api(page, "GET", "/v1/me/state")).body.profile.hide_charts, { timeout: 30000 }).toBe(false);
  await page.goto("/history");
  await expect(page.getByRole("list", { name: /^Days in / })).toBeVisible({ timeout: 30000 });
});
