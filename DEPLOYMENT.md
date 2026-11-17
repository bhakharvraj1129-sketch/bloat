# Deployment

A **public preview** exists (the owner's decision, 18 Nov 2026). It runs on the hosted `bloat-test` database with synthetic data, a labelled mock AI and mock billing. There is no production site and no real payments.

## State on 18 Nov 2026

| Part | State |
|---|---|
| Public preview | `https://bloat-git-claude-bloat-software-build-uxzoru-typeshi2.vercel.app`. Opens without any Vercel login. Tied to branch `claude/bloat-software-build-uxzoru`: every push rebuilds it. Last verified build: commit `b70e7ed` (deployment `dpl_6W3brAYiyqyDoeyYuCM8yNgyq3Ga`). |
| GitHub | Branch `claude/bloat-software-build-uxzoru` on `bhakharvraj1129-sketch/bloat`. No pull request. |
| Supabase `bloat-test` (`qntazirusbuwfmnmihzu`) | Six migrations applied, matching the files in `supabase/migrations/` by version: `20261117051631 foundation`, `20261117051734 server_functions`, `20261117051738 synthetic_test_users`, `20261117061403 country_capability_set`, `20261117174442 doctor_report_privacy`, `20261117182606 server_functions_not_for_signed_in_users`. |
| Harmless extra statement in the hosted foundation migration | When the foundation file was applied by hand through the connector on 17 Nov, one extra line went in: `insert into public.feature_flags (key, enabled, note) select 'x', false, null where false;`. `where false` means it inserts nothing (zero rows). It is in the recorded statement on `bloat-test` but not in the checked-in file. Schema fingerprints were identical before and after. Left as is: migrations are never edited after they are applied. |
| Data changes outside migrations | (1) One row in `private.server_secrets`, `preview-2026-11-17`, holding only the SHA-256 hash of the preview secret. (2) Synthetic accounts for each hosted test run, created with a one-off password (only its bcrypt hash is stored) and deleted after the run. On 18 Nov the 25 synthetic `hosted-…@example.com` accounts from earlier runs were also deleted, because their password is written in the repo. |
| Vercel project `bloat` (canonical) | Team `typeshi2`. Vercel Authentication **off** since 18 Nov (was on for all previews). Framework Next.js, Node 22. |
| Vercel variables (Preview only) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `BLOAT_SERVER_SECRET` (Sensitive, owner-entered), `BLOAT_AI_PROVIDER=mock`, `BLOAT_BILLING_PROVIDER=mock`, `BLOAT_TEST_LOGIN=0`, `BLOAT_PRO_TEST_EMAILS`. Not set: `BLOAT_STAFF_EMAILS` (founder tools off), any AI key. |
| Vercel project `bloat-zlrr` (duplicate) | Checked 18 Nov: no variables, no custom domains, no production deployment, Vercel Authentication on. Nothing depends on it. Its automatic builds are now skipped ("Ignored Build Step" set to a command that exits 0). Not deleted; the owner can delete it. |
| Supabase Auth (hosted) | Email sign-in on; new addresses must be confirmed (`mailer_autoconfirm` false); Google off. **Custom SMTP configured on 17 Nov at 06:12 UTC is not delivering** (see "Email codes" below). |
| AI key, Resend, Sentry, payments | Not connected. |

## Email codes (sign-in) on the hosted project

What the Supabase Auth logs show (17 Nov, UTC):

- Before 06:12, codes went out through Supabase's built-in mailer (`mail.send` events) and two sign-ups completed.
- At 06:12 the auth settings were saved three times and the email limit changed from 2 to 30 an hour. That only happens when a custom SMTP server is saved.
- From then on, every code request (`POST /otp`) ran into Supabase Auth's 10-second limit (`504 request_timeout`, "context deadline exceeded") and no `mail.send` event appears. Supabase could not finish talking to the mail server.

The app now tells the person when a code could not be sent (instead of always showing "enter your code"). The mail server itself must be fixed in the Supabase dashboard by the owner: Authentication, Emails, SMTP Settings. Check host and port as a pair (465 means TLS from the start, 587 means STARTTLS; a wrong pair hangs like this), the username and password, and that the sender address is on a domain verified with the mail provider. The SMTP settings cannot be read from this build environment.

## Open it on your phone (owner)

1. Open `https://bloat-git-claude-bloat-software-build-uxzoru-typeshi2.vercel.app` in any browser. No Vercel account is needed now.
2. Tap Get started, choose a country, read the help page, enter your email and ask for a code. Codes only arrive once the SMTP settings above are fixed.
3. Your test mailbox address is on the Pro test list, so it sees Pro screens without buying anything.
4. To install it: in Chrome tap the menu then "Add to Home screen"; in Safari tap Share then "Add to Home Screen".

Use made-up data only. The preview is public: anyone with the address can open it and make an account.

## Environment variables

Names are in `.env.example`. Never commit values.

| Name | Where | What |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser and server | The `bloat-test` project URL and its publishable key. Safe in the browser. |
| `BLOAT_SERVER_SECRET` | server only | A long random value. Its SHA-256 hash must be in `private.server_secrets`. Without it nothing can be saved. |
| `BLOAT_AI_PROVIDER`, `BLOAT_AI_MODEL`, `ANTHROPIC_API_KEY` | server only | `mock` by default. `anthropic` plus a key for the real check. Only approved models run. |
| `BLOAT_BILLING_PROVIDER`, `BLOAT_BILLING_WEBHOOK_SECRET` | server only | `mock` only. |
| `BLOAT_STAFF_EMAILS` | server only | Comma-separated email addresses allowed into `/admin` (founder tools). Each also needs an authenticator app code. Leave empty to switch founder tools off. Not set on the preview. |
| `BLOAT_TEST_LOGIN` | server only | Exactly `1` turns on password sign-in for synthetic accounts, the mock purchase and the test clock. **`0` on the public preview since 18 Nov 2026.** Never `1` on a public or live site. |
| `BLOAT_PRO_TEST_EMAILS` | server only | Comma-separated confirmed addresses that get Pro without a purchase, for testing Pro screens while payments and the mock purchase are off. Preview: `pro-tester@bloat.test` (synthetic, for the hosted test run) and the owner's test mailbox. Empty on a live site. |

## Set up a preview from scratch

1. Apply every file in `supabase/migrations/` to `bloat-test`, in order.
2. Make a server secret and store only its hash in the database:

```sql
insert into private.server_secrets (name, sha256_hex)
values ('preview', encode(sha256(convert_to('<the secret>', 'utf8')), 'hex'));
```

3. In Supabase Auth settings: add the preview URL to the redirect list; put `{{ .Token }}` in the Magic Link and Confirm sign-up email templates (see `supabase/templates/code.html`) so the email shows a 6-digit code; set up custom SMTP; switch on Google only if wanted (the sign-in page hides the Google button while it is off).
4. Create a Vercel project from this repo, framework Next.js, and add the variables above for Preview, with `BLOAT_TEST_LOGIN=0`.
5. Before removing deployment protection, check on the new build that `POST /v1/auth/test-login` answers 404 and the sign-in page has no test password form.

## Hosted test run

The hosted browser suite (`tests/hosted/preview.spec.ts`) needs signed-in synthetic accounts, but a public preview has no password sign-in. So, for each run:

1. Make a one-off random password in a local file (never printed or committed) and its bcrypt hash.
2. Create the accounts for the run in `bloat-test` with that hash (roles: public, p1, diary, iso_a, iso_b, export, and `pro-tester@bloat.test` for Pro).
3. Run: `NODE_USE_ENV_PROXY=1 HOSTED_URL=<preview> HOSTED_SUPABASE_URL=<project URL> HOSTED_SUPABASE_KEY=<publishable key> HOSTED_ACCOUNTS=<role=email,...> HOSTED_PASSWORD=<from the file> pnpm test:hosted`. The test signs these accounts in through Supabase directly and gives the browser the session cookie.
4. Delete the accounts and the password file after the run.

## Replace a key

Make the new key, set it in Vercel, redeploy, check one request works, then delete the old key at the provider. For `BLOAT_SERVER_SECRET`: insert the new hash first, deploy the new value, then delete the old row from `private.server_secrets`.

## Never without the owner's yes

Production promotion, `bloat-live`, real users, real payments (`checkout_enabled` stays false until Gate 2; the founder tools refuse to switch it on).
