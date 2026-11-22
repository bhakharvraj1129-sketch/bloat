# Deployment

A **public preview** exists (the owner's decision, 18 Nov 2026). It runs on the hosted `bloat-test` database with synthetic data, a labelled mock AI and mock billing. There is no production site and no real payments.

## State on 18 Nov 2026

| Part | State |
|---|---|
| Public preview | `https://bloat-preview.vercel.app` (and `https://bloat-git-claude-bloat-software-build-uxzoru-typeshi2.vercel.app`). Opens without any Vercel login. Since 22 Nov it is published only by the Preview workflow after its checks pass ("Publishing the preview"); before that, every push rebuilt it. **Sign-in: email and password for owner-provisioned test accounts only** (since 18 Nov, commit `940a00d`, deployment `dpl_92qDryyhPyPmfHvD7zVQbQLT6sXR`). See "Sign-in method". |
| GitHub | Branch `claude/bloat-software-build-uxzoru` on `bhakharvraj1129-sketch/bloat`. No pull request. |
| Supabase `bloat-test` (`qntazirusbuwfmnmihzu`) | Six migrations applied, matching the files in `supabase/migrations/` by version: `20261117051631 foundation`, `20261117051734 server_functions`, `20261117051738 synthetic_test_users`, `20261117061403 country_capability_set`, `20261117174442 doctor_report_privacy`, `20261117182606 server_functions_not_for_signed_in_users`. |
| Harmless extra statement in the hosted foundation migration | When the foundation file was applied by hand through the connector on 17 Nov, one extra line went in: `insert into public.feature_flags (key, enabled, note) select 'x', false, null where false;`. `where false` means it inserts nothing (zero rows). It is in the recorded statement on `bloat-test` but not in the checked-in file. Schema fingerprints were identical before and after. Left as is: migrations are never edited after they are applied. |
| Data changes outside migrations | (1) One row in `private.server_secrets`, `preview-2026-11-17`, holding only the SHA-256 hash of the preview secret. (2) Synthetic accounts for each hosted test run, created with a one-off password (only its bcrypt hash is stored) and deleted after the run. On 18 Nov the 25 synthetic `hosted-…@example.com` accounts from earlier runs were also deleted, because their password is written in the repo. |
| Vercel project `bloat` (canonical) | Team `typeshi2`. Vercel Authentication **off** since 18 Nov (was on for all previews). Framework Next.js, Node 22. |
| Vercel variables (Preview only) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `BLOAT_SERVER_SECRET` (Sensitive, owner-entered), `BLOAT_AI_PROVIDER=mock`, `BLOAT_BILLING_PROVIDER=mock`, `BLOAT_TEST_LOGIN=0`, `BLOAT_PRO_TEST_EMAILS`. Not set: `BLOAT_STAFF_EMAILS` (founder tools off), any AI key. |
| Vercel project `bloat-zlrr` (duplicate) | Checked 18 Nov: no variables, no custom domains, no production deployment, Vercel Authentication on. Nothing depends on it. Its automatic builds are now skipped ("Ignored Build Step" set to a command that exits 0). Not deleted; the owner can delete it. |
| Supabase Auth (hosted) | Checked 18 Nov 08:40 UTC. Email provider on; new addresses must be confirmed (`mailer_autoconfirm` false); Google off. **Sign-ups still allowed (`disable_signup` false): owner action below.** Custom SMTP switched off at 06:45 UTC (built-in mailer, project-team addresses only, 2 emails an hour). Site URL is the preview's `/auth/callback`; that address is on the redirect list and unknown sites are refused (checked by sending an invalid link to Supabase and reading where it redirects; no email sent). |
| AI key, Resend, Sentry, payments | Not connected. |

## Sign-in method (temporary, testing only)

Since 18 Nov 2026 the preview offers **email and password** sign-in, for test accounts the owner sets up in Supabase. It is the temporary testing method while email delivery is limited. Real users will sign in with email codes again before anyone outside is invited.

What is on:

- `BLOAT_SIGN_IN_METHOD=password` (Vercel, Preview). The sign-in screen shows email and password only. No sign-up link, no email-code screen (`/sign-in/code` sends you back to `/sign-in`), no Google button, no "forgot password" link.
- Supabase's normal password sign-in and session: the browser sends the password straight to Supabase Auth over HTTPS; Bloat's server never sees it. The session is the usual Supabase cookie, so a refresh keeps you signed in and every private screen and API still checks it.
- `BLOAT_TEST_LOGIN=0`: the old test-login route answers 404; no shared password, no automatic login, no mock purchase.
- The test account is on the Pro test list (`BLOAT_PRO_TEST_EMAILS`), so it sees Pro screens without buying anything. It is **not** staff: `BLOAT_STAFF_EMAILS` is empty, so founder tools stay off.
- The email-code sign-in is still in the code (`src/app/sign-in/form.tsx`, `src/app/sign-in/code/`) for a controlled restoration.

### Owner: set up and use the test account (two dashboard steps, about 2 minutes)

1. **Switch off sign-ups in Supabase** (this is what blocks new accounts at the provider, not just in the app). Supabase dashboard, project **bloat-test**, Authentication, then **Sign In / Providers**. Turn off **"Allow new users to sign up"**. Leave the Email provider on. Save.
2. **Create the test account.** Authentication, then **Users**, then **Add user**, then **Create new user**. Email: `bloat-tester@bloat.test`. Password: a strong, unique one from your password manager (for example 20 random characters). Tick **Auto Confirm User**. Create.
3. Open the preview, tap **Sign in**, and enter that email and password. Keep the password only in your password manager: not in chat, notes, email, the repo or Vercel.

To change the password later: delete the user in Supabase and create it again (this also deletes its synthetic diary data). Do not reuse the password anywhere else.

### Before inviting anyone outside: restore email sign-in

1. Set up a working email sender in Supabase (Authentication, Emails, SMTP Settings) with a domain you own and have verified with your email provider. Send yourself a test email from the dashboard.
2. In Authentication, Emails, edit the **Magic Link** and **Confirm signup** templates so they show the 6-digit code with `{{ .Token }}` (copy from `supabase/templates/code.html`). The app asks for a code, not a link.
3. Raise the email rate limit (Authentication, Rate Limits) to what you expect, for example 30 an hour.
4. Turn **"Allow new users to sign up"** back on only if new testers should create their own accounts.
5. In Vercel, set `BLOAT_SIGN_IN_METHOD=email_code` (or delete it) for Preview, then redeploy (push a commit or Redeploy in Vercel).
6. Remove `bloat-tester@bloat.test` from `BLOAT_PRO_TEST_EMAILS` and delete the test account if it is no longer needed.
7. Run the hosted tests and the email-code checks in TEST_RESULTS.md against the preview before inviting anyone.

## Email codes (sign-in) on the hosted project

Custom SMTP was switched off at 06:45 UTC on 18 Nov; Supabase is back on its built-in mailer (project-team addresses only, 2 an hour). The history below explains why codes failed before.

What the Supabase Auth logs show (17 Nov, UTC):

- Before 06:12, codes went out through Supabase's built-in mailer (`mail.send` events) and two sign-ups completed.
- At 06:12 the auth settings were saved three times and the email limit changed from 2 to 30 an hour. That only happens when a custom SMTP server is saved.
- From then on, every code request (`POST /otp`) ran into Supabase Auth's 10-second limit (`504 request_timeout`, "context deadline exceeded") and no `mail.send` event appears. Supabase could not finish talking to the mail server.

The app now tells the person when a code could not be sent (instead of always showing "enter your code"). The mail server itself must be fixed in the Supabase dashboard by the owner: Authentication, Emails, SMTP Settings. Check host and port as a pair (465 means TLS from the start, 587 means STARTTLS; a wrong pair hangs like this), the username and password, and that the sender address is on a domain verified with the mail provider. The SMTP settings cannot be read from this build environment.

## Open it on your phone (owner)

1. Open `https://bloat-git-claude-bloat-software-build-uxzoru-typeshi2.vercel.app`. No Vercel account is needed.
2. Tap **Get started** (choose a country and read the help page), or **Sign in**. Use the test account from "Sign-in method".
3. To install it: in Chrome tap the menu then "Add to Home screen"; in Safari tap Share then "Add to Home Screen".

Use made-up data only. The preview is public: anyone with the address can open it, but only accounts you create in Supabase can sign in once sign-ups are switched off.

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
| `BLOAT_PRO_TEST_EMAILS` | server only | Comma-separated confirmed addresses that get Pro without a purchase, for testing Pro screens while payments and the mock purchase are off. Preview: `bloat-tester@bloat.test` (the owner's test account), `pro-tester@bloat.test` (synthetic, hosted test runs) and the owner's test mailbox. Empty on a live site. |
| `BLOAT_SIGN_IN_METHOD` | server only | `password`: email and password for owner-provisioned test accounts (the temporary testing method; preview since 18 Nov 2026). `email_code` or empty: email codes, the method for real users. Only one is shown at a time. |

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

## Addresses

- Testing preview, dedicated address: `https://bloat-preview.vercel.app` (added 19 Nov 2026).
- The same build: `https://bloat-git-claude-bloat-software-build-uxzoru-typeshi2.vercel.app`.
- Since 22 Nov 2026 both addresses move **only** through the Preview workflow, after its checks pass ("Publishing the preview"). A push no longer publishes by itself.
- `bloat-olive.vercel.app` is the project's production address. There is no production deployment, on purpose.
- If email sign-in is restored, add `https://bloat-preview.vercel.app/auth/callback` to Supabase's redirect URLs.

## Publishing the preview (quality gates)

A build that compiles is not a tested release. `vercel.json` switches off Vercel's automatic Git builds, so a push to the branch no longer changes what testers see. The workflow `.github/workflows/preview.yml` runs on every push to `claude/bloat-software-build-uxzoru` (and the checks alone on pull requests):

| Step | Blocks publishing? | What runs |
|---|---|---|
| 1. Checks | Yes | Typecheck, lint, rule tests; then the local Supabase stack in Docker, `scripts/ci-env.sh` (local-only test settings), the app build, the API tests and the browser tests on a phone screen. |
| 2. Vercel build | Yes | Vercel builds the commit with the Preview variables. Nothing public points at it yet. |
| 3. Hosted checks on the new build | Yes | The six account-free hosted checks (`pnpm test:hosted --grep @smoke`): signed-out return path, Back on public pages, empty-form messages, opens with no Vercel login, signed-out data refused, nobody can create an account. |
| 4. Publish | - | Both addresses are pointed at the tested build; the workflow then confirms through Vercel which deployment `bloat-preview.vercel.app` serves and fails if it is not that one. The run summary records commit and deployment. |
| 5. Hosted checks after publishing | No (reports only) | The same six checks on `https://bloat-preview.vercel.app`. A failure turns the run red; roll back as below. |
| Signed-in hosted suite | No (manual) | Needs owner-approved synthetic accounts and a one-off password ("Hosted test run"). Run it on the published build before calling a milestone tested. |

Not in the workflow: the control crawl, the link-by-link navigation run and the five-width check in `tests/ledger/` (long evidence runs, made by hand for the verification report), and checks on real phones.

**Every way the dedicated address could change, and what stops it** (checked 22 Nov):

| Path | What happens now |
|---|---|
| A push to the branch (Vercel's Git build) | Blocked twice: `vercel.json` turns Git builds off, and the project's "Ignored Build Step" is `test -n "$VERCEL_GIT_COMMIT_SHA"`, which skips any build that comes from a Git commit even if `vercel.json` is changed. Seen: no deployment for 4 pushes since `af950f5`. The second layer was set on 22 Nov at about 19:40 UTC; the tool used cannot read the value back, so check it once in Vercel: project `bloat`, Settings, Git, Ignored Build Step |
| "Redeploy" in the dashboard, or a deploy hook | Also Git builds, so the Ignored Build Step skips them. No deploy hook was created for this project |
| Pushes to other branches (for example `main`) | Skipped the same way; their builds could never take this address anyway, because it is tied to this branch |
| The Preview workflow | The only automatic path: it uploads the commit's files without Git history (so its build is not skipped), runs the hosted checks on the new build, then moves the address |
| A person with access to the Vercel team (dashboard "Assign domain", or the Vercel CLI with their own login) | Cannot be blocked by a setting: this is an owner-level action. Do not move the address by hand; if you must (roll back), note it in DEPLOYMENT.md |
| Someone with push access weakening the workflow | Possible, but it is a visible commit to `.github/workflows/preview.yml` or `vercel.json`; review any change to those two files |

**Owner step, needed once, or the preview stops updating.** Until it is done, the workflow stops at step 2 with "the VERCEL_TOKEN repository secret is not set", and the preview stays on the last published build. That is on purpose: nothing untested gets published.

1. On vercel.com: Account Settings, Tokens, Create. Name it `bloat-preview-publish`, scope: team `typeshi2`, expiry: 90 days.
2. On github.com, repository `bloat`: Settings, Secrets and variables, Actions, New repository secret. Name `VERCEL_TOKEN`, paste the token there (not in chat, not in a file).
3. In the Actions tab, open the latest "Preview" run and choose "Re-run all jobs".

The token is never written to the repository or printed in the run log (GitHub masks it). Replace it before it expires, the same way.

A commit whose message contains `[skip ci]` skips the whole workflow, publishing included, so it can never reach the preview. Use it only for commits that change notes, not the app.

**Roll back** (if step 5 fails, or a problem is found later): in Vercel, project `bloat`, Deployments, open the previous good deployment, and assign `bloat-preview.vercel.app` to it (Domains, or "Assign domain"). Then fix the commit; the next passing run publishes again.

**What a CI run costs:** the checks take most of the time. Locally the browser tests take about 7 minutes and the API tests about 3; with installing and starting the local Supabase stack, the checks took 11 minutes on GitHub (run 3, 22 Nov), plus a few minutes for the Vercel build and hosted checks once publishing is set up. On a private repository this uses GitHub Actions minutes from the free monthly allowance.

## Hosted test run

The six account-free hosted checks run in the Preview workflow on every publish (`pnpm test:hosted --grep @smoke`). The signed-in hosted suite (`tests/hosted/preview.spec.ts` and `signed-in-navigation.spec.ts`) signs in through the app's own email-and-password form and needs accounts made for the run. For each run:

1. Ask the owner to approve the exact list of accounts first (roles: public, p1, diary, iso_a, iso_b, export, and `pro-tester@bloat.test` for Pro), each marked `synthetic_test_run = <date>` in its user metadata.
2. Make a one-off random password in a local file (never printed or committed) and its bcrypt hash. Create the accounts in `bloat-test` with that hash, through the Supabase connector (needs the owner's confirmation there) or the owner pasting the prepared SQL into the Supabase SQL editor.
3. Run: `NODE_USE_ENV_PROXY=1 HOSTED_URL=<preview> HOSTED_SUPABASE_URL=<project URL> HOSTED_SUPABASE_KEY=<publishable key> HOSTED_ACCOUNTS=<role=email,...> HOSTED_PASSWORD=<from the file> pnpm test:hosted`. Record the commit and the deployment ID the address served during the run. Use fresh accounts for every run (the checks count entries). Files run in name order: `signed-in-navigation.spec.ts` relies on accounts set up by `preview.spec.ts`.
4. Delete the accounts, using only the approved list: read their IDs, emails and marker first and stop on any difference. Deleting a user in `auth.users` removes its sessions, refresh tokens, identities and every app row (they cascade). Then confirm with read-only queries that all of them are gone.
5. Deleting the password file only stops new password sign-ins. It does not end sessions already issued; deleting the accounts (step 4) does.

What happens to a token issued before an account is deleted (checked locally by `tests/api/slice-a-account.test.ts`, "a deleted account's earlier tokens"): the app checks every request with Supabase Auth, so `/v1` answers 401 at once; Supabase refuses the user lookup (403) and the refresh token (400). The access token itself stays signature-valid until it expires (the project's token lifetime; Supabase's default is one hour), so a direct database read with it is not refused by the token check, but it returns no rows, because every row went with the account, and direct writes are refused (403).

## Replace a key

Make the new key, set it in Vercel, redeploy, check one request works, then delete the old key at the provider. For `BLOAT_SERVER_SECRET`: insert the new hash first, deploy the new value, then delete the old row from `private.server_secrets`.

## Never without the owner's yes

Production promotion, `bloat-live`, real users, real payments (`checkout_enabled` stays false until Gate 2; the founder tools refuse to switch it on).
