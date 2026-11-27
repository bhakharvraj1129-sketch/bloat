import { expect, test, type Page } from "@playwright/test";
import { account, PASSWORD, sessionFor } from "./session";
import { zoneLabel } from "../../src/lib/regions";

// The four defects from the external report of 23 Nov 2026, checked on the PUBLIC preview with one
// synthetic account (role "pro") whose Bloat Buddy time zone is Asia/Kolkata, in a browser whose time zone
// is America/Los_Angeles: the same mismatch the report used. Needs the run's synthetic accounts.
//   B1: changing only a meal's name saves, and the saved time stays exactly the same
//   B2: "Keep" is chosen and keeps the saved time
//   B3: Patterns with no finished day: no backwards date range
//   B4: a day with only a meal says no bloating was logged
const BASE = process.env.HOSTED_URL!;
const HELP_VERSION = "nhs-bloating-2026-11-07";
const ZONE = "Asia/Kolkata";
test.use({ timezoneId: "America/Los_Angeles" });

const localIn = (ms: number, zone: string) => new Date(ms).toLocaleString("sv-SE", { timeZone: zone }).replace(" ", "T").slice(0, 16);
const api = (page: Page, method: string, url: string, body?: unknown) => page.evaluate(async ({ method, url, body }) => {
  const r = await fetch(url, { method, headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store" });
  return { status: r.status, body: await r.json().catch(() => null) };
}, { method, url, body });

test("hosted: the four reported defects are fixed (phone in Los Angeles, account in India)", async ({ page }) => {
  test.skip(!PASSWORD, "needs the run's synthetic accounts");
  // Set the new account up through the app's API, with the India time zone.
  const { token } = await sessionFor("pro");
  const setup = await fetch(`${BASE}/v1/onboarding/commit`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
    body: JSON.stringify({
      age_18_or_older: "yes", country: "IN", time_zone: ZONE, units: "metric",
      help: { viewed_at: new Date().toISOString(), page_version: HELP_VERSION }, consents: ["terms_privacy", "health_data", "wellness_ack"],
      answers: [], medicines: [], followed: [],
    }),
  });
  expect(setup.status, "account set up").toBe(201);

  // Sign in through the app's own form, as a person does.
  await page.goto("/sign-in", { waitUntil: "load" });
  await page.getByLabel("Email").fill(account("pro"));
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible({ timeout: 30000 });
  const state = (await api(page, "GET", "/v1/me/state")).body;
  const today = state.today.date as string;

  // B3: Patterns on the first day.
  await page.goto("/insights");
  const caption = page.getByText("groups examined; differences can appear by chance.");
  await expect(caption).toBeVisible({ timeout: 30000 });
  await expect(caption).toContainText("No finished days yet.");
  await expect(caption).not.toContainText(" to ");

  // B4: a day with only a meal.
  const meal = await api(page, "POST", "/v1/meals", { save_key: crypto.randomUUID(), dish_text: "SYNTHETIC hosted fix check toast", eaten: { mode: "now" } });
  expect(meal.status).toBe(201);
  const id = meal.body.meal.id as string;
  const savedAt = async (day = today) => ((await api(page, "GET", `/v1/days/${day}`)).body.meals as Array<{ id: string; eaten_at: string; dish_text: string }>).find((m) => m.id === id)!;
  const before = await savedAt();
  await page.goto(`/day/${today}`);
  await expect(page.getByText("SYNTHETIC hosted fix check toast")).toBeVisible();
  await expect(page.getByText("No bloating was logged and there is no review.")).toBeVisible();
  await expect(page.getByText("Nothing was logged and there is no review.")).toHaveCount(0);

  // B1: change only the name.
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  let sheet = page.getByRole("dialog", { name: "Edit meal" });
  await sheet.getByLabel("What did you have?").fill("SYNTHETIC hosted fix check toast, renamed");
  await sheet.getByRole("button", { name: "Save changes" }).click();
  await expect(sheet).toBeHidden({ timeout: 20000 });
  const afterB1 = await savedAt();
  expect(afterB1.dish_text).toBe("SYNTHETIC hosted fix check toast, renamed");
  expect(afterB1.eaten_at, "B1: the saved time is unchanged").toBe(before.eaten_at);

  // B2: pick another time, then Keep: Keep is chosen and the saved time stays.
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  sheet = page.getByRole("dialog", { name: "Edit meal" });
  const keep = sheet.getByRole("radio", { name: "Keep" });
  await expect(keep).toHaveAttribute("aria-checked", "true");
  await sheet.getByRole("radio", { name: "Choose time" }).click();
  await expect(sheet.getByText(`Times here are in your Bloat Buddy time zone, ${zoneLabel(ZONE)}.`)).toBeVisible();
  await sheet.getByLabel("Date and time").fill(localIn(Date.now() - 3 * 3600_000, ZONE));
  await keep.click();
  await expect(keep).toHaveAttribute("aria-checked", "true");
  await sheet.getByLabel("What did you have?").fill("SYNTHETIC hosted fix check toast, kept");
  await sheet.getByRole("button", { name: "Save changes" }).click();
  await expect(sheet).toBeHidden({ timeout: 20000 });
  expect((await savedAt()).eaten_at, "B2: Keep kept the saved time").toBe(before.eaten_at);

  // An explicit new time is read in the account's zone.
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  sheet = page.getByRole("dialog", { name: "Edit meal" });
  await sheet.getByRole("radio", { name: "Choose time" }).click();
  const target = Date.now() - 2 * 3600_000;
  await sheet.getByLabel("Date and time").fill(localIn(target, ZONE));
  await sheet.getByRole("button", { name: "Save changes" }).click();
  await expect(sheet).toBeHidden({ timeout: 20000 });
  const moved = Date.parse((await savedAt(localIn(target, ZONE).slice(0, 10))).eaten_at);
  expect(localIn(moved, ZONE)).toBe(localIn(target, ZONE));
});
