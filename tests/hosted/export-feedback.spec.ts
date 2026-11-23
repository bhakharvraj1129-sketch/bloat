import { expect, test, type Page } from "@playwright/test";
import { account, PASSWORD } from "./session";

// Export messages on the PUBLIC preview (final round of 23 Nov, R2): a server that answers with an
// error and a lost connection get different messages, and nothing downloads. The failures are made
// in this browser only (the request is answered or cut off here); the preview itself is not touched.
// Run it after the main hosted suite: it signs in as the "export" account that preview.spec.ts sets up.
const BASE = process.env.HOSTED_URL!;
test.beforeAll(() => { if (!BASE) throw new Error("Set HOSTED_URL"); });

async function signIn(page: Page, role: string) {
  await page.goto("/sign-in", { waitUntil: "load" });
  await page.getByLabel("Email").fill(account(role));
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible({ timeout: 30000 });
}

test("hosted, signed in: export says 'Try again' for a server error and 'Check your connection' for a lost connection; nothing downloads", async ({ page }) => {
  test.skip(!process.env.HOSTED_PASSWORD, "needs the run's synthetic accounts");
  await signIn(page, "export");
  await page.goto("/me");
  let downloads = 0;
  page.on("download", () => { downloads++; });
  const NO_CONNECTION = "That didn't work. Check your connection and try again.";
  const SERVER = "That didn't work. Try again.";
  await page.route("**/v1/export", (route) => route.request().method() === "POST"
    ? route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: { code: "ERROR", message: "Something went wrong. Nothing was saved." } }) })
    : route.fallback());
  await page.getByRole("button", { name: "JSON", exact: true }).click();
  await expect(page.getByText(SERVER, { exact: true })).toBeVisible({ timeout: 20000 });
  await expect(page.getByText(NO_CONNECTION, { exact: true })).toHaveCount(0);
  await page.unroute("**/v1/export");
  await page.route("**/v1/export", (route) => route.request().method() === "POST" ? route.abort("internetdisconnected") : route.fallback());
  await page.getByRole("button", { name: "CSV", exact: true }).click();
  await expect(page.getByText(NO_CONNECTION, { exact: true })).toBeVisible({ timeout: 20000 });
  await expect(page.getByText(SERVER, { exact: true })).toHaveCount(0);
  await page.unroute("**/v1/export");
  expect(downloads).toBe(0);
});
