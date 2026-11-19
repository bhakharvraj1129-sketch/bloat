import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

// Control ledger crawler (LOCAL stack only, synthetic accounts, test mode on locally).
// For every screen and role it lists every control, then exercises each safe one and records
// what actually happened: navigation, a dialog, a request, a visible change, an error or nothing.
// Destructive controls are listed but not clicked here; targeted tests cover them.
// Output: test-evidence/ledger/ledger-<label>.json (summarised into docs/control-ledger.md).

const OUT = path.join("test-evidence", "ledger"); // outside test-results, which Playwright empties on every run
const LABEL = process.env.LEDGER_LABEL ?? "after";
const DESTRUCTIVE = /delete|sign out|revoke|cancel (pro|my plan)|end (the )?experiment|withdraw|remove|pause pro|stop|discard|mock purchase|reset|log out/i;
const HELP_VERSION = "nhs-bloating-2026-11-07";

type Control = { i: number; tag: string; role: string; name: string; href: string | null; disabled: boolean; visible: boolean; covered: boolean; inDialog: boolean; selected: boolean };
type Effect = { kind: string; detail: string };
type Row = Control & { route: string; who: string; effect: Effect | null; status: "pass" | "fail" | "listed" | "check" };

const rows: Row[] = [];
const pageErrors: Array<{ who: string; route: string; error: string }> = [];

async function collect(page: Page): Promise<Control[]> {
  return page.evaluate(() => {
    const sel = "a[href], button, [role=button], input:not([type=hidden]), select, textarea, [role=checkbox], [role=radio], [role=tab], [role=switch], summary";
    const els = [...document.querySelectorAll<HTMLElement>(sel)];
    return els.map((el, i) => {
      el.setAttribute("data-ledger", String(i));
      const r = el.getBoundingClientRect();
      const visible = !!(el.offsetParent || el.getClientRects().length) && r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
      // Covered = still hidden under something after scrolling it to the middle of the screen
      // (a control merely sitting under the bottom tab bar before scrolling is not covered).
      const hitTest = () => {
        const box = el.getClientRects()[0] ?? el.getBoundingClientRect(); // first line of a wrapped link
        const hit = document.elementFromPoint(box.left + Math.min(box.width / 2, 20), box.top + Math.min(box.height / 2, 12));
        return !!hit && hit !== el && !el.contains(hit) && !(hit as HTMLElement).closest?.("label")?.contains(el);
      };
      let covered = false;
      if (visible) {
        el.scrollIntoView({ block: "center" });
        covered = hitTest();
      }
      const labelled = el.getAttribute("aria-label") || (el.id ? document.querySelector(`label[for="${el.id}"]`)?.textContent : "") || el.closest("label")?.textContent || "";
      const name = (labelled || el.innerText || (el as HTMLInputElement).placeholder || (el as HTMLInputElement).value || el.getAttribute("title") || "").replace(/\s+/g, " ").trim().slice(0, 80);
      return {
        i, tag: el.tagName.toLowerCase(), role: el.getAttribute("role") || (el.tagName === "A" ? "link" : el.tagName === "BUTTON" ? "button" : (el as HTMLInputElement).type || el.tagName.toLowerCase()),
        name, href: el.getAttribute("href"), disabled: (el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled") === "true",
        visible, covered, inDialog: !!el.closest("[role=dialog]"),
        selected: el.getAttribute("aria-checked") === "true" || el.getAttribute("aria-pressed") === "true" || el.getAttribute("aria-current") === "page" || (el as HTMLInputElement).checked === true,
      };
    });
  });
}

async function settle(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.getByRole("heading", { level: 1 }).first().waitFor({ timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(600);
}

/** Click one control and report what visibly happened within 2 s. */
async function go(page: Page, route: string) {
  // A sheet closed a moment ago may still be tidying its one history step: wait and try once more.
  try { return await page.goto(route); } catch { await page.waitForTimeout(300); return page.goto(route); }
}

async function exercise(page: Page, route: string, c: Control): Promise<Effect> {
  await go(page, route);
  await settle(page);
  await collect(page);
  const el = page.locator(`[data-ledger="${c.i}"]`);
  if (!(await el.count())) return { kind: "gone", detail: "control not present after reload" };
  const before = { url: page.url(), dialogs: await page.getByRole("dialog").count(), checked: await el.evaluate((n) => (n as HTMLInputElement).checked ?? null) };
  const requests: string[] = [];
  const onReq = (r: import("@playwright/test").Request) => { if (r.url().includes("/v1/") && r.method() !== "GET") requests.push(`${r.method()} ${new URL(r.url()).pathname}`); };
  const errs: string[] = [];
  const onErr = (e: Error) => errs.push(e.message);
  page.on("request", onReq); page.on("pageerror", onErr);
  await page.evaluate(() => {
    (window as unknown as { __mut: number }).__mut = 0;
    new MutationObserver((m) => { (window as unknown as { __mut: number }).__mut += m.length; }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["aria-checked", "aria-pressed", "aria-expanded", "data-state", "class"] });
  });
  try {
    await el.click({ timeout: 4000 });
  } catch (e) {
    page.off("request", onReq); page.off("pageerror", onErr);
    return { kind: "not clickable", detail: String((e as Error).message).split("\n")[0]!.slice(0, 160) };
  }
  await page.waitForTimeout(1300);
  page.off("request", onReq); page.off("pageerror", onErr);
  if (errs.length) return { kind: "page error", detail: errs.join(" | ").slice(0, 200) };
  if (page.url() !== before.url) return { kind: "navigated", detail: new URL(page.url()).pathname + new URL(page.url()).search };
  const dialogs = await page.getByRole("dialog").count();
  if (dialogs > before.dialogs) return { kind: "dialog", detail: (await page.getByRole("dialog").last().getAttribute("aria-label")) ?? (await page.getByRole("dialog").last().locator("h2").first().innerText().catch(() => "")) };
  if (requests.length) return { kind: "request", detail: requests.join(", ") };
  const mut = await page.evaluate(() => (window as unknown as { __mut: number }).__mut).catch(() => 0);
  if (mut > 0) return { kind: "changed", detail: `${mut} DOM changes` };
  const checked = await el.evaluate((n) => (n as HTMLInputElement).checked ?? null).catch(() => null);
  if (checked !== before.checked) return { kind: "changed", detail: `ticked: ${checked}` };
  if (c.selected) return { kind: "already selected", detail: "choosing the option that is already chosen changes nothing, as expected" };
  return { kind: "NO EFFECT", detail: "no navigation, dialog, request or DOM change in 1.3 s" };
}

async function signedIn(context: BrowserContext, opts: { pro: boolean }): Promise<Page> {
  const page = await context.newPage();
  await page.goto("/");
  const email = `ledger-${opts.pro ? "pro" : "free"}-${Date.now()}@example.com`;
  expect((await page.request.post("/v1/auth/test-login", { data: { email, password: "synthetic-password-1", create: true } })).ok()).toBe(true);
  const send = (method: string, url: string, body?: unknown) => page.evaluate(async ({ method, url, body }) => {
    const r = await fetch(url, { method, headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: body === undefined ? undefined : JSON.stringify(body) });
    return r.status;
  }, { method, url, body });
  expect(await send("POST", "/v1/onboarding/commit", {
    age_18_or_older: "yes", country: "US", time_zone: "America/New_York", units: "us",
    help: { viewed_at: new Date().toISOString(), page_version: HELP_VERSION }, consents: ["terms_privacy", "health_data", "wellness_ack"],
    answers: [], medicines: [{ name: "Ledger iron", type: "supplement", med_group: "iron" }], followed: ["ACT-01"],
  })).toBe(201);
  if (opts.pro) expect(await send("POST", "/v1/billing/mock-purchase", { interval: "three_month" })).toBe(200);
  await send("POST", "/v1/meals", { save_key: crypto.randomUUID(), dish_text: "ledger toast", eaten: { mode: "now" } });
  await send("POST", "/v1/episodes", { strength: 4, started: { mode: "now" } });
  return page;
}

async function crawl(page: Page, who: string, routes: string[]) {
  for (const route of routes) {
    const errs: string[] = [];
    const onErr = (e: Error) => errs.push(e.message);
    page.on("pageerror", onErr);
    const res = await go(page, route);
    await settle(page);
    page.off("pageerror", onErr);
    for (const e of errs) pageErrors.push({ who, route, error: e.slice(0, 200) });
    const landed = new URL(page.url()).pathname;
    rows.push({ i: -1, tag: "page", role: "page", name: `HTTP ${res?.status()} → ${landed}`, href: null, disabled: false, visible: true, covered: false, inDialog: false, selected: false, route, who, effect: null, status: res && res.status() < 400 ? "pass" : "fail" });
    const controls = await collect(page);
    for (const c of controls) {
      const row: Row = { ...c, route, who, effect: null, status: "listed" };
      rows.push(row);
      if (!c.visible || c.disabled || c.inDialog) continue;
      if (c.covered) { row.effect = { kind: "covered", detail: "another element sits on top of this control" }; row.status = "fail"; continue; }
      if (c.tag === "a" && c.href) {
        if (/^https?:\/\//.test(c.href) && !c.href.includes("127.0.0.1")) { row.effect = { kind: "external", detail: c.href }; row.status = "check"; continue; }
        const target = new URL(c.href, page.url());
        const probe = await page.request.get(target.toString(), { maxRedirects: 5 });
        row.effect = { kind: "link", detail: `${target.pathname}${target.search} → HTTP ${probe.status()}` };
        row.status = probe.status() < 400 ? "pass" : "fail";
        continue;
      }
      if (c.role === "textbox" || c.role === "email" || c.role === "password" || c.role === "number" || c.role === "search" || c.tag === "textarea" || c.tag === "select" || c.role === "date" || c.role === "time" || c.role === "tel" || c.role === "text") { row.status = "listed"; continue; }
      if (DESTRUCTIVE.test(c.name)) { row.effect = { kind: "destructive", detail: "not clicked by the crawler" }; row.status = "check"; continue; }
      const effect = await exercise(page, route, c);
      row.effect = effect;
      row.status = effect.kind === "NO EFFECT" || effect.kind === "page error" || effect.kind === "not clickable" ? "fail" : "pass";
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(150);
    }
    save();
  }
}

function save() {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(path.join(OUT, `ledger-${LABEL}.json`), JSON.stringify({ when: new Date().toISOString(), base: process.env.E2E_PORT ?? "3100", rows, pageErrors }, null, 2));
}

test.describe.configure({ mode: "serial" });
test.setTimeout(120 * 60_000);

test("control ledger", async ({ browser }) => {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const PUBLIC = ["/", "/start", "/help", "/help?signup=1", "/sign-in", "/sign-in?new=1", "/sign-in/code", "/unavailable", "/terms", "/privacy", "/contact", "/how-bloat-works", "/offline", "/share/not-a-real-token", "/admin"];
  const PRIVATE = ["/today", "/history", `/day/${today}`, `/review/${yesterday}`, "/insights", "/journey", "/report", "/experiments", "/cards", "/learn", "/health", "/doctor", "/me", "/meal/recall", "/upgrade", "/setup"];

  const out = await browser.newContext({ serviceWorkers: "block" });
  await crawl(await out.newPage(), "signed-out", [...PUBLIC, ...PRIVATE]);
  await out.close();

  for (const pro of [false, true]) {
    const ctx = await browser.newContext({ serviceWorkers: "block" });
    const page = await signedIn(ctx, { pro });
    await crawl(page, pro ? "pro" : "free", [...PRIVATE, "/help", "/how-bloat-works", "/terms", "/privacy", "/contact"]);
    await ctx.close();
  }

  save();
  const fails = rows.filter((r) => r.status === "fail");
  console.log(`ledger: ${rows.length} rows, ${fails.length} fail, ${pageErrors.length} page errors`);
});
