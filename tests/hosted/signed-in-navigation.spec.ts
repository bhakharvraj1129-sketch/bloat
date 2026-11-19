import { expect, test, type Page } from "@playwright/test";
import { account, PASSWORD } from "./session";

// Signed-in navigation checks on the PUBLIC preview. The file name sorts after preview.spec.ts on
// purpose: that file sets up the "p1" and "pro" accounts (and logs p1's meal) that these use.
const BASE = process.env.HOSTED_URL!;
test.beforeAll(() => { if (!BASE) throw new Error("Set HOSTED_URL"); });

async function signIn(page: Page, role: string) {
  await page.goto("/sign-in", { waitUntil: "load" });
  await page.getByLabel("Email").fill(account(role));
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible({ timeout: 30000 });
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
