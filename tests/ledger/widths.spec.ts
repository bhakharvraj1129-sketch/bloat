import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

// Every screen at five widths: records any sideways scrolling (content wider than the screen)
// and takes before/after pictures of the main screens. LOCAL stack, synthetic accounts only.
const WIDTHS = [320, 390, 768, 1024, 1440];
const LABEL = process.env.LEDGER_LABEL ?? "after";
const OUT = path.join("test-evidence", "ledger"); // outside test-results, which Playwright empties on every run
const SHOTS = path.join("test-evidence", "screens", LABEL);
const HELP_VERSION = "nhs-bloating-2026-11-07";

type Row = { who: string; route: string; width: number; overflow: number; landed: string };
const rows: Row[] = [];

async function signedIn(browser: Browser, pro: boolean): Promise<BrowserContext> {
  const ctx = await browser.newContext({ serviceWorkers: "block" });
  const page = await ctx.newPage();
  await page.goto("/");
  const email = `widths-${pro ? "pro" : "free"}-${Date.now()}@example.com`;
  expect((await page.request.post("/v1/auth/test-login", { data: { email, password: "synthetic-password-1", create: true } })).ok()).toBe(true);
  const send = (method: string, url: string, body?: unknown) => page.evaluate(async ({ method, url, body }) => (await fetch(url, { method, headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: body === undefined ? undefined : JSON.stringify(body) })).status, { method, url, body });
  expect(await send("POST", "/v1/onboarding/commit", {
    age_18_or_older: "yes", country: "US", time_zone: "America/New_York", units: "us",
    help: { viewed_at: new Date().toISOString(), page_version: HELP_VERSION }, consents: ["terms_privacy", "health_data", "wellness_ack"],
    answers: [], medicines: [{ name: "Width iron", type: "supplement", med_group: "iron" }], followed: ["ACT-01"],
  })).toBe(201);
  await send("POST", "/v1/meals", { save_key: crypto.randomUUID(), dish_text: "Oat porridge with banana", eaten: { mode: "now" } });
  if (pro) expect(await send("POST", "/v1/billing/mock-purchase", { interval: "three_month" })).toBe(200);
  await send("POST", "/v1/episodes", { strength: 4, started: { mode: "now" } });
  await page.close();
  return ctx;
}

async function measure(page: Page, who: string, route: string, width: number) {
  await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
  await page.goto(route);
  await page.getByRole("heading", { level: 1 }).first().waitFor({ timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(300);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  rows.push({ who, route, width, overflow, landed: new URL(page.url()).pathname });
}

test.setTimeout(60 * 60_000);

test("every screen at five widths", async ({ browser }) => {
  const today = new Date().toISOString().slice(0, 10);
  const PUBLIC = ["/", "/start", "/help", "/sign-in", "/unavailable", "/about", "/terms", "/privacy", "/contact", "/how-bloat-works", "/offline"];
  const PRIVATE = ["/today", "/history", `/day/${today}`, "/insights", "/journey", "/report", "/experiments", "/cards", "/learn", "/health", "/doctor", "/me", "/upgrade"];
  mkdirSync(SHOTS, { recursive: true });

  const out = await browser.newContext({ serviceWorkers: "block" });
  const p = await out.newPage();
  for (const r of PUBLIC) for (const w of WIDTHS) await measure(p, "signed-out", r, w);
  for (const [r, name] of [["/", "home"], ["/sign-in", "sign-in"]] as const) {
    for (const w of [390, 1440]) { await p.setViewportSize({ width: w, height: 900 }); await p.goto(r); await p.waitForTimeout(400); await p.screenshot({ path: path.join(SHOTS, `${name}-${w}.png`), fullPage: false }); }
  }
  await out.close();

  for (const pro of [false, true]) {
    const ctx = await signedIn(browser, pro);
    const page = await ctx.newPage();
    for (const r of PRIVATE) for (const w of WIDTHS) await measure(page, pro ? "pro" : "free", r, w);
    if (pro) {
      for (const [r, name] of [["/today", "today"], ["/me", "me"], ["/history", "history"]] as const) {
        for (const w of [390, 1440]) { await page.setViewportSize({ width: w, height: 900 }); await page.goto(r); await page.waitForTimeout(600); await page.screenshot({ path: path.join(SHOTS, `${name}-${w}.png`), fullPage: false }); }
      }
      // The new "close without saving?" question, at phone width.
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/today");
      await page.getByRole("button", { name: "Add meal" }).click();
      await page.getByRole("dialog").getByRole("textbox").first().fill("Lentil soup");
      await page.keyboard.press("Escape");
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(SHOTS, "meal-close-390.png") });
    }
    await ctx.close();
  }

  mkdirSync(OUT, { recursive: true });
  writeFileSync(path.join(OUT, `widths-${LABEL}.json`), JSON.stringify({ when: new Date().toISOString(), rows }, null, 2));
  const wide = rows.filter((r) => r.overflow > 0);
  console.log(`widths: ${rows.length} checks, ${wide.length} with sideways scrolling`);
  for (const r of wide) console.log(`  ${r.who} ${r.route} @${r.width}: ${r.overflow}px too wide`);
});
