import { expect, test, type Page } from "@playwright/test";
import { account, PASSWORD } from "./session";

// Your journey on the PUBLIC preview for an account with no finished day (external report B3, 23 Nov):
// the range from the account's first day to yesterday would run backwards, so the screen must say
// "No finished days yet." and show no backwards range. The file name sorts after preview.spec.ts on
// purpose: that file sets up the "pro" account (created today, so no day has finished yet).
const BASE = process.env.HOSTED_URL!;
test.beforeAll(() => { if (!BASE) throw new Error("Set HOSTED_URL"); });

async function signIn(page: Page, role: string) {
  await page.goto("/sign-in", { waitUntil: "load" });
  await page.getByLabel("Email").fill(account(role));
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible({ timeout: 30000 });
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DATE = String.raw`(?:\d{1,2} [A-Z][a-z]{2}|[A-Z][a-z]{2} \d{1,2})`;
const order = (d: string) => { const [x, y] = d.split(" ") as [string, string]; return /\d/.test(x) ? MONTHS.indexOf(y) * 100 + Number(x) : MONTHS.indexOf(x) * 100 + Number(y); };
const backwards = (text: string) => [...text.matchAll(new RegExp(`(${DATE}) to (${DATE})`, "g"))].filter((m) => order(m[1]!) > order(m[2]!)).map((m) => m[0]);

test("hosted, signed in: Your journey with no finished day says so and shows no backwards date range", async ({ page }) => {
  test.skip(!process.env.HOSTED_PASSWORD, "needs the run's synthetic accounts");
  await signIn(page, "pro");
  await page.goto("/journey");
  await expect(page.getByRole("heading", { name: "Your journey" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByText(/No finished days yet\./).first()).toBeVisible();
  expect(backwards(await page.locator("main").innerText()), "no range that ends before it starts").toEqual([]);
});
