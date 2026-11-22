import { expect, test, type BrowserContext, type Locator, type Page, type Request } from "@playwright/test";
import { execFileSync } from "node:child_process";

// Save and edit actions, checked for their real outcome (not just "something happened"):
//   1. saves: the write request succeeds, the intended record changes (read back from the API),
//      and the change is still there after a full page refresh;
//   2. failure: a server error is shown on screen, the form stays open with what was entered,
//      nothing changes, and pressing the same button again saves it;
//   3. double tap: two quick taps send one write and change the record once.
// LOCAL stack only, synthetic accounts.

test.use({ serviceWorkers: "block" });
const HELP_VERSION = "nhs-bloating-2026-11-07";
const FAIL_MESSAGE = "Something went wrong. Nothing was saved.";

type Api = (method: string, url: string, body?: unknown, at?: string) => Promise<{ status: number; body: any }>; // at: local test clock
type Ctx = { page: Page; api: Api; today: string; seed: Record<string, any> };

type Action = {
  name: string;
  role: "free" | "pro" | "signed-out" | "new";
  setup?: (c: Ctx) => Promise<void>; // preconditions, through the API
  open: (c: Ctx) => Promise<void>; // go to the screen, open the form, fill it in
  submit: (c: Ctx) => Locator; // the control that saves
  write: { method: string; path: RegExp; notBody?: RegExp }; // notBody: same address, but not this write (a preview)
  changed: (c: Ctx) => Promise<boolean>; // read back: did the intended change happen?
  failText?: string; // the screen's own failure wording, when it does not show the server's message
  after: (c: Ctx) => Promise<void>; // after a refresh, the screen shows it
};

/** Local database only (Docker), for records no API returns to the browser, such as the waitlist. */
function sql(query: string): string {
  return execFileSync("docker", ["exec", "supabase_db_bloat", "psql", "-U", "postgres", "-tAc", query], { encoding: "utf8" }).trim();
}

async function account(context: BrowserContext, role: Action["role"]): Promise<Ctx> {
  const page = await context.newPage();
  await page.goto("/");
  if (role === "signed-out") {
    const api: Api = async () => ({ status: 0, body: null });
    return { page, api, today: new Date().toISOString().slice(0, 10), seed: {} };
  }
  const email = `mut-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
  expect((await page.request.post("/v1/auth/test-login", { data: { email, password: "synthetic-password-1", create: true } })).ok()).toBe(true);
  const api: Api = (method, url, body, at) => page.evaluate(async ({ method, url, body, at }) => {
    const headers: Record<string, string> = { "content-type": "application/json", "idempotency-key": crypto.randomUUID() };
    if (at) headers["x-bloat-test-now"] = at;
    const r = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store" });
    const text = await r.text();
    let parsed: unknown = null; try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
    return { status: r.status, body: parsed };
  }, { method, url, body, at });
  if (role === "new") {
    // Signed in, not set up yet: the country and help page were answered before sign-in, as in the app.
    await page.evaluate((v) => sessionStorage.setItem("bloat.pre", JSON.stringify({ country: "US", help_viewed_at: new Date().toISOString(), help_version: v, adult: true })), HELP_VERSION);
    return { page, api, today: new Date().toISOString().slice(0, 10), seed: {} };
  }
  expect((await api("POST", "/v1/onboarding/commit", {
    age_18_or_older: "yes", country: "US", time_zone: "America/New_York", units: "us",
    help: { viewed_at: new Date().toISOString(), page_version: HELP_VERSION }, consents: ["terms_privacy", "health_data", "wellness_ack"],
    answers: [], medicines: [{ name: "Matrix iron", type: "supplement", med_group: "iron" }], followed: ["ACT-01"],
  })).status).toBe(201);
  if (role === "pro") expect((await api("POST", "/v1/billing/mock-purchase", { interval: "three_month" })).status).toBe(200);
  const state = (await api("GET", "/v1/me/state")).body;
  return { page, api, today: state.today.date, seed: { email } };
}

const st = async (c: Ctx) => (await c.api("GET", "/v1/me/state")).body;
const day = async (c: Ctx) => (await c.api("GET", `/v1/days/${c.today}`)).body;
const dialog = (c: Ctx, name: string | RegExp) => c.page.getByRole("dialog", { name });
const userId = (c: Ctx) => sql(`select id from auth.users where email = '${c.seed.email}'`);
const events = (c: Ctx, name: string) => Number(sql(`select count(*) from public.product_events where user_id = '${userId(c)}' and name = '${name}'`));
const localAgo = (minsAgo: number) => new Date(Date.now() - minsAgo * 60_000).toLocaleString("sv-SE", { timeZone: "America/New_York" }).replace(" ", "T").slice(0, 16);

/** Local fixture: the account started 10 days ago and the last 4 days have confirmed reviews (experiments need them). */
async function readyForExperiments(c: Ctx) {
  sql(`update public.profiles set created_at = now() - interval '10 days' where user_id = '${userId(c)}'`);
  for (let k = 1; k <= 4; k++) {
    const d = new Date(Date.parse(`${c.today}T12:00:00Z`) - k * 86_400_000).toISOString().slice(0, 10);
    const nextNoon = new Date(Date.parse(`${d}T12:00:00Z`) + 86_400_000 + 4 * 3_600_000).toISOString();
    expect((await c.api("PUT", `/v1/days/${d}/review`, { worst: 0, whole_day: "yes" }, nextNoon)).status).toBeLessThan(300);
  }
}
async function startExperiment(c: Ctx, key: string) {
  await readyForExperiments(c);
  if (key.startsWith("swap_")) expect((await c.api("POST", "/v1/experiments/checks", { fx01: "no", fx02: "no", fx03: "no", fx04: "no" })).status).toBe(201);
  const r = await c.api("POST", "/v1/experiments", { key });
  expect(r.status, JSON.stringify(r.body)).toBeLessThan(300);
  c.seed.xp = r.body.experiment.id;
}
const xpResult = async (c: Ctx) => (await c.api("GET", `/v1/experiments/${c.seed.xp}/result`)).body;
/** Local fixture: the running swap started 7 days ago, so the weekly check and adding back are due. */
const ageSwap = (c: Ctx) => sql(`update public.experiments set started_on = started_on - 7 where id = '${c.seed.xp}'`);
async function endedEpisode(c: Ctx) {
  const ep = await c.api("POST", "/v1/episodes", { strength: 4, started: { mode: "exact", local: localAgo(50), zone: "America/New_York" } });
  expect(ep.status).toBe(201);
  const id = ep.body.episode?.id ?? (await st(c)).open_episode.id;
  expect((await c.api("POST", `/v1/episodes/${id}/end`, { ended: { mode: "exact", local: localAgo(20), zone: "America/New_York" } })).status).toBeLessThan(300);
}
/** Local fixture: an open bloating record that started 9 hours ago, so "Is it still happening?" is asked. */
async function longOpenEpisode(c: Ctx) {
  expect((await c.api("POST", "/v1/episodes", { strength: 3, started: { mode: "now" } })).status).toBe(201);
  sql(`update public.episodes set started_at = started_at - interval '9 hours' where user_id = '${userId(c)}'`);
  sql(`update public.strength_samples set observed_at = observed_at - interval '9 hours' where user_id = '${userId(c)}'`);
}
const shares = (c: Ctx, where = "true") => Number(sql(`select count(*) from public.report_shares where user_id = '${userId(c)}' and ${where}`));
async function previewReport(c: Ctx) {
  await c.page.goto("/doctor");
  await c.page.getByRole("button", { name: "Preview report" }).click();
  await expect(c.page.getByRole("button", { name: "Create share link" })).toBeVisible();
}
async function fillShare(c: Ctx) {
  await c.page.getByLabel("Who is it for?").fill("Dr Test");
  await c.page.getByLabel("What is it for?").fill("Appointment");
  await c.page.getByRole("checkbox", { name: /I agree to share this report/ }).check();
}

const ACTIONS: Action[] = [
  {
    name: "Log bloating", role: "free",
    open: async (c) => { await c.page.goto("/today"); await c.page.getByRole("button", { name: "I feel bloated" }).click(); await dialog(c, "Log bloating").getByRole("radio", { name: "5", exact: true }).click(); },
    submit: (c) => dialog(c, "Log bloating").getByRole("button", { name: "Save" }),
    write: { method: "POST", path: /\/v1\/episodes$/ },
    changed: async (c) => (await st(c)).open_episode?.current_strength === 5,
    after: async (c) => { await expect(c.page.getByRole("button", { name: /Bloating ongoing/ })).toContainText("strength 5"); },
  },
  {
    name: "Update the strength of ongoing bloating", role: "free",
    setup: async (c) => { expect((await c.api("POST", "/v1/episodes", { strength: 3, started: { mode: "now" } })).status).toBe(201); },
    open: async (c) => { await c.page.goto("/today"); await c.page.getByRole("button", { name: /Bloating ongoing/ }).click(); const d = dialog(c, "Bloating now"); await d.getByRole("button", { name: "Update strength" }).click(); await d.getByRole("radio", { name: "7", exact: true }).click(); },
    submit: (c) => dialog(c, "Bloating now").getByRole("button", { name: "Save reading" }),
    write: { method: "POST", path: /\/v1\/episodes\/[^/]+\/samples$/ },
    changed: async (c) => (await st(c)).open_episode?.current_strength === 7,
    after: async (c) => { await expect(c.page.getByRole("button", { name: /Bloating ongoing/ })).toContainText("strength 7"); },
  },
  {
    name: "End bloating", role: "free",
    setup: async (c) => { expect((await c.api("POST", "/v1/episodes", { strength: 4, started: { mode: "now" } })).status).toBe(201); },
    open: async (c) => { await c.page.goto("/today"); await c.page.getByRole("button", { name: /Bloating ongoing/ }).click(); await dialog(c, "Bloating now").getByRole("button", { name: "Bloating gone" }).click(); },
    submit: (c) => dialog(c, "Bloating ended").getByRole("button", { name: "Save" }),
    write: { method: "POST", path: /\/v1\/episodes\/[^/]+\/end$/ },
    changed: async (c) => (await st(c)).open_episode === null,
    after: async (c) => { await expect(c.page.getByRole("button", { name: /Bloating ongoing/ })).toHaveCount(0); await expect(c.page.getByText(/Bloating, strongest 4$/)).toBeVisible(); },
  },
  {
    name: "No bloating so far today", role: "free",
    open: async (c) => { await c.page.goto("/today"); },
    submit: (c) => c.page.getByRole("button", { name: "No bloating so far today" }),
    write: { method: "POST", path: /\/no-bloating-so-far$/ },
    changed: async (c) => (await st(c)).today.provisional_zero === true,
    after: async (c) => { await expect(c.page.getByText("No bloating so far", { exact: true })).toBeVisible(); },
  },
  {
    name: "Add a meal", role: "free",
    open: async (c) => { await c.page.goto("/today"); await c.page.getByRole("button", { name: "Add meal" }).click(); await dialog(c, "Add meal").getByLabel("What did you have?").fill("Matrix lentil soup"); },
    submit: (c) => dialog(c, "Add meal").getByRole("button", { name: "Save", exact: true }),
    write: { method: "POST", path: /\/v1\/meals$/ },
    changed: async (c) => (await st(c)).timeline.filter((t: any) => t.kind === "meal" && t.text === "Matrix lentil soup").length === 1,
    after: async (c) => { await expect(c.page.getByText("Matrix lentil soup")).toBeVisible(); },
  },
  {
    name: "Add an activity", role: "free",
    open: async (c) => { await c.page.goto("/today"); await c.page.getByRole("button", { name: "Add activity" }).click(); await dialog(c, "Add activity").getByRole("checkbox", { name: "Ate quickly" }).click(); },
    submit: (c) => dialog(c, "Add activity").getByRole("button", { name: "Save", exact: true }),
    write: { method: "PUT", path: /\/v1\/days\/[^/]+\/activities$/ },
    changed: async (c) => (await day(c)).activities.some((a: any) => a.activity_id === "ACT-01"),
    after: async (c) => { await expect(c.page.getByRole("region", { name: "Today so far" }).or(c.page.locator("section", { hasText: "Today so far" })).getByText("Ate quickly")).toBeVisible(); },
  },
  {
    name: "Log exercise (Pro)", role: "pro",
    open: async (c) => {
      await c.page.goto("/today"); await c.page.getByRole("button", { name: "Add activity" }).click();
      await dialog(c, "Add activity").getByRole("button", { name: "Log a walk or exercise in detail" }).click();
      const d = dialog(c, "Log exercise"); await d.getByRole("radio", { name: "Walking" }).click(); await d.getByRole("radio", { name: "20 min" }).click();
    },
    submit: (c) => dialog(c, "Log exercise").getByRole("button", { name: "Save", exact: true }),
    write: { method: "POST", path: /\/v1\/exercise$/ },
    changed: async (c) => (await day(c)).exercise.length === 1,
    after: async (c) => { await c.page.goto(`/day/${c.today}`); await expect(c.page.getByText(/walking/i).first()).toBeVisible(); },
  },
  {
    name: "Log a bowel movement (Pro)", role: "pro",
    open: async (c) => { await c.page.goto("/today"); await c.page.getByRole("button", { name: "Log bowel movement" }).click(); await dialog(c, "Log bowel movement").getByRole("radio", { name: "Smooth and soft, like a sausage" }).click(); },
    submit: (c) => dialog(c, "Log bowel movement").getByRole("button", { name: "Save", exact: true }),
    write: { method: "POST", path: /\/v1\/bowel$/ },
    changed: async (c) => (await day(c)).bowel.length === 1,
    after: async (c) => { await c.page.goto(`/day/${c.today}`); await expect(c.page.getByText("Bowel and exercise", { exact: false }).first()).toBeVisible(); },
  },
  {
    name: "Edit a meal", role: "free",
    setup: async (c) => { expect((await c.api("POST", "/v1/meals", { save_key: crypto.randomUUID(), dish_text: "Matrix toast", eaten: { mode: "now" } })).status).toBe(201); },
    open: async (c) => { await c.page.goto(`/day/${c.today}`); await c.page.getByRole("button", { name: "Edit", exact: true }).click(); await dialog(c, "Edit meal").getByRole("textbox").first().fill("Matrix toast with jam"); },
    submit: (c) => dialog(c, "Edit meal").getByRole("button", { name: "Save changes" }),
    write: { method: "PATCH", path: /\/v1\/meals\/[^/]+$/ },
    changed: async (c) => (await day(c)).meals.some((m: any) => m.dish_text === "Matrix toast with jam"),
    after: async (c) => { await expect(c.page.getByText("Matrix toast with jam")).toBeVisible(); },
  },
  {
    name: "Delete a meal", role: "free",
    setup: async (c) => { expect((await c.api("POST", "/v1/meals", { save_key: crypto.randomUUID(), dish_text: "Matrix crackers", eaten: { mode: "now" } })).status).toBe(201); },
    open: async (c) => { await c.page.goto(`/day/${c.today}`); await c.page.getByRole("button", { name: "Delete", exact: true }).last().click(); },
    submit: (c) => dialog(c, "Delete this?").getByRole("button", { name: "Delete", exact: true }),
    write: { method: "DELETE", path: /\/v1\/meals\/[^/]+$/ },
    changed: async (c) => (await day(c)).meals.length === 0,
    after: async (c) => { await expect(c.page.getByText("Matrix crackers")).toHaveCount(0); },
  },
  {
    name: "Change units", role: "free",
    open: async (c) => { await c.page.goto("/me"); },
    submit: (c) => c.page.getByRole("radio", { name: "Metric" }),
    write: { method: "PATCH", path: /\/v1\/me\/profile$/ },
    changed: async (c) => (await st(c)).profile.units === "metric",
    after: async (c) => { await expect(c.page.getByRole("radio", { name: "Metric" })).toHaveAttribute("aria-checked", "true"); },
  },
  {
    name: "Change habits to follow", role: "free",
    open: async (c) => { await c.page.goto("/me"); await c.page.getByRole("button", { name: "Change habits" }).click(); await dialog(c, "Habits to follow").getByRole("checkbox", { name: "Ate quickly" }).click(); },
    submit: (c) => dialog(c, "Habits to follow").getByRole("button", { name: "Save", exact: true }),
    write: { method: "PUT", path: /\/v1\/me\/followed-activities$/ },
    changed: async (c) => (await st(c)).followed.length === 0,
    after: async (c) => { await expect(c.page.getByText("None chosen")).toBeVisible(); },
  },
  {
    name: "Add a medicine", role: "free",
    open: async (c) => { await c.page.goto("/me"); await c.page.getByRole("button", { name: "Add or change" }).click(); await dialog(c, "Medicines and supplements").getByLabel("Name").fill("Matrix magnesium"); },
    submit: (c) => dialog(c, "Medicines and supplements").getByRole("button", { name: "Add to my record" }),
    write: { method: "POST", path: /\/v1\/medicines$/ },
    changed: async (c) => (await c.api("GET", "/v1/medicines")).body.medicines.filter((m: any) => m.name === "Matrix magnesium").length === 1,
    after: async (c) => { await expect(c.page.getByText("Matrix magnesium")).toBeVisible(); },
  },
  {
    name: "Remove a medicine", role: "free",
    open: async (c) => { await c.page.goto("/me"); await c.page.getByRole("button", { name: "Add or change" }).click(); const d = dialog(c, "Medicines and supplements"); await d.getByRole("button", { name: "Remove" }).click(); },
    submit: (c) => dialog(c, "Medicines and supplements").getByRole("button", { name: "Remove" }),
    write: { method: "DELETE", path: /\/v1\/medicines\/[^/]+$/ },
    changed: async (c) => (await c.api("GET", "/v1/medicines")).body.medicines.length === 0,
    after: async (c) => { await expect(c.page.getByText("Matrix iron")).toHaveCount(0); },
  },
  {
    name: "Withdraw an optional consent", role: "free",
    setup: async (c) => { expect((await c.api("POST", "/v1/consents", { type: "ai_meal" })).status).toBeLessThan(300); },
    open: async (c) => { await c.page.goto("/me"); await c.page.getByRole("button", { name: "Withdraw" }).click(); },
    submit: (c) => dialog(c, "Withdraw consent").getByRole("button", { name: "Withdraw" }),
    write: { method: "DELETE", path: /\/v1\/consents\/ai_meal$/ },
    changed: async (c) => (await c.api("GET", "/v1/consents")).body.consents.some((x: any) => x.type === "ai_meal" && x.withdrawn_at),
    after: async (c) => { await expect(c.page.getByText(/Withdrawn \d{4}-\d{2}-\d{2}/)).toBeVisible(); },
  },
  {
    name: "Keep my meal photos (Pro)", role: "pro",
    open: async (c) => { await c.page.goto("/me"); },
    submit: (c) => c.page.getByRole("checkbox", { name: /Keep my meal photos/ }),
    write: { method: "PATCH", path: /\/v1\/me\/profile$/ },
    changed: async (c) => (await st(c)).profile.keep_meal_photos === true,
    after: async (c) => { await expect(c.page.getByRole("checkbox", { name: /Keep my meal photos/ })).toBeChecked(); },
  },
  {
    name: "Pause Pro", role: "pro",
    open: async (c) => { await c.page.goto("/me"); await c.page.getByRole("button", { name: "Pause Pro" }).click(); },
    submit: (c) => dialog(c, "Pause Pro").getByRole("button", { name: "Pause for 1 month" }),
    write: { method: "POST", path: /\/v1\/billing\/pause$/ },
    changed: async (c) => (await c.api("GET", "/v1/billing/entitlement")).body.paused === true,
    after: async (c) => { await expect(c.page.getByText("Bloat Pro (paused)")).toBeVisible(); },
  },
  {
    name: "Switch on Keep an eye on it (Pro)", role: "pro",
    open: async (c) => { await c.page.goto("/me"); await c.page.getByRole("button", { name: "Switch on" }).click(); await dialog(c, "Keep an eye on it").getByRole("checkbox").first().click(); },
    submit: (c) => dialog(c, "Keep an eye on it").getByRole("button", { name: "Save", exact: true }),
    write: { method: "PUT", path: /\/v1\/me\/logging-mode$/ },
    changed: async (c) => (await st(c)).profile.logging_mode === "keep_an_eye",
    after: async (c) => { await expect(c.page.getByRole("button", { name: "Back to full logging" })).toBeVisible(); },
  },
  {
    name: "Save health background (Pro)", role: "pro",
    open: async (c) => { await c.page.goto("/health"); await c.page.getByRole("checkbox", { name: "IBS", exact: true }).click(); },
    submit: (c) => c.page.getByRole("button", { name: "Save", exact: true }),
    write: { method: "PUT", path: /\/v1\/health\/conditions$/ },
    changed: async (c) => (await c.api("GET", "/v1/health/conditions")).body.conditions.some((x: any) => x.condition === "ibs"),
    after: async (c) => { await expect(c.page.getByRole("checkbox", { name: "IBS", exact: true })).toHaveAttribute("aria-checked", "true"); },
  },
  {
    name: "Add a health test (Pro)", role: "pro",
    open: async (c) => { await c.page.goto("/health"); await c.page.getByRole("radiogroup", { name: "Test" }).getByRole("radio").first().click(); },
    submit: (c) => c.page.getByRole("button", { name: "Add test" }),
    write: { method: "POST", path: /\/v1\/health\/tests$/ },
    changed: async (c) => (await c.api("GET", "/v1/health/conditions")).body.tests.length === 1,
    after: async (c) => { await expect(c.page.getByRole("button", { name: "Remove" })).toHaveCount(1); },
  },
  {
    name: "Make a doctor report (Pro)", role: "pro",
    open: async (c) => { await c.page.goto("/doctor"); },
    submit: (c) => c.page.getByRole("button", { name: "Preview report" }),
    write: { method: "POST", path: /\/v1\/reports$/ },
    changed: async (c) => (await c.api("GET", "/v1/reports")).body.reports.filter((r: any) => r.kind === "doctor").length === 1,
    after: async (c) => { expect((await c.api("GET", "/v1/reports")).body.reports.filter((r: any) => r.kind === "doctor").length).toBe(1); },
  },
  {
    name: "Give feedback on today's card (Pro)", role: "pro",
    open: async (c) => { await c.page.goto("/cards"); await c.page.getByRole("radio", { name: "Tried" }).click(); },
    submit: (c) => c.page.getByRole("button", { name: "Save feedback" }),
    write: { method: "POST", path: /\/v1\/cards\/[^/]+\/feedback$/ },
    changed: async (c) => (await c.api("GET", "/v1/cards/today")).body.feedback?.tried === "tried",
    after: async (c) => { expect((await c.api("GET", "/v1/cards/today")).body.feedback?.tried).toBe("tried"); },
  },
  {
    name: "Edit the times of a bloating record", role: "free",
    setup: async (c) => {
      // A realistic record: started 50 minutes ago, ended 20 minutes ago (times are kept to the minute).
      const local = (minsAgo: number) => new Date(Date.now() - minsAgo * 60_000).toLocaleString("sv-SE", { timeZone: "America/New_York" }).replace(" ", "T").slice(0, 16);
      const ep = await c.api("POST", "/v1/episodes", { strength: 4, started: { mode: "exact", local: local(50), zone: "America/New_York" } });
      expect(ep.status).toBe(201);
      const id = ep.body.episode?.id ?? (await st(c)).open_episode.id;
      expect((await c.api("POST", `/v1/episodes/${id}/end`, { ended: { mode: "exact", local: local(20), zone: "America/New_York" } })).status).toBeLessThan(300);
    },
    open: async (c) => { await c.page.goto(`/day/${c.today}`); await c.page.getByRole("button", { name: "Edit times" }).click(); await dialog(c, "Edit times").getByRole("radiogroup", { name: "Start" }).getByRole("radio", { name: "Roughly" }).click(); },
    submit: (c) => dialog(c, "Edit times").getByRole("button", { name: "Save changes" }),
    write: { method: "PATCH", path: /\/v1\/episodes\/[^/]+$/ },
    changed: async (c) => (await day(c)).episodes[0]?.start_precision === "approximate",
    after: async (c) => { await c.page.getByRole("button", { name: "Edit times" }).click(); await expect(dialog(c, "Edit times").getByRole("radiogroup", { name: "Start" }).getByRole("radio", { name: "Roughly" })).toHaveAttribute("aria-checked", "true"); },
  },
  {
    name: "Delete an exercise record (Pro)", role: "pro",
    setup: async (c) => { expect((await c.api("POST", "/v1/exercise", { type: "walking", started: { mode: "now" }, minutes: 20 })).status).toBe(201); },
    open: async (c) => { await c.page.goto(`/day/${c.today}`); await c.page.locator("section", { hasText: "Bowel and exercise" }).getByRole("button", { name: "Delete" }).click(); },
    submit: (c) => dialog(c, "Delete this?").getByRole("button", { name: "Delete", exact: true }),
    write: { method: "DELETE", path: /\/v1\/exercise\/[^/]+$/ },
    changed: async (c) => (await day(c)).exercise.length === 0,
    after: async (c) => { await expect(c.page.getByText(/Walking, 20 min/)).toHaveCount(0); },
  },
  // ---- third batch: the gaps listed in the 22 Nov report ----
  {
    name: "Answer 'Is it still happening?': Yes", role: "free",
    setup: longOpenEpisode,
    open: async (c) => { await c.page.goto("/today"); await expect(dialog(c, "Is it still happening?")).toBeVisible(); },
    submit: (c) => dialog(c, "Is it still happening?").getByRole("button", { name: "Yes", exact: true }),
    write: { method: "POST", path: /\/v1\/episodes\/[^/]+\/still-happening$/ },
    // The answer is recorded as one event; the bloating record stays open (the app never closes it by itself).
    changed: async (c) => events(c, "still_happening_answered") === 1 && (await st(c)).open_episode !== null,
    // The answer itself is not stored, so on the next app open the question is asked again while the
    // record stays open over 8 hours (plan EP-07, "on app open"); the record is still open.
    after: async (c) => { await expect(dialog(c, "Is it still happening?")).toBeVisible(); expect((await st(c)).open_episode).not.toBeNull(); },
  },
  {
    name: "Answer 'Is it still happening?': Not sure", role: "free",
    setup: longOpenEpisode,
    open: async (c) => { await c.page.goto("/today"); await expect(dialog(c, "Is it still happening?")).toBeVisible(); },
    submit: (c) => dialog(c, "Is it still happening?").getByRole("button", { name: "Not sure", exact: true }),
    write: { method: "POST", path: /\/v1\/episodes\/[^/]+\/still-happening$/ },
    changed: async (c) => events(c, "still_happening_answered") === 1 && (await st(c)).open_episode !== null,
    // The answer itself is not stored, so on the next app open the question is asked again while the
    // record stays open over 8 hours (plan EP-07, "on app open"); the record is still open.
    after: async (c) => { await expect(dialog(c, "Is it still happening?")).toBeVisible(); expect((await st(c)).open_episode).not.toBeNull(); },
  },
  {
    name: "Delete a bloating record", role: "free",
    setup: endedEpisode,
    open: async (c) => { await c.page.goto(`/day/${c.today}`); await c.page.getByRole("button", { name: "Delete", exact: true }).first().click(); },
    submit: (c) => dialog(c, "Delete this?").getByRole("button", { name: "Delete", exact: true }),
    write: { method: "DELETE", path: /\/v1\/episodes\/[^/]+$/ },
    changed: async (c) => (await day(c)).episodes.length === 0,
    after: async (c) => { await expect(c.page.getByRole("button", { name: "Edit times" })).toHaveCount(0); },
  },
  {
    name: "Delete a bowel record (Pro)", role: "pro",
    setup: async (c) => { expect((await c.api("POST", "/v1/bowel", { occurred: { mode: "now" } })).status).toBe(201); },
    open: async (c) => { await c.page.goto(`/day/${c.today}`); await c.page.locator("section", { hasText: "Bowel and exercise" }).getByRole("button", { name: "Delete" }).click(); },
    submit: (c) => dialog(c, "Delete this?").getByRole("button", { name: "Delete", exact: true }),
    write: { method: "DELETE", path: /\/v1\/bowel\/[^/]+$/ },
    changed: async (c) => (await day(c)).bowel.length === 0,
    after: async (c) => { await expect(c.page.getByText(/^Bowel movement/)).toHaveCount(0); },
  },
  {
    name: "Answer today's experiment question (Pro)", role: "pro",
    setup: (c) => startExperiment(c, "eat_more_slowly"),
    open: async (c) => { await c.page.goto(`/experiments/${c.seed.xp}`); },
    submit: (c) => c.page.getByRole("button", { name: "Yes", exact: true }),
    write: { method: "POST", path: /\/v1\/experiments\/[^/]+\/days$/ },
    changed: async (c) => { const r = await xpResult(c); return r.answered_today && r.days.some((d: any) => d.date === r.today && d.answer === "yes"); },
    after: async (c) => { await expect(c.page.getByText("Today's answer is saved: Yes.", { exact: false })).toBeVisible(); },
  },
  {
    name: "End an experiment early (Pro)", role: "pro",
    setup: (c) => startExperiment(c, "eat_more_slowly"),
    open: async (c) => { await c.page.goto(`/experiments/${c.seed.xp}`); await c.page.getByRole("button", { name: "End early" }).click(); await dialog(c, "End this experiment").getByRole("radio", { name: "Too hard to keep up" }).click(); },
    submit: (c) => dialog(c, "End this experiment").getByRole("button", { name: "End experiment" }),
    write: { method: "POST", path: /\/v1\/experiments\/[^/]+\/end$/ },
    changed: async (c) => (await xpResult(c)).experiment.phase === "ENDED_EARLY",
    after: async (c) => { await expect(c.page.getByText("Finished", { exact: true })).toBeVisible(); },
  },
  {
    name: "Weekly check during a food swap (Pro)", role: "pro",
    setup: async (c) => { await startExperiment(c, "swap_lactose_free_dairy"); ageSwap(c); },
    open: async (c) => {
      await c.page.goto(`/experiments/${c.seed.xp}`);
      await expect(c.page.getByText("A quick weekly check")).toBeVisible();
      const card = c.page.locator("div", { has: c.page.getByText("A quick weekly check") }).last();
      for (const g of await card.getByRole("group").all()) await g.getByRole("radio", { name: "No", exact: true }).click();
    },
    submit: (c) => c.page.locator("div", { has: c.page.getByText("A quick weekly check") }).last().getByRole("button", { name: "Save", exact: true }),
    write: { method: "POST", path: /\/v1\/experiments\/[^/]+\/wellbeing$/ },
    changed: async (c) => (await xpResult(c)).wellbeing_due === false,
    after: async (c) => { await expect(c.page.getByText("A quick weekly check")).toHaveCount(0); },
  },
  {
    name: "Finish a swap and start adding back (Pro)", role: "pro",
    setup: async (c) => { await startExperiment(c, "swap_lactose_free_dairy"); ageSwap(c); },
    open: async (c) => { await c.page.goto(`/experiments/${c.seed.xp}`); },
    submit: (c) => c.page.getByRole("button", { name: "Finish the swap and start adding back" }),
    write: { method: "POST", path: /\/v1\/experiments\/[^/]+\/add-back$/ },
    changed: async (c) => (await xpResult(c)).experiment.phase === "ADDING_BACK",
    after: async (c) => { await expect(c.page.getByText(/Adding back/).first()).toBeVisible(); },
  },
  {
    name: "Resume a paused swap (Pro)", role: "pro",
    setup: async (c) => { await startExperiment(c, "swap_lactose_free_dairy"); ageSwap(c); expect((await c.api("POST", `/v1/experiments/${c.seed.xp}/wellbeing`, { wb01: "yes", wb02: "no" })).body.paused).toBe(true); },
    open: async (c) => { await c.page.goto(`/experiments/${c.seed.xp}`); },
    submit: (c) => c.page.getByRole("button", { name: "Resume" }),
    write: { method: "POST", path: /\/v1\/experiments\/[^/]+\/resume$/ },
    changed: async (c) => (await xpResult(c)).experiment.phase !== "PAUSED",
    after: async (c) => { await expect(c.page.getByRole("button", { name: "Resume" })).toHaveCount(0); },
  },
  {
    name: "Un-hide a card in Learn (Pro)", role: "pro",
    setup: async (c) => {
      const card = (await c.api("GET", "/v1/cards/today")).body.card;
      expect(card).toBeTruthy(); c.seed.card = card.id;
      expect((await c.api("POST", `/v1/cards/${card.id}/feedback`, { other: "hide_this_card" })).status).toBeLessThan(300);
    },
    open: async (c) => { await c.page.goto("/learn"); },
    submit: (c) => c.page.getByRole("button", { name: "Un-hide" }).first(),
    write: { method: "POST", path: /\/v1\/cards\/[^/]+\/feedback$/ },
    changed: async (c) => (await c.api("GET", "/v1/library")).body.cards.some((x: any) => x.id === c.seed.card && x.hidden === false),
    after: async (c) => { await expect(c.page.getByRole("button", { name: "Un-hide" })).toHaveCount(0); },
  },
  {
    name: "Save a meal with its ingredient check (Pro)", role: "pro",
    setup: async (c) => { expect((await c.api("POST", "/v1/consents", { type: "ai_meal" })).status).toBeLessThan(300); },
    open: async (c) => {
      await c.page.goto("/today"); await c.page.getByRole("button", { name: "Add meal" }).click();
      const d = dialog(c, /Add meal|Ingredient check/);
      await d.getByLabel("What did you have?").fill("Matrix dal tadka");
      await d.getByRole("button", { name: "Next: check ingredients" }).click();
      await d.getByRole("button", { name: "Had all of these" }).click();
    },
    submit: (c) => dialog(c, "Ingredient check").getByRole("button", { name: "Save", exact: true }),
    write: { method: "POST", path: /\/v1\/meals$/ },
    changed: async (c) => (await day(c)).meals.some((m: any) => m.dish_text === "Matrix dal tadka" && m.ingredients.length > 0 && m.ingredients.every((i: any) => i.answer === "had")),
    after: async (c) => { await expect(c.page.getByText("Matrix dal tadka")).toBeVisible(); },
  },
  {
    name: "Create a report share link (Pro)", role: "pro",
    open: async (c) => { await previewReport(c); await fillShare(c); },
    submit: (c) => c.page.getByRole("button", { name: "Create share link" }),
    write: { method: "POST", path: /\/v1\/reports\/[^/]+\/shares$/ },
    changed: async (c) => shares(c) === 1,
    after: async (c) => { expect(shares(c, "revoked_at is null")).toBe(1); },
  },
  {
    name: "Revoke a report share link (Pro)", role: "pro",
    open: async (c) => { await previewReport(c); await fillShare(c); await c.page.getByRole("button", { name: "Create share link" }).click(); await expect(c.page.getByText("Link ready")).toBeVisible(); },
    submit: (c) => c.page.getByRole("button", { name: "Revoke link" }),
    write: { method: "DELETE", path: /\/v1\/reports\/[^/]+\/shares$/ },
    changed: async (c) => shares(c, "revoked_at is not null") === 1,
    after: async (c) => { expect(shares(c, "revoked_at is null")).toBe(0); },
  },
  {
    name: "Delete my account", role: "free", failText: "That didn't work. Nothing was deleted. Try again.",
    open: async (c) => { await c.page.goto("/me"); await c.page.getByRole("button", { name: "Delete account" }).click(); await dialog(c, "Delete account").getByLabel("Type DELETE to confirm").fill("DELETE"); },
    submit: (c) => dialog(c, "Delete account").getByRole("button", { name: "Delete my account" }),
    write: { method: "POST", path: /\/v1\/account\/delete$/ },
    changed: async (c) => sql(`select count(*) from auth.users where email = '${c.seed.email}'`) === "0",
    after: async (c) => { await c.page.goto("/today"); await expect(c.page).toHaveURL(/\/sign-in/); },
  },
  // ---- second batch ----
  {
    name: "Finish the morning review", role: "free",
    open: async (c) => {
      await c.page.goto(`/review/${yesterday(c)}`);
      await c.page.getByRole("radiogroup", { name: "Strongest bloating, 0 to 10" }).getByRole("radio", { name: "4", exact: true }).click();
      await c.page.getByRole("radio", { name: "Yes", exact: true }).click();
      await c.page.getByRole("button", { name: "Continue" }).click();
      await c.page.getByRole("button", { name: "Continue" }).click();
    },
    submit: (c) => c.page.getByRole("button", { name: "Finish" }),
    write: { method: "PUT", path: /\/v1\/days\/[^/]+\/review$/ },
    changed: async (c) => (await c.api("GET", `/v1/days/${yesterday(c)}`)).body.review?.worst === 4,
    after: async (c) => { await c.page.goto(`/day/${yesterday(c)}`); await expect(c.page.getByText(/4/).first()).toBeVisible(); },
  },
  {
    name: "Change time zone", role: "free",
    open: async (c) => {
      await c.page.goto("/me"); await c.page.getByRole("button", { name: "Change" }).first().click();
      const d = dialog(c, "Change time zone"); await d.getByLabel("New time zone").fill("Asia/Kolkata");
      await d.getByRole("button", { name: "Preview the change" }).click();
    },
    submit: (c) => dialog(c, "Change time zone").getByRole("button", { name: "Confirm change" }),
    write: { method: "PATCH", path: /\/v1\/me\/profile$/, notBody: /"preview":true/ },
    changed: async (c) => (await st(c)).profile.analysis_time_zone === "Asia/Kolkata",
    after: async (c) => { await expect(c.page.getByText("Asia/Kolkata")).toBeVisible(); },
  },
  {
    name: "Choose what you want to find out", role: "free",
    open: async (c) => { await c.page.goto("/me"); await c.page.getByRole("button", { name: "Change" }).nth(1).click(); await dialog(c, "Your goal").getByRole("checkbox", { name: "Which foods affect me" }).click(); },
    submit: (c) => dialog(c, "Your goal").getByRole("button", { name: "Save", exact: true }),
    write: { method: "PATCH", path: /\/v1\/me\/profile$/ },
    changed: async (c) => (await st(c)).profile.goals.length === 1,
    after: async (c) => { await expect(c.page.getByText("Which foods affect me")).toBeVisible(); },
  },
  {
    name: "Record a medicine change", role: "free",
    open: async (c) => {
      await c.page.goto("/me"); await c.page.getByRole("button", { name: "Add or change" }).click();
      const d = dialog(c, "Medicines and supplements"); await d.getByRole("button", { name: "Did this change?" }).click(); await d.getByRole("radio", { name: "Stopped" }).click();
    },
    submit: (c) => dialog(c, "Medicines and supplements").getByRole("button", { name: "Save change" }),
    write: { method: "POST", path: /\/v1\/medicines\/[^/]+\/changes$/ },
    changed: async (c) => (await c.api("GET", "/v1/medicines")).body.medicines[0]?.changes.length === 1,
    after: async (c) => { await expect(c.page.getByText(/stopped/i).first()).toBeVisible(); },
  },
  {
    name: "Resume Pro", role: "pro",
    setup: async (c) => { expect((await c.api("POST", "/v1/billing/pause", { months: 1 })).status).toBeLessThan(300); },
    open: async (c) => { await c.page.goto("/me"); },
    submit: (c) => c.page.getByRole("button", { name: "Resume Pro" }),
    write: { method: "POST", path: /\/v1\/billing\/resume$/ },
    changed: async (c) => (await c.api("GET", "/v1/billing/entitlement")).body.paused === false,
    after: async (c) => { await expect(c.page.getByRole("button", { name: "Pause Pro" })).toBeVisible(); },
  },
  {
    name: "Cancel Pro", role: "pro",
    open: async (c) => { await c.page.goto("/me"); await c.page.getByRole("button", { name: "Cancel", exact: true }).click(); },
    submit: (c) => dialog(c, "Cancel Pro").getByRole("button", { name: "Cancel Pro" }),
    write: { method: "POST", path: /\/v1\/billing\/cancel$/ },
    changed: async (c) => (await c.api("GET", "/v1/billing/entitlement")).body.status === "cancelled",
    after: async (c) => { await expect(c.page.getByText(/Cancelled\. Pro stays on until/)).toBeVisible(); },
  },
  {
    name: "Hide charts", role: "free",
    open: async (c) => { await c.page.goto("/me"); },
    submit: (c) => c.page.getByRole("checkbox", { name: "Hide charts" }),
    write: { method: "PATCH", path: /\/v1\/me\/profile$/ },
    changed: async (c) => (await st(c)).profile.hide_charts === true,
    after: async (c) => { await expect(c.page.getByRole("checkbox", { name: "Hide charts" })).toBeChecked(); },
  },
  {
    name: "Back to full logging (Pro)", role: "pro",
    setup: async (c) => { expect((await c.api("PUT", "/v1/me/logging-mode", { mode: "keep_an_eye", watched_groups: ["TAG-01"] })).status).toBeLessThan(300); },
    open: async (c) => { await c.page.goto("/me"); },
    submit: (c) => c.page.getByRole("button", { name: "Back to full logging" }),
    write: { method: "PUT", path: /\/v1\/me\/logging-mode$/ },
    changed: async (c) => (await st(c)).profile.logging_mode === "full",
    after: async (c) => { await expect(c.page.getByRole("button", { name: "Switch on" })).toBeVisible(); },
  },
  {
    name: "Remove a health test (Pro)", role: "pro",
    setup: async (c) => { expect((await c.api("POST", "/v1/health/tests", { test: "lactose_breath_test" })).status).toBeLessThan(300); },
    open: async (c) => { await c.page.goto("/health"); await c.page.getByRole("button", { name: "Remove" }).click(); },
    submit: (c) => c.page.getByRole("button", { name: "Confirm remove" }),
    write: { method: "DELETE", path: /\/v1\/health\/tests$/ },
    changed: async (c) => (await c.api("GET", "/v1/health/conditions")).body.tests.length === 0,
    after: async (c) => { await expect(c.page.getByRole("button", { name: "Remove" })).toHaveCount(0); },
  },
  {
    name: "Start an experiment (Pro)", role: "pro",
    // An experiment needs 4 confirmed days in the week before: four morning reviews, each given
    // the next morning (local test clock), with a whole-day answer.
    setup: async (c) => {
      // Local test fixture: the account started 10 days ago, so these days are inside its life
      // (the app never counts days from before an account existed).
      sql(`update public.profiles set created_at = now() - interval '10 days' where user_id = (select id from auth.users where email = '${c.seed.email}')`);
      for (let k = 1; k <= 4; k++) {
        const d = new Date(Date.parse(`${c.today}T12:00:00Z`) - k * 86_400_000).toISOString().slice(0, 10);
        const nextNoon = new Date(Date.parse(`${d}T12:00:00Z`) + 86_400_000 + 4 * 3_600_000).toISOString();
        expect((await c.api("PUT", `/v1/days/${d}/review`, { worst: 0, whole_day: "yes" }, nextNoon)).status).toBeLessThan(300);
      }
    },
    open: async (c) => { await c.page.goto("/experiments"); await c.page.getByRole("button", { name: "Choose" }).first().click(); },
    submit: (c) => c.page.getByRole("dialog").getByRole("button", { name: "Start today" }),
    write: { method: "POST", path: /\/v1\/experiments$/ },
    changed: async (c) => !!(await c.api("GET", "/v1/experiments")).body.active,
    after: async (c) => { await c.page.goto("/experiments"); await expect(c.page.getByRole("button", { name: "Choose" }).first()).toBeDisabled(); },
  },
  {
    name: "Hide today's card (Pro)", role: "pro",
    open: async (c) => { await c.page.goto("/cards"); },
    submit: (c) => c.page.getByRole("button", { name: "Hide this card" }),
    write: { method: "POST", path: /\/v1\/cards\/[^/]+\/feedback$/ },
    changed: async (c) => { const b = (await c.api("GET", "/v1/cards/today")).body; return !b.card || b.feedback?.other === "hide_this_card"; },
    after: async (c) => { await c.page.goto("/learn"); await expect(c.page.getByRole("button", { name: "Un-hide" }).first()).toBeVisible(); },
  },
  {
    name: "Join the waitlist", role: "signed-out", failText: "That didn't save. Try again.",
    open: async (c) => { await c.page.goto("/unavailable"); await c.page.getByLabel("Your country").fill("France"); c.seed.email = `wait-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`; await c.page.getByRole("textbox", { name: /^Email/ }).fill(c.seed.email); },
    submit: (c) => c.page.getByRole("button", { name: "Join waitlist" }),
    write: { method: "POST", path: /\/v1\/waitlist$/ },
    changed: async (c) => !!c.seed.email && sql(`select count(*) from private.waitlist where email = '${c.seed.email}'`) === "1",
    after: async (c) => { expect(sql(`select count(*) from private.waitlist where email = '${c.seed.email}'`)).toBe("1"); },
  },
  {
    name: "Finish setup", role: "new",
    open: async (c) => {
      await c.page.goto("/setup");
      await expect(c.page.getByRole("heading", { name: "Consent" })).toBeVisible();
      for (const box of await c.page.getByRole("checkbox").all()) await box.check();
      await c.page.getByRole("button", { name: "Continue" }).click();
      await c.page.getByRole("checkbox", { name: "This is right" }).click();
      for (let i = 0; i < 7; i++) await c.page.getByRole("button", { name: "Continue" }).click();
    },
    submit: (c) => c.page.getByRole("button", { name: "Go to Today" }),
    write: { method: "POST", path: /\/v1\/onboarding\/commit$/ },
    changed: async (c) => (await st(c)).onboarded === true,
    after: async (c) => { await expect(c.page.getByRole("heading", { name: "Today", exact: true })).toBeVisible(); },
  },
];

/** Intercept only the action's write (GETs to the same address pass through). */
const isWrite = (a: Action) => (r: Request) => r.method() === a.write.method && a.write.path.test(new URL(r.url()).pathname) && !(a.write.notBody && a.write.notBody.test(r.postData() ?? ""));
const yesterday = (c: Ctx) => new Date(Date.parse(`${c.today}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

for (const a of ACTIONS) {
  test.describe(a.name, () => {
    test("saves the intended change, and it is still there after a refresh", async ({ context }) => {
      const c = await account(context, a.role);
      await a.setup?.(c);
      expect(await a.changed(c), "already changed before the action").toBe(false);
      await a.open(c);
      const res = c.page.waitForResponse((r) => isWrite(a)(r.request()));
      await a.submit(c).click();
      const reply = await res;
      expect(reply.status(), `write status: ${reply.status() >= 300 ? await reply.text() : ""}`).toBeLessThan(300);
      await expect.poll(() => a.changed(c), { message: "intended data change" }).toBe(true);
      await c.page.reload();
      await c.page.waitForLoadState("networkidle");
      await a.after(c);
      expect(await a.changed(c)).toBe(true);
    });

    test("a server failure is shown, nothing changes, and the same button then saves", async ({ context }) => {
      const c = await account(context, a.role);
      await a.setup?.(c);
      const before = await a.changed(c);
      await c.page.route("**/v1/**", (route) => isWrite(a)(route.request())
        ? route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: { code: "ERROR", message: FAIL_MESSAGE } }) })
        : route.continue());
      await a.open(c);
      // When the action happens in a sheet, the message must appear inside that sheet, not behind it.
      const inSheet = (await c.page.getByRole("dialog").count()) > 0;
      await a.submit(c).click();
      const scope = inSheet ? c.page.getByRole("dialog").last() : c.page.locator("body");
      await expect(scope.getByText(a.failText ?? FAIL_MESSAGE).first(), `failure message on screen${inSheet ? ", inside the sheet" : ""}`).toBeVisible();
      await expect(a.submit(c), "the form is still there").toBeVisible();
      expect(await a.changed(c), "nothing changed").toBe(before);
      await c.page.unroute("**/v1/**");
      const res = c.page.waitForResponse((r) => isWrite(a)(r.request()));
      await a.submit(c).click(); // what was entered is still in place: one tap saves it
      expect((await res).status()).toBeLessThan(300);
      await expect.poll(() => a.changed(c)).toBe(true);
    });

    test("a double tap sends one write and changes the record once", async ({ context }) => {
      const c = await account(context, a.role);
      await a.setup?.(c);
      await a.open(c);
      let writes = 0;
      c.page.on("request", (r) => { if (isWrite(a)(r)) writes++; });
      await a.submit(c).dblclick();
      await c.page.waitForTimeout(1500);
      expect(writes, "write requests").toBe(1);
      await expect.poll(() => a.changed(c)).toBe(true);
    });
  });
}

test("experiments cannot be chosen before there are enough confirmed days, and the screen says why", async ({ context }) => {
  const c = await account(context, "pro");
  await c.page.goto("/experiments");
  await expect(c.page.getByText("Log normally for a few more days first.")).toBeVisible();
  const choose = c.page.getByRole("button", { name: "Choose" });
  expect(await choose.count()).toBeGreaterThan(0);
  for (const b of await choose.all()) await expect(b).toBeDisabled(); // it used to be enabled, and starting was then refused
});

test("'Is it still happening?': No, it ended opens the end time, and saving it closes the record", async ({ context }) => {
  const c = await account(context, "free");
  await longOpenEpisode(c);
  await c.page.goto("/today");
  await dialog(c, "Is it still happening?").getByRole("button", { name: "No, it ended" }).click();
  const end = dialog(c, "Bloating ended");
  await expect(end).toBeVisible();
  await expect(end.getByRole("button", { name: "Save" })).toBeDisabled(); // ended earlier: an end time (or "I don't know") is needed
  await end.getByRole("radio", { name: "I don't know" }).click();
  await end.getByRole("button", { name: "Save" }).click();
  await expect.poll(async () => (await st(c)).open_episode).toBeNull();
  expect(events(c, "still_happening_answered")).toBe(1);
});

test("ingredient check fails: the message shows, the dish is kept, Try the check again works, and the meal still saves", async ({ context }) => {
  const c = await account(context, "pro");
  expect((await c.api("POST", "/v1/consents", { type: "ai_meal" })).status).toBeLessThan(300);
  await c.page.goto("/today");
  await c.page.getByRole("button", { name: "Add meal" }).click();
  await dialog(c, "Add meal").getByLabel("What did you have?").fill("Matrix bean chilli");
  let checks = 0;
  await c.page.route("**/v1/food-suggestions", (r) => { checks++; return r.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: { code: "ERROR", message: FAIL_MESSAGE } }) }); });
  await dialog(c, "Add meal").getByRole("button", { name: "Next: check ingredients" }).click();
  const d = dialog(c, "Ingredient check");
  await expect(d.getByText("Your meal is saved when you tap Save. Add ingredients yourself, or try the check again later.")).toBeVisible();
  await expect(d.getByText("Matrix bean chilli")).toBeVisible(); // the dish is kept
  await c.page.unroute("**/v1/food-suggestions");
  await d.getByRole("button", { name: "Try the check again" }).click();
  await expect(d.getByRole("button", { name: "Had all of these" })).toBeVisible(); // the check worked this time
  expect(checks).toBe(1);
  // The meal saves with what was marked; the earlier failure left nothing behind.
  await d.getByRole("button", { name: "Save", exact: true }).click();
  await expect.poll(async () => (await day(c)).meals.filter((m: any) => m.dish_text === "Matrix bean chilli").length).toBe(1);
  expect(Number(sql(`select count(*) from public.food_suggestions where user_id = '${userId(c)}'`))).toBeLessThanOrEqual(1);
});

test("ingredient check fails and the person saves anyway: the meal saves without ingredients", async ({ context }) => {
  const c = await account(context, "pro");
  expect((await c.api("POST", "/v1/consents", { type: "ai_meal" })).status).toBeLessThan(300);
  await c.page.route("**/v1/food-suggestions", (r) => r.abort());
  await c.page.goto("/today");
  await c.page.getByRole("button", { name: "Add meal" }).click();
  await dialog(c, "Add meal").getByLabel("What did you have?").fill("Matrix soup");
  await dialog(c, "Add meal").getByRole("button", { name: "Next: check ingredients" }).click();
  const d = dialog(c, "Ingredient check");
  await expect(d.getByRole("button", { name: "Try the check again" })).toBeVisible();
  await d.getByRole("button", { name: "Save", exact: true }).click();
  await expect.poll(async () => (await day(c)).meals.filter((m: any) => m.dish_text === "Matrix soup").length).toBe(1);
});

test("deleting the account with a lost reply: it says so, and Check and finish completes it once", async ({ context }) => {
  const c = await account(context, "free");
  await c.page.goto("/me");
  await c.page.getByRole("button", { name: "Delete account" }).click();
  const d = dialog(c, "Delete account");
  await d.getByLabel("Type DELETE to confirm").fill("DELETE");
  // The server deletes the account, but the reply never arrives.
  await c.page.route("**/v1/account/delete", async (r) => { await r.fetch(); await r.abort(); });
  await d.getByRole("button", { name: "Delete my account" }).click();
  await expect(d.getByText("Connection lost. We can't tell yet whether your account was deleted.")).toBeVisible();
  expect(sql(`select count(*) from auth.users where email = '${c.seed.email}'`)).toBe("0"); // it was deleted
  await c.page.unroute("**/v1/account/delete");
  await d.getByRole("button", { name: "Check and finish" }).click();
  await expect(c.page).toHaveURL(/127\.0\.0\.1:\d+\/$/);
});

test("after an account is deleted on one device, the other device's earlier sign-in stops working", async ({ browser }) => {
  // Device A and device B are both signed in to the same synthetic account (two separate sessions).
  const a = await browser.newContext({ serviceWorkers: "block" });
  const c = await account(a, "free");
  const b = await browser.newContext({ serviceWorkers: "block" });
  const pageB = await b.newPage();
  await pageB.goto("/");
  expect((await pageB.request.post("/v1/auth/test-login", { data: { email: c.seed.email, password: "synthetic-password-1" } })).ok()).toBe(true);
  await c.page.goto("/today");
  await expect(c.page.getByRole("heading", { name: "Today", exact: true })).toBeVisible();
  expect((await pageB.request.post("/v1/account/delete", { data: { confirm: "DELETE" }, headers: { "idempotency-key": crypto.randomUUID() } })).status()).toBe(200);
  // Device A still holds its earlier session cookie: the app no longer accepts it.
  expect((await c.page.request.get("/v1/me/state")).status()).toBe(401);
  await c.page.goto("/history");
  await expect(c.page).toHaveURL(/\/sign-in/);
  await a.close(); await b.close();
});
