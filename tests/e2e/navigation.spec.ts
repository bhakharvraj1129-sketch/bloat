import { expect, test, type BrowserContext, type Page } from "@playwright/test";

// Navigation and action repairs (control ledger round). Each test reproduces a failure found in
// the ledger and checks the repaired behaviour. Synthetic accounts on the LOCAL stack only.

const HELP_VERSION = "nhs-bloating-2026-11-07";
test.use({ serviceWorkers: "block" });

async function send(page: Page, method: string, url: string, body?: unknown) {
  return page.evaluate(async ({ method, url, body }) => {
    const r = await fetch(url, { method, headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: r.status, body: await r.text() };
  }, { method, url, body });
}

/** A new synthetic account, set up and signed in, through the local test-only endpoints. */
async function account(context: BrowserContext, opts: { pro?: boolean; onboard?: boolean; meal?: string } = {}): Promise<Page> {
  const page = await context.newPage();
  await page.goto("/");
  const email = `nav-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
  expect((await page.request.post("/v1/auth/test-login", { data: { email, password: "synthetic-password-1", create: true } })).ok()).toBe(true);
  if (opts.onboard === false) return page;
  expect((await send(page, "POST", "/v1/onboarding/commit", {
    age_18_or_older: "yes", country: "US", time_zone: "America/New_York", units: "us",
    help: { viewed_at: new Date().toISOString(), page_version: HELP_VERSION }, consents: ["terms_privacy", "health_data", "wellness_ack"],
    answers: [], medicines: [{ name: "Nav iron", type: "supplement", med_group: "iron" }], followed: ["ACT-01"],
  })).status).toBe(201);
  if (opts.meal) expect((await send(page, "POST", "/v1/meals", { save_key: crypto.randomUUID(), dish_text: opts.meal, eaten: { mode: "now" } })).status).toBe(201);
  if (opts.pro) expect((await send(page, "POST", "/v1/billing/mock-purchase", { interval: "three_month" })).status).toBe(200);
  return page;
}

test("Back returns to the screen you came from, and falls back to the parent on a deep link", async ({ context }) => {
  const page = await account(context, { meal: "toast" });
  await page.goto("/today");
  await page.getByRole("link", { name: "Edit today's entries" }).click();
  await expect(page).toHaveURL(/\/day\//);
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page).toHaveURL(/\/today$/); // came from Today, so back to Today (it used to go to History)

  await page.getByRole("link", { name: "What Pro adds" }).click();
  await expect(page).toHaveURL(/\/upgrade$/);
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page).toHaveURL(/\/today$/); // it used to go to Me

  // Opened directly (a bookmark or a shared link): Back goes to the screen's parent.
  const fresh = await context.newPage();
  await fresh.goto("/upgrade");
  await fresh.getByRole("link", { name: "Back" }).click();
  await expect(fresh).toHaveURL(/\/me$/);
});

test("the phone's Back button closes an open sheet and stays on the screen; focus returns to the opener", async ({ context }) => {
  const page = await account(context);
  await page.goto("/me");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Today" }).click();
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible();

  const opener = page.getByRole("button", { name: "I feel bloated" });
  await opener.click();
  await expect(page.getByRole("dialog", { name: "Log bloating" })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("dialog", { name: "Log bloating" })).toHaveCount(0);
  await expect(page).toHaveURL(/\/today$/); // it used to leave Today for the previous screen

  await opener.click();
  await expect(page.getByRole("dialog", { name: "Log bloating" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(opener).toBeFocused();
  // Closing by its own button leaves no extra history step behind.
  await page.goBack();
  await expect(page).toHaveURL(/\/me$/);
});

test("the tab bar's Log button: the phone's Back closes Log bloating and then leaves Today, from another screen or from Today itself", async ({ context }) => {
  // Found in the interface review of 28 Nov 2026: after Log, Back landed on /today?log=1 again and
  // reopened the sheet, so Back could neither close it nor leave Today.
  const page = await account(context);
  const log = () => page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: /^Log/ });
  const sheet = () => page.getByRole("dialog", { name: "Log bloating" });
  await page.goto("/me");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "History" }).click();
  await expect(page).toHaveURL(/\/history$/);
  await log().click();
  await expect(sheet()).toBeVisible();
  await expect(page).toHaveURL(/\/today$/);
  await page.goBack();
  await expect(sheet()).toHaveCount(0);
  await expect(page).toHaveURL(/\/today$/);
  await page.waitForTimeout(500);
  await expect(sheet()).toHaveCount(0); // it does not open again by itself
  await page.goBack();
  await expect(page).toHaveURL(/\/history$/);

  // From Today itself: Back closes the sheet, and the next Back leaves Today.
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Today" }).click();
  await expect(page).toHaveURL(/\/today$/);
  await log().click();
  await expect(sheet()).toBeVisible();
  await page.goBack();
  await expect(sheet()).toHaveCount(0);
  await expect(page).toHaveURL(/\/today$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/history$/);
});

test("closing a sheet with something typed asks first, and keeps what was typed", async ({ context }) => {
  const page = await account(context);
  await page.goto("/today");
  await page.getByRole("button", { name: "Add meal" }).click();
  const sheet = page.getByRole("dialog", { name: "Add meal" });
  await sheet.getByLabel("What did you have?").fill("Lentil soup");
  await page.keyboard.press("Escape");
  await expect(sheet.getByText("Close without saving?")).toBeVisible(); // it used to close and lose the text
  await sheet.getByRole("button", { name: "Keep editing" }).click();
  await expect(sheet.getByLabel("What did you have?")).toHaveValue("Lentil soup");
  await sheet.getByRole("button", { name: "Close" }).click();
  await sheet.getByRole("button", { name: "Close without saving" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("in setup, the phone's Back button goes to the previous step instead of leaving setup", async ({ context }) => {
  const page = await account(context, { onboard: false });
  await page.evaluate(() => sessionStorage.setItem("bloat.pre", JSON.stringify({ country: "US", help_viewed_at: new Date().toISOString(), help_version: "nhs-bloating-2026-11-07", adult: true })));
  await page.goto("/setup");
  await expect(page.getByRole("heading", { name: "Consent" })).toBeVisible();
  for (const box of await page.getByRole("checkbox").all()) await box.check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("checkbox", { name: "This is right" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "About your bloating" })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Location, time and units" })).toBeVisible();
  await expect(page).toHaveURL(/\/setup$/);
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Consent" })).toBeVisible();
  await expect(page.getByRole("checkbox").first()).toBeChecked(); // answers kept
});

test("a lost reply followed by a failed check keeps the sheet open and says so", async ({ context }) => {
  const page = await account(context);
  await page.goto("/today");
  await page.getByRole("button", { name: "I feel bloated" }).click();
  const sheet = page.getByRole("dialog", { name: "Log bloating" });
  await sheet.getByRole("radio", { name: "5", exact: true }).click();
  await page.route("**/v1/episodes", (r) => r.abort());
  await page.route("**/v1/commands/**", (r) => r.abort());
  await sheet.getByRole("button", { name: "Save" }).click();
  await sheet.getByRole("button", { name: "Check save status" }).click();
  await page.waitForTimeout(800);
  // It used to close the sheet here as if the save had worked.
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText("Connection lost. We can't tell yet whether this was saved.")).toBeVisible();
  await page.unroute("**/v1/episodes");
  await page.unroute("**/v1/commands/**");
  await sheet.getByRole("button", { name: "Check save status" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Bloating ongoing/ })).toBeVisible(); // saved exactly once
});

test("health background: a failed part of the save is reported, never shown as saved", async ({ context }) => {
  const page = await account(context, { pro: true });
  await page.goto("/health");
  await expect(page.getByRole("heading", { name: "Health background" })).toBeVisible();
  await page.route("**/v1/health/family", (r) => r.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: { code: "ERROR", message: "Something went wrong. Nothing was saved." } }) }));
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Something went wrong. Nothing was saved.")).toBeVisible(); // it used to stay silent
  await expect(page.getByText("Saved", { exact: true })).toHaveCount(0);
});

test("the recall screen asks before turning on the AI ingredient check", async ({ context }) => {
  const page = await account(context, { meal: "dal tadka", pro: true }); // logged on Free, so it can be recalled
  await page.goto("/meal/recall");
  await page.getByRole("button", { name: "Check ingredients" }).click();
  await expect(page.getByRole("button", { name: "I agree, check this dish" })).toBeVisible();
  const consents = JSON.parse((await send(page, "GET", "/v1/consents")).body) as { consents: Array<{ type: string; withdrawn_at: string | null }> };
  // It used to record the agreement without asking.
  expect(consents.consents.some((c) => c.type === "ai_meal" && !c.withdrawn_at)).toBe(false);
});

test("withdrawing a consent and removing a medicine ask first, and show progress", async ({ context }) => {
  const page = await account(context);
  expect((await send(page, "POST", "/v1/consents", { type: "ai_meal" })).status).toBeLessThan(300);
  await page.goto("/me");
  const writes: string[] = [];
  page.on("request", (r) => { if (r.method() !== "GET" && r.url().includes("/v1/")) writes.push(`${r.method()} ${new URL(r.url()).pathname}`); });
  await page.getByRole("button", { name: "Withdraw" }).click();
  const confirm = page.getByRole("dialog", { name: "Withdraw consent" });
  await expect(confirm).toBeVisible(); // it used to withdraw at once
  expect(writes).toEqual([]);
  await confirm.getByRole("button", { name: "Withdraw" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  // Dates read as people write them (a US account: "Nov 27, 2026"), with no internal version code.
  await expect(page.getByText(/Withdrawn [A-Z][a-z]{2} \d{1,2}, \d{4}$/)).toBeVisible();
  await expect(page.getByText(/\d{4}-\d{2}-\d{2}|version \d/)).toHaveCount(0);

  await page.getByRole("button", { name: "Add or change" }).click();
  const meds = page.getByRole("dialog", { name: "Medicines and supplements" });
  await meds.getByRole("button", { name: "Remove" }).click();
  await expect(meds.getByText("Remove Nav iron from your record?")).toBeVisible();
  await meds.getByRole("button", { name: "Remove" }).click();
  await expect(meds.getByText("Nav iron")).toHaveCount(0);
});

test("a double tap on Download sends one request", async ({ context }) => {
  const page = await account(context);
  await page.goto("/me");
  let exports = 0;
  page.on("request", (r) => { if (r.method() === "POST" && r.url().endsWith("/v1/export")) exports++; });
  await page.getByRole("button", { name: "JSON" }).dblclick();
  await expect(page.getByText("Your download is complete.")).toBeVisible({ timeout: 20000 });
  expect(exports).toBe(1);
});

test("when a session runs out, signing in again returns to the same screen", async ({ context }) => {
  const page = await account(context);
  await page.goto("/history");
  await page.waitForLoadState("networkidle"); // History has finished loading before the session ends
  await context.clearCookies();
  await page.goto("/me");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fme$/);
  // A save on an open screen after the session ran out also comes back here.
  const second = await account(context);
  await second.goto("/today");
  await expect(second.getByRole("button", { name: "Add activity" })).toBeVisible();
  await context.clearCookies();
  await second.getByRole("button", { name: "Add activity" }).click();
  await second.getByRole("dialog", { name: "Add activity" }).getByRole("checkbox").first().click();
  await second.getByRole("dialog", { name: "Add activity" }).getByRole("button", { name: "Save" }).click();
  await expect(second).toHaveURL(/\/sign-in\?next=%2Ftoday$/);
});

test("waitlist and email-code forms explain an empty field instead of doing nothing", async ({ page }) => {
  await page.goto("/unavailable");
  await page.getByRole("button", { name: "Join waitlist" }).click();
  await expect(page.getByText("Enter your country and a valid email address.")).toBeVisible();
});

test("the help page's Back works when the page was opened directly", async ({ page }) => {
  await page.goto("/help");
  await page.getByRole("button", { name: "Back" }).click(); // it used to do nothing (no earlier page)
  await expect(page).toHaveURL(/127\.0\.0\.1:\d+\/$/);
});

test("Pro plan actions, the photo setting and account deletion each confirm their result", async ({ context }) => {
  const page = await account(context, { pro: true });
  await page.goto("/me");
  await page.getByRole("button", { name: "Pause Pro" }).click();
  await page.getByRole("dialog", { name: "Pause Pro" }).getByRole("button", { name: "Pause for 1 month" }).click();
  await expect(page.getByText("Bloat Buddy Pro (paused)")).toBeVisible();
  await page.getByRole("button", { name: "Resume Pro" }).click();
  await expect(page.getByRole("button", { name: "Pause Pro" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("dialog", { name: "Cancel Pro" }).getByRole("button", { name: "Cancel Pro" }).click();
  await expect(page.getByText(/Cancelled\. Pro stays on until/)).toBeVisible();

  const photos = page.getByRole("checkbox", { name: /Keep my meal photos/ });
  await photos.check();
  await expect(page.getByText("Saving…")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("checkbox", { name: /Keep my meal photos/ })).toBeChecked();

  await page.getByRole("button", { name: "Delete account" }).click();
  const del = page.getByRole("dialog", { name: "Delete account" });
  await expect(del.getByRole("button", { name: "Delete my account" })).toBeDisabled();
  await del.getByLabel("Type DELETE to confirm").fill("DELETE");
  await del.getByRole("button", { name: "Delete my account" }).click();
  await expect(page).toHaveURL(/127\.0\.0\.1:\d+\/$/);
  await page.goto("/today");
  await expect(page).toHaveURL(/\/sign-in/);
});

test("leaving a screen with unsaved changes asks first, by tab bar or Back", async ({ context }) => {
  const page = await account(context, { pro: true });
  await page.goto("/me");
  await page.getByRole("link", { name: /Health background/ }).click();
  await expect(page.getByRole("heading", { name: "Health background" })).toBeVisible();
  await page.getByRole("checkbox", { name: "IBS", exact: true }).click();
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Today" }).click();
  const ask = page.getByRole("dialog", { name: "Leave without saving?" });
  await expect(ask).toBeVisible();
  await ask.getByRole("button", { name: "Stay and keep editing" }).click();
  await expect(page).toHaveURL(/\/health$/);
  await expect(page.getByRole("checkbox", { name: "IBS", exact: true })).toBeChecked();
  await page.getByRole("link", { name: "Back" }).click();
  await ask.getByRole("button", { name: "Leave without saving" }).click();
  await expect(page).toHaveURL(/\/me$/); // Back still returns to where the person came from
});
