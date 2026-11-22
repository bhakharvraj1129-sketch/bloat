import { expect, test } from "@playwright/test";

// Signed-out navigation checks on the PUBLIC preview (no account needed).
//   HOSTED_URL=https://<preview host> pnpm exec playwright test -c playwright.hosted.config.ts tests/hosted/navigation.spec.ts
const BASE = process.env.HOSTED_URL!;
test.beforeAll(() => { if (!BASE) throw new Error("Set HOSTED_URL"); });
const home = new RegExp(`^${BASE.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}/?$`);

test("hosted: a private screen sends a signed-out visitor to sign in, remembering where they were going", { tag: "@smoke" }, async ({ page }) => {
  await page.goto("/me", { waitUntil: "load" });
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fme$/);
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  await page.goto("/sign-in?next=https%3A%2F%2Fevil.example", { waitUntil: "load" });
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible(); // an outside address is ignored
});

test("hosted: Back returns to the page you came from, and to the start page on a direct link", { tag: "@smoke" }, async ({ page }) => {
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

test("hosted: empty forms explain what is missing instead of doing nothing", { tag: "@smoke" }, async ({ page }) => {
  await page.goto("/unavailable", { waitUntil: "load" });
  await page.getByRole("button", { name: "Join waitlist" }).click();
  await expect(page.getByText("Enter your country and a valid email address.")).toBeVisible();
  await page.goto("/sign-in", { waitUntil: "load" });
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Enter your email address.")).toBeVisible();
});
