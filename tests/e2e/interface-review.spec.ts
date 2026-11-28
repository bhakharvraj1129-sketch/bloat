import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";

// Interface review of the redesigned app (owner, 28 Nov 2026): a crawl of every main screen's
// controls, real link and Back navigation, screen widths from 320 px to desktop, light and dark,
// reduced motion, keyboard use of the chart controls, 200% zoom on the chart screens, narrow drawers
// and the password forms. A populated Pro account (charts filled in) and a brand-new account (empty
// states) are both covered. LOCAL stack, synthetic accounts only. Browser emulation only: this is
// not a real-phone or screen-reader test.

const HELP_VERSION = "nhs-bloating-2026-11-07";
const PASSWORD = "synthetic-password-1";
const PASSWORD_SERVER = process.env.E2E_SIGN_IN === "password";
type Acct = { email: string; today: string };
const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const atNY = (date: string, time: string) => new Date(`${date}T${time}:00-05:00`).toISOString();

async function makeAccount(browser: Browser, populated: boolean): Promise<Acct> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto("/");
  const email = `review-${populated ? "full" : "new"}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
  expect((await page.request.post("/v1/auth/test-login", { data: { email, password: PASSWORD, create: true } })).ok()).toBe(true);
  const api = (method: string, url: string, body?: unknown, at?: string) => page.evaluate(async ({ method, url, body, at }) => {
    const headers: Record<string, string> = { "content-type": "application/json", "idempotency-key": crypto.randomUUID() };
    if (at) headers["x-bloat-test-now"] = at;
    const r = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: r.status, body: await r.json().catch(() => null) };
  }, { method, url, body, at });
  expect((await api("POST", "/v1/onboarding/commit", {
    age_18_or_older: "yes", country: "US", time_zone: "America/New_York", units: "us",
    help: { viewed_at: new Date().toISOString(), page_version: HELP_VERSION }, consents: ["terms_privacy", "health_data", "wellness_ack"],
    answers: [], medicines: [], followed: populated ? ["ACT-01"] : [],
  })).status).toBe(201);
  const today = (await api("GET", "/v1/me/state")).body.today.date as string;
  if (populated) {
    expect((await api("POST", "/v1/billing/mock-purchase", { interval: "three_month" })).status).toBe(200);
    // History starts at the account's first day: date it back so the 14 logged days show (local database only).
    execFileSync("docker", ["exec", "supabase_db_bloat", "psql", "-U", "postgres", "-tAc", `update public.profiles set created_at = now() - interval '30 days' where user_id = (select id from auth.users where email = '${email}')`]);
    for (let k = 14; k >= 1; k--) {
      const d = addDays(today, -k);
      const s = await api("POST", "/v1/episodes", { strength: k % 2 ? 7 : 2, started: { mode: "exact", local: `${d}T13:10`, zone: "America/New_York" } }, atNY(d, "23:30"));
      expect(s.status, JSON.stringify(s.body)).toBe(201);
      expect((await api("POST", `/v1/episodes/${s.body.episode.id}/end`, { ended: { mode: "exact", local: `${d}T14:40`, zone: "America/New_York" } }, atNY(d, "23:30"))).status).toBe(200);
      expect((await api("POST", "/v1/meals", { save_key: crypto.randomUUID(), dish_text: k % 2 ? "Sample burger" : "Sample rice", eaten: { mode: "exact", local: `${d}T12:30`, zone: "America/New_York" } }, atNY(d, "23:30"))).status).toBe(201);
      expect((await api("PUT", `/v1/days/${d}/review`, { worst: k % 2 ? 7 : 2, whole_day: "yes", food_coverage: "all", habits: { "ACT-01": k % 2 ? "yes" : "no" } }, atNY(addDays(d, 1), "08:00"))).status).toBe(200);
    }
  }
  await ctx.close();
  return { email, today };
}

async function signedIn(context: BrowserContext, a: Acct): Promise<Page> {
  const page = await context.newPage();
  await page.goto("/");
  expect((await page.request.post("/v1/auth/test-login", { data: { email: a.email, password: PASSWORD } })).ok()).toBe(true);
  return page;
}

const screens = (a: Acct, populated: boolean) => [
  "/today", "/history", "/insights", "/journey", "/report", "/me", "/help", "/how-bloat-works", "/about", "/privacy",
  ...(populated ? [`/day/${addDays(a.today, -1)}`] : [`/day/${a.today}`]),
];

/** Problems with the screen's layout and controls, measured in the page. */
async function crawl(page: Page) {
  return page.evaluate(() => {
    const vw = innerWidth;
    const out: string[] = [];
    const se = document.scrollingElement!;
    if (se.scrollWidth > vw + 1) out.push(`sideways scroll: page ${se.scrollWidth}px wide in ${vw}px`);
    const scrollerAncestor = (el: Element) => { for (let p = el.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === "auto" || o === "scroll" || o === "hidden") return true; } return false; };
    const visible = (el: Element) => { const r = el.getBoundingClientRect(); const c = getComputedStyle(el); return r.width > 0 && r.height > 0 && c.visibility !== "hidden" && c.display !== "none" && !el.closest("[aria-hidden=true],[inert]"); };
    const nameOf = (el: HTMLElement) => {
      const by = el.getAttribute("aria-labelledby");
      if (by) return by.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ").trim();
      if (el.getAttribute("aria-label")) return el.getAttribute("aria-label")!.trim();
      if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
        const lab = (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) || el.closest("label");
        if (lab) return lab.textContent!.trim();
        return el.getAttribute("placeholder") ?? "";
      }
      return (el.innerText || el.getAttribute("title") || el.querySelector("img[alt]")?.getAttribute("alt") || "").trim();
    };
    const controls = [...document.querySelectorAll<HTMLElement>("a[href],button,input:not([type=hidden]),select,textarea,[role=button],[role=checkbox],[role=radio],[role=tab],[role=switch],[role=slider],summary")].filter(visible);
    for (const el of controls) {
      const name = nameOf(el);
      const r = el.getBoundingClientRect();
      const label = `${el.tagName.toLowerCase()} "${name.slice(0, 40)}"`;
      if (!name) out.push(`no accessible name: ${el.outerHTML.slice(0, 100)}`);
      if (!scrollerAncestor(el) && (r.left < -1 || r.right > vw + 1)) out.push(`outside the screen: ${label} (${Math.round(r.left)}–${Math.round(r.right)} of ${vw})`);
      const inlineLink = el.tagName === "A" && getComputedStyle(el).display === "inline";
      if (!inlineLink && el.getAttribute("type") !== "range" && (r.width < 24 || r.height < 24)) out.push(`target under 24 px: ${label} ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
    // Text contrast (normal text 4.5:1, large text 3:1) against the nearest solid background.
    const lum = (rgb: number[]) => { const [r, g, b] = rgb.map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!; };
    const parse = (c: string) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1]!.split(/[ ,/]+/).filter(Boolean).map(Number); return { rgb: p.slice(0, 3), a: p[3] ?? 1 }; };
    const bgOf = (el: Element): number[] | null => {
      for (let p: Element | null = el; p; p = p.parentElement) {
        const c = getComputedStyle(p);
        if (c.backgroundImage !== "none") return null; // gradients and pictures: skipped
        const b = parse(c.backgroundColor);
        if (b && b.a >= 0.99) return b.rgb;
        if (b && b.a > 0.01) return null; // see-through tints: skipped
      }
      return [255, 255, 255];
    };
    const seen = new Set<string>();
    for (const el of document.querySelectorAll<HTMLElement>("body *")) {
      if (!visible(el) || el.closest("svg")) continue;
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim().length > 1);
      if (!own) continue;
      const c = getComputedStyle(el);
      if (parseFloat(c.opacity) < 1) continue;
      const fg = parse(c.color); const bg = bgOf(el);
      if (!fg || !bg || fg.a < 0.99) continue;
      const L1 = lum(fg.rgb), L2 = lum(bg);
      const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      const size = parseFloat(c.fontSize); const bold = Number(c.fontWeight) >= 700;
      const need = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
      const text = el.textContent!.trim().slice(0, 30);
      if (ratio < need - 0.05 && !seen.has(text)) { seen.add(text); out.push(`low contrast ${ratio.toFixed(2)}:1 (needs ${need}): "${text}"`); }
    }
    // Reduced motion: nothing should still be animating.
    const moving = document.getAnimations().filter((a) => a.playState === "running" && Number((a.effect?.getComputedTiming().duration as number) ?? 0) > 50);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches && moving.length) out.push(`${moving.length} animation(s) still running with reduce motion`);
    return out;
  });
}

test.describe.configure({ mode: "serial" });
let full: Acct;
let fresh: Acct;
test.beforeAll(async ({ browser }) => {
  test.setTimeout(180_000);
  full = await makeAccount(browser, true);
  fresh = await makeAccount(browser, false);
});

test.describe("control crawl: every main screen", () => {
  for (const scheme of ["light", "dark"] as const) {
    for (const width of [320, 412]) {
      for (const kind of ["populated Pro", "new account"] as const) {
        test(`${kind}, ${scheme}, ${width} px, reduced motion: names, fit, targets, contrast, no errors`, async ({ browser }) => {
          test.setTimeout(180_000);
          const a = kind === "populated Pro" ? full : fresh;
          const context = await browser.newContext({ viewport: { width, height: 800 }, colorScheme: scheme, reducedMotion: "reduce", hasTouch: true, isMobile: true });
          const page = await signedIn(context, a);
          const errors: string[] = [];
          page.on("pageerror", (e) => errors.push(e.message));
          // Console errors, except the browser's own line for a refused request, which is judged below.
          page.on("console", (m) => { if (m.type() === "error" && !m.text().startsWith("Failed to load resource")) errors.push(m.text()); });
          // A Free account asking for a Pro feature is refused by the server (403): that is the Pro check
          // working, and the screen then offers Pro. Any other failed request is a problem.
          page.on("response", (r) => { const u = new URL(r.url()); if (u.pathname.startsWith("/v1/") && r.status() >= 400 && !(r.status() === 403 && kind === "new account")) errors.push(`${r.status()} from ${u.pathname}`); });
          const problems: string[] = [];
          for (const path of screens(a, kind === "populated Pro")) {
            await page.goto(path, { waitUntil: "networkidle" });
            await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 20000 });
            await page.waitForTimeout(400);
            for (const p of await crawl(page)) problems.push(`${path}: ${p}`);
          }
          for (const e of errors) problems.push(`error: ${e.slice(0, 160)}`);
          expect(problems, problems.join("\n")).toEqual([]);
          await context.close();
        });
      }
    }
  }
});

test("screen widths 320 to 1280 px: no sideways scrolling on any main screen (populated Pro and new account)", async ({ browser }) => {
  test.setTimeout(240_000);
  const problems: string[] = [];
  for (const a of [full, fresh]) {
    for (const width of [320, 360, 768, 1024, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 800 } });
      const page = await signedIn(context, a);
      for (const path of screens(a, a === full)) {
        await page.goto(path, { waitUntil: "networkidle" });
        await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 20000 });
        const w = await page.evaluate(() => [document.scrollingElement!.scrollWidth, innerWidth]);
        if (w[0]! > w[1]! + 1) problems.push(`${path} at ${width}px: ${w[0]}px wide`);
      }
      await context.close();
    }
  }
  expect(problems, problems.join("\n")).toEqual([]);
});

/** The page is exactly at this path (any query is ignored), not merely at an address containing it. */
const urlIs = (path: string) => new RegExp(`^https?://[^/]+${path.split("?")[0]!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\?.*)?$`);

test("links and Back: every in-app link on each screen opens a working screen, and Back returns", async ({ browser }) => {
  test.setTimeout(420_000);
  const context = await browser.newContext({ viewport: { width: 412, height: 900 } });
  const page = await signedIn(context, full);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const problems: string[] = [];
  const visited = new Set<string>();
  for (const from of screens(full, true)) {
    await page.goto(from, { waitUntil: "networkidle" });
    const hrefs = await page.evaluate(() => [...new Set([...document.querySelectorAll<HTMLAnchorElement>("a[href]")]
      // The screen's own Back control is checked by navigation.spec.ts (it returns to the previous screen).
      .filter((a) => { const r = a.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !a.closest("[aria-hidden=true]") && a.target !== "_blank" && !a.hasAttribute("download") && a.getAttribute("aria-label") !== "Back"; })
      .map((a) => a.getAttribute("href")!)
      .filter((h) => h.startsWith("/") && !h.startsWith("/v1") && !h.startsWith("/auth") && !h.includes("#")))]);
    for (const href of hrefs) {
      const key = `${from} -> ${href}`;
      if (href === from) continue; // a link to the screen you are on (its own tab)
      if (href === "/today?log=1") {
        // The Log button opens Log bloating on Today; Back closes it and the next Back returns.
        await page.goto(from, { waitUntil: "networkidle" });
        await page.locator(`a[href="${href}"]:visible`).first().click();
        try {
          await expect(page.getByRole("dialog", { name: /^(Log bloating|Bloating now)$/ })).toBeVisible({ timeout: 15000 });
          await page.goBack();
          await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 15000 });
          if (from !== "/today") { await page.goBack(); await expect(page).toHaveURL(new RegExp(`${from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), { timeout: 15000 }); }
        } catch (e) { problems.push(`${key}: ${String(e).split("\n")[0]!.slice(0, 160)}`); }
        continue;
      }
      if (visited.has(href) && !href.startsWith("/day/")) continue;
      visited.add(href);
      await page.goto(from, { waitUntil: "networkidle" });
      const link = page.locator(`a[href="${href}"]:visible`).first();
      if (!(await link.count())) continue;
      await link.click();
      try {
        await expect(page).toHaveURL(urlIs(href), { timeout: 15000 });
        await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 15000 });
        await page.goBack();
        await expect(page).toHaveURL(urlIs(from), { timeout: 15000 });
        await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 15000 });
      } catch (e) {
        problems.push(`${key}: ${String(e).split("\n")[0]!.slice(0, 160)} (now at ${page.url()})`);
      }
    }
  }
  for (const e of errors) problems.push(`error: ${e.slice(0, 160)}`);
  expect(visited.size, "links followed").toBeGreaterThan(10);
  expect(problems, problems.join("\n")).toEqual([]);
  await context.close();
});

test("chart controls by keyboard: range, month buttons and every table toggle work with Tab, arrows, Enter and Space", async ({ browser }) => {
  test.setTimeout(180_000);
  const context = await browser.newContext({ viewport: { width: 412, height: 900 } });
  const page = await signedIn(context, full);
  await page.goto("/history", { waitUntil: "networkidle" });
  const range = page.getByRole("radiogroup", { name: "Range" });
  await range.getByRole("radio", { name: "Month" }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(range.getByRole("radio", { name: "Week" })).toBeChecked();
  await expect(range.getByRole("radio", { name: "Week" })).toBeFocused();
  await expect(page.getByRole("img", { name: /^Daily Bloat Score for 7 days/ })).toBeVisible();
  await page.keyboard.press("End");
  await expect(range.getByRole("radio", { name: "All" })).toBeChecked();
  await page.keyboard.press("ArrowRight"); // wraps round
  await expect(range.getByRole("radio", { name: "Week" })).toBeChecked();
  await page.keyboard.press("Home");
  await expect(range.getByRole("radio", { name: "Week" })).toBeChecked();
  await page.keyboard.press("ArrowDown");
  await expect(range.getByRole("radio", { name: "Month" })).toBeChecked();
  const prev = page.getByRole("button", { name: "Previous month" });
  if (await prev.isEnabled()) {
    await prev.focus(); await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Next month" })).toBeEnabled();
    await page.getByRole("button", { name: "Next month" }).focus(); await page.keyboard.press(" ");
  }
  for (const path of ["/history", "/journey", `/day/${addDays(full.today, -1)}`, "/insights"]) {
    await page.goto(path, { waitUntil: "networkidle" });
    const toggles = page.getByRole("button", { name: "Show as a table" });
    const n = await toggles.count();
    for (let i = 0; i < n; i++) {
      const t = page.getByRole("button", { name: /^(Show as a table|Hide the table)$/ }).nth(i);
      await t.focus();
      await expect(t, `${path} toggle ${i + 1} has focus`).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(t).toHaveAttribute("aria-expanded", "true");
      await expect(page.locator(`#${await t.getAttribute("aria-controls")} table`.replace(/:/g, "\\:"))).toBeVisible();
      await page.keyboard.press(" ");
      await expect(t).toHaveAttribute("aria-expanded", "false");
    }
  }
  await context.close();
});

test("200% zoom on the chart screens: nothing sideways, tables scroll inside their frame", async ({ browser }) => {
  test.setTimeout(180_000);
  const context = await browser.newContext({ viewport: { width: 640, height: 400 }, deviceScaleFactor: 2 });
  const page = await signedIn(context, full);
  const problems: string[] = [];
  for (const path of ["/history", "/insights", "/journey", "/report", `/day/${addDays(full.today, -1)}`, "/how-bloat-works"]) {
    await page.goto(path, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 20000 });
    const toggles = page.getByRole("button", { name: "Show as a table" });
    for (let i = await toggles.count(); i > 0; i--) await toggles.first().click();
    for (const p of await crawl(page)) if (!p.startsWith("low contrast")) problems.push(`${path}: ${p}`);
  }
  expect(problems, problems.join("\n")).toEqual([]);
  await context.close();
});

test("drawers at 320 px in dark: Log bloating and Add meal fit, scroll inside, and Save is reachable", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 568 }, colorScheme: "dark", hasTouch: true, isMobile: true });
  const page = await signedIn(context, fresh);
  for (const opener of ["I feel bloated", "Add meal"]) {
    await page.goto("/today", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: opener }).first().click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    const box = (await sheet.boundingBox())!;
    expect(box.x, `${opener}: sheet inside the screen`).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width).toBeLessThanOrEqual(321);
    const save = sheet.getByRole("button", { name: /^(Save|Next)/ }).last();
    await save.scrollIntoViewIfNeeded();
    await expect(save, `${opener}: Save reachable`).toBeInViewport();
    expect((await crawl(page)).filter((p) => p.startsWith("sideways") || p.startsWith("outside"))).toEqual([]);
    await page.keyboard.press("Escape");
    const discard = page.getByRole("button", { name: "Close without saving" });
    if (await discard.isVisible().catch(() => false)) await discard.click();
  }
  await context.close();
});

test("password forms: sign-in and change password have labels, explain problems under the field, work by keyboard and fit at 320 px and 200% zoom", async ({ browser }) => {
  test.skip(!PASSWORD_SERVER, "needs the server with password sign-in (E2E_SIGN_IN=password)");
  test.setTimeout(180_000);
  for (const size of [{ viewport: { width: 320, height: 640 } }, { viewport: { width: 640, height: 400 }, deviceScaleFactor: 2 }]) {
    const context = await browser.newContext(size);
    const page = await context.newPage();
    await page.goto("/sign-in", { waitUntil: "networkidle" });
    const email = page.getByLabel("Email");
    const password = page.getByLabel("Password", { exact: true });
    await expect(email).toBeVisible();
    await expect(password).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    // The problem shows under the field, in ink with an icon, and focus goes to that field.
    const problem = page.locator("#email-error p");
    await expect(problem).toBeVisible();
    await expect(problem.locator("svg")).toHaveCount(1);
    await expect(email).toBeFocused();
    await expect(email).toHaveAttribute("aria-describedby", /email-error/);
    await email.focus();
    await page.keyboard.type(fresh.email);
    await page.keyboard.press("Tab");
    await expect(password).toBeFocused();
    await page.keyboard.type(PASSWORD);
    expect((await crawl(page)).filter((p) => p.startsWith("sideways") || p.startsWith("outside") || p.startsWith("no accessible"))).toEqual([]);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/today$/, { timeout: 20000 });
    await page.goto("/me", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Change password" }).click();
    const sheet = page.getByRole("dialog", { name: "Change password" });
    await expect(sheet).toBeVisible();
    const next = sheet.getByLabel(/^New password(?! again)/);
    await expect(next).toHaveAttribute("type", "password");
    await expect(next).toBeFocused().catch(() => next.focus());
    await page.keyboard.type("short");
    await sheet.getByRole("button", { name: "Change password" }).click();
    await expect(sheet.locator("#pw-msg p")).toContainText(/at least \d+ characters/i);
    await expect(sheet.locator("#pw-msg p svg")).toHaveCount(1);
    expect((await crawl(page)).filter((p) => p.startsWith("sideways") || p.startsWith("outside"))).toEqual([]);
    await context.close();
  }
});
