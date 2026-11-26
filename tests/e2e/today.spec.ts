import { expect, test, type BrowserContext, type Locator, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";

// Today and logging review (26 Nov 2026). LOCAL stack, synthetic accounts only.
//
// T1  A save on Today said nothing: the sheet closed and, on a phone, the new entry was below the fold.
//     The plan's wording is "Meal saved." and "Noted: no bloating so far today.". Each save started on
//     Today now says what was saved, next to where it was started, in a status line screen readers announce.
// T2  "No bloating so far today", an experiment answer and "Not useful" remove their own button once
//     saved, and keyboard focus fell back to the page (the same kind of defect as K1). Focus now moves to
//     the control that takes its place.
// T3  After "No bloating so far today" the score read "0 / 10" on screen but "Nothing logged yet" to a
//     screen reader.
// T4  With "Earlier" or "Choose time" picked and the date field emptied, Save stayed on and the server
//     answered only "Some answers were not valid.". Save now waits for a time and the field says why.

const HELP_VERSION = "nhs-bloating-2026-11-07";
const PASSWORD = "synthetic-password-1";
type Api = (method: string, url: string, body?: unknown, at?: string) => Promise<{ status: number; body: any }>;
type Ctx = { page: Page; api: Api; email: string; today: string };

function sql(query: string): string {
  return execFileSync("docker", ["exec", "supabase_db_bloat", "psql", "-U", "postgres", "-tAc", query], { encoding: "utf8" }).trim();
}

async function account(context: BrowserContext, pro = false): Promise<Ctx> {
  const page = await context.newPage();
  await page.goto("/");
  const email = `today-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
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
    answers: [], medicines: [], followed: [],
  })).status).toBe(201);
  if (pro) expect((await api("POST", "/v1/billing/mock-purchase", { interval: "three_month" })).status).toBe(200);
  const today = (await api("GET", "/v1/me/state")).body.today.date as string;
  return { page, api, email, today };
}

const userId = (c: Ctx) => sql(`select id from auth.users where email = '${c.email}'`);
const pastDay = (c: Ctx, k: number) => new Date(Date.parse(`${c.today}T12:00:00Z`) - k * 86_400_000).toISOString().slice(0, 10);

/** The status line under "I feel bloated" (bloating) or under the Add to today buttons (add). */
const notice = (page: Page, where: "bloating" | "add") =>
  page.locator("section", { has: where === "add" ? page.getByRole("heading", { name: "Add to today" }) : page.getByText("Highest logged so far") }).getByRole("status").last();

/** Press Tab (or Shift+Tab) until the target has focus. */
async function tabTo(page: Page, target: Locator, max = 80) {
  await expect(target).toHaveCount(1);
  for (const key of ["Tab", "Shift+Tab"]) {
    for (let i = 0; i < max; i++) {
      if (await target.evaluate((el) => el === document.activeElement)) return;
      await page.keyboard.press(key);
    }
  }
  throw new Error(`Not reachable with Tab or Shift+Tab: ${target}`);
}
const focusedName = async (page: Page) => page.evaluate(() => { const el = document.activeElement as HTMLElement | null; return el && el !== document.body ? (el.getAttribute("aria-label") ?? el.textContent ?? "").trim() : "BODY"; });

test.describe("T1: every save started on Today says what was saved", () => {
  test("Free: bloating, a strength reading, a meal and an activity", async ({ context }) => {
    const c = await account(context);
    const { page } = c;
    await page.goto("/today");
    await page.getByRole("button", { name: "I feel bloated" }).click();
    const log = page.getByRole("dialog", { name: "Log bloating" });
    await log.getByRole("radio", { name: "5", exact: true }).click();
    await log.getByRole("button", { name: "Save" }).click();
    await expect(log).toBeHidden({ timeout: 20000 });
    await expect(notice(page, "bloating")).toHaveText("Bloating saved.");

    // A new reading: "Saved" stays in the sheet after the reading form closes.
    await page.getByRole("button", { name: /Bloating ongoing/ }).click();
    const now = page.getByRole("dialog", { name: "Bloating now" });
    await now.getByRole("button", { name: "Update strength" }).click();
    await now.getByRole("radio", { name: "7", exact: true }).click();
    await now.getByRole("button", { name: "Save reading" }).click();
    await expect(now.getByRole("button", { name: "Update strength" })).toBeVisible({ timeout: 20000 });
    await expect(now.getByText("Saved", { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(now).toBeHidden();

    // Opening another sheet clears the earlier message, so it never describes the wrong save.
    await page.getByRole("button", { name: "Add meal" }).click();
    const meal = page.getByRole("dialog", { name: "Add meal" });
    await meal.getByLabel("What did you have?").fill("toast with butter");
    await meal.getByRole("button", { name: "Save" }).click();
    await expect(meal).toBeHidden({ timeout: 20000 });
    await expect(notice(page, "add")).toHaveText("Meal saved.");
    await expect(notice(page, "bloating")).toHaveText("");

    await page.getByRole("button", { name: "Add activity" }).click();
    const act = page.getByRole("dialog", { name: "Add activity" });
    await act.getByRole("checkbox", { name: "Ate quickly" }).click();
    await act.getByRole("button", { name: "Save", exact: true }).click();
    await expect(act).toBeHidden({ timeout: 20000 });
    await expect(notice(page, "add")).toHaveText("Activity saved.");
    // The message is not shown before the server confirms: reload shows the saved records, no message.
    await page.reload();
    await expect(page.getByText("toast with butter")).toBeVisible();
    await expect(notice(page, "add")).toHaveText("");
  });

  test("Pro: a bowel movement and exercise", async ({ context }) => {
    const { page } = await account(context, true);
    await page.goto("/today");
    await page.getByRole("button", { name: "Log bowel movement" }).click();
    const bowel = page.getByRole("dialog", { name: "Log bowel movement" });
    await bowel.getByRole("button", { name: "Save" }).click();
    await expect(bowel).toBeHidden({ timeout: 20000 });
    await expect(notice(page, "add")).toHaveText("Bowel movement saved.");

    await page.getByRole("button", { name: "Add activity" }).click();
    await page.getByRole("dialog", { name: "Add activity" }).getByRole("button", { name: "Log a walk or exercise in detail" }).click();
    const ex = page.getByRole("dialog", { name: "Log exercise" });
    await ex.getByRole("radio", { name: "Walking", exact: true }).click(); // EX-01
    await ex.getByRole("radio", { name: "20 min", exact: true }).click(); // EX-03
    await ex.getByRole("button", { name: "Save" }).click();
    await expect(ex).toBeHidden({ timeout: 20000 });
    await expect(notice(page, "add")).toHaveText("Exercise saved.");
  });
});

test.describe("T2 and T3: inline saves on Today keep keyboard focus; the score reads the same to everyone", () => {
  test.use({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false });

  test("No bloating so far today: focus moves to I feel bloated, the save is announced, and the score reads 0 out of 10", async ({ context }) => {
    const { page } = await account(context);
    await page.goto("/today");
    const score = page.locator("p.t-score");
    await expect(score).toHaveAttribute("aria-label", "Nothing logged yet");
    await tabTo(page, page.getByRole("button", { name: "No bloating so far today" }));
    await page.keyboard.press("Enter");
    await expect(page.getByText("No bloating so far", { exact: true })).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole("button", { name: "I feel bloated" })).toBeFocused();
    await expect(notice(page, "bloating")).toHaveText("Noted: no bloating so far today.");
    await expect(score).toHaveAttribute("aria-label", "0 out of 10");
    await expect(page.getByRole("img", { name: "0 out of 10" })).toHaveText("0/ 10");
  });

  test("experiment answer: focus moves to Open experiment", async ({ context }) => {
    const c = await account(context, true);
    // Local fixture: the account started 10 days ago and the last 4 days have confirmed reviews.
    sql(`update public.profiles set created_at = now() - interval '10 days' where user_id = '${userId(c)}'`);
    for (let k = 1; k <= 4; k++) {
      const d = pastDay(c, k);
      const nextNoon = new Date(Date.parse(`${d}T12:00:00Z`) + 86_400_000 + 4 * 3_600_000).toISOString();
      expect((await c.api("PUT", `/v1/days/${d}/review`, { worst: 0, whole_day: "yes" }, nextNoon)).status).toBeLessThan(300);
    }
    expect((await c.api("POST", "/v1/experiments", { key: "eat_more_slowly" })).status).toBeLessThan(300);
    await c.page.goto("/today");
    await tabTo(c.page, c.page.getByRole("button", { name: "Partly", exact: true }));
    await c.page.keyboard.press("Enter");
    await expect(c.page.getByText("Today's answer is saved.")).toBeVisible({ timeout: 20000 });
    await expect(c.page.getByRole("link", { name: "Open experiment" })).toBeFocused();
  });

  test("Not useful: focus never falls back to the page", async ({ context }) => {
    const c = await account(context, true);
    // Local fixture: a habit that is not followed, tapped on 6 days, so Today suggests following it.
    sql(`update public.profiles set created_at = now() - interval '10 days' where user_id = '${userId(c)}'`);
    for (let k = 1; k <= 6; k++) {
      const d = pastDay(c, k);
      expect((await c.api("PUT", `/v1/days/${d}/activities`, { taps: [{ activity_id: "ACT-03" }] }, new Date(`${d}T20:00:00-05:00`).toISOString())).status).toBeLessThan(300);
    }
    await c.page.goto("/today");
    await expect(c.page.getByText("Next best log")).toBeVisible();
    await tabTo(c.page, c.page.getByRole("button", { name: "Not useful" }));
    await c.page.keyboard.press("Enter");
    await expect(c.page.getByText("Next best log")).toHaveCount(0, { timeout: 20000 });
    await c.page.waitForTimeout(2500); // the replacement never comes: the screen title takes focus
    expect(await focusedName(c.page)).not.toBe("BODY");
    await expect(c.page.getByRole("heading", { level: 1 })).toBeFocused();
  });
});

test.describe("T4: a typed time that is empty cannot be sent, and the field says why", () => {
  test("Log bloating, Add meal and editing a meal on the day screen", async ({ context }) => {
    const c = await account(context);
    const { page } = c;
    await page.goto("/today");
    await page.getByRole("button", { name: "I feel bloated" }).click();
    const log = page.getByRole("dialog", { name: "Log bloating" });
    await log.getByRole("radio", { name: "4", exact: true }).click();
    await log.getByRole("radio", { name: "Earlier" }).click();
    await log.locator('input[type="datetime-local"]').fill("");
    await expect(log.getByText("Choose a date and time to save.")).toBeVisible();
    await expect(log.getByRole("button", { name: "Save" })).toBeDisabled();
    await log.getByRole("radio", { name: "Now" }).click();
    await expect(log.getByRole("button", { name: "Save" })).toBeEnabled();
    await log.getByRole("button", { name: "Close", exact: true }).click();
    await page.getByRole("button", { name: "Close without saving" }).click();
    await expect(log).toBeHidden();

    await page.getByRole("button", { name: "Add meal" }).click();
    const meal = page.getByRole("dialog", { name: "Add meal" });
    await meal.getByLabel("What did you have?").fill("soup");
    await meal.getByRole("radio", { name: "Choose time" }).click();
    await meal.locator('input[type="datetime-local"]').fill("");
    await expect(meal.getByText("Choose a date and time to save.")).toBeVisible();
    await expect(meal.getByRole("button", { name: "Save" })).toBeDisabled();
    await meal.getByRole("radio", { name: "Now" }).click();
    await meal.getByRole("button", { name: "Save" }).click();
    await expect(meal).toBeHidden({ timeout: 20000 });

    await page.goto(`/day/${c.today}`);
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    const edit = page.getByRole("dialog", { name: "Edit meal" });
    await edit.getByRole("radio", { name: "Choose time" }).click();
    await edit.locator('input[type="datetime-local"]').fill("");
    await expect(edit.getByText("Choose a date and time to save.")).toBeVisible();
    await expect(edit.getByRole("button", { name: "Save changes" })).toBeDisabled();
  });
});
