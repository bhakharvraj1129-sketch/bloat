import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { anon, srvRpc, STAFF_EMAIL, totp } from "../api/helpers";

const PASSWORD = "synthetic-password-1";
// Both tests use the one staff account, so they run one after the other.
test.describe.configure({ mode: "serial" });

test("Q76: founder tools open only for a staff account after an authenticator code", async ({ page }) => {
  // Start from a staff account with no second step set up yet.
  const old = await anon().auth.signInWithPassword({ email: STAFF_EMAIL, password: PASSWORD });
  if (old.data.user) await srvRpc("srv_delete_account", { p_user: old.data.user.id });

  // Signed out: nothing is shown.
  await page.goto("/admin");
  await expect(page.getByText("Founder tools need a staff account.")).toBeVisible();
  await expect(page.getByText("AI spending this month")).toHaveCount(0);

  // An ordinary signed-in account gets the same answer.
  const plain = await page.request.post("/v1/auth/test-login", { data: { email: `e2e-plain-${Date.now()}@example.com`, password: PASSWORD, create: true } });
  expect(plain.ok()).toBe(true);
  await page.goto("/admin");
  await expect(page.getByText("Founder tools need a staff account.")).toBeVisible();

  // The staff account: password alone leads to the second step, not to the tools.
  const staff = await page.request.post("/v1/auth/test-login", { data: { email: STAFF_EMAIL, password: PASSWORD, create: true } });
  expect(staff.ok()).toBe(true);
  await page.goto("/admin");
  await expect(page.getByText("Second sign-in step")).toBeVisible({ timeout: 20000 });
  await expect(page.getByText("AI spending this month")).toHaveCount(0);
  await expect(page.getByAltText("Code to scan with your authenticator app")).toBeVisible();
  const secret = (await page.locator("span.break-all").innerText()).trim();

  await page.getByLabel("6-digit code from your app").fill("000000");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("That code didn't work.")).toBeVisible();
  await expect(page.getByText("AI spending this month")).toHaveCount(0);

  await page.getByLabel("6-digit code from your app").fill(totp(secret));
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("AI spending this month")).toBeVisible({ timeout: 20000 });

  // A refresh keeps the verified session; the tools still open without a new scan.
  await page.reload();
  await expect(page.getByText("AI spending this month")).toBeVisible({ timeout: 20000 });
});

// Section 5 (23 Nov): the founder tools' buttons, on the screen, with their saved result.
// LOCAL stack only. The settings are put back as they were at the end.
function sql(query: string): string {
  return execFileSync("docker", ["exec", "supabase_db_bloat", "psql", "-U", "postgres", "-tAc", query], { encoding: "utf8" }).trim();
}

test("founder tools: Set limit and the AI kill switch save once per tap, with one audit record each; a refused change or a lost connection says so and changes nothing", async ({ page }) => {
  const old = await anon().auth.signInWithPassword({ email: STAFF_EMAIL, password: PASSWORD });
  if (old.data.user) await srvRpc("srv_delete_account", { p_user: old.data.user.id });
  const limitBefore = sql("select monthly_limit_micros from private.ai_settings");
  const aiBefore = sql("select enabled from public.feature_flags where key = 'ai_enabled'");
  expect(aiBefore).toBe("t");
  const limit = () => sql("select monthly_limit_micros from private.ai_settings");
  const ai = () => sql("select enabled from public.feature_flags where key = 'ai_enabled'");
  try {
    expect((await page.request.post("/v1/auth/test-login", { data: { email: STAFF_EMAIL, password: PASSWORD, create: true } })).ok()).toBe(true);
    await page.goto("/admin");
    await expect(page.getByAltText("Code to scan with your authenticator app")).toBeVisible({ timeout: 20000 });
    const secret = (await page.locator("span.break-all").innerText()).trim();
    await page.getByLabel("6-digit code from your app").fill(totp(secret));
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("AI spending this month")).toBeVisible({ timeout: 20000 });
    const staff = sql(`select id from auth.users where email = '${STAFF_EMAIL}'`);
    // Every side effect of a change: the setting itself, its audit record, and the audit record of the
    // screen's reload afterwards. Counted per action for the staff account.
    const audits = () => Object.fromEntries(sql(`select action || '=' || count(*) from public.audit_log where user_id = '${staff}' group by action`).split("\n").filter(Boolean).map((l) => { const [k, v] = l.split("="); return [k!, Number(v)]; }));
    let posts = 0;
    page.on("request", (r) => { if (r.method() === "POST" && r.url().endsWith("/v1/admin")) posts++; });
    const settled = async () => { await page.waitForLoadState("networkidle"); await page.waitForTimeout(500); };

    // Set limit: saved, shown, and still there after a refresh.
    await page.getByLabel("Monthly limit in US dollars").fill("12.5");
    await page.getByRole("button", { name: "Set limit" }).click();
    await expect(page.getByText("Saved.")).toBeVisible();
    expect(limit()).toBe("12500000");
    await page.reload();
    await expect(page.getByText(/of \$12\.50/)).toBeVisible({ timeout: 20000 });
    await settled();

    // A refused change: the screen says so and nothing changes.
    await page.route("**/v1/admin", (route) => route.request().method() === "POST" ? route.fulfill({ status: 500, contentType: "application/json", body: "{}" }) : route.fallback());
    await page.getByLabel("Monthly limit in US dollars").fill("99");
    await page.getByRole("button", { name: "Set limit" }).click();
    await expect(page.getByText("That change was refused.")).toBeVisible();
    await page.unroute("**/v1/admin");
    // A lost connection: the screen says so and nothing changes.
    await page.route("**/v1/admin", (route) => route.request().method() === "POST" ? route.abort("internetdisconnected") : route.fallback());
    await page.getByRole("button", { name: "Set limit" }).click();
    await expect(page.getByText("That didn't work. Check your connection and try again.")).toBeVisible();
    await page.unroute("**/v1/admin");
    expect(limit()).toBe("12500000");
    await settled();

    // Double tap on Set limit: one request, one change, one audit record for it, one reload.
    let before = audits(); posts = 0;
    await page.getByLabel("Monthly limit in US dollars").fill("13");
    await page.getByRole("button", { name: "Set limit" }).dblclick();
    await expect(page.getByText(/of \$13\.00/)).toBeVisible();
    await settled();
    expect(posts, "requests from a double tap").toBe(1);
    expect(limit()).toBe("13000000");
    let after = audits();
    expect((after.admin_set_limit ?? 0) - (before.admin_set_limit ?? 0), "audit records for the change").toBe(1);
    expect((after.admin_read ?? 0) - (before.admin_read ?? 0), "audit records for the reload").toBe(1);

    // Kill switch, double tap: AI off once, not off and back on.
    before = audits(); posts = 0;
    await page.getByRole("button", { name: "Turn all AI off now (kill switch)" }).dblclick();
    await expect(page.getByRole("button", { name: "Turn AI back on" })).toBeVisible();
    await settled();
    expect(posts).toBe(1);
    expect(ai()).toBe("f");
    after = audits();
    expect((after.admin_set_flag ?? 0) - (before.admin_set_flag ?? 0)).toBe(1);
    expect((after.admin_read ?? 0) - (before.admin_read ?? 0)).toBe(1);
    await page.reload();
    await expect(page.getByRole("button", { name: "Turn AI back on" })).toBeVisible({ timeout: 20000 });
    await settled();

    // A slower second tap while the change is still on its way is ignored: the button waits.
    before = audits(); posts = 0;
    await page.route("**/v1/admin", async (route) => { if (route.request().method() === "POST") await new Promise((r) => setTimeout(r, 1500)); await route.fallback(); });
    const on = page.getByRole("button", { name: "Turn AI back on" });
    await on.click();
    await expect(on).toBeDisabled();
    await page.waitForTimeout(400);
    await on.click({ force: true }).catch(() => {});
    await expect(page.getByRole("button", { name: "Turn all AI off now (kill switch)" })).toBeVisible({ timeout: 10000 });
    await page.unroute("**/v1/admin");
    await settled();
    expect(posts).toBe(1);
    expect(ai()).toBe("t");
    after = audits();
    expect((after.admin_set_flag ?? 0) - (before.admin_set_flag ?? 0)).toBe(1);
  } finally {
    sql(`update private.ai_settings set monthly_limit_micros = ${limitBefore}`);
    sql(`update public.feature_flags set enabled = ${aiBefore === "t"} where key = 'ai_enabled'`);
  }
});
