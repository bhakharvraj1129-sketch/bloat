import { expect, test, type Page } from "@playwright/test";

// Email sign-in codes against the LOCAL stack. Local Supabase delivers every email to its mail
// catcher (Mailpit), so the test reads the real email and the real code.
const MAIL = "http://127.0.0.1:54324";
const address = (tag: string) => `otp-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

async function codesFor(to: string, atLeast = 1): Promise<string[]> {
  for (let i = 0; i < 40; i++) {
    const list = await (await fetch(`${MAIL}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`)).json() as { messages: Array<{ ID: string; Created: string }> };
    if (list.messages.length >= atLeast) {
      const sorted = [...list.messages].sort((a, b) => a.Created.localeCompare(b.Created));
      const out: string[] = [];
      for (const m of sorted) {
        const msg = await (await fetch(`${MAIL}/api/v1/message/${m.ID}`)).json() as { Text: string; HTML: string; Subject: string };
        const code = /\b(\d{6})\b/.exec(`${msg.Text} ${msg.HTML.replace(/<[^>]+>/g, " ")}`)?.[1];
        expect(code, `email "${msg.Subject}" holds a 6-digit code`).toBeTruthy();
        out.push(code!);
      }
      return out;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`no email for ${to}`);
}

async function toNewAccountForm(page: Page) {
  await page.goto("/");
  await page.getByRole("link", { name: "Get started" }).first().click();
  await page.getByRole("radio", { name: "United States" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "I've read this" }).click();
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
}

const WRONG = "That code is wrong or has expired. Check it, or ask for a new one.";

test("a new account by email code: the email arrives, a wrong code is refused, the right code signs in, and the session survives a refresh; a new code after the cooldown replaces the old one", async ({ page }) => {
  test.setTimeout(180_000);
  const email = address("new");
  await toNewAccountForm(page);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("I am 18 or older").check();
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(page).toHaveURL(/\/sign-in\/code\?email=.*&new=1/);
  const [first] = await codesFor(email);

  // Resend is locked during the 60 s cooldown, then works and sends a fresh code.
  await expect(page.getByRole("button", { name: /Send a new code in \d+ s/ })).toBeDisabled();
  await page.getByRole("button", { name: "Send a new code", exact: true }).click({ timeout: 75_000 });
  await expect(page.getByText("A new code is on its way if that address can sign in.")).toBeVisible({ timeout: 20000 });
  const codes = await codesFor(email, 2);
  const newest = codes[codes.length - 1]!;
  expect(newest).not.toBe(first);

  const box = page.getByLabel("6-digit code");
  await box.fill(first === "000000" ? "111111" : "000000");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText(WRONG)).toBeVisible();
  await box.fill(first!); // replaced by the newer code, so no longer valid
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText(WRONG)).toBeVisible();

  await box.fill(newest);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/(today|setup)/, { timeout: 20000 });
  await page.reload();
  await expect(page).not.toHaveURL(/sign-in/);
  await page.goto("/today");
  await expect(page).not.toHaveURL(/sign-in/);
});

test("signing in with an address that has no account looks exactly like a sent code (no account enumeration)", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(address("none"));
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(page).toHaveURL(/\/sign-in\/code/);
  await expect(page.getByText(/If .* can sign in, we sent it a 6-digit code/)).toBeVisible();
});

test("when the code email cannot be sent, or there is no connection, or codes are asked for too often, the app says so and stays on the form", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(address("fail"));
  // The real hosted failure: Supabase Auth gives up after 10 seconds while the mail server hangs.
  await page.route("**/auth/v1/otp**", (r) => r.fulfill({ status: 504, contentType: "application/json", body: JSON.stringify({ code: 504, error_code: "request_timeout", msg: "Processing this request timed out, please retry after a moment." }) }));
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(page.getByText("We couldn't send the email just now. The problem is on our side, not with your address. Please try again in a few minutes.")).toBeVisible({ timeout: 60000 });
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.unroute("**/auth/v1/otp**");
  await page.route("**/auth/v1/otp**", (r) => r.abort("internetdisconnected"));
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(page.getByText("We couldn't reach Bloat. Check your connection and try again. No code was sent.")).toBeVisible({ timeout: 60000 });
  await page.unroute("**/auth/v1/otp**");
  await page.route("**/auth/v1/otp**", (r) => r.fulfill({ status: 429, contentType: "application/json", body: JSON.stringify({ code: 429, error_code: "over_email_send_rate_limit", msg: "For security purposes, you can only request this after 37 seconds." }) }));
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(page.getByText("A code was asked for very recently. You can ask for another in 37 seconds.")).toBeVisible();
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("an existing account signs in by email code (a sign-in code, not a sign-up confirmation)", async ({ page }) => {
  const email = address("existing");
  const made = await page.request.post("/v1/auth/test-login", { data: { email, password: "synthetic-password-1", create: true } });
  expect(made.ok()).toBe(true);
  await page.context().clearCookies();
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(page).toHaveURL(/\/sign-in\/code\?email=[^&]+$/);
  const [code] = await codesFor(email);
  await page.getByLabel("6-digit code").fill(code!);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/(today|setup)/, { timeout: 20000 });
  await page.reload();
  await expect(page).not.toHaveURL(/sign-in/);
});

test("Google sign-in is not offered while it is switched off in Supabase, so nobody lands on an error page", async ({ page }) => {
  const settings = await (await fetch("http://127.0.0.1:54321/auth/v1/settings", { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" } })).json();
  expect(settings.external.google).toBe(false);
  await page.goto("/sign-in");
  await expect(page.getByRole("button", { name: "Send code" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toHaveCount(0);
});
