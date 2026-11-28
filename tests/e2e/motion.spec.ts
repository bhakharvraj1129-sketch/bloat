import { expect, test, type BrowserContext, type Page } from "@playwright/test";

// The owner's motion and design spec (27 Nov 2026): every tap answers within 150ms, overlays slide
// and fade in about 250ms, nothing takes longer than about 400ms, saves end with a tick and a toast,
// loading shows a skeleton, lists and charts animate, forms help, and "reduce motion" stops it all.
// LOCAL stack, synthetic accounts only.

const HELP_VERSION = "nhs-bloating-2026-11-07";

async function account(context: BrowserContext, opts: { country?: "US" | "IN"; pro?: boolean } = {}): Promise<Page> {
  const page = await context.newPage();
  await page.goto("/");
  const email = `motion-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
  expect((await page.request.post("/v1/auth/test-login", { data: { email, password: "synthetic-password-1", create: true } })).ok()).toBe(true);
  const country = opts.country ?? "US";
  const commit = await page.request.post("/v1/onboarding/commit", {
    headers: { "idempotency-key": crypto.randomUUID() },
    data: {
      age_18_or_older: "yes", country, time_zone: country === "IN" ? "Asia/Kolkata" : "America/New_York", units: country === "US" ? "us" : "metric",
      help: { viewed_at: new Date().toISOString(), page_version: HELP_VERSION }, consents: ["terms_privacy", "health_data", "wellness_ack"],
      answers: [], medicines: [], followed: [],
    },
  });
  expect(commit.status()).toBe(201);
  if (opts.pro) expect((await page.request.post("/v1/billing/mock-purchase", { headers: { "idempotency-key": crypto.randomUUID() }, data: { interval: "three_month" } })).status()).toBe(200);
  return page;
}

test.describe("motion spec", () => {
  test("a pressed button shrinks slightly at once, and the motion tokens stay within 400ms", async ({ context }) => {
    const page = await account(context);
    await page.goto("/today");
    const button = page.getByRole("button", { name: "I feel bloated" });
    const box = (await button.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await expect.poll(() => button.evaluate((el) => getComputedStyle(el).scale), { timeout: 1000 }).toBe("0.97");
    await page.mouse.up();
    const tokens = await page.evaluate(() => {
      const st = getComputedStyle(document.documentElement);
      // The built stylesheet may write 120ms as .12s: read both.
      return ["--dur-press", "--dur-fast", "--dur-base", "--dur-slow"].map((t) => {
        const v = st.getPropertyValue(t).trim();
        return Math.round(v.endsWith("ms") ? parseFloat(v) : parseFloat(v) * 1000);
      });
    });
    expect(tokens).toEqual([120, 150, 250, 400]);
  });

  test("a bottom sheet slides in over 250ms; a save ends with a tick and a toast that screen readers hear", async ({ context }) => {
    const page = await account(context);
    await page.goto("/today");
    await page.getByRole("button", { name: "I feel bloated" }).click();
    const sheet = page.getByRole("dialog", { name: "Log bloating" });
    await expect(sheet).toBeVisible();
    expect(await page.locator("[data-vaul-drawer]").evaluate((el) => getComputedStyle(el).animationDuration)).toBe("0.25s");
    await sheet.getByRole("radio", { name: "4", exact: true }).click();
    await sheet.getByRole("button", { name: "Save" }).click();
    const toast = page.locator('[data-sonner-toast][data-front="true"]');
    await expect(toast).toHaveText("Bloating saved.");
    await expect(toast.locator("svg")).toHaveCount(1); // the tick
    await expect(page.locator("section[aria-live='polite']", { has: toast })).toHaveCount(1);
  });

  test("with reduce motion on, nothing animates: sheets, the start page and numbers just appear", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await account(context);
    await page.goto("/today");
    await page.getByRole("button", { name: "I feel bloated" }).click();
    await expect(page.getByRole("dialog", { name: "Log bloating" })).toBeVisible();
    expect(await page.locator("[data-vaul-drawer]").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
    const visitor = await context.newPage();
    await visitor.goto("/");
    expect(await visitor.locator(".hero-word > span").first().evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
    expect(await visitor.locator(".hero-pattern").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
    expect(await visitor.locator(".ticker-track").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
    // The sample phone shows its finished state and does not play; there is nothing to pause.
    await expect(visitor.getByText("Bloating saved.", { exact: true })).toHaveCount(1);
    await expect(visitor.getByRole("button", { name: "Pause animation" })).toHaveCount(0);
    // The day story is a plain list of its four moments.
    await expect(visitor.getByRole("heading", { name: "Day done.", exact: true })).toBeVisible();
    await expect(visitor.getByRole("heading", { name: "Morning review.", exact: true })).toBeVisible();
    await context.close();
  });

  test("a slow screen shows a skeleton of the page, never a blank screen or a spinner", async ({ context }) => {
    const page = await account(context);
    await page.route("**/v1/history", async (route) => { await new Promise((r) => setTimeout(r, 1500)); await route.continue(); });
    await page.goto("/history");
    await expect(page.getByRole("heading", { name: "History" })).toBeVisible();
    await expect(page.locator(".skeleton").first()).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "Loading history" })).toHaveCount(1);
    await expect(page.getByText("Your days", { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.locator(".skeleton")).toHaveCount(0);
  });

  test("India: a PIN code fills in the state (and shows the city); a wrong one gets a gentle message under the field", async ({ context }) => {
    const page = await account(context, { country: "IN" });
    await page.goto("/me");
    const pin = page.getByLabel("PIN code (optional)");
    await pin.fill("012345");
    await pin.blur();
    await expect(page.getByText("A PIN code has 6 digits and doesn't start with 0.")).toBeVisible();
    await expect(pin).toHaveAttribute("aria-invalid", "true");
    await pin.fill("380001");
    await expect(page.getByText("Ahmadabad, Gujarat")).toBeVisible({ timeout: 20000 });
    await expect(pin).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("button", { name: /^State or union territory \(optional\)/ })).toHaveAccessibleName("State or union territory (optional) Gujarat", { timeout: 20000 });
    const profile = (await (await page.request.get("/v1/me/state")).json()).profile;
    expect(profile.region).toBe("Gujarat");
    expect(JSON.stringify(profile)).not.toContain("380001"); // the PIN code itself is not saved
  });

  test("change password: a problem appears gently under its field instead of blocking", async ({ context }) => {
    // The sheet exists only where password sign-in is on (the preview): run with a server started with
    // BLOAT_SIGN_IN_METHOD=password and E2E_SIGN_IN=password.
    test.skip(process.env.E2E_SIGN_IN !== "password", "needs a server with password sign-in");
    const page = await account(context);
    await page.goto("/me");
    await page.getByRole("button", { name: "Change password" }).click();
    const sheet = page.getByRole("dialog", { name: "Change password" });
    const [first, second] = [sheet.locator('input[autocomplete="new-password"]').nth(0), sheet.locator('input[autocomplete="new-password"]').nth(1)];
    await first.fill("short");
    await second.fill("short");
    await sheet.getByRole("button", { name: "Change password" }).click();
    await expect(sheet.getByText("Use at least 10 characters.")).toBeVisible();
    await expect(first).toHaveAttribute("aria-invalid", "true");
    await first.fill("long-enough-password");
    await second.fill("different-password");
    await sheet.getByRole("button", { name: "Change password" }).click();
    await expect(sheet.getByText("The two passwords don't match.")).toBeVisible();
    await expect(second).toHaveAttribute("aria-invalid", "true");
  });

  test("History's chart draws its bars (Recharts) and keeps its text alternative", async ({ context }) => {
    const page = await account(context, { pro: true });
    await page.request.post("/v1/episodes", { headers: { "idempotency-key": crypto.randomUUID() }, data: { strength: 6, started: { mode: "now" } } });
    await page.goto("/history");
    await expect(page.getByRole("img", { name: /Daily Bloat Score for \d+ days/ })).toBeVisible({ timeout: 20000 });
    await expect(page.locator(".recharts-bar-rectangle")).not.toHaveCount(0);
    await expect(page.getByText("Solid: confirmed. Hollow: late review.")).toBeVisible();
  });

  test("start page: sections reveal as they scroll into view, and end fully visible", async ({ page }) => {
    await page.goto("/");
    const cards = page.locator("[data-reveal-group] > li");
    await cards.last().scrollIntoViewIfNeeded();
    await expect.poll(() => cards.last().evaluate((el) => getComputedStyle(el).opacity), { timeout: 3000 }).toBe("1");
    await expect(page.getByRole("heading", { name: "Patterns in your records" })).toBeVisible();
  });

  test("start page: the sample phone plays and can be paused with everything else that moves", async ({ page }) => {
    await page.goto("/");
    // The sample plays only while it is on screen: bring it into view, then its save message appears within one loop.
    await page.getByText("The Today screen, shown with sample entries.").scrollIntoViewIfNeeded();
    await expect(page.locator(".demo-toast[data-open]")).toHaveCount(1, { timeout: 10000 });
    await page.getByRole("button", { name: "Pause animation" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-motion-paused", "");
    expect(await page.locator(".ticker-track").evaluate((el) => getComputedStyle(el).animationPlayState)).toBe("paused");
    expect(await page.locator(".hero-pattern").evaluate((el) => getComputedStyle(el).animationPlayState)).toBe("paused");
    await page.getByRole("button", { name: "Play animation" }).click();
    expect(await page.locator(".ticker-track").evaluate((el) => getComputedStyle(el).animationPlayState)).toBe("running");
  });

  test("start page: the try-it sample uses the real scale, fills in, and says nothing was saved or sent", async ({ page }) => {
    const writes: string[] = [];
    page.on("request", (r) => { if (r.method() !== "GET" && new URL(r.url()).pathname.startsWith("/v1/")) writes.push(r.url()); });
    await page.goto("/");
    await page.locator("#try").scrollIntoViewIfNeeded();
    const save = page.getByRole("button", { name: "Pick a number first" });
    await expect(save).toBeDisabled();
    await page.getByRole("radiogroup", { name: "How strong is it right now? (sample)" }).getByRole("radio", { name: "6", exact: true }).click();
    await page.getByRole("radio", { name: "Earlier today" }).click();
    await page.getByRole("button", { name: "Save the sample" }).click();
    await expect(page.getByText("Saved in this sample only. Nothing was sent.")).toBeVisible();
    await expect(page.getByText("of 10 · since earlier today")).toBeVisible();
    await page.getByRole("button", { name: "Start again" }).click();
    await expect(page.getByRole("button", { name: "Pick a number first" })).toBeDisabled();
    expect(writes).toEqual([]); // nothing was sent anywhere
  });

  test("start page: the day story moves with the scroll, and the questions open one at a time", async ({ page }) => {
    await page.goto("/");
    const story = page.locator("section[aria-labelledby=day-title]");
    const box = (await story.boundingBox())!;
    const top = (await page.evaluate(() => scrollY)) + box.y;
    await page.evaluate((y) => scrollTo(0, y + 5), top);
    await expect.poll(() => page.getByRole("heading", { name: "Morning review.", exact: true }).evaluate((el) => getComputedStyle(el.parentElement!).opacity)).toBe("1");
    await page.evaluate((y) => scrollTo(0, y), top + box.height - (await page.evaluate(() => innerHeight)) - 5);
    await expect.poll(() => page.getByRole("heading", { name: "Day done.", exact: true }).evaluate((el) => getComputedStyle(el.parentElement!).opacity)).toBe("1");

    const first = page.getByRole("button", { name: "Who is Bloat Buddy for?" });
    const second = page.getByRole("button", { name: "Is it a medical app?" });
    await second.scrollIntoViewIfNeeded();
    await expect(first).toHaveAttribute("aria-expanded", "true");
    await second.click();
    await expect(second).toHaveAttribute("aria-expanded", "true");
    await expect(first).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("region", { name: "Is it a medical app?" })).toContainText("does not diagnose or treat anything");
    await expect(page.getByRole("region", { name: "Is it a medical app?" }).getByRole("link", { name: "when to get medical help" })).toHaveAttribute("href", "/help");
  });

  test("start page: the before-and-after slider works by keyboard, and the step cards flip with both sides readable", async ({ page }) => {
    await page.goto("/");
    const slider = page.getByRole("slider", { name: /Compare scattered notes with a Bloat Buddy record/ });
    await slider.scrollIntoViewIfNeeded();
    await expect(slider).toHaveValue("55");
    await slider.focus();
    for (let i = 0; i < 10; i++) await page.keyboard.press("ArrowLeft");
    await expect(slider).toHaveValue("45");
    await expect(slider).toHaveAttribute("aria-valuetext", "55% record shown");

    const card = page.getByRole("button", { name: /Log as the day goes/ });
    await card.scrollIntoViewIfNeeded();
    await expect(card).toHaveAttribute("aria-expanded", "false");
    await expect(card).toContainText("Two taps when bloating starts and ends."); // the details are in the page before flipping
    await card.press("Enter");
    await expect(card).toHaveAttribute("aria-expanded", "true");
    await expect.poll(() => card.locator(".flip-inner").evaluate((el) => getComputedStyle(el).transform)).not.toBe("none");
  });

  test("in the app: the active tab has its pill, a chosen chip shows a tick, and logged days fill in", async ({ context }) => {
    const page = await account(context);
    await page.request.post("/v1/meals", { headers: { "idempotency-key": crypto.randomUUID() }, data: { save_key: crypto.randomUUID(), dish_text: "Sample toast", eaten: { mode: "now" } } });
    await page.goto("/today");
    await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Today" }).locator(".tab-pill")).toHaveCount(1);
    await expect(page.locator(".week-fill")).toHaveCount(1);
    await page.getByRole("button", { name: "I feel bloated" }).click();
    const sheet = page.getByRole("dialog", { name: "Log bloating" });
    await expect(sheet.getByRole("radio", { name: "Now" }).locator("svg.pop-in")).toHaveCount(1);
    await sheet.getByRole("radio", { name: "6", exact: true }).click();
    await expect(sheet.getByRole("radio", { name: "6", exact: true })).toHaveClass(/\bpick\b/);
  });
});
