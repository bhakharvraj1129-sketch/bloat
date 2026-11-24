import { expect, test, type BrowserContext, type Locator, type Page } from "@playwright/test";

// Keyboard-only main journeys and 200% browser zoom (23 Nov 2026). LOCAL stack, synthetic accounts.
//
// Keyboard: every step is reached with Tab (or Shift+Tab) and used with Enter, Space or Escape only.
// Nothing is clicked and focus is never moved by the test itself, so a control that Tab cannot reach
// fails the check.
// 200% zoom: a 1280 x 800 desktop window zoomed to 200% lays the page out at 640 x 400 CSS pixels with
// twice the pixel density; that is how the browser's own zoom works, so it is emulated exactly that way.
// Not covered here: a screen reader (needs a person with VoiceOver, TalkBack or NVDA).
//
// Focus after a sheet closes (defect K1, found 23 Nov 2026): when a save removes the button that opened
// the sheet, focus goes to the control that replaced it, or else to the nearest meaningful heading,
// and the next Tab continues from there. The four reported cases are checked below.

const HELP_VERSION = "nhs-bloating-2026-11-07";
const PASSWORD = "synthetic-password-1";
const SIZES = {
  "desktop at 100%": { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
  "desktop at 200% zoom": { viewport: { width: 640, height: 400 }, deviceScaleFactor: 2 },
} as const;

async function account(context: BrowserContext): Promise<{ page: Page; email: string; api: (m: string, u: string, b?: unknown) => Promise<any> }> {
  const page = await context.newPage();
  await page.goto("/");
  const email = `a11y-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
  expect((await page.request.post("/v1/auth/test-login", { data: { email, password: PASSWORD, create: true } })).ok()).toBe(true);
  const api = (method: string, url: string, body?: unknown) => page.evaluate(async ({ method, url, body }) => {
    const r = await fetch(url, { method, headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store" });
    return { status: r.status, body: await r.json().catch(() => null) };
  }, { method, url, body });
  expect((await api("POST", "/v1/onboarding/commit", {
    age_18_or_older: "yes", country: "US", time_zone: "America/New_York", units: "us",
    help: { viewed_at: new Date().toISOString(), page_version: HELP_VERSION }, consents: ["terms_privacy", "health_data", "wellness_ack"],
    answers: [], medicines: [], followed: [],
  })).status).toBe(201);
  return { page, email, api };
}

/** Press Tab (or Shift+Tab) until the target has focus; fail if it is never reached. Returns the presses used. */
async function tabTo(page: Page, target: Locator, max = 80): Promise<number> {
  await expect(target).toHaveCount(1);
  for (const key of ["Tab", "Shift+Tab"]) {
    for (let i = 0; i < max; i++) {
      if (await target.evaluate((el) => el === document.activeElement)) return i;
      await page.keyboard.press(key);
    }
  }
  throw new Error(`Not reachable with Tab or Shift+Tab: ${target}`);
}
/** The focused control shows a visible focus indicator. */
async function expectRing(page: Page) {
  const ring = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const c = getComputedStyle(el);
    return { outline: c.outlineStyle !== "none" && parseFloat(c.outlineWidth) >= 2, shadow: c.boxShadow !== "none", tag: el.tagName, text: (el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 40) };
  });
  expect(ring.outline || ring.shadow, `visible focus on ${ring.tag} "${ring.text}"`).toBe(true);
}
const focusInside = (page: Page, dialog: Locator) => dialog.evaluate((d) => d.contains(document.activeElement));
const focusedName = async (page: Page) => { await page.waitForTimeout(400); return page.evaluate(() => { const el = document.activeElement as HTMLElement | null; return el && el !== document.body ? (el.getAttribute("aria-label") ?? el.textContent ?? "").trim() : "BODY"; }); };

for (const [label, size] of Object.entries(SIZES)) {
  test.describe(`keyboard only, ${label}`, () => {
    test.use({ ...size, isMobile: false, hasTouch: false });

    test("sign in, log bloating, close a sheet with Escape, add, edit and delete a meal, change units, export, sign out", async ({ context }) => {
      test.setTimeout(120_000);
      const { page, email, api } = await account(context);
      const today = (await api("GET", "/v1/me/state")).body.today.date as string;
      await context.clearCookies();

      // 1. Sign in with the keyboard (email and password on the preview; the test-password form locally).
      await page.goto("/sign-in");
      await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
      await tabTo(page, page.getByLabel("Email"));
      await expectRing(page);
      await page.keyboard.type(email);
      const password = page.getByLabel("Password", { exact: true });
      const passwordMode = (await password.count()) === 1;
      await tabTo(page, passwordMode ? password : page.getByLabel("Test password"));
      await page.keyboard.type(PASSWORD);
      await tabTo(page, page.getByRole("button", { name: passwordMode ? "Sign in" : "Sign in with test password", exact: true }));
      await expectRing(page);
      await page.keyboard.press("Enter");
      await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible({ timeout: 30000 });

      // 2. Log bloating: open the sheet, choose 5, save.
      await tabTo(page, page.getByRole("button", { name: "I feel bloated" }));
      await expectRing(page);
      await page.keyboard.press("Enter");
      const log = page.getByRole("dialog", { name: "Log bloating" });
      await expect(log).toBeVisible();
      expect(await focusInside(page, log), "focus moves into the sheet").toBe(true);
      await tabTo(page, log.getByRole("radio", { name: "5", exact: true }));
      await expectRing(page);
      await page.keyboard.press("Space");
      await expect(log.getByRole("radio", { name: "5", exact: true })).toHaveAttribute("aria-checked", "true");
      await tabTo(page, log.getByRole("button", { name: "Save" }));
      await page.keyboard.press("Enter");
      await expect(log).toBeHidden({ timeout: 20000 });
      await expect.poll(async () => (await api("GET", "/v1/me/state")).body.open_episode?.current_strength).toBe(5);
      await expect(page.getByRole("button", { name: /Bloating ongoing/ }), "focus moves to the button that replaced I feel bloated").toBeFocused();

      // 3. Escape closes a sheet and returns focus to the button that opened it.
      const addMeal = page.getByRole("button", { name: "Add meal" });
      await tabTo(page, addMeal);
      await page.keyboard.press("Enter");
      const sheet = page.getByRole("dialog", { name: "Add meal" });
      await expect(sheet).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(sheet).toBeHidden();
      await expect(addMeal, "focus returns to Add meal").toBeFocused();

      // 4. Add a meal.
      await page.keyboard.press("Enter");
      await expect(sheet).toBeVisible();
      await tabTo(page, sheet.getByLabel("What did you have?"));
      await page.keyboard.type("Keyboard toast");
      await tabTo(page, sheet.getByRole("button", { name: "Save", exact: true }));
      await page.keyboard.press("Enter");
      await expect(sheet).toBeHidden({ timeout: 20000 });
      await expect(addMeal, "focus returns to Add meal after saving").toBeFocused();
      await expect.poll(async () => (await api("GET", `/v1/days/${today}`)).body.meals.map((m: any) => m.dish_text)).toEqual(["Keyboard toast"]);

      // 5. History, then the day: edit the meal's text, then delete it.
      await tabTo(page, page.getByRole("link", { name: "History", exact: true }));
      await expectRing(page);
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/history$/);
      await tabTo(page, page.locator(`a[href="/day/${today}"]`));
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new RegExp(`/day/${today}$`));
      const mealRow = page.locator("div, li, article").filter({ hasText: "Keyboard toast" }).filter({ has: page.getByRole("button", { name: "Edit", exact: true }) }).last();
      await tabTo(page, mealRow.getByRole("button", { name: "Edit", exact: true }));
      await page.keyboard.press("Enter");
      const edit = page.getByRole("dialog", { name: "Edit meal" });
      await expect(edit).toBeVisible();
      await tabTo(page, edit.getByLabel("What did you have?"));
      await page.keyboard.press("ControlOrMeta+a");
      await page.keyboard.type("Keyboard toast, edited");
      await tabTo(page, edit.getByRole("button", { name: "Save changes" }));
      await page.keyboard.press("Enter");
      await expect(edit).toBeHidden({ timeout: 20000 });
      expect(await focusedName(page), "focus returns to the Edit button after saving").toBe("Edit");
      await expect.poll(async () => (await api("GET", `/v1/days/${today}`)).body.meals.map((m: any) => m.dish_text)).toEqual(["Keyboard toast, edited"]);
      const editedRow = page.locator("div, li, article").filter({ hasText: "Keyboard toast, edited" }).filter({ has: page.getByRole("button", { name: "Delete", exact: true }) }).last();
      await tabTo(page, editedRow.getByRole("button", { name: "Delete", exact: true }));
      await page.keyboard.press("Enter");
      const confirm = page.getByRole("dialog", { name: "Delete this?" });
      await expect(confirm).toBeVisible();
      await tabTo(page, confirm.getByRole("button", { name: "Delete", exact: true }));
      await page.keyboard.press("Enter");
      await expect.poll(async () => (await api("GET", `/v1/days/${today}`)).body.meals.length).toBe(0);
      await expect(confirm).toBeHidden();
      await expect(page.getByRole("heading", { level: 1 }), "the day had no other meal, so focus goes to the screen title").toBeFocused();

      // 6. You: change units, export JSON.
      await tabTo(page, page.getByRole("link", { name: "You", exact: true }));
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/me$/);
      const metric = page.getByRole("radiogroup", { name: "Units" }).getByRole("radio", { name: "Metric" });
      await tabTo(page, metric);
      await expectRing(page);
      await page.keyboard.press("Space");
      await expect.poll(async () => (await api("GET", "/v1/me/state")).body.profile.units).toBe("metric");
      const download = page.waitForEvent("download");
      await tabTo(page, page.getByRole("button", { name: "JSON", exact: true }));
      await page.keyboard.press("Enter");
      await expect(page.getByText("Your download is complete.")).toBeVisible({ timeout: 20000 });
      expect((await download).suggestedFilename()).toMatch(/\.json$/);

      // 7. Sign out.
      await tabTo(page, page.getByRole("button", { name: "Sign out" }));
      await page.keyboard.press("Enter");
      await expect(page).not.toHaveURL(/\/me$/, { timeout: 20000 });
      await page.goto("/today");
      await expect(page).toHaveURL(/\/sign-in/);
    });
  });
}

test.describe("200% browser zoom (1280 x 800 window)", () => {
  test.use({ ...SIZES["desktop at 200% zoom"], isMobile: false, hasTouch: false });

  test("main screens: no sideways scrolling, no control outside the screen, no clipped text, nothing hidden under the tab bar", async ({ context }) => {
    test.setTimeout(120_000);
    const { page, api } = await account(context);
    expect((await api("POST", "/v1/meals", { save_key: crypto.randomUUID(), dish_text: "Zoom toast", eaten: { mode: "now" } })).status).toBe(201);
    const today = (await api("GET", "/v1/me/state")).body.today.date as string;
    const problems: string[] = [];
    for (const path of ["/", "/today", "/history", `/day/${today}`, "/insights", "/experiments", "/me", "/help", "/upgrade", "/doctor", "/privacy"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 }).first(), path).toBeVisible({ timeout: 20000 });
      await page.waitForLoadState("networkidle");
      const found = await page.evaluate(() => {
        const out: string[] = [];
        const W = window.innerWidth;
        if (document.documentElement.scrollWidth > W + 1) out.push(`page scrolls sideways (${document.documentElement.scrollWidth} > ${W})`);
        const visible = (el: Element) => { const r = el.getBoundingClientRect(); const c = getComputedStyle(el); return r.width > 0 && r.height > 0 && c.visibility !== "hidden" && c.display !== "none"; };
        const name = (el: Element) => ((el.getAttribute("aria-label") ?? el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40));
        for (const el of document.querySelectorAll("a, button, input, select, textarea, [role=radio], [role=checkbox]")) {
          if (!visible(el)) continue;
          const r = el.getBoundingClientRect();
          if (r.left < -1 || r.right > W + 1) out.push(`control outside the screen: ${el.tagName} "${name(el)}" (${Math.round(r.left)} to ${Math.round(r.right)})`);
        }
        for (const el of document.querySelectorAll("body *")) {
          if (!visible(el) || !(el as HTMLElement).innerText?.trim()) continue;
          const c = getComputedStyle(el);
          const clips = ["hidden", "clip"].includes(c.overflowX) || c.textOverflow === "ellipsis";
          if (clips && el.scrollWidth > el.clientWidth + 2) out.push(`text cut off: ${el.tagName} "${name(el)}"`);
        }
        // The last control in the page can be scrolled clear of anything fixed on top of it (the tab bar).
        const controls = [...document.querySelectorAll("main a, main button, main input, main textarea")].filter(visible);
        const last = controls[controls.length - 1] as HTMLElement | undefined;
        if (last) {
          last.scrollIntoView({ block: "center" });
          const r = last.getBoundingClientRect();
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          if (hit && hit !== last && !last.contains(hit)) out.push(`last control "${name(last)}" is covered by ${hit.tagName} "${name(hit)}"`);
        }
        return out;
      });
      problems.push(...found.map((f) => `${path}: ${f}`));
    }
    expect(problems).toEqual([]);
  });

  test("sheets at 200%: the form scrolls inside the sheet and Save is reachable and works (bloating, meal, edit)", async ({ context }) => {
    test.setTimeout(120_000);
    const { page, api } = await account(context);
    const today = (await api("GET", "/v1/me/state")).body.today.date as string;
    await page.goto("/today");
    await page.getByRole("button", { name: "I feel bloated" }).click();
    const log = page.getByRole("dialog", { name: "Log bloating" });
    await log.getByRole("radio", { name: "3", exact: true }).click();
    const save = log.getByRole("button", { name: "Save" });
    await save.scrollIntoViewIfNeeded();
    await expect(save).toBeInViewport();
    await save.click();
    await expect(log).toBeHidden({ timeout: 20000 });
    await page.getByRole("button", { name: "Add meal" }).click();
    const meal = page.getByRole("dialog", { name: "Add meal" });
    await meal.getByLabel("What did you have?").fill("Zoom lunch");
    const mealSave = meal.getByRole("button", { name: "Save", exact: true });
    await mealSave.scrollIntoViewIfNeeded();
    await expect(mealSave).toBeInViewport();
    await mealSave.click();
    await expect(meal).toBeHidden({ timeout: 20000 });
    await page.goto(`/day/${today}`);
    const row = page.locator("div, li, article").filter({ hasText: "Zoom lunch" }).filter({ has: page.getByRole("button", { name: "Edit", exact: true }) }).last();
    await row.getByRole("button", { name: "Edit", exact: true }).click();
    const edit = page.getByRole("dialog", { name: "Edit meal" });
    await edit.getByLabel("What did you have?").fill("Zoom lunch, edited");
    const editSave = edit.getByRole("button", { name: "Save changes" });
    await editSave.scrollIntoViewIfNeeded();
    await expect(editSave).toBeInViewport();
    await editSave.click();
    await expect(edit).toBeHidden({ timeout: 20000 });
    const state = (await api("GET", "/v1/me/state")).body;
    expect(state.open_episode?.current_strength).toBe(3);
    expect((await api("GET", `/v1/days/${today}`)).body.meals.map((m: any) => m.dish_text)).toEqual(["Zoom lunch, edited"]);
    await page.screenshot({ path: "test-results/zoom-200-day.png", fullPage: true });
  });
});

/** Press Tab once and check focus lands on the first control after the restored position, in page order. */
async function nextTabContinuesHere(page: Page) {
  const found = await page.evaluate(() => {
    const from = document.activeElement as HTMLElement;
    const all = [...document.querySelectorAll<HTMLElement>("a[href], button, input, select, textarea, [tabindex]")]
      .filter((el) => el.tabIndex >= 0 && !(el as HTMLButtonElement).disabled && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden");
    const next = all.find((el) => !from.contains(el) && (from.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING));
    document.querySelectorAll("[data-next-expected]").forEach((e) => e.removeAttribute("data-next-expected"));
    next?.setAttribute("data-next-expected", "");
    return next ? (next.getAttribute("aria-label") ?? next.textContent ?? "").trim().slice(0, 40) : null;
  });
  expect(found, "there is a control after the restored position").not.toBeNull();
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.hasAttribute("data-next-expected")), `next Tab goes to "${found}"`).toBe(true);
}

test.describe("focus after a save removes the button that opened the sheet (K1)", () => {
  test.use({ ...SIZES["desktop at 100%"], isMobile: false, hasTouch: false });

  test("1. saving Log bloating: focus moves to its replacement, Bloating ongoing, and the next Tab continues from there", async ({ context }) => {
    const { page } = await account(context);
    await page.goto("/today");
    await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible();
    await tabTo(page, page.getByRole("button", { name: "I feel bloated" }));
    await page.keyboard.press("Enter");
    const log = page.getByRole("dialog", { name: "Log bloating" });
    await tabTo(page, log.getByRole("radio", { name: "5", exact: true }));
    await page.keyboard.press("Space");
    await tabTo(page, log.getByRole("button", { name: "Save" }));
    await page.keyboard.press("Enter");
    await expect(log).toBeHidden({ timeout: 20000 });
    await expect(page.getByRole("button", { name: /Bloating ongoing/ })).toBeFocused();
    await expectRing(page);
    await nextTabContinuesHere(page);
  });

  test("2. ending bloating: focus moves to its replacement, I feel bloated, and the next Tab continues from there", async ({ context }) => {
    const { page, api } = await account(context);
    expect((await api("POST", "/v1/episodes", { strength: 4, started: { mode: "now" } })).status).toBe(201);
    await page.goto("/today");
    await tabTo(page, page.getByRole("button", { name: /Bloating ongoing/ }));
    await page.keyboard.press("Enter");
    const now = page.getByRole("dialog", { name: "Bloating now" });
    await tabTo(page, now.getByRole("button", { name: "Bloating gone" }));
    await page.keyboard.press("Enter");
    const end = page.getByRole("dialog", { name: "Bloating ended" });
    await tabTo(page, end.getByRole("button", { name: "Save" }));
    await page.keyboard.press("Enter");
    await expect(end.getByText(/Lasted/)).toBeVisible({ timeout: 20000 });
    await tabTo(page, end.getByRole("button", { name: "Done" }));
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "I feel bloated" })).toBeFocused();
    await nextTabContinuesHere(page);
  });

  test("3. deleting one of two meals: focus moves to the Meals heading, and the next Tab continues from there", async ({ context }) => {
    const { page, api } = await account(context);
    for (const dish of ["First test meal", "Second test meal"]) expect((await api("POST", "/v1/meals", { save_key: crypto.randomUUID(), dish_text: dish, eaten: { mode: "now" } })).status).toBe(201);
    const today = (await api("GET", "/v1/me/state")).body.today.date as string;
    await page.goto(`/day/${today}`);
    const row = page.locator("div").filter({ hasText: "Second test meal" }).filter({ has: page.getByRole("button", { name: "Delete", exact: true }) }).last();
    await tabTo(page, row.getByRole("button", { name: "Delete", exact: true }));
    await page.keyboard.press("Enter");
    const confirm = page.getByRole("dialog", { name: "Delete this?" });
    await tabTo(page, confirm.getByRole("button", { name: "Delete", exact: true }));
    await page.keyboard.press("Enter");
    await expect(page.getByText("Second test meal")).toHaveCount(0, { timeout: 20000 });
    await expect(page.getByRole("heading", { name: "Meals" })).toBeFocused();
    await expectRing(page);
    await nextTabContinuesHere(page);
  });

  test("4. deleting the only bloating record: its section goes, so focus moves to the screen title, and the next Tab continues from there", async ({ context }) => {
    const { page, api } = await account(context);
    const ep = await api("POST", "/v1/episodes", { strength: 3, started: { mode: "now" } });
    expect(ep.status).toBe(201);
    expect((await api("POST", `/v1/episodes/${ep.body.episode.id}/end`, { ended: { mode: "now" } })).status).toBeLessThan(300);
    expect((await api("POST", "/v1/meals", { save_key: crypto.randomUUID(), dish_text: "Meal that stays", eaten: { mode: "now" } })).status).toBe(201);
    const today = (await api("GET", "/v1/me/state")).body.today.date as string;
    await page.goto(`/day/${today}`);
    const section = page.locator("section", { has: page.getByRole("heading", { name: "Bloating", exact: true }) });
    await tabTo(page, section.getByRole("button", { name: "Delete", exact: true }));
    await page.keyboard.press("Enter");
    const confirm = page.getByRole("dialog", { name: "Delete this?" });
    await tabTo(page, confirm.getByRole("button", { name: "Delete", exact: true }));
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Bloating", exact: true })).toHaveCount(0, { timeout: 20000 });
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    await nextTabContinuesHere(page);
  });

  test("normal return is kept, and focus is never taken back once the person has moved on", async ({ context }) => {
    const { page, api } = await account(context);
    expect((await api("POST", "/v1/meals", { save_key: crypto.randomUUID(), dish_text: "Meal to edit", eaten: { mode: "now" } })).status).toBe(201);
    const today = (await api("GET", "/v1/me/state")).body.today.date as string;
    // The button that opened the sheet still exists: focus goes back to it (Escape and Save).
    await page.goto(`/day/${today}`);
    const edit = page.getByRole("button", { name: "Edit", exact: true });
    await tabTo(page, edit);
    await page.keyboard.press("Enter");
    await page.keyboard.press("Escape");
    await expect(edit).toBeFocused();
    // Saving Log bloating, then moving focus elsewhere at once: when Today reloads a moment later
    // and replaces I feel bloated, focus stays where the person put it.
    await page.goto("/today");
    await tabTo(page, page.getByRole("button", { name: "I feel bloated" }));
    await page.keyboard.press("Enter");
    const log = page.getByRole("dialog", { name: "Log bloating" });
    await tabTo(page, log.getByRole("radio", { name: "2", exact: true }));
    await page.keyboard.press("Space");
    await tabTo(page, log.getByRole("button", { name: "Save" }));
    await page.keyboard.press("Enter");
    await expect(log).toBeHidden({ timeout: 20000 });
    const elsewhere = page.getByRole("link", { name: "History", exact: true });
    await elsewhere.focus();
    await page.waitForTimeout(5500);
    await expect(elsewhere).toBeFocused();
  });
});
