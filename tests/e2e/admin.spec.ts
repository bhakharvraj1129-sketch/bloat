import { expect, test } from "@playwright/test";
import { anon, srvRpc, STAFF_EMAIL, totp } from "../api/helpers";

const PASSWORD = "synthetic-password-1";

test("Q76: founder tools open only for a staff account after an authenticator code", async ({ page }) => {
  // Start from a staff account with no second step set up yet.
  const old = await anon().auth.signInWithPassword({ email: STAFF_EMAIL, password: PASSWORD });
  if (old.data.user) await srvRpc("srv_delete_account", { p_user: old.data.user.id });

  // Signed out: nothing is shown.
  await page.goto("/admin");
  await expect(page.getByText("Founder tools need a staff account.")).toBeVisible();
  await expect(page.getByText("AI spending this month")).toHaveCount(0);

  // An ordinary signed-in account gets the same answer.
  const plain = await page.request.post("/v1/auth/test-login", { data: { email: `e2e-plain-${Date.now()}@example.com`, password: PASSWORD, create: true } });
  expect(plain.ok()).toBe(true);
  await page.goto("/admin");
  await expect(page.getByText("Founder tools need a staff account.")).toBeVisible();

  // The staff account: password alone leads to the second step, not to the tools.
  const staff = await page.request.post("/v1/auth/test-login", { data: { email: STAFF_EMAIL, password: PASSWORD, create: true } });
  expect(staff.ok()).toBe(true);
  await page.goto("/admin");
  await expect(page.getByText("Second sign-in step")).toBeVisible({ timeout: 20000 });
  await expect(page.getByText("AI spending this month")).toHaveCount(0);
  await expect(page.getByAltText("Code to scan with your authenticator app")).toBeVisible();
  const secret = (await page.locator("span.break-all").innerText()).trim();

  await page.getByLabel("6-digit code from your app").fill("000000");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("That code didn't work.")).toBeVisible();
  await expect(page.getByText("AI spending this month")).toHaveCount(0);

  await page.getByLabel("6-digit code from your app").fill(totp(secret));
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("AI spending this month")).toBeVisible({ timeout: 20000 });

  // A refresh keeps the verified session; the tools still open without a new scan.
  await page.reload();
  await expect(page.getByText("AI spending this month")).toBeVisible({ timeout: 20000 });
});
