import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";

// Editing saved times when the phone's time zone differs from the account's time zone (external
// report, 23 Nov 2026, B1 and B2). Rules checked:
//   - Changing only a meal's name never touches its saved time (to the millisecond).
//   - "Keep" really keeps the saved time, even after another time was picked.
//   - An explicit time is read in the account's time zone, the same zone the day screen shows,
//     and the screen says which zone that is when the phone's zone differs.
//   - The same for a bloating record's start and end, and around midnight and clock changes.

const HELP_VERSION = "nhs-bloating-2026-11-07";
type Api = (method: string, url: string, body?: unknown, headers?: Record<string, string>) => Promise<{ status: number; body: any }>;

function sql(query: string): string {
  return execFileSync("docker", ["exec", "supabase_db_bloat", "psql", "-U", "postgres", "-tAc", query], { encoding: "utf8" }).trim();
}

/** A signed-in, set-up account whose Bloat Buddy time zone is `zone`. */
async function account(context: BrowserContext, zone: string, country: "US" | "IN" = "US"): Promise<{ page: Page; api: Api; email: string }> {
  const page = await context.newPage();
  await page.goto("/");
  const email = `tz-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
  expect((await page.request.post("/v1/auth/test-login", { data: { email, password: "synthetic-password-1", create: true } })).ok()).toBe(true);
  const api: Api = (method, url, body, headers = {}) => page.evaluate(async ({ method, url, body, headers }) => {
    const h: Record<string, string> = { "content-type": "application/json", "idempotency-key": crypto.randomUUID(), ...headers };
    const r = await fetch(url, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store" });
    const text = await r.text();
    let parsed: unknown = null; try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
    return { status: r.status, body: parsed };
  }, { method, url, body, headers });
  expect((await api("POST", "/v1/onboarding/commit", {
    age_18_or_older: "yes", country, time_zone: zone, units: country === "US" ? "us" : "metric",
    help: { viewed_at: new Date().toISOString(), page_version: HELP_VERSION }, consents: ["terms_privacy", "health_data", "wellness_ack"],
    answers: [], medicines: [], followed: [],
  })).status).toBe(201);
  return { page, api, email };
}

/** "YYYY-MM-DDTHH:MM" for an instant, in a time zone. */
const localIn = (ms: number, zone: string) => new Date(ms).toLocaleString("sv-SE", { timeZone: zone }).replace(" ", "T").slice(0, 16);
const dayIn = (ms: number, zone: string) => localIn(ms, zone).slice(0, 10);

async function addMeal(api: Api, dish: string) {
  const r = await api("POST", "/v1/meals", { save_key: crypto.randomUUID(), dish_text: dish, eaten: { mode: "now" } });
  expect(r.status).toBe(201);
  return r.body.meal as { id: string; eaten_at: string };
}
const mealRow = (id: string) => {
  const [eaten_at, dish_text, revision] = sql(`select to_char(eaten_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US'), dish_text, revision from public.meals where id = '${id}'`).split("|");
  return { eaten_at, dish_text, revision: Number(revision) };
};

async function openMealEdit(page: Page, date: string, dish: string) {
  await page.goto(`/day/${date}`);
  const row = page.locator("li, article, div").filter({ hasText: dish }).filter({ has: page.getByRole("button", { name: "Edit", exact: true }) }).last();
  await row.getByRole("button", { name: "Edit", exact: true }).click();
  return page.getByRole("dialog", { name: "Edit meal" });
}

const ZONES = [
  { name: "phone behind the account (account Asia/Kolkata, phone America/Los_Angeles)", account: "Asia/Kolkata", country: "IN" as const, device: "America/Los_Angeles" },
  { name: "phone ahead of the account (account America/New_York, phone Asia/Tokyo)", account: "America/New_York", country: "US" as const, device: "Asia/Tokyo" },
  { name: "phone in the account's zone (America/New_York)", account: "America/New_York", country: "US" as const, device: "America/New_York" },
];

for (const z of ZONES) {
  test.describe(z.name, () => {
    test.use({ timezoneId: z.device });

    test("changing only the meal's name saves, and the saved time stays exactly the same", async ({ context }) => {
      const { page, api } = await account(context, z.account, z.country);
      const meal = await addMeal(api, "tz name-only toast");
      const before = mealRow(meal.id);
      const sheet = await openMealEdit(page, dayIn(Date.parse(meal.eaten_at), z.account), "tz name-only toast");
      await sheet.getByLabel("What did you have?").fill("tz name-only toast and jam");
      await sheet.getByRole("button", { name: "Save changes" }).click();
      await expect(sheet).toBeHidden();
      const after = mealRow(meal.id);
      expect(after.dish_text).toBe("tz name-only toast and jam");
      expect(after.eaten_at, "saved time, to the microsecond").toBe(before.eaten_at);
      expect(after.revision).toBe(before.revision + 1);
    });

    test("'Keep' restores the saved time after another time was picked, and shows as chosen", async ({ context }) => {
      const { page, api } = await account(context, z.account, z.country);
      const meal = await addMeal(api, "tz keep soup");
      const before = mealRow(meal.id);
      const sheet = await openMealEdit(page, dayIn(Date.parse(meal.eaten_at), z.account), "tz keep soup");
      const keep = sheet.getByRole("radio", { name: "Keep" });
      await expect(keep, "Keep is chosen when the sheet opens").toHaveAttribute("aria-checked", "true");
      await sheet.getByRole("radio", { name: "Choose time" }).click();
      await sheet.getByLabel("Date and time").fill(localIn(Date.now() - 3 * 3600_000, z.account));
      await keep.click();
      await expect(keep).toHaveAttribute("aria-checked", "true");
      await expect(sheet.getByRole("radio", { name: "Choose time" })).toHaveAttribute("aria-checked", "false");
      await sheet.getByLabel("What did you have?").fill("tz keep soup, renamed");
      await sheet.getByRole("button", { name: "Save changes" }).click();
      await expect(sheet).toBeHidden();
      expect(mealRow(meal.id).eaten_at).toBe(before.eaten_at);
    });

    test("an explicit new time is read in the account's time zone, as the day screen shows it", async ({ context }) => {
      const { page, api } = await account(context, z.account, z.country);
      const meal = await addMeal(api, "tz explicit rice");
      const sheet = await openMealEdit(page, dayIn(Date.parse(meal.eaten_at), z.account), "tz explicit rice");
      await sheet.getByRole("radio", { name: "Choose time" }).click();
      if (z.account !== z.device) await expect(sheet.getByText(`Times here are in your Bloat Buddy time zone, ${z.account}.`)).toBeVisible();
      else await expect(sheet.getByText(/Times here are in your Bloat Buddy time zone/)).toHaveCount(0);
      const target = Date.now() - 2 * 3600_000; // two hours ago, whatever the zones
      const local = localIn(target, z.account);
      await sheet.getByLabel("Date and time").fill(local);
      await sheet.getByRole("button", { name: "Save changes" }).click();
      await expect(sheet).toBeHidden();
      const saved = Date.parse(mealRow(meal.id).eaten_at + "Z");
      expect(localIn(saved, z.account), "the saved time, in the account's zone").toBe(local);
      expect(Math.abs(saved - target)).toBeLessThan(60_000);
    });

    test("editing a bloating record: a changed end is read in the account's zone and the untouched start stays exactly the same", async ({ context }) => {
      const { page, api } = await account(context, z.account, z.country);
      const start = Date.now() - 90 * 60_000;
      const ep = await api("POST", "/v1/episodes", { strength: 3, started: { mode: "exact", local: localIn(start, z.account), zone: z.account } });
      expect(ep.status).toBe(201);
      const id = (ep.body.episode?.id ?? (await api("GET", "/v1/me/state")).body.open_episode.id) as string;
      expect((await api("POST", `/v1/episodes/${id}/end`, { ended: { mode: "exact", local: localIn(Date.now() - 60 * 60_000, z.account), zone: z.account } })).status).toBeLessThan(300);
      const read = () => sql(`select to_char(started_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US'), to_char(ended_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US'), revision from public.episodes where id = '${id}'`).split("|");
      const [startBefore, , revBefore] = read();
      await page.goto(`/day/${dayIn(start, z.account)}`);
      await page.getByRole("button", { name: "Edit times" }).click();
      const sheet = page.getByRole("dialog", { name: "Edit times" });
      await expect(sheet.getByRole("radiogroup", { name: "Start" }).getByRole("radio", { name: "Keep" })).toHaveAttribute("aria-checked", "true");
      // Saving with both times kept changes nothing.
      await sheet.getByRole("button", { name: "Save changes" }).click();
      await expect(sheet).toBeHidden();
      expect(read()[2], "revision unchanged when nothing was changed").toBe(revBefore);
      await page.getByRole("button", { name: "Edit times" }).click();
      const end = sheet.getByRole("radiogroup", { name: "End" });
      await end.getByRole("radio", { name: "Choose time" }).click();
      const newEnd = Date.now() - 30 * 60_000;
      await sheet.getByLabel("Date and time").fill(localIn(newEnd, z.account));
      await sheet.getByRole("button", { name: "Save changes" }).click();
      await expect(sheet).toBeHidden();
      const [startAfter, endAfter] = read();
      expect(startAfter, "start untouched, to the microsecond").toBe(startBefore);
      expect(localIn(Date.parse(endAfter + "Z"), z.account)).toBe(localIn(newEnd, z.account));
    });
  });
}

test.describe("edge cases (phone in Asia/Tokyo, account America/New_York)", () => {
  test.use({ timezoneId: "Asia/Tokyo" });

  test("a meal just before midnight in the account's zone: renaming keeps it on its day and time", async ({ context }) => {
    const { page, api, email } = await account(context, "America/New_York");
    const meal = await addMeal(api, "tz late snack");
    // Yesterday 23:50 New York time: in Tokyo the phone's date is already two days on.
    const yesterday = dayIn(Date.now() - 86_400_000, "America/New_York");
    sql(`update public.profiles set created_at = now() - interval '10 days' where user_id = (select id from auth.users where email = '${email}')`);
    sql(`update public.meals set eaten_at = (timestamp '${yesterday} 23:50:17.123456' at time zone 'America/New_York') where id = '${meal.id}'`);
    const before = mealRow(meal.id);
    const sheet = await openMealEdit(page, yesterday, "tz late snack");
    await sheet.getByLabel("What did you have?").fill("tz late snack, crackers");
    await sheet.getByRole("button", { name: "Save changes" }).click();
    await expect(sheet).toBeHidden();
    expect(mealRow(meal.id).eaten_at).toBe(before.eaten_at);
  });

  test("clocks going back (a time that happened twice): renaming keeps the exact time; choosing that time asks which one", async ({ context }) => {
    const { page, api, email } = await account(context, "America/New_York");
    const meal = await addMeal(api, "tz fall-back oats");
    sql(`update public.profiles set created_at = '2026-10-20' where user_id = (select id from auth.users where email = '${email}')`);
    // 01:30 on 1 Nov 2026 in New York happened twice; this is the first one (05:30 UTC).
    sql(`update public.meals set eaten_at = '2026-11-01 05:30:00+00' where id = '${meal.id}'`);
    const before = mealRow(meal.id);
    let sheet = await openMealEdit(page, "2026-11-01", "tz fall-back oats");
    await sheet.getByLabel("What did you have?").fill("tz fall-back oats, renamed");
    await sheet.getByRole("button", { name: "Save changes" }).click();
    await expect(sheet).toBeHidden();
    expect(mealRow(meal.id).eaten_at, "the first 01:30 is kept, not moved").toBe(before.eaten_at);
    sheet = await openMealEdit(page, "2026-11-01", "tz fall-back oats, renamed");
    await sheet.getByRole("radio", { name: "Choose time" }).click();
    await sheet.getByLabel("Date and time").fill("2026-11-01T01:30");
    await sheet.getByRole("button", { name: "Save changes" }).click();
    await expect(sheet.getByText("That time happened twice")).toBeVisible();
    await sheet.getByRole("button", { name: "The second one (after the clocks changed)" }).click();
    await expect(sheet).toBeHidden();
    expect(mealRow(meal.id).eaten_at).toBe("2026-11-01T06:30:00.000000");
  });

  test("clocks going forward (a time that never happened): the message says so and nothing changes", async ({ context }) => {
    const { page, api } = await account(context, "America/New_York");
    const meal = await addMeal(api, "tz spring tea");
    const before = mealRow(meal.id);
    const sheet = await openMealEdit(page, dayIn(Date.parse(meal.eaten_at), "America/New_York"), "tz spring tea");
    await sheet.getByRole("radio", { name: "Choose time" }).click();
    await sheet.getByLabel("Date and time").fill("2026-03-08T02:30");
    await sheet.getByRole("button", { name: "Save changes" }).click();
    await expect(sheet.getByText(/did not exist that day/)).toBeVisible();
    await expect(sheet).toBeVisible();
    expect(mealRow(meal.id)).toEqual(before);
  });
});
