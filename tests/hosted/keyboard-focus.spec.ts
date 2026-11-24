import { expect, test, type Locator, type Page } from "@playwright/test";
import { account, PASSWORD, sessionFor } from "./session";

// Keyboard focus after a sheet closes, on the PUBLIC preview (defect K1, fixed 24 Nov 2026). Uses its own
// synthetic account (role "focus"), set up here through the app's API; run it after the main suite.
// The four reported cases, by keyboard only: saving Log bloating, ending bloating, deleting one of two
// meals, deleting the only bloating record. After each, focus is on the right control or heading and
// the next Tab continues from there.
const BASE = process.env.HOSTED_URL!;
const HELP_VERSION = "nhs-bloating-2026-11-07";
test.beforeAll(() => { if (!BASE) throw new Error("Set HOSTED_URL"); });
test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false });

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
async function nextTabContinuesHere(page: Page) {
  const found = await page.evaluate(() => {
    const from = document.activeElement as HTMLElement;
    const all = [...document.querySelectorAll<HTMLElement>("a[href], button, input, select, textarea, [tabindex]")]
      .filter((el) => el.tabIndex >= 0 && !(el as HTMLButtonElement).disabled && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden");
    const next = all.find((el) => !from.contains(el) && (from.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING));
    document.querySelectorAll("[data-next-expected]").forEach((e) => e.removeAttribute("data-next-expected"));
    next?.setAttribute("data-next-expected", "");
    return !!next;
  });
  expect(found).toBe(true);
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.hasAttribute("data-next-expected"))).toBe(true);
}

test("hosted, keyboard only: after the four sheet saves, focus goes to the replacement control or heading and Tab continues from there", async ({ page }) => {
  test.skip(!PASSWORD, "needs the run's synthetic accounts");
  test.setTimeout(180_000);
  const { token } = await sessionFor("focus");
  const call = (method: string, path: string, body?: unknown) => fetch(`${BASE}${path}`, {
    method, headers: { Authorization: `Bearer ${token}`, "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
  expect((await call("POST", "/v1/onboarding/commit", {
    age_18_or_older: "yes", country: "US", time_zone: "America/New_York", units: "us",
    help: { viewed_at: new Date().toISOString(), page_version: HELP_VERSION }, consents: ["terms_privacy", "health_data", "wellness_ack"],
    answers: [], medicines: [], followed: [],
  })).status).toBe(201);

  await page.goto("/sign-in", { waitUntil: "load" });
  await page.getByLabel("Email").fill(account("focus"));
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible({ timeout: 30000 });

  // 1. Save Log bloating: focus on its replacement, Bloating ongoing.
  await tabTo(page, page.getByRole("button", { name: "I feel bloated" }));
  await page.keyboard.press("Enter");
  const log = page.getByRole("dialog", { name: "Log bloating" });
  await tabTo(page, log.getByRole("radio", { name: "4", exact: true }));
  await page.keyboard.press("Space");
  await tabTo(page, log.getByRole("button", { name: "Save" }));
  await page.keyboard.press("Enter");
  await expect(log).toBeHidden({ timeout: 30000 });
  await expect(page.getByRole("button", { name: /Bloating ongoing/ })).toBeFocused({ timeout: 10000 });
  await nextTabContinuesHere(page);

  // 2. End it: focus on its replacement, I feel bloated.
  await tabTo(page, page.getByRole("button", { name: /Bloating ongoing/ }));
  await page.keyboard.press("Enter");
  const now = page.getByRole("dialog", { name: "Bloating now" });
  await tabTo(page, now.getByRole("button", { name: "Bloating gone" }));
  await page.keyboard.press("Enter");
  const end = page.getByRole("dialog", { name: "Bloating ended" });
  await tabTo(page, end.getByRole("button", { name: "Save" }));
  await page.keyboard.press("Enter");
  await expect(end.getByText(/Lasted/)).toBeVisible({ timeout: 30000 });
  await tabTo(page, end.getByRole("button", { name: "Done" }));
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "I feel bloated" })).toBeFocused({ timeout: 10000 });
  await nextTabContinuesHere(page);

  // 3. Delete one of two meals on the day screen: focus on the Meals heading.
  for (const dish of ["SYNTHETIC focus meal one", "SYNTHETIC focus meal two"]) {
    expect((await call("POST", "/v1/meals", { save_key: crypto.randomUUID(), dish_text: dish, eaten: { mode: "now" } })).status).toBe(201);
  }
  const today = (await call("GET", "/v1/me/state")).body.today.date as string;
  await page.goto(`/day/${today}`);
  const row = page.locator("div").filter({ hasText: "SYNTHETIC focus meal two" }).filter({ has: page.getByRole("button", { name: "Delete", exact: true }) }).last();
  await tabTo(page, row.getByRole("button", { name: "Delete", exact: true }));
  await page.keyboard.press("Enter");
  let confirm = page.getByRole("dialog", { name: "Delete this?" });
  await tabTo(page, confirm.getByRole("button", { name: "Delete", exact: true }));
  await page.keyboard.press("Enter");
  await expect(page.getByText("SYNTHETIC focus meal two")).toHaveCount(0, { timeout: 30000 });
  await expect(page.getByRole("heading", { name: "Meals" })).toBeFocused({ timeout: 10000 });
  await nextTabContinuesHere(page);

  // 4. Delete the only bloating record: its section goes, so focus on the screen title.
  const section = page.locator("section", { has: page.getByRole("heading", { name: "Bloating", exact: true }) });
  await tabTo(page, section.getByRole("button", { name: "Delete", exact: true }));
  await page.keyboard.press("Enter");
  confirm = page.getByRole("dialog", { name: "Delete this?" });
  await tabTo(page, confirm.getByRole("button", { name: "Delete", exact: true }));
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Bloating", exact: true })).toHaveCount(0, { timeout: 30000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused({ timeout: 10000 });
  await nextTabContinuesHere(page);
});
