# Deployment

A **public testing preview** exists (the owner's decision, 18 Nov 2026). It runs on the hosted `bloat-test` database with synthetic data and mock billing. Since 27 Nov 2026 it is the candidate for the **first invited acceptance round** (AI off; Learn, daily cards and experiments off; Pro test access; made-up data only; `docs/beta/README.md`), frozen; nobody is invited. There is no production build and no real payments. Since 24 Nov 2026 the project's main addresses show that same test build (the owner's decision); that is not a launch.

This file has the **current state** first, then **how things are done now** (publishing, hosted test runs, the test account, keys), then a short **history**. What remains to decide or build is in `PROGRESS.md`, "What remains".

## Current state (verified 28 Nov 2026, after run 25)

| Part | State | Evidence |
|---|---|---|
| Public preview (charts and pattern diagrams) | `https://bloat-preview.vercel.app` and the branch address serve deployment `dpl_7aBmbLFDaUjXm6WBcfqWm2XKDKG1`, built by run 25 (push, 28 Nov 10:08 UTC, published 10:27) from commit `0bfa329`: everything in run 24 plus the chart system, the month calendar, the comparison and halves pictures, the day timeline and the How a comparison works diagram (choice 36). Opens without any Vercel login. Previous build: `dpl_9ZxDR1j2tSNyrWqDRtqT1RB6CV9C` (run 24); before it `dpl_FCsJjMaBkxJ87uNHu8tKyK8MUvGK` (run 22); the accepted acceptance-round candidate: `dpl_2QsTiDKAVFB4NaQr99RVjTtAGdvt` | Run 25 passed every step; Vercel reports both addresses on it; all 235 repository files Vercel lists byte-identical to `0bfa329`; live checks 16 of 16, 8 of 8, 1 of 1 and 2 of 2 with disposable accounts, deleted afterwards |
| Main addresses | `bloat-olive.vercel.app`, `bloat-typeshi2.vercel.app` and `bloat-git-main-typeshi2.vercel.app` point at an **older** deployment, `dpl_DoAEN2q7gxKTrfvL9pZw1nGGEekn` (commit `83fe4da`, **without the K1 and P2 fixes**). They were moved there by hand on 24 Nov 2026 (the owner's request; before that they served the docs-only `main` deployment of 15 Nov, which answered 404). The Preview workflow does not move them, so runs 13 to 18 left them there (read again on 27 Nov after run 18). Same settings as the preview: a Preview-target deployment with the Preview variables only (`bloat-test`, mock AI, mock billing, `BLOAT_TEST_LOGIN=0`, password sign-in). `bloat-olive.vercel.app` also had a temporary shareable-link protection bypass, created 24 Nov (not by the workflow); Vercel shows it expired on 24 Nov at 18:48 UTC (read 26 Nov), so it no longer works. Still no production build; the page stays hidden from search engines | Alias list read before run 13 and after runs 13 and 14, 24 Nov (`test-evidence/ledger/deploy-7N1R.txt`); read again on 26 Nov before and after run 15 |
| Publishing | Only the Preview workflow (`.github/workflows/preview.yml`) moves the two preview addresses, after its checks pass (it never moves the main addresses). Its `VERCEL_TOKEN` repository secret is in place (added by the owner on 22 Nov) | Runs 6, 9 to 22, 24 and 25 published (run 23 did not; run list read 28 Nov) |
| GitHub | Branch `claude/bloat-software-build-uxzoru` on `bhakharvraj1129-sketch/bloat`. On 24 Nov 2026, at the owner's request, `main` was fast-forwarded to it (`8d2d4d7` to `3646f92`) and then got one notes-only commit (`244c80b`), so `main` holds neither the K1 nor the P2 fix. A push to `main` publishes nothing (Git builds are off and the workflow runs only for the branch). Later commits go to the branch; `main` catches up only when the owner asks. Since 26 Nov a cloud session also works on `claude/bloat-continuation-9mjd46`; it holds the same app code as the publishing branch (`35c947b`) plus notes commits, and a push there publishes nothing. A branch `claude/unzip-push-main-04req7` (not made by this session; an old planning commit) was left untouched | `git ls-remote`, 24 Nov; branches read 26 Nov |
| Supabase `bloat-test` (`qntazirusbuwfmnmihzu`) | Six migrations applied, matching `supabase/migrations/` by version: `20261117051631 foundation`, `20261117051734 server_functions`, `20261117051738 synthetic_test_users`, `20261117061403 country_capability_set`, `20261117174442 doctor_report_privacy`, `20261117182606 server_functions_not_for_signed_in_users` | Migration list read on 27 Nov (no migration was needed in the 26 Nov round) |
| Supabase Auth | Sign-ups **off** in Supabase itself; email-and-password sign-in for accounts made in the dashboard; Google off; custom SMTP off (built-in mailer, project-team addresses only, 2 emails an hour) | Sign-ups: hosted check "nobody can create an account" passed on `da4bb77` (27 Nov). Mailer and Google: last read on 18 Nov. Leaked-password protection: off (Supabase security advisor; decision D29) |
| Accounts | The owner's test account `bloat-tester@bloat.test` (with its sample meal, bloating record and report; unchanged), 3 other existing accounts, and **5 participant accounts** for the first acceptance round (created 27 Nov with the owner's approval, marked `acceptance_round_participant = 2026-11-27` in their user metadata; their addresses are only in Supabase and in `BLOAT_PRO_TEST_EMAILS`, not in the repository). Participant accounts are persistent: never deleted, reset or used by test runs without the owner's instruction. No synthetic test accounts remain | Read-only checks, 27 Nov |
| Data outside migrations | One row in `private.server_secrets`, `preview-2026-11-17`, holding only the SHA-256 hash of the preview secret | |
| Vercel project `bloat` | Team `typeshi2`. Vercel Authentication off (since 18 Nov). Git builds off (`vercel.json`); Ignored Build Step `test -n "$VERCEL_GIT_COMMIT_SHA"` | Every workflow run reads both back before building (run 14: matched) |
| Vercel variables (Preview only) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `BLOAT_SERVER_SECRET` (sensitive, owner-entered), `BLOAT_AI_PROVIDER=off` (was `mock` until 27 Nov), `BLOAT_OFF_FEATURES=learn_library,daily_cards,experiments_habit,experiments_swap` (created 27 Nov; experiments added before run 18), `BLOAT_BILLING_PROVIDER=mock`, `BLOAT_TEST_LOGIN=0`, `BLOAT_PRO_TEST_EMAILS`, `BLOAT_SIGN_IN_METHOD=password`. Not set: `BLOAT_STAFF_EMAILS` (founder tools off), any AI key. No Production variables exist | Variable changed and read back on 27 Nov, before run 18 |
| Vercel project `bloat-zlrr` (duplicate) | No variables, no domains, no production deployment; its automatic builds are skipped. Nothing depends on it. On 24 Nov the owner asked for it to go; deleting is done by the owner in Vercel (project `bloat-zlrr`, Settings, General, Delete Project) | Checked 18 Nov; unchanged since (project list, 23 Nov) |
| AI key, Resend, Sentry, payments | Not connected | Variable list, 27 Nov |

## Frozen (from 28 Nov 2026, after run 25)

The two preview addresses serve `dpl_7aBmbLFDaUjXm6WBcfqWm2XKDKG1` (run 25, commit `0bfa329`): design v2, the owner's answers of 27 Nov, the motion and design pass (choice 34), the animated start page with in-app responses (choice 35) and the charts and pattern diagrams (choice 36). The three main addresses serve `dpl_DoAEN2q7gxKTrfvL9pZw1nGGEekn` (commit `83fe4da`) until the owner asks for them to be moved. Rollback targets: `dpl_9ZxDR1j2tSNyrWqDRtqT1RB6CV9C` (run 24, before the charts), `dpl_FCsJjMaBkxJ87uNHu8tKyK8MUvGK` (run 22, before the animated start page), `dpl_9Gxh4m9E7Pf4d3nqvDoRnauck6R9` (run 21), `dpl_7DidTdSjyyaiPWeW52ER3docj8dm` (run 20) and `dpl_2QsTiDKAVFB4NaQr99RVjTtAGdvt` (run 19, the accepted acceptance-round code). Earlier freezes were lifted for K1 and P2 (runs 13 and 14), the review fixes (15 to 17), the acceptance round (18), the participants' Pro list (19), the redesign (20), the owner's answers of 27 Nov (21), the motion and design request (22) the owner's request for a properly animated interface (23 and 24) and the owner's request for charts and pattern diagrams (25). The owner distributes the guide and credentials; Claude sends nothing. Otherwise nothing is published, no Vercel variable, Supabase setting or account is changed, and nobody is invited. Notes-only commits carry `[skip ci]`, so they run no workflow and cannot publish.

## Addresses

- Testing preview, dedicated address: `https://bloat-preview.vercel.app`.
- The same build: `https://bloat-git-claude-bloat-software-build-uxzoru-typeshi2.vercel.app`.
- Both addresses move **only** through the Preview workflow, after its checks pass. A push does not publish by itself.
- `bloat-olive.vercel.app` (with `bloat-typeshi2.vercel.app` and `bloat-git-main-typeshi2.vercel.app`) is the project's production address. Since 24 Nov 2026 it points at a test deployment, by the owner's decision; since runs 13, 14 and 15 that is an **older** build `83fe4da` (`dpl_DoAEN2q7gxKTrfvL9pZw1nGGEekn`), not the one the preview serves. There is still no production build. The Preview workflow does not move these addresses: they stay where they are until someone moves them (Vercel, project `bloat`, Deployments, the new deployment, Assign domain) and records it here. Moving them is the owner's call.

## Branches and addresses: reconciliation plan (28 Nov 2026; recommended, not done)

Read on 28 Nov 2026 with full Git history (read only; nothing was moved or merged):

| Thing | Where it is | Gap |
|---|---|---|
| Publishing branch `claude/bloat-software-build-uxzoru` | The tested app (run 26 onwards) | none |
| Working branch `claude/bloat-continuation-9mjd46` | Same commits as the publishing branch | none |
| `main` | `244c80b` (24 Nov, a notes-only commit after `3646f92`) | 52 commits behind the working head; it has **no** commit of its own that the branch lacks, so it can be fast-forwarded with no merge |
| Main addresses `bloat-olive`, `bloat-typeshi2`, `bloat-git-main-typeshi2` | `dpl_DoAEN2q7gxKTrfvL9pZw1nGGEekn`, commit `83fe4da` (set by hand on 24 Nov) | 55 commits behind: without K1, P2, the 26 and 27 Nov review fixes, the redesign, and the four fixes of choice 37. Same Preview settings and the same `bloat-test` database as the preview |
| Branch `claude/unzip-push-main-04req7` | `8d2d4d7`, an old planning commit | fully contained in `main`; nothing would be lost by deleting it |

Recommended, in this order, each only on the owner's yes:

1. **Main addresses first** (they are public now and show a build with known, fixed defects). Point all three at the same deployment the preview serves after its live checks pass: Vercel, project `bloat`, Deployments, that deployment, Assign domain, once per address (or `vercel alias set <deployment> <address>`). Read the three aliases back and record them here. Alternative if they are not needed: remove the three aliases so only the preview address remains. Either way the Preview workflow keeps not moving them.
2. **Then `main`:** fast-forward it to the verified publishing-branch commit (`git push origin <commit>:main`, fast-forward only, no force). A push to `main` publishes nothing (Git builds are off; the workflow runs only for the publishing branch). After that, decide whether future work goes to `main` through pull requests or stays on the publishing branch.
3. **Tidy:** delete `claude/unzip-push-main-04req7`; keep the working branch until the round ends.

## Publishing the preview (the only way)

A build that compiles is not a tested release. `vercel.json` switches off Vercel's automatic Git builds. The workflow `.github/workflows/preview.yml` runs on every push to `claude/bloat-software-build-uxzoru` (the checks alone on pull requests), and can be started by hand (Actions, "Preview", "Run workflow" on that branch):

| Step | Blocks publishing? | What runs |
|---|---|---|
| 1. Checks | Yes | Typecheck, lint, rule tests; then the local Supabase stack in Docker, `scripts/ci-env.sh` (local-only test settings), the app build, the API tests and the browser tests on a phone screen (including the interface review, `tests/e2e/interface-review.spec.ts`). Since 28 Nov (choice 37): a second app server from the same build with the preview's beta settings (AI off; Learn, daily cards and experiments off; password sign-in) runs the round's API checks and the browser checks that need those settings or password sign-in; any skipped, failed or empty beta suite blocks publishing. Passed, failed and skipped counts per suite are written to the run summary. |
| 2. Vercel build | Yes | Reads back the deployment controls (Git builds off, Ignored Build Step) and stops if they differ; then Vercel builds the commit's files with the Preview variables. Nothing public points at it yet. |
| 3. Hosted checks on the new build | Yes | The six account-free hosted checks (`pnpm test:hosted --grep @smoke`): signed-out return path, Back on public pages, empty-form messages, opens with no Vercel login, signed-out data refused, nobody can create an account. |
| 4. Publish | - | Both addresses are pointed at the tested build; the workflow then confirms through Vercel which deployment `bloat-preview.vercel.app` serves and fails if it is not that one. The run summary records commit and deployment. |
| 5. Hosted checks after publishing | No (reports only) | The same six checks on `https://bloat-preview.vercel.app`. A failure turns the run red; roll back as below. |
| Signed-in hosted suite | No (manual) | Needs owner-approved synthetic accounts ("Hosted test run"). Run it on the published build before calling a milestone tested. |

A commit whose message contains `[skip ci]` skips the whole workflow, publishing included. Use it only for commits that change notes or tests, not the app.

**After changing a Vercel variable** (for example the sign-in method), the running build does not change. Start the workflow by hand on the branch (Actions, "Preview", "Run workflow"): it builds again with the new variables, runs the checks and publishes only if they pass. Do not use "Redeploy" in the Vercel dashboard: it rebuilds outside the workflow, so none of the checks run (what it would do to the addresses has not been tested).

Not in the workflow: the older long evidence runs in `tests/ledger/` (made by hand for the verification report) and checks on real phones. Since 28 Nov a shorter control crawl, link and Back run, width check (320 to 1280 px), 200% zoom on the chart screens and password-form check run in every workflow run (`tests/e2e/interface-review.spec.ts`).

**Every way the dedicated address could change, and what stops it** (checked 22 Nov; re-confirmed by every run since):

| Path | What happens now |
|---|---|
| A push to the branch (Vercel's Git build) | **Blocked by `vercel.json`** (Git builds off): no Git-triggered deployment for any push since `af950f5`. **Second layer, configured and read back, not proven:** the Ignored Build Step `test -n "$VERCEL_GIT_COMMIT_SHA"`, meant to skip any Git-triggered build even if `vercel.json` changes. Whether it really skips a Git build has not been tested (that needs a Git build on a separate branch, with the owner's permission) |
| "Redeploy" in the dashboard, or a deploy hook | **Not tested.** A redeploy of a Git build would rely on the same second layer (configured, not proven); the current deployments were made by the workflow, not from Git, and the Ignored Build Step does not skip those. Either way it bypasses the checks: do not use it. No deploy hook exists for this project |
| Pushes to other branches (for example `main`) | Their builds can never take this address: it is tied to this branch |
| The Preview workflow | The only automatic path: it uploads the commit's files without Git history (so its build is not skipped), runs the hosted checks on the new build, then moves the address |
| A person with access to the Vercel team (dashboard "Assign domain", or the Vercel CLI with their own login) | Cannot be blocked by a setting: an owner-level action. Use it only for an emergency roll back (below), and record it here |
| Someone with push access weakening the workflow | Possible, but it is a visible commit to `.github/workflows/preview.yml` or `vercel.json`; review any change to those two files |

**Roll back (emergency only):** if step 5 fails, or a serious problem is found on the published build, open Vercel, project `bloat`, Deployments, open the previous good deployment and assign `bloat-preview.vercel.app` to it. Record the date and deployment here. Then fix the commit; the next passing workflow run publishes again.

**The `VERCEL_TOKEN` secret.** In place since 22 Nov. If it is missing or has expired, the workflow stops at step 2 and nothing is published (on purpose). To replace it: on vercel.com, Account Settings, Tokens, Create (scope: team `typeshi2`; choose an expiry); then on github.com, repository `bloat`, Settings, Secrets and variables, Actions, update `VERCEL_TOKEN` with the new value (never in chat or a file). Then start the workflow by hand.

**What a run costs:** about 15 to 17 minutes end to end (run 14: 09:43 to 09:57 UTC), most of it the checks. On a private repository this uses GitHub Actions minutes from the monthly allowance.

## Hosted test run

The six account-free hosted checks run inside the workflow on every publish. The **signed-in hosted suite (16 checks)** is four files, run in this order, and needs accounts made for the run:

`tests/hosted/navigation.spec.ts`, `tests/hosted/preview.spec.ts`, `tests/hosted/signed-in-journey.spec.ts`, `tests/hosted/signed-in-navigation.spec.ts`

Optional extra checks, run **after** the suite (they use accounts the suite sets up): `tests/hosted/beta-candidate.spec.ts` (accounts "beta" and "pro"; the round's settings, the 26 and 27 Nov fixes, Pro test access and a password change), `tests/hosted/export-feedback.spec.ts` (account "export") and `tests/hosted/kept-photos.spec.ts` (account "pro"; it first confirms the preview's ingredient check is the mock, so it does not apply while AI is off). `tests/hosted/reported-fixes.spec.ts` needs its own fresh "pro" account. `tests/hosted/motion.spec.ts` (28 Nov) needs one more account, role "motion" (for example `run-motion@bloat.test`; it sets itself up in India): the PIN code lookup on the deployed build, the bottom sheet and the save message, and the start page's reveals. `tests/hosted/charts.spec.ts` (28 Nov, choice 36) runs **last**, after reported-fixes, with the same "pro" account: the How it works diagram, the day timeline, the month calendar, the daily chart, their tables, and Hide charts in You. Do not run `pnpm test:hosted` without naming files: it runs every file in name order, and the extra checks would run before their accounts exist.

For each run:

0. **Never touch participant accounts** (marked `acceptance_round_participant` in their user metadata): create run accounts only with the `synthetic_test_run` marker, delete only the run's own roles with `delete-accounts.ts`, and check cleanup only against the run's own IDs and marker.
1. Ask the owner to approve the exact list of accounts first (roles: public, p1, diary, iso_a, iso_b, export, and `pro-tester@bloat.test` for Pro), each marked `synthetic_test_run = <date>` in its user metadata. Never use `bloat-tester@bloat.test`.
2. Take a read-only fingerprint of `bloat-tester@bloat.test` (its meals, bloating records, readings, reports, profile, plan and sign-in details) to compare afterwards.
3. Make a one-off random password in a private local file (never printed or committed) and its bcrypt hash. Create the accounts in `bloat-test` with only that hash, through the Supabase connector or by the owner pasting the prepared SQL into the Supabase SQL editor.
4. Run: `NODE_USE_ENV_PROXY=1 HOSTED_URL=<preview> HOSTED_SUPABASE_URL=<project URL> HOSTED_SUPABASE_KEY=<publishable key> HOSTED_ACCOUNTS=<role=email,...> HOSTED_PASSWORD=<from the file> pnpm exec playwright test -c playwright.hosted.config.ts <the four files above>`. Record the commit and the deployment ID the address served during the run. Use fresh accounts for every run (the checks count entries).
5. Delete the accounts **through the app**, with the same password and accounts: `pnpm exec tsx tests/hosted/delete-accounts.ts <roles>`. This is the user's own "Delete my account", so it also removes kept photos from storage; deleting rows in `auth.users` directly would not remove stored files. Then destroy the password file.
6. Confirm with read-only queries: no users, sessions, refresh tokens, identities, stored files or app rows for those IDs, no account left with the run's marker, and `bloat-tester`'s fingerprint unchanged.

What happens to a token issued before an account is deleted (checked locally by `tests/api/slice-a-account.test.ts`): the app checks every request with Supabase Auth, so `/v1` answers 401 at once; Supabase refuses the user lookup (403) and the refresh token (400). The access token itself stays signature-valid until it expires (Supabase's default is one hour), but a direct database read with it returns no rows, and direct writes are refused (403).

## Sign-in method (temporary, testing only)

Since 18 Nov 2026 the preview offers **email and password** sign-in, for accounts the owner makes in Supabase. It is the temporary testing method while email delivery is limited. Real users will sign in with email codes before anyone outside is invited.

- `BLOAT_SIGN_IN_METHOD=password` (Vercel, Preview). The sign-in screen shows email and password only: no sign-up link, no email-code screen (`/sign-in/code` sends you back to `/sign-in`), no Google button, no password-reset email. Since 27 Nov (run 17) it says "Forgot your password? Ask the person who invited you to set a new temporary one. Once you're signed in, you can change it in You.", and You has **Change password** (at least 10 characters; the browser sends it straight to Supabase).
- Supabase's normal password sign-in and session: the browser sends the password straight to Supabase Auth over HTTPS; Bloat's server never sees it. A refresh keeps you signed in, and every private screen and API still checks the session.
- Sign-ups are off in Supabase itself (Authentication, Sign In / Providers, "Allow new users to sign up" off), so only accounts made in the dashboard can sign in.
- `BLOAT_TEST_LOGIN=0`: the old test-login route answers 404; no shared password, no automatic login, no mock purchase.
- The email-code sign-in is still in the code (`src/app/sign-in/form.tsx`, `src/app/sign-in/code/`) for a controlled restoration.

### The owner's test account

`bloat-tester@bloat.test` was made by the owner on 22 Nov (Authentication, Users, Add user, Create new user, Auto Confirm User). It is on the Pro test list (`BLOAT_PRO_TEST_EMAILS`), so it sees Pro screens without buying anything. It is **not** staff. Its password lives only in the owner's password manager.

### Change the test account's password (keeps the account and every record)

Do **not** delete and recreate the account to change its password: that deletes its records for good and gives it a new ID. Use Supabase's admin password update instead (`auth.admin.updateUserById`, from the Supabase documentation). It changes only the password; the account, its ID and every record stay as they are. Checked on the local stack on 23 Nov with this exact script: afterwards the old password was refused, the new one worked, the account ID was the same and its records were unchanged.

You run this yourself on your own computer. The secret key and the new password never go into chat, the repository, Vercel or any file you keep.

1. In the Supabase dashboard, project **bloat-test**: Authentication, Users, open `bloat-tester@bloat.test` and copy its **User UID**.
2. Project Settings, API Keys: reveal and copy a **secret** key. It bypasses all access rules, so keep it only for this one step.
3. On your computer, in an empty folder, with Node.js 20 or newer: run `npm install @supabase/supabase-js`, then save this as `change-password.mjs`:

```js
import { createClient } from "@supabase/supabase-js";
const url = process.env.SUPABASE_URL ?? "https://qntazirusbuwfmnmihzu.supabase.co";
const admin = createClient(url, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const { error } = await admin.auth.admin.updateUserById(process.env.USER_ID, { password: process.env.NEW_PASSWORD });
console.log(error ? `Not changed: ${error.message}` : "Password changed. The account and its records are unchanged.");
```

4. In a terminal (macOS or Linux; the values are typed, not shown, and not kept in the shell history):

```bash
read -rs SUPABASE_SECRET_KEY && export SUPABASE_SECRET_KEY
```

```bash
read -rs NEW_PASSWORD && export NEW_PASSWORD
```

```bash
USER_ID=<the User UID from step 1> node change-password.mjs
```

5. Sign in on the preview with the new password, save it in your password manager, then close the terminal and delete the folder. If you want, make a new secret key in the dashboard and delete the one you used.

The signed-in person can also change their own password in You, Change password (since run 17). A password-reset email is not usable here: it needs a real mailbox and working email delivery. For a tester, use the tester's User UID in step 1 (`docs/beta/owner-checklist.md`, section 4).

### Before inviting anyone outside: restore email sign-in

1. Set up a working email sender in Supabase (Authentication, Emails, SMTP Settings) with a domain you own and have verified with your email provider. Send yourself a test email from the dashboard.
2. In Authentication, Emails, edit the **Magic Link** and **Confirm signup** templates so they show the 6-digit code with `{{ .Token }}` (copy from `supabase/templates/code.html`). The app asks for a code, not a link.
3. Raise the email rate limit (Authentication, Rate Limits) to what you expect, for example 30 an hour.
4. Decide whether new testers may create their own accounts; only then turn **"Allow new users to sign up"** back on.
5. Add `https://bloat-preview.vercel.app/auth/callback` to Supabase's redirect URLs.
6. In Vercel, set `BLOAT_SIGN_IN_METHOD=email_code` (or delete it) for Preview, then start the Preview workflow by hand on the branch (Actions, "Preview", "Run workflow"). It builds with the new setting, runs the checks and publishes only if they pass.
7. Remove `bloat-tester@bloat.test` from `BLOAT_PRO_TEST_EMAILS` (publish again the same way) and delete the test account if it is no longer needed.
8. Run the signed-in hosted suite and the email-code checks in `TEST_RESULTS.md` against the preview before inviting anyone.

## Open it on your phone (owner)

1. Open `https://bloat-preview.vercel.app`. No Vercel account is needed.
2. Tap **Sign in** and use your test account.
3. To install it: in Chrome tap the menu then "Add to Home screen"; in Safari tap Share then "Add to Home Screen".

Use made-up data only. The preview is public: anyone with the address can open it, but only accounts made in Supabase can sign in.

## Environment variables

Names are in `.env.example`. Never commit values.

| Name | Where | What |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser and server | The `bloat-test` project URL and its publishable key. Safe in the browser. |
| `BLOAT_SERVER_SECRET` | server only | A long random value. Its SHA-256 hash must be in `private.server_secrets`. Without it nothing can be saved. |
| `BLOAT_AI_PROVIDER`, `BLOAT_AI_MODEL`, `ANTHROPIC_API_KEY` | server only | `mock` by default. `off`: no AI anywhere (the AI features are not offered and their routes answer 404; the beta candidate). `anthropic` plus a key for the real check (owner's approval of the key and spending limit first). Only approved models run. |
| `BLOAT_OFF_FEATURES` | server only | Comma-separated feature keys from `docs/data/` (for example `learn_library,daily_cards`) that are not offered to anyone: hidden in the app, 404 on their routes. Empty by default. Acceptance round: `learn_library,daily_cards,experiments_habit,experiments_swap`. |
| `BLOAT_BILLING_PROVIDER`, `BLOAT_BILLING_WEBHOOK_SECRET` | server only | `mock` only. |
| `BLOAT_STAFF_EMAILS` | server only | Comma-separated addresses allowed into `/admin` (founder tools). Each also needs an authenticator app code. Empty switches founder tools off. Not set on the preview. |
| `BLOAT_TEST_LOGIN` | server only | Exactly `1` turns on the test-only login, the mock purchase and the test clock (local stack only). **`0` on the public preview.** Never `1` on a public or live site. |
| `BLOAT_PRO_TEST_EMAILS` | server only | Comma-separated confirmed addresses that get Pro without a purchase, for testing Pro screens while payments are off. Preview: `bloat-tester@bloat.test`, `pro-tester@bloat.test` (synthetic, hosted test runs), the owner's test mailbox and, since 27 Nov, the five participants' addresses. A change needs a new build (run the workflow by hand). Empty on a live site. |
| `BLOAT_SIGN_IN_METHOD` | server only | `password`: email and password for owner-made test accounts (the temporary testing method; preview). `email_code` or empty: email codes, the method for real users. Only one is shown at a time. |

## Set up a preview from scratch

1. Apply every file in `supabase/migrations/` to `bloat-test`, in order.
2. Make a server secret and store only its hash in the database:

```sql
insert into private.server_secrets (name, sha256_hex)
values ('preview', encode(sha256(convert_to('<the secret>', 'utf8')), 'hex'));
```

3. In Supabase Auth settings: add the preview URL to the redirect list; put `{{ .Token }}` in the Magic Link and Confirm sign-up email templates (see `supabase/templates/code.html`); set up custom SMTP; switch on Google only if wanted.
4. Create a Vercel project from this repo, framework Next.js, and add the variables above for Preview, with `BLOAT_TEST_LOGIN=0`. Set its Ignored Build Step to `test -n "$VERCEL_GIT_COMMIT_SHA"` (`vercel.json` already switches Git builds off).
5. Add the `VERCEL_TOKEN` repository secret (above) and publish only through the Preview workflow; its hosted checks include "opens with no Vercel login" and "nobody can create an account".

## Replace a key

Make the new key, set it in Vercel, publish through the Preview workflow (start it by hand), check one request works, then delete the old key at the provider. For `BLOAT_SERVER_SECRET`: insert the new hash first, publish with the new value, then delete the old row from `private.server_secrets`.

## Never without the owner's yes

Production promotion, `bloat-live`, real users (inviting beta testers included), real payments (`checkout_enabled` stays false until Gate 2; the founder tools refuse to switch it on), paid AI, and any change during the review freeze.

## History

Kept for the record; true on the date given, not necessarily now.

- **17 Nov 2026, foundation migration.** When the foundation file was applied by hand through the connector, one extra line went in: `insert into public.feature_flags (key, enabled, note) select 'x', false, null where false;`. `where false` means it inserts nothing. It is in the recorded statement on `bloat-test` but not in the checked-in file. Schema fingerprints were identical before and after. Left as is: migrations are never edited after they are applied.
- **17 to 18 Nov 2026, email codes on the hosted project.** Before 06:12 UTC on 17 Nov, codes went out through Supabase's built-in mailer and two sign-ups completed. At 06:12 a custom SMTP server was saved (the email limit changed from 2 to 30 an hour); from then on every code request hit Supabase Auth's 10-second limit (`504 request_timeout`) and no email was sent. The app now tells the person when a code could not be sent. Custom SMTP was switched off at 06:45 UTC on 18 Nov. When it is set up again, check host and port as a pair (465 means TLS from the start, 587 means STARTTLS), the username and password, and that the sender address is on a verified domain.
- **18 Nov 2026.** Vercel Authentication switched off for the public preview; the 25 synthetic `hosted-…@example.com` accounts from earlier runs deleted (their password was written in the repo); the duplicate project `bloat-zlrr`'s builds skipped; the password sign-in added.
- **19 Nov 2026.** The dedicated address `https://bloat-preview.vercel.app` added. Until 22 Nov every push rebuilt the preview.
- **22 Nov 2026.** The owner switched Supabase sign-ups off and made `bloat-tester@bloat.test`. Git builds switched off and the Preview workflow made the only publishing path; the owner added `VERCEL_TOKEN`; run 6 published `adfe49b`. The 19 temporary accounts from 19 Nov and the 7 accounts of that evening's run were deleted and verified.
- **23 Nov 2026.** Runs 9 to 12 published `0d537d2`, `7713098`, `62431c7` and `83fe4da`; the preview was frozen on `83fe4da`. Every set of synthetic accounts used for hosted runs that day was deleted through the app and verified.
- **24 Nov 2026.** At the owner's request: `main` fast-forwarded to the build branch (`3646f92`), and the three production addresses moved from the 15 Nov docs-only deployment (404) to the frozen review deployment `dpl_DoAEN2q7gxKTrfvL9pZw1nGGEekn`. Nothing was built or published, and no variable or setting changed. The owner deletes the duplicate project `bloat-zlrr` in the dashboard.
- **24 Nov 2026, later.** The owner approved one focused fix (K1, keyboard focus after a sheet closes). Run 13 published `9c6ed14` as `dpl_55jDsCf3AbLK5mYRCEBEnKqtN9Jc` to the two preview addresses only; the three main addresses stayed on `dpl_DoAEN2q7gxKTrfvL9pZw1nGGEekn` (`83fe4da`). No other domain, variable or setting changed. The 8 synthetic accounts for the hosted run were deleted through the app and verified; `bloat-tester` untouched. Frozen again.
- **24 Nov 2026, later still.** The owner confirmed the failed-deletion message as a defect (P2, formerly D20). Run 14 published `f8fcd9d` as `dpl_7N1RRQjq8qFDNmw9x3ihfcxk9iBD` to the two preview addresses only; the main addresses stayed on `dpl_DoAEN2q7gxKTrfvL9pZw1nGGEekn`. No other domain, variable or setting changed; no account was made; `bloat-tester` untouched. Frozen again.
- **26 Nov 2026.** New Claude account and session. State read with this session's own access; the `bloat-olive` bypass link had expired (24 Nov 18:48 UTC). The owner approved the Today fixes T1 to T4: commit `8ef62e7` pushed to the publishing branch at 17:22 UTC. Run 15's first attempt stopped at "Start the local Supabase stack" (port 54324 already in use on GitHub's machine; nothing built or published); the failed job was re-run and published `dpl_EZyj38upABHtKaQidLokQB4n6cxo` to the two preview addresses at 17:42 UTC. The main addresses stayed on `dpl_DoAEN2q7gxKTrfvL9pZw1nGGEekn`. No variable, setting or account changed; `bloat-tester` not used (read-only check afterwards: intact). The History fixes (`0ffc99a`) were not pushed to the publishing branch: the owner's yes covered the Today fixes only.
- **26 Nov 2026, later.** With the owner's approvals: the History fixes R1 and H1 published by run 16 (`0ffc99a`, `dpl_CoBNVMnW9ivkcLvNRuKc3PML3eks`, 20:18 UTC) to the two preview addresses only. Then the review fixes R2, X1 and A1 and the beta switches were made and tested locally.
- **27 Nov 2026.** For the invited beta candidate: Vercel Preview variables `BLOAT_AI_PROVIDER` changed from `mock` to `off` and `BLOAT_OFF_FEATURES=learn_library,daily_cards` created (with upsert, after an interrupted first call was checked to have created nothing). Run 17 published `da4bb77` as `dpl_DMcN8fjTd9f99QHXjxA5Rc7uerhR` to the two preview addresses only, at 03:59 UTC; the main addresses stayed on `dpl_DoAEN2q7gxKTrfvL9pZw1nGGEekn`. This cloud session's own network allowlist got the `bloat-test` Supabase host, so the signed-in hosted checks could run from here (no app or project setting). 8 synthetic accounts were made for the hosted run, deleted through the app and verified gone; `bloat-tester` not used (read-only check afterwards: unchanged). No migration, no Supabase setting changed, nobody invited. Frozen for the owner's acceptance.
- **27 Nov 2026, later.** The owner's decisions for the first invited acceptance round. `BLOAT_OFF_FEATURES` changed to `learn_library,daily_cards,experiments_habit,experiments_swap` (Preview), then run 18 published `35c947b` as `dpl_LxVJ6VzoY4iswtpfhy78kN3B76jj` to the two preview addresses only; the main addresses stayed on `dpl_DoAEN2q7gxKTrfvL9pZw1nGGEekn`. 8 synthetic accounts were made for the hosted run, deleted through the app and verified gone; `bloat-tester` not used (read-only check afterwards: unchanged). No migration, no Supabase setting changed, no tester account made, nobody invited. Frozen.
- **27 Nov 2026, acceptance.** The owner accepted `35c947b` (`dpl_LxVJ6VzoY4iswtpfhy78kN3B76jj`) for the fictional-data acceptance round. Documentation-only commits followed (`[skip ci]`); nothing published, no variable or setting changed, no account created.
- **27 Nov 2026, participant accounts.** With the owner's approval: 5 participant accounts created in `bloat-test` (each address checked first; none existed; created with a one-way password hash only; marked as participants). `BLOAT_PRO_TEST_EMAILS` (Preview) extended with their addresses, keeping the three already there. Run 19, started by hand on the publishing branch (09:28 UTC), rebuilt `9cb6ee3` (app code identical to `35c947b`) and published `dpl_2QsTiDKAVFB4NaQr99RVjTtAGdvt` at 09:43; the main addresses stayed on `dpl_DoAEN2q7gxKTrfvL9pZw1nGGEekn`. Each participant account was then checked once: signed in, plan Pro, experiments, Learn, daily cards and the AI offer refused, signed out; no session, token or app record left. No email, text or invitation was sent by Claude.
- **27 Nov 2026, design v2.** The owner asked for a professional redesign (name Bloat Buddy, logo, colour, light and dark themes). Run 20 published `3120a26` as `dpl_7DidTdSjyyaiPWeW52ER3docj8dm` to the two preview addresses only (12:36 UTC); the main addresses stay on `83fe4da`. No variable or setting changed. Checked live with 8 disposable accounts (marker `2026-11-27-run20`), deleted through the app afterwards; `bloat-tester` and the participant accounts unchanged.
- **27 Nov 2026, the owner's answers.** D33 "do it", D34 "what would be suitable do it", D35 "yes", and the report "There is no state names there and many like these". Run 21 published `c91169c` as `dpl_9Gxh4m9E7Pf4d3nqvDoRnauck6R9` to the two preview addresses only (17:35 UTC); main addresses unchanged. No variable or setting changed. Checked live with disposable accounts (marker `2026-11-27-run21`), all deleted through the app; `bloat-tester` and the participant accounts unchanged. The owner confirmed receiving the participants' passwords; the private plaintext copies in the session were destroyed.
- **28 Nov 2026, the motion and design pass.** The owner asked for the app's design to use the new toolkit: quick press feedback, sliding sheets, page glide, skeletons, animated numbers and charts, helpful forms (PIN code fills in the state, searchable state picker), one consistent calm style in both themes and one strong moment on the start page (DECISIONS.md choice 34). Run 22 published `7953a6a` as `dpl_FCsJjMaBkxJ87uNHu8tKyK8MUvGK` to the two preview addresses only (00:25 UTC); main addresses unchanged. No variable or setting changed. Checked live with disposable accounts (marker `2026-11-27-run22`), all deleted through the app; `bloat-tester` and the participant accounts unchanged.
- **28 Nov 2026, the animated start page.** The owner asked for the toolkit to decide every button and movement, pointing to countquill.com and metavixtechno.com for the level of life (not to copy); the cloud environment now also allows `countquill.com`, `www.countquill.com`, `share.google`, `metavixtechno.com` and `www.metavixtechno.com` (approved by the owner) so they could be studied. Run 23 (`40be915`) failed twice on tests that break in the hour after midnight in New York and published nothing; one test was fixed. Run 24 published `0fc6d11` as `dpl_9ZxDR1j2tSNyrWqDRtqT1RB6CV9C` to the two preview addresses only (05:59 UTC); main addresses unchanged. No variable or setting changed. Checked live with disposable accounts (marker `2026-11-28-run24`), all deleted through the app.
