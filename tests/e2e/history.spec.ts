import { expect, test, type BrowserContext, type Page } from "@playwright/test";

// History and editing review (26 Nov 2026). LOCAL stack, synthetic accounts only.
//
// H1  A habit answer could not be corrected anywhere: the day screen listed habits with no Edit or
//     Delete (plan screen 27: "Edit / Delete on each item"), and Add activity can only add. A wrong tap
//     stayed a "Yes" in comparisons for good. The day screen now has Delete on each habit; the answer
//     becomes unknown, never "No".

const HELP_VERSION = "nhs-bloating-2026-11-07";
type Api = (method: string, url: string, body?: unknown) => Promise<{ status: number; body: any }>;

async function account(context: BrowserContext): Promise<{ page: Page; api: Api; today: string }> {
  const page = await context.newPage();
  await page.goto("/");
  const email = `history-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
  expect((await page.request.post("/v1/auth/test-login", { data: { email, password: "synthetic-password-1", create: true } })).ok()).toBe(true);
  const api: Api = (method, url, body) => page.evaluate(async ({ method, url, body }) => {
    const r = await fetch(url, { method, headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store" });
    return { status: r.status, body: await r.json().catch(() => null) };
  }, { method, url, body });
  expect((await api("POST", "/v1/onboarding/commit", {
    age_18_or_older: "yes", country: "US", time_zone: "America/New_York", units: "us",
    help: { viewed_at: new Date().toISOString(), page_version: HELP_VERSION }, consents: ["terms_privacy", "health_data", "wellness_ack"],
    answers: [], medicines: [], followed: [],
  })).status).toBe(201);
  const today = (await api("GET", "/v1/me/state")).body.today.date as string;
  return { page, api, today };
}

test("H1: a habit tapped by mistake can be deleted on the day screen, and it becomes unknown, not No", async ({ context }) => {
  const { page, api, today } = await account(context);
  expect((await api("PUT", `/v1/days/${today}/activities`, { taps: [{ activity_id: "ACT-01" }, { activity_id: "ACT-03" }] })).status).toBe(200);
  await page.goto(`/day/${today}`);
  const habits = page.locator("section", { has: page.getByRole("heading", { name: "Habits" }) });
  await expect(habits.getByText("Ate quickly")).toBeVisible();
  await habits.getByRole("button", { name: "Delete Ate quickly" }).click();
  const confirm = page.getByRole("dialog", { name: "Delete this?" });
  await expect(confirm.getByText("It becomes unknown, not No.")).toBeVisible();
  await confirm.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(confirm).toBeHidden({ timeout: 20000 });
  await expect(habits.getByText("Ate quickly")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Habits" })).toBeVisible();
  await expect(page.getByText("Ate quickly")).toHaveCount(0);
  // Removed, not turned into "No": the record is gone and the other habit stays.
  const day = (await api("GET", `/v1/days/${today}`)).body;
  expect(day.activities.map((a: { activity_id: string; answer: string }) => `${a.activity_id}:${a.answer}`)).toEqual(["ACT-03:yes"]);
});
