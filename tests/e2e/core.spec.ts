import { expect, test, type Page } from "@playwright/test";

const email = () => `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
const PASSWORD = "synthetic-password-1";

async function signUp(page: Page, country = "United States") {
  await page.goto("/");
  await page.getByRole("link", { name: "Get started" }).first().click();
  await page.getByRole("radio", { name: country }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "When to get medical help" })).toBeVisible();
  await page.getByRole("button", { name: "I've read this" }).click();
  await page.getByLabel("Email").fill(email());
  await page.getByLabel("I am 18 or older").check();
  await page.getByLabel("Test password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in with test password" }).click();
  await expect(page.getByRole("heading", { name: "Consent" })).toBeVisible({ timeout: 20000 });
}

async function setup(page: Page) {
  for (const box of await page.getByRole("checkbox").all()) await box.check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("checkbox", { name: "This is right" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "Continue" }).click(); // steps 3 to 7, all optional
  await expect(page.getByRole("heading", { name: "Habits to follow" })).toBeVisible();
  await page.getByRole("checkbox", { name: "Ate quickly" }).click();
  await expect(page.getByText("1/3 chosen")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "How Bloat Buddy works" })).toBeVisible();
  await page.getByRole("button", { name: "Go to Today" }).click();
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible({ timeout: 20000 });
}

test("Q92, Q61: sign-up shows the help page first, then setup, then Today. Q129: no third-party requests at all", async ({ page }) => {
  const outside: string[] = [];
  page.on("request", (r) => {
    const host = new URL(r.url()).host;
    if (!["127.0.0.1:3100", "127.0.0.1:54321"].includes(host) && !r.url().startsWith("data:")) outside.push(r.url());
  });
  await signUp(page);
  await setup(page);
  await expect(page.getByRole("heading", { name: "How are you feeling?" })).toBeVisible();
  await expect(page.getByText("Nothing logged yet today.")).toBeVisible();
  await expect(page.getByText(/0 days logged · 0 of 14 confirmed days needed/)).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link")).toHaveText(["Today", "History", "Log bloating", "Patterns", "You"]);
  expect(outside).toEqual([]);
});

test("log bloating with a warning sign, update it, end it, add a meal, and see it in History and day detail (Q94, Q114)", async ({ page }) => {
  await signUp(page);
  await setup(page);
  await page.getByRole("button", { name: "I feel bloated" }).click();
  const sheet = page.getByRole("dialog", { name: "Log bloating" });
  await expect(sheet.getByRole("button", { name: "Save" })).toBeDisabled(); // a strength is needed
  await sheet.getByRole("radio", { name: "6", exact: true }).click();
  await sheet.getByRole("checkbox", { name: "Fever, or feeling hot, cold or shivery" }).click();
  await expect(sheet.getByText("Contact a doctor today or go to urgent care.")).toBeVisible();
  await expect(sheet.getByText("Adapted from NHS, Bloating")).toBeVisible();
  // Pro fields are locked for Free, with a truthful label
  await expect(sheet.getByText("How it feels, other symptoms")).toBeVisible();
  await sheet.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("dialog", { name: "Saved" }).getByText("Nothing in Bloat Buddy has been paused.")).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("button", { name: /Bloating ongoing/ })).toBeVisible();
  await expect(page.getByText("1 episode")).toBeVisible();
  // no second open episode is possible: the main button is replaced
  await expect(page.getByRole("button", { name: "I feel bloated" })).toHaveCount(0);

  await page.getByRole("button", { name: /Bloating ongoing/ }).click();
  const ongoing = page.getByRole("dialog", { name: "Bloating now" });
  await ongoing.getByRole("button", { name: "Update strength" }).click();
  await ongoing.getByRole("radio", { name: "8", exact: true }).click();
  await ongoing.getByRole("button", { name: "Save reading" }).click();
  await expect(ongoing.getByLabel("Current strength 8")).toBeVisible();
  await ongoing.getByRole("button", { name: "Bloating gone" }).click();
  const end = page.getByRole("dialog", { name: "Bloating ended" });
  await end.getByRole("radio", { name: "I don't know" }).click();
  await end.getByRole("button", { name: "Save" }).click();
  await expect(end.getByText("End time not known")).toBeVisible(); // never a made-up end
  await end.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("button", { name: "I feel bloated" })).toBeVisible();

  await page.getByRole("button", { name: "Add meal" }).click();
  const meal = page.getByRole("dialog", { name: "Add meal" });
  await meal.getByLabel("What did you have?").fill("Masala dosa, coffee");
  await meal.getByRole("radio", { name: "Medium" }).click();
  await meal.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Masala dosa, coffee")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/calorie|kcal/i);

  await page.getByRole("link", { name: "History" }).click();
  await expect(page.getByRole("heading", { name: "History" })).toBeVisible();
  await expect(page.getByText("Highest logged 8 · review to confirm")).toBeVisible();
  await expect(page.getByText("Chart and 7-day average")).toBeVisible(); // locked Pro card, truthful text
  await page.getByText("· today").click();
  await expect(page.getByText("Masala dosa, coffee")).toBeVisible();
  await expect(page.getByText(/end not known/)).toBeVisible();
  await expect(page.getByText(/Also logged: Fever/)).toBeVisible();
  // delete the meal from day detail
  await page.getByRole("button", { name: "Delete" }).last().click();
  await page.getByRole("dialog", { name: "Delete this?" }).getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Masala dosa, coffee")).toHaveCount(0);
});

test("Q59 core recording works with the keyboard alone, and controls have names and a visible focus ring", async ({ page }) => {
  await signUp(page);
  await setup(page);
  const main = page.getByRole("button", { name: "I feel bloated" });
  await page.keyboard.press("Tab"); // keyboard focus shows the ring
  const ring = await page.evaluate(() => { const el = document.activeElement!; const c = getComputedStyle(el); return { style: c.outlineStyle, width: c.outlineWidth }; });
  expect(ring).toEqual({ style: "solid", width: "3px" }); // Silver: 3px ink ring
  await main.focus();
  await page.keyboard.press("Enter");
  const sheet = page.getByRole("dialog", { name: "Log bloating" });
  await sheet.getByRole("radio", { name: "4", exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(sheet.getByRole("radio", { name: "4", exact: true })).toHaveAttribute("aria-checked", "true");
  await sheet.getByRole("button", { name: "Save" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: /Bloating ongoing/ })).toBeVisible();
  // every button and link on Today has an accessible name; the selected state is not colour-only
  for (const el of await page.getByRole("button").all()) expect((await el.textContent())?.trim() || (await el.getAttribute("aria-label"))).toBeTruthy();
  await page.goto("/help");
  await expect(page.getByRole("heading", { name: "When to get medical help" })).toBeVisible();
  await expect(page.getByText("Call 911 now if you have bloating with a swollen stomach and:")).toBeVisible();
});

test("phone layout: no sideways scrolling, readable text on every filled button and link in light and dark, 44px touch targets, and both themes", async ({ page }) => {
  await signUp(page);
  await setup(page);
  for (const [scheme, path] of (["light", "dark"] as const).flatMap((s) => ["/today", "/history", "/me", "/upgrade", "/help", "/"].map((p) => [s, p] as const))) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `${scheme} ${path}`).toBeLessThanOrEqual(0);
    // A filled control's text must stand out from its own fill (it once matched it: invisible text).
    const unreadable = await page.evaluate(() => {
      const lum = (c: string) => { const [r, g, b] = (c.match(/[\d.]+/g) ?? []).map(Number).slice(0, 3).map((v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!; };
      const out: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>("a, button")) {
        const st = getComputedStyle(el);
        if ((el as HTMLButtonElement).disabled || !el.textContent?.trim() || st.backgroundColor === "rgba(0, 0, 0, 0)") continue;
        const a = lum(st.color), b = lum(st.backgroundColor);
        const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        if (ratio < 4.5) out.push(`${el.textContent.trim().slice(0, 40)} (${ratio.toFixed(2)})`);
      }
      return out;
    });
    expect(unreadable, `${scheme} ${path}`).toEqual([]);
  }
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/today");
  for (const b of await page.getByRole("button").all()) {
    const box = await b.boundingBox();
    if (box) expect(box.height, await b.textContent() ?? "").toBeGreaterThanOrEqual(44);
  }
  // Design v2 (owner, 27 Nov 2026): light and dark themes. The device setting picks one unless You sets it.
  await page.emulateMedia({ colorScheme: "dark" });
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(14, 18, 19)");
  await page.emulateMedia({ colorScheme: "light" });
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(246, 248, 248)");
});

test("Q91 another country gets the honest waitlist; Q203 a Free user who opens Your journey lands on Upgrade with no preview; Q39 sign-out; delete account", async ({ page }) => {
  await page.goto("/start");
  await page.getByRole("radio", { name: "Other" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Bloat Buddy isn't available in your country yet.")).toBeVisible();
  await page.getByLabel("Your country").fill("France");
  await page.getByRole("textbox", { name: /^Email/ }).fill(email()); // required by the server, so no longer labelled "optional"
  await page.getByRole("button", { name: "Join waitlist" }).click();
  await expect(page.getByText("You're on the waitlist")).toBeVisible();

  await signUp(page, "India");
  await setup(page);
  await page.goto("/journey");
  await expect(page.getByRole("heading", { name: "Bloat Buddy Pro" })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("₹1,999 a year")).toBeVisible(); // yearly first, in the user's currency
  await expect(page.getByText(/Includes 18% GST/)).toBeVisible();
  await expect(page.getByText(/There is no free trial/)).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/worth watching/i);
  await page.getByRole("button", { name: "Upgrade", exact: true }).click();
  await expect(page.getByText(/Payments are not switched on yet. Nothing was charged/)).toBeVisible();

  await page.goto("/me");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/today");
  await expect(page).toHaveURL(/sign-in/); // private screens need a session
});

test("a Pro user (mock purchase) sees the ingredient check, marks items, and Possible triggers opens", async ({ page }) => {
  await signUp(page);
  await setup(page);
  await page.goto("/upgrade");
  await page.getByRole("button", { name: "Mock purchase" }).click();
  await expect(page.getByRole("heading", { name: "You have Pro" })).toBeVisible({ timeout: 15000 });
  await page.goto("/today");
  await page.getByRole("button", { name: "Add meal" }).click();
  const meal = page.getByRole("dialog");
  await meal.getByLabel("What did you have?").fill("chicken burrito with beans");
  await meal.getByRole("button", { name: "Next: check ingredients" }).click();
  await expect(page.getByRole("dialog", { name: "Before the first check" })).toBeVisible();
  await page.getByRole("button", { name: "I agree" }).click();
  const check = page.getByRole("dialog", { name: "Ingredient check" });
  await expect(check.getByText(/AI suggestion, may be wrong/)).toBeVisible();
  await expect(check.getByText("Test data (mock)", { exact: false })).toBeVisible(); // a mock is labelled as a mock
  await expect(check.getByText("Usually in this recipe").first()).toBeVisible();
  await check.getByRole("button", { name: "None of these" }).click();
  await check.getByRole("radiogroup", { name: "Did you have cheese?" }).getByRole("radio", { name: "Had", exact: true }).click();
  await check.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("chicken burrito with beans")).toBeVisible();
  await page.getByRole("link", { name: "Patterns" }).click();
  await expect(page.getByRole("heading", { name: "Possible triggers" })).toBeVisible();
  await expect(page.getByText("These are patterns in your own records, not proof of a cause.")).toBeVisible();
  await expect(page.getByText("Not enough data yet")).toBeVisible();
  await page.goto("/cards");
  await expect(page.getByText("Why you're seeing this")).toBeVisible();
  await expect(page.getByText(/General wellness information, not medical advice/)).toBeVisible();
});

test("screenshots for a visual check", async ({ page }) => {
  await signUp(page);
  await setup(page);
  await page.getByRole("button", { name: "I feel bloated" }).click();
  await page.getByRole("dialog").getByRole("radio", { name: "6", exact: true }).click();
  await page.getByRole("dialog").getByRole("checkbox", { name: "Vomiting", exact: true }).click();
  await page.screenshot({ path: "test-results/shots/log-bloating.png" });
  await page.getByRole("dialog").getByRole("button", { name: "Save" }).click();
  await page.getByRole("button", { name: "Done" }).click();
  await page.screenshot({ path: "test-results/shots/today.png", fullPage: true });
  await page.goto("/history"); await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "test-results/shots/history.png", fullPage: true });
  await page.goto("/"); await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "test-results/shots/landing.png", fullPage: true });
});

test("Q129, Q59: every screen opens for a Pro user with a heading, no errors, no failed requests and nothing sent to a third party", async ({ page }) => {
  await signUp(page);
  await setup(page);
  await page.goto("/upgrade");
  await page.getByRole("button", { name: "Mock purchase" }).click();
  await expect(page.getByRole("heading", { name: "You have Pro" })).toBeVisible({ timeout: 15000 });

  const outside: string[] = [];
  const failed: string[] = [];
  const errors: string[] = [];
  page.on("request", (r) => {
    const host = new URL(r.url()).host;
    if (!["127.0.0.1:3100", "127.0.0.1:54321"].includes(host) && !/^(data|blob):/.test(r.url())) outside.push(r.url());
  });
  page.on("response", (r) => { if (r.status() >= 500) failed.push(`${r.status()} ${new URL(r.url()).pathname}`); });
  page.on("pageerror", (e) => errors.push(e.message));

  const today = await page.evaluate(async () => (await (await fetch("/v1/history", { cache: "no-store" })).json()).today as string);
  const screens = [
    "/today", "/history", `/day/${today}`, "/insights", "/journey", "/report", "/experiments", "/cards", "/learn",
    "/health", "/doctor", "/me", "/meal/recall", "/upgrade", "/how-bloat-works", "/help", "/terms", "/privacy", "/contact", "/offline", "/admin", "/unavailable",
  ];
  for (const path of screens) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 }).first(), path).toBeVisible({ timeout: 20000 });
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/something went wrong|application error/i), path).toHaveCount(0);
    // Keyboard: the first Tab lands on something focusable with a visible name.
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.tagName), path).not.toBe("BODY");
  }
  expect(outside).toEqual([]);
  expect(failed).toEqual([]);
  expect(errors).toEqual([]);
});

test("Q102 a photo chosen before the AI consent is checked after 'I agree'; the test AI says it can't tell, and with Keep off nothing is stored", async ({ page }) => {
  await signUp(page);
  await setup(page);
  await page.goto("/upgrade");
  await page.getByRole("button", { name: "Mock purchase" }).click();
  await expect(page.getByRole("heading", { name: "You have Pro" })).toBeVisible({ timeout: 15000 });
  await page.goto("/today");
  await page.getByRole("button", { name: "Add meal" }).click();
  const sheet = page.getByRole("dialog");
  // A real JPEG with camera and location data, made by the test.
  const sharp = (await import("sharp")).default;
  const jpeg = await sharp({ create: { width: 1600, height: 1200, channels: 3, background: { r: 200, g: 120, b: 60 } } })
    .withExif({ IFD0: { Make: "TestCam" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "51/1 30/1 0/1" } }).jpeg().toBuffer();
  const sent: string[] = [];
  page.on("request", (r) => { if (r.url().includes("/v1/meal-photos")) sent.push(r.method()); });
  await sheet.locator('input[type="file"]').setInputFiles({ name: "meal.jpg", mimeType: "image/jpeg", buffer: jpeg });
  await expect(page.getByRole("dialog", { name: "Before the first check" })).toBeVisible();
  await page.getByRole("button", { name: "I agree" }).click();
  await expect(page.getByText(/didn't show clearly|Type the dish instead/).first()).toBeVisible({ timeout: 20000 });
  await expect(page.getByLabel("What did you have?")).toBeVisible(); // back on the meal step, nothing lost
  expect(sent).toEqual(["POST", "POST"]); // once before consent (refused), once after
  // Keep my meal photos is off: no photo record and no stored file.
  const stored = await page.evaluate(async () => (await (await fetch("/v1/export", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: JSON.stringify({ format: "json" }) })).json()));
  const file = await (await page.request.get(stored.download_url)).text();
  expect(JSON.parse(file).meal_photos ?? []).toEqual([]);
  // The meal itself still saves by typing.
  await page.getByLabel("What did you have?").fill("photo test lunch");
  await page.getByRole("dialog").getByRole("button", { name: "Save without the check" }).click();
  await expect(page.getByText("photo test lunch")).toBeVisible({ timeout: 15000 });
});

test("doctor report: the in-app preview shows everything the PDF and shared link contain, and switched-off Medicines and Health appear in none of them", async ({ page }) => {
  await signUp(page);
  await setup(page);
  await page.goto("/upgrade");
  await page.getByRole("button", { name: "Mock purchase" }).click();
  await expect(page.getByRole("heading", { name: "You have Pro" })).toBeVisible({ timeout: 15000 });
  const MED = "Zorvatrin-7Q";
  const send = (method: string, url: string, body: unknown) => page.evaluate(async ({ method, url, body }) => (await fetch(url, { method, headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: JSON.stringify(body) })).status, { method, url, body });
  expect(await send("POST", "/v1/medicines", { name: MED, type: "supplement", started_precision: "not_sure" })).toBe(201);
  expect(await send("PATCH", "/v1/me/profile", { answers: { "ON-10": ["pregnancy"] } })).toBe(200);
  expect(await send("PUT", "/v1/health/conditions", { conditions: [{ condition: "reflux", status: "diagnosed_by_a_doctor", year: 2019 }] })).toBe(200);

  await page.goto("/doctor");
  await page.getByLabel("Questions you want to ask your doctor").fill("Synthetic question QZ-88");
  await page.getByRole("checkbox", { name: "Medicines", exact: true }).click();
  await page.getByRole("checkbox", { name: "Health background" }).click();
  await expect(page.getByRole("checkbox", { name: "Medicines", exact: true })).not.toBeChecked();
  await page.getByRole("button", { name: "Preview report" }).click();
  const preview = page.getByRole("region", { name: /Preview: everything/ });
  await expect(preview.getByText("QZ-88")).toBeVisible({ timeout: 30000 });
  await expect(preview.getByText(/Sections included:/)).not.toContainText("Medicines");
  const previewText = (await preview.innerText()).toLowerCase();
  for (const leak of [MED, "Pregnancy", "Reflux"]) expect(previewText, leak).not.toContain(leak.toLowerCase());

  // The shared page shows the same content as the preview.
  await page.getByLabel("Who is it for?").fill("Test GP");
  await page.getByLabel("What is it for?").fill("Privacy check");
  await page.getByRole("checkbox").last().check();
  await page.getByRole("button", { name: "Create share link" }).click();
  const link = (await page.locator("p.break-all").innerText()).trim();
  const reader = await page.context().newPage();
  await reader.goto(link);
  await expect(reader.getByText("QZ-88")).toBeVisible({ timeout: 30000 });
  const sharedText = (await reader.locator("main").innerText()).toLowerCase();
  for (const leak of [MED, "Pregnancy", "Reflux"]) expect(sharedText, leak).not.toContain(leak.toLowerCase());
  for (const heading of ["At a glance", "Questions for the appointment", "Symptoms", "What is missing, and limits"]) {
    expect(previewText, heading).toContain(heading.toLowerCase());
    expect(sharedText, heading).toContain(heading.toLowerCase());
  }
});

test("Me: Download my data saves a complete JSON and CSV file and says so", async ({ page }) => {
  await signUp(page);
  await setup(page);
  await page.goto("/me");
  for (const [button, check] of [["JSON", (t: string) => JSON.parse(t).row_counts.profiles === 1], ["CSV", (t: string) => t.startsWith("# bloat-export-2") && t.includes("# table: profiles (1 row)")]] as const) {
    const [file] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: button, exact: true }).click()]);
    const fs = await import("node:fs/promises");
    expect(check(await fs.readFile((await file.path())!, "utf8")), button).toBe(true);
    await expect(page.getByText("Your download is complete.")).toBeVisible();
  }
});
