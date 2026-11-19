import { expect, test, type Page } from "@playwright/test";
import { account, PASSWORD } from "./session";

// Signed-out navigation checks on the PUBLIC preview (no account needed).
//   HOSTED_URL=https://<preview host> pnpm exec playwright test -c playwright.hosted.config.ts tests/hosted/navigation.spec.ts
const BASE = process.env.HOSTED_URL!;
test.beforeAll(() => { if (!BASE) throw new Error("Set HOSTED_URL"); });
const home = new RegExp(`^${BASE.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}/?$`);

test("hosted: a private screen sends a signed-out visitor to sign in, remembering where they were going", async ({ page }) => {
  await page.goto("/me", { waitUntil: "load" });
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fme$/);
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  await page.goto("/sign-in?next=https%3A%2F%2Fevil.example", { waitUntil: "load" });
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible(); // an outside address is ignored
});

test("hosted: Back returns to the page you came from, and to the start page on a direct link", async ({ page }) => {
  await page.goto("/contact", { waitUntil: "load" });
  await page.getByRole("main").getByRole("link", { name: "When to get medical help" }).first().click();
  await expect(page.getByRole("heading", { name: /When to get medical help/ })).toBeVisible();
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page).toHaveURL(/\/contact$/);

  for (const route of ["/privacy", "/terms", "/how-bloat-works"]) {
    const fresh = await page.context().newPage();
    await fresh.goto(route, { waitUntil: "load" });
    await fresh.getByRole("link", { name: "Back" }).click();
    await expect(fresh).toHaveURL(home);
    await fresh.close();
  }
  const help = await page.context().newPage();
  await help.goto("/help", { waitUntil: "load" });
  await help.getByRole("button", { name: "Back" }).click(); // used to do nothing on a direct link
  await expect(help).toHaveURL(home);
});

test("hosted: empty forms explain what is missing instead of doing nothing", async ({ page }) => {
  await page.goto("/unavailable", { waitUntil: "load" });
  await page.getByRole("button", { name: "Join waitlist" }).click();
  await expect(page.getByText("Enter your country and a valid email address.")).toBeVisible();
  await page.goto("/sign-in", { waitUntil: "load" });
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Enter your email address.")).toBeVisible();
});

// Signed in (needs HOSTED_ACCOUNTS and HOSTED_PASSWORD; run after preview.spec.ts has set up "p1" and "pro").
async function signIn(page: Page, role: string) {
  await page.goto("/sign-in", { waitUntil: "load" });
  await page.getByLabel("Email").fill(account(role));
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible({ timeout: 30000 });
}

test("hosted, signed in: Back, sheets and the phone's Back button, focus return, and close-without-saving", async ({ page }) => {
  test.skip(!process.env.HOSTED_PASSWORD, "needs the run's synthetic accounts");
  await signIn(page, "p1");
  await page.getByRole("link", { name: "Edit today's entries" }).click();
  await expect(page).toHaveURL(/\/day\//);
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page).toHaveURL(/\/today$/);

  const opener = page.getByRole("button", { name: "Add activity" });
  await opener.click();
  await expect(page.getByRole("dialog", { name: "Add activity" })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/\/today$/);
  await opener.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(opener).toBeFocused();

  await page.getByRole("button", { name: "Add meal" }).click();
  const sheet = page.getByRole("dialog", { name: "Add meal" });
  await sheet.getByLabel("What did you have?").fill("Hosted check soup");
  await page.keyboard.press("Escape");
  await expect(sheet.getByText("Close without saving?")).toBeVisible();
  await sheet.getByRole("button", { name: "Keep editing" }).click();
  await expect(sheet.getByLabel("What did you have?")).toHaveValue("Hosted check soup");
  await sheet.getByRole("button", { name: "Close" }).click();
  await sheet.getByRole("button", { name: "Close without saving" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("hosted, signed in: leaving a screen with unsaved changes asks first", async ({ page }) => {
  test.skip(!process.env.HOSTED_PASSWORD, "needs the run's synthetic accounts");
  await signIn(page, "pro");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "You" }).click();
  await page.getByRole("link", { name: /Health background/ }).click();
  await expect(page.getByRole("heading", { name: "Health background" })).toBeVisible();
  await page.getByRole("checkbox", { name: "IBS", exact: true }).click();
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Today" }).click();
  const ask = page.getByRole("dialog", { name: "Leave without saving?" });
  await expect(ask).toBeVisible();
  await ask.getByRole("button", { name: "Stay and keep editing" }).click();
  await expect(page).toHaveURL(/\/health$/);
  await page.getByRole("link", { name: "Back" }).click();
  await ask.getByRole("button", { name: "Leave without saving" }).click();
  await expect(page).toHaveURL(/\/me$/);
});
