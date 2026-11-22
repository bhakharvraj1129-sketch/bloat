import { expect, test, type Browser, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

// Navigation outcomes (LOCAL stack, synthetic accounts). For every screen, visitor type and width,
// every distinct visible in-app link is clicked; the test records where it landed and whether that
// is the right screen (the link's own address, or the documented redirect for that visitor), then
// presses Back (the screen's own Back link when it has one, otherwise the browser's) and records
// whether it returned to the starting screen.
// Output: test-evidence/ledger/navigate.json (summarised in docs/verification-report.md).

const OUT = path.join("test-evidence", "ledger");
const HELP_VERSION = "nhs-bloating-2026-11-07";
type Who = "signed-out" | "free" | "pro";
type Row = { who: Who; width: number; from: string; link: string; href: string; landed: string; expected: string; destOk: boolean; back: "app" | "browser" | "none"; backTo: string; backOk: boolean | null; note: string };
const rows: Row[] = [];

const PRIVATE = /^\/(today|history|insights|me|setup|log|day|review|meal|upgrade|learn|experiments|journey|report|triggers|cards|health|doctor)(\/|$)/;
const PRO_ONLY = /^\/(insights|journey|report|experiments|cards|learn|health|meal\/recall)(\/|$)/;

/** Where a link should land for this visitor, by the app's own rules. */
function expected(who: Who, href: string): { re: RegExp; label: string } {
  const u = new URL(href, "http://x");
  const p = u.pathname, full = p + u.search;
  if (who === "signed-out" && PRIVATE.test(p)) return { re: new RegExp(`^/sign-in\\?next=${encodeURIComponent(p).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$|^/sign-in$`), label: "sign-in (signed out)" };
  if (who === "free" && PRO_ONLY.test(p)) return { re: /^\/upgrade$/, label: "/upgrade (Pro screen, Free plan)" };
  if (who !== "signed-out" && (p === "/sign-in" || p === "/setup")) return { re: /^\/today$/, label: "/today (already signed in and set up)" };
  return { re: new RegExp(`^${full.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), label: full };
}

async function signedIn(browser: Browser, pro: boolean, width: number) {
  const ctx = await browser.newContext({ serviceWorkers: "block", viewport: { width, height: width < 768 ? 844 : 900 } });
  const page = await ctx.newPage();
  await page.goto("/");
  expect((await page.request.post("/v1/auth/test-login", { data: { email: `nav-${pro ? "pro" : "free"}-${width}-${Date.now()}@example.com`, password: "synthetic-password-1", create: true } })).ok()).toBe(true);
  const send = (method: string, url: string, body?: unknown) => page.evaluate(async ({ method, url, body }) => (await fetch(url, { method, headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: body === undefined ? undefined : JSON.stringify(body) })).status, { method, url, body });
  expect(await send("POST", "/v1/onboarding/commit", {
    age_18_or_older: "yes", country: "US", time_zone: "America/New_York", units: "us",
    help: { viewed_at: new Date().toISOString(), page_version: HELP_VERSION }, consents: ["terms_privacy", "health_data", "wellness_ack"],
    answers: [], medicines: [], followed: ["ACT-01"],
  })).toBe(201);
  await send("POST", "/v1/meals", { save_key: crypto.randomUUID(), dish_text: "Navigation toast", eaten: { mode: "now" } });
  if (pro) expect(await send("POST", "/v1/billing/mock-purchase", { interval: "three_month" })).toBe(200);
  return { ctx, page };
}

const here = (page: Page) => { const u = new URL(page.url()); return u.pathname + u.search; };

async function settle(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.getByRole("heading", { level: 1 }).first().waitFor({ timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(250);
}

/** Visible in-app links on the screen (no outside sites, downloads or new tabs). Chrome links are tagged. */
async function links(page: Page) {
  return page.evaluate(() => [...document.querySelectorAll<HTMLAnchorElement>("a[href]")].flatMap((a, i) => {
    const r = a.getBoundingClientRect();
    const visible = r.width > 0 && r.height > 0 && getComputedStyle(a).visibility !== "hidden" && !!a.offsetParent;
    const url = new URL(a.href, location.href);
    if (!visible || url.origin !== location.origin || a.hasAttribute("download") || (a.target && a.target !== "_self") || url.hash) return [];
    a.setAttribute("data-nav", String(i));
    const chrome = !!a.closest("header, footer, nav[aria-label=Main], aside");
    return [{ i, name: (a.getAttribute("aria-label") || a.innerText || "").replace(/\s+/g, " ").trim().slice(0, 60), href: url.pathname + url.search, chrome }];
  }));
}

async function crawl(page: Page, who: Who, width: number, routes: string[]) {
  const seenChrome = new Map<string, number>();
  for (const from of routes) {
    await page.goto(from); await settle(page);
    const start = here(page);
    for (const l of await links(page)) {
      if (l.href === start) continue; // a link to the screen you are on
      if (l.chrome) { const n = seenChrome.get(l.href) ?? 0; if (n >= 2) continue; seenChrome.set(l.href, n + 1); } // header, footer, tabs: from two screens each
      await page.goto(from); await settle(page); await links(page);
      const origin = here(page);
      const exp = expected(who, l.href);
      const row: Row = { who, width, from: origin, link: l.name, href: l.href, landed: "", expected: exp.label, destOk: false, back: "none", backTo: "", backOk: null, note: "" };
      try {
        await page.locator(`[data-nav="${l.i}"]`).click({ timeout: 5000 });
        await page.waitForURL((u) => u.pathname + u.search !== origin, { timeout: 8000 }).catch(() => {});
        await settle(page);
        row.landed = here(page);
        row.destOk = exp.re.test(row.landed);
        const back = page.getByRole("main").getByRole("link", { name: "Back", exact: true }).first();
        if (await back.isVisible().catch(() => false)) { row.back = "app"; await back.click(); }
        else { row.back = "browser"; await page.goBack(); }
        await page.waitForURL((u) => u.pathname + u.search !== row.landed, { timeout: 8000 }).catch(() => {});
        await settle(page);
        row.backTo = here(page);
        row.backOk = row.backTo === origin;
      } catch (e) { row.note = String((e as Error).message).split("\n")[0]!.slice(0, 140); }
      rows.push(row);
    }
    save();
  }
}

function save() {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(path.join(OUT, "navigate.json"), JSON.stringify({ when: new Date().toISOString(), rows }, null, 2));
}

test.setTimeout(120 * 60_000);

test("every in-app link: right destination, and Back returns", async ({ browser }) => {
  const today = new Date().toISOString().slice(0, 10);
  const PUBLIC = ["/", "/start", "/help", "/sign-in", "/unavailable", "/about", "/terms", "/privacy", "/contact", "/how-bloat-works", "/offline"];
  const APP = ["/today", "/history", `/day/${today}`, "/insights", "/journey", "/report", "/experiments", "/cards", "/learn", "/health", "/doctor", "/me", "/meal/recall", "/upgrade"];
  for (const width of [412, 1440]) {
    const out = await browser.newContext({ serviceWorkers: "block", viewport: { width, height: width < 768 ? 844 : 900 } });
    await crawl(await out.newPage(), "signed-out", width, [...PUBLIC, "/today", "/me"]);
    await out.close();
    for (const pro of [false, true]) {
      const { ctx, page } = await signedIn(browser, pro, width);
      await crawl(page, pro ? "pro" : "free", width, [...APP, "/help", "/about"]);
      await ctx.close();
    }
  }
  save();
  const bad = rows.filter((r) => !r.destOk || r.backOk === false || r.note);
  console.log(`navigate: ${rows.length} clicks, ${rows.filter((r) => r.destOk).length} right destination, ${rows.filter((r) => r.backOk).length} Back returned, ${bad.length} problems`);
  for (const r of bad) console.log(`  ${r.who} @${r.width} ${r.from} "${r.link}" -> ${r.landed} (expected ${r.expected}); back(${r.back}) -> ${r.backTo} ${r.note}`);
});
