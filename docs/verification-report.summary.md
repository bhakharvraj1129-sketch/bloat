## Results at a glance

**Tested and published: commit `83fe4daf773f35b74b93b633db8a77b8f0f1f580`, Vercel deployment `dpl_DoAEN2q7gxKTrfvL9pZw1nGGEekn`** (`bloat-mco7ostgg-typeshi2.vercel.app`), published on 23 Nov 2026 at 15:36 UTC by GitHub run 12 and served at `https://bloat-preview.vercel.app` and the branch address. **The preview is frozen on this build for feature-by-feature review** (`PROGRESS.md`): later commits only change notes and do not publish.

How tested and deployed are tied together (section 9): run 12 started on the push of `83fe4da` and reports that commit; its hosted checks ran against exactly `https://bloat-mco7ostgg-typeshi2.vercel.app` before publishing; its publish step confirmed through the Vercel API that `bloat-preview.vercel.app` serves that build; Vercel listed 490 of the deployment's 632 files (the listing is partial) and all 209 source files among them are byte-identical to `83fe4da` (the changed account-deletion route is in a folder the listing left out; the live photo check below exercised it); Vercel reports both addresses on it, and it is the only deployment since run 11.

Every result below names the build it ran on. Earlier builds of the same day: `0d537d2` (`dpl_59A4HADi2dEAD26ivcfdoXVWPf9K`, run 9), `7713098` (`dpl_E8w2BwFqLPuj59xLtcptnRVWT1fB`, run 10), `62431c7` (`dpl_AvmuUC34HMhQpEj34UsAk6ekV2Lm`, run 11).

### Defects fixed in this verification round, with evidence

Each was shown by a check on the build before its fix, fixed in its own commit, and the check passes after it (details and evidence files in section 4).

| # | Defect | Shown before (build) | Fix | After: local | After: live |
|---|---|---|---|---|---|
| B1, B2 | Changing only a meal's name failed or moved its time across time zones; "Keep" did nothing | 14 of 15 checks failed (`adfe49b`) | `d863fa7` | 15 of 15 | Passed (`0d537d2`) |
| B3 | Backwards date range on Patterns and Your journey for a new account | Failed (`adfe49b`) | `a746eb7` | Passed | Passed (`0d537d2`, and in every hosted run since) |
| B4 | "Nothing was logged" on a day with a meal | Failed (`adfe49b`) | `f58103d` | Passed | Passed (`0d537d2`) |
| S1 to S3 | Doctor reminder, Today experiment answer, Today "Not useful": a failed save showed nothing | 3 checks failed (`0d537d2`) | `7713098` | 36 of 36 | Not run live (needs several days of records) |
| R1 | Recalled-meals offer could be left half-saved (offer used, no answer) | 2 checks failed (`7713098`) | `61a9c93` | 2 of 2 | Cannot be caused live |
| R2 | Export said "Check your connection" for a server error | Failed (`7713098`) | `2f3cb25` | Passed | Passed (`62431c7` and `83fe4da`) |
| R3 | Founder tools: a double tap sent 2 changes and 2 audit records; a lost connection showed nothing | Measured (`7713098`) | `b3c1212` | Passed: 1 request, 1 change, 1 change record, 1 reload record | Not run (no staff account on the preview) |
| P1 | Deleting an account ignored storage errors and could leave kept photos with no owner | 2 checks failed: account gone, photo row and file left (`62431c7`) | `83fe4da` | 3 of 3 API checks and 1 screen check: simulated storage failure, then recovery | Normal path passed (`83fe4da`): 2 synthetic photos kept, then removed with the account |

Two timing races in the checks themselves, not the app, were also fixed: the local delete-account check (`62431c7`) and the hosted diary check (`114f2a1`).

### Results on the final build (`83fe4da`)

| Check | Where | Result |
|---|---|---|
| Rule tests | Local | **97 of 97** |
| API tests (real HTTP against the local app), incl. R1 and P1 | Local | **140 of 140** |
| Browser tests on a phone screen | Local | **251 of 251**, none retried. Save and edit outcomes: 63 actions x 3 = 189 plus 10 single checks = 199; founder tools 2; time edits 15; empty states 5; navigation 14; core 11; email code 5 |
| Type check, lint | Local | 0 errors (5 old warnings) |
| Run 12: the same checks on a clean checkout (browser 251 of 251), controls read back, Vercel build, 6 account-free checks before and after publishing | CI | **Passed** |
| Full hosted suite, 7 fresh synthetic accounts (marked `2026-11-23e`) | Live, 15:41 to 15:43 UTC | **16 of 16** |
| Export messages: server error vs lost connection | Live | **Passed** |
| Kept photos: a Pro test account keeps 2 synthetic photos, then "Delete my account" | Live and `bloat-test` | **Passed**: 2 stored, then 0 (the whole photo bucket is empty); no clean-up failure alert |
| The 7 accounts deleted through the app, then read-only checks | Live and `bloat-test` | **Passed**: 0 rows anywhere, no marked account left; `bloat-tester` and its meal, bloating record and report identical before and after |

### Launch blockers that remain

1. **Real devices.** No iOS Safari or Android Chrome phone has been used, and no screen reader has been used. Defect K1 (keyboard focus, below) should be fixed before an outside beta.
2. **A real AI provider.** The photo and dish ingredient check has only run against the labelled mock. It needs your approval of a key and a spending limit, then an evaluation.
3. **Email sign-in.** The preview uses email-and-password for owner-made test accounts, marked temporary while email delivery is limited (`BLOAT_SIGN_IN_METHOD`). Real users need the email-code sign-in with working email delivery.
4. **Plan gates still open:** business entity and payment provider (Gate 2; payments stay off), legal text (Gate 1), the live project `bloat-live`.
5. **Account deletion during a storage outage:** now safe (nothing is deleted, the person tries again), but the plan describes a background deletion job. A background job that removes files after the account is gone needs a server storage key, a new secret: your decision for `bloat-live` (DECISIONS, D18).
6. **Founder audit record:** a founder change and its audit record are written in two steps (DECISIONS, D10); fixing it needs a new migration: your decision.

### Tests still not performed

1. Real phones (iOS Safari, Android Chrome) and any screen reader: none performed. (200% browser zoom and keyboard-only journeys: tested locally during the freeze, below.)
2. Real-provider AI evaluation (photo and typed dish).
3. Founder tools on the hosted preview (no staff account there, by design).
4. The three history-dependent checks on the hosted preview: the doctor reminder in History, the experiment answer on Today, "Not useful" on Today (checked locally and by the gate).
5. On the hosted preview, the failure paths that can only be forced on the local database: a refused second write in the recalled-meals offer (R1) and a storage failure during account deletion (P1). Both pass locally, including a partial photo removal (below).
6. The control crawl, the click-through navigation run and the five-width check on the final code (last run on 22 Nov, app code `2f22cc4`; sections 1 and 2).
7. Whether Vercel's Ignored Build Step really blocks a Git build (configured and read back only).
8. A real backup restore on `bloat-test` (plan Q33): re-applying deletions after a restore is checked locally only.

### During the freeze (23 Nov): local checks on the frozen code `83fe4da`

Nothing was published. Local stack, synthetic disposable accounts, local fault injection; `bloat-tester` not used. Evidence: `test-evidence/ledger/failure-tests-83fe4da.txt`, `a11y-83fe4da.txt`.

| Check | Result |
|---|---|
| Storage failure during account deletion: total failure with recovery, failure clearing during retries, and **partial removal** (2 of 3 photos removed, one silently kept) | **4 of 4 passed**: nothing else deleted, the person told, founder alert with counts only, the retry finishes |
| Failure midway through the recalled-meals offer (answer refused; duplicate-tap record refused) | **2 of 2 passed**: full rollback; the same request then saves once; a repeat writes nothing |
| Keyboard-only main journeys, desktop at 100% and at 200% zoom, both sign-in modes | **Passed**, except defect K1 |
| 200% browser zoom: 11 main screens and 3 sheets | **Passed** |
| Screen reader | **Not performed** |
| Suites | Rule 97 of 97, API 141 of 141, browser 256 of 256 |

**K1, keyboard focus lost (found 23 Nov, not fixed: the preview is frozen).** When a save removes the button that opened a sheet, focus falls back to the page itself: after saving "Log bloating", after ending bloating, and after confirming "Delete" for a meal or a bloating record. Reproduction: `tests/e2e/accessibility.spec.ts`, check "known defect K1" (marked as expected to fail). Impact: a keyboard or screen-reader user loses their place, and the next Tab starts again from the top of the page; nothing is lost or saved wrongly. Proposed focused fix (one shared function, `returnFocus` in `src/lib/client/nav.ts`): if the button that opened the sheet is gone, move focus to the control that replaced it (for example "Bloating ongoing") or else to the screen's main heading. The K1 check then passes and becomes a normal check. Waiting for your go-ahead.

### Section 5 actions on the screen (23 Nov, earlier the same day)

| Item | Local | Live |
|---|---|---|
| 12 actions checked only through the API before (Pro bloating fields, ingredient marking, saved dishes, photo check, recalled meals, swap safety questions, card, doctor reminder, two Today buttons): saves and persists, failure shown, double tap | **33 of 36 passed** on the published code; **3 failed** (S1 to S3: a failed save showed nothing). After the fix: **36 of 36 passed** | Not run live: these need several days of back-dated records, which the preview cannot create without editing the database by hand. The gate ran all 36 on the deployed commit |
| Single checks: photo with the local mock; "Yes, go through them"; a failed export, then a retry; founder tools | **4 of 4 passed** (the export and founder checks were extended in the final round) | Export messages: live check passed on the final build. Founder tools: not run (no staff account on the preview, by design) |
| Photo check with a real AI provider | **Pending**: no provider connected; needs your approval of a key and a spending limit | **Pending** |

### Fixes from the external report (23 Nov)

| Defect | Local (old code, then fix) | Live, on `dpl_59A4HADi2dEAD26ivcfdoXVWPf9K` (and unchanged in the current build) |
|---|---|---|
| B1: changing only a meal's name failed or moved its time when the phone and account zones differed | Reproduced (14 of 15 new checks failed); all 15 pass | **Passed**: account in Asia/Kolkata, browser in America/Los_Angeles; rename saved, saved time identical |
| B2: "Keep" had no effect | Reproduced; passes | **Passed**: Keep chosen, kept the time after another time was picked |
| B3: backwards date range on Patterns (and Your journey) for a new account | Reproduced on both screens; pass | **Passed** on Patterns ("No finished days yet.") and, in the full hosted run, on Your journey |
| B4: "Nothing was logged" on a day with a meal | Reproduced; passes | **Passed** ("No bloating was logged and there is no review.") |

Words used: **Passed** (the outcome was checked and was right), **Failed**, **Skipped** (left out on purpose, with the reason), **Blocked** (could not run; the reason is given), **Not done**.

### Local evidence (this workspace: local Supabase in Docker, synthetic accounts, test mode on)

Results by build. The final build's rule, API and browser results are in the table above (`83fe4da`). The rows below with counts 137 and 250 ran on `62431c7`; the crawl, the navigation run and the width check ran on 22 Nov on app code `2f22cc4`.

| Check | Result |
|---|---|
| Rule tests `pnpm test` | **Passed**, 97 of 97 |
| API tests `pnpm test:api` on `62431c7`, incl. a deleted account's earlier tokens (section 6) and the two all-or-nothing checks (R1) | **Passed**, 137 of 137 (140 of 140 on `83fe4da`) |
| Browser tests `tests/e2e` on `62431c7`, phone screen (Chromium, Pixel 7 size), incl. 20 checks for B1 to B4 and 40 for section 5 | **Passed**, 250 of 250, 0 retried (251 of 251 on `83fe4da`). One earlier full run on the same app code had 1 failure, a timing race in the delete-account check, since fixed in the check (section 4) |
| &nbsp;&nbsp;of which save and edit outcomes on `62431c7`, 63 actions x 3 plus 9 single checks (sections 3 and 5) | **Passed**, 198 of 198 (199 of 199 on `83fe4da`) |
| Navigation by real clicks, destination and Back, signed-out, Free and Pro, 412px and 1440px (section 2) | **Passed**, 238 clicks: 238 right destination, 238 Back returned |
| Control crawl (section 1) | 1,292 rows: **834 passed** (74 screen loads, 244 clicked and responded, 516 link targets loaded without clicking), 0 failed, 49 skipped on purpose (20 destructive, each covered by a named test; 29 outside links), 409 excluded (332 hidden at phone width, 32 disabled, 45 fields), 0 blocked |
| Five widths, 320 to 1440px | **Passed**, 0 of 185 with sideways scrolling |
| Type check and lint | **Passed**, 0 errors (5 old warnings) |

### CI evidence (GitHub Actions, clean checkout of the commit)

| Check | Result |
|---|---|
| Run 12 (push of `83fe4da`): all checks (API 140, browser 251 of 251), controls read back, Vercel build, 6 hosted checks before and after publishing | **Passed**, published `dpl_DoAEN2q7gxKTrfvL9pZw1nGGEekn` (15:20 to 15:37 UTC, 23 Nov) |
| Run 11 (push of `62431c7`): all checks (API 137, browser 250 of 250), controls read back, Vercel build, 6 hosted checks before and after publishing | **Passed**, published `dpl_AvmuUC34HMhQpEj34UsAk6ekV2Lm` (12:05 to 12:20 UTC, 23 Nov) |
| Run 10 (push of `7713098`): all checks (browser 250 of 250), controls read back, Vercel build, 6 hosted checks before and after publishing | **Passed**, published `dpl_E8w2BwFqLPuj59xLtcptnRVWT1fB` (09:48 to 10:03 UTC, 23 Nov) |
| Run 9 (started by hand, commit `0d537d2`): all checks, controls read back, Vercel build, hosted checks before and after publishing | **Passed**, published `dpl_59A4HADi2dEAD26ivcfdoXVWPf9K` (07:12 to 07:26 UTC, 23 Nov) |
| Run 7 (commit `8d7ae58`) | **Failed, nothing published**: one browser check still expected the old "Roughly" chip on reopening (updated in `d0d7383`) |
| Run 8 (commit `d0d7383`) | **Failed, nothing published**: GitHub's machine could not start the local mail test service (port already in use), before any test ran |
| Run 6 (started by hand, commit `adfe49b`): typecheck, lint, rule tests, local Supabase, build, API tests, browser tests | **Passed** (20:13 to 20:22 UTC) |
| Run 6: deployment controls read back before building (`vercel.json` keeps Git builds off; the Vercel project's Ignored Build Step equals `test -n "$VERCEL_GIT_COMMIT_SHA"`) | **Passed** (read back through the Vercel API) |
| Run 6: Vercel build, then the 6 account-free hosted checks on that new, not yet public deployment | **Passed**, 6 of 6 |
| Run 6: addresses moved, then "which deployment does bloat-preview.vercel.app serve" compared with the build | **Passed** |
| Run 6: the 6 checks again on the public address after publishing | **Passed** |
| Earlier runs 1 to 5 | Runs 1 and 2 **failed** (a workflow setup mistake; the missing PDF tool and a real defect, section 4 row 8), all fixed; runs 3 and 5 passed every check and stopped before publishing because `VERCEL_TOKEN` was not set yet, as designed; run 4 was cancelled by a newer push |

### Hosted evidence (the public preview and the `bloat-test` database)

On `dpl_DoAEN2q7gxKTrfvL9pZw1nGGEekn` (`83fe4da`, final, 23 Nov):

| Check | Result |
|---|---|
| 6 account-free checks, twice inside run 12 | **Passed** |
| Full hosted suite, 15:41 to 15:43 UTC, 7 accounts marked `2026-11-23e` (`hosted-full-DoAE.txt`) | **Passed, 16 of 16** |
| Export messages (`tests/hosted/export-feedback.spec.ts`) and kept photos (`tests/hosted/kept-photos.spec.ts`), 15:43 UTC (`hosted-extra-DoAE.txt`) | **Passed, 2 of 2**. The kept-photo check first confirmed the preview's check is the labelled mock (no paid AI); the project has no AI key |
| The 7 accounts deleted through "Delete my account" (`hosted-delete-DoAE.txt`) | **Passed**: 7 of 7 deleted, each token refused at once |
| Read-only checks afterwards (`hosted-cleanup-DoAE.txt`) | 0 users, sessions, refresh tokens, identities, stored files, profiles, meals, bloating records, photo rows, reports and share links for these IDs; no marked account; the test Pro account's 2 kept photos gone and the photo bucket empty; no clean-up failure alert. `bloat-tester`: meal, bloating record, 2 readings, report, profile, plan and sign-in details identical to the snapshot taken before the run |

On `dpl_AvmuUC34HMhQpEj34UsAk6ekV2Lm` (`62431c7`, 23 Nov; the build before the final one):

| Check | Result |
|---|---|
| 6 account-free checks, twice inside run 11 | **Passed** |
| Full hosted suite, first attempt, 12:24 to 12:26 UTC, 7 accounts marked `2026-11-23c` (`hosted-full-Avmu.txt`) | 15 of 16. **Failed:** the diary check: its move to `/me` was cancelled (`net::ERR_ABORTED`) because it started while the app was still stepping back in history after the meal sheet closed. The data was saved correctly (meal, ended bloating record, warning sign, read from the database). The check now waits for that step (test only; 5 of 5 local repeats) |
| Full hosted suite, repeat with 7 fresh accounts marked `2026-11-23d`, 12:29 to 12:31 UTC (`hosted-full-Avmu-final.txt`) | **Passed, 16 of 16** |
| Live export messages (R2): a server error says "That didn't work. Try again.", a lost connection says "Check your connection", nothing downloads | **Passed** |
| Both sets of 7 accounts deleted through "Delete my account" | **Passed**: 14 of 14 deleted, each token refused at once; read-only checks: 0 rows anywhere, no marked account left. `bloat-tester` identical before and after (meals, bloating records, readings, report, profile, plan, sign-in details) |

On `dpl_E8w2BwFqLPuj59xLtcptnRVWT1fB` (`7713098`, 23 Nov 10:01 UTC): the 6 account-free checks passed twice inside run 10. The signed-in suite was not run on it.

On `dpl_59A4HADi2dEAD26ivcfdoXVWPf9K` (`0d537d2`, 23 Nov):

| Check | Result |
|---|---|
| Full hosted suite, 09:28 to 09:30 UTC: the 15 checks below plus Your journey with no finished day, 7 separate synthetic accounts | **Passed, 16 of 16** |
| Those 7 accounts deleted through "Delete my account" | **Passed**: 7 of 7, each token refused at once; read-only check: 0 rows anywhere, no marked account left; `bloat-tester` untouched (1 meal, 1 bloating record) |
| B1 to B4 live check (one account, deleted afterwards and verified) | **Passed** |
| 6 account-free checks, twice inside run 9 | **Passed** |

On `dpl_GYCc4U8LgKQJWhKBizXioK2fw2FQ` (`adfe49b`, 22 Nov):

| Check | Result |
|---|---|
| Full hosted suite, 22 Nov about 20:26 UTC: 6 account-free and 9 signed-in checks (saving and History, the diary flow, two-account isolation, report privacy and share links, exports, password sign-in and sign-out, test-only switches off, signed-in navigation) | **Passed**, 15 of 15 |
| The coverage endpoint missing from the old build (section 4, row 8) | **Passed**: answers 401 (exists, needs sign-in), where `af950f5` answered 404 |
| A deleted account's earlier session: protected data (section 6) | **Passed**: same unexpired session read data before; after deletion every app data request 401 with no data, Supabase user lookup 403, refresh 400, direct database reads 0 rows, writes 403 |
| The same session: screen (reported separately) | `/history` redirects to Sign in. Not counted as evidence that data is protected |
| Deleting the 19 temporary accounts from 19 Nov (owner ran the guarded SQL) | **Passed**: read-only check at 20:12 UTC shows 0 users, sessions, refresh tokens, identities, stored files and rows in all 48 app tables; the owner's `bloat-tester@bloat.test` is intact |
| Deleting the 7 accounts of this run (through the app's own "Delete my account") | **Passed**: 7 of 7 answered "deleted" and their tokens were refused at once; read-only check shows 0 users, sessions, refresh tokens, identities, stored files and app rows; the app kept only its 7 deletion records (a hash of each account ID). No account with a test marker remains |
| Git builds off through `vercel.json` | **Passed**: no Git-triggered deployment for any push since `af950f5`; Vercel lists only the five deployments the workflow made (runs 6, 9, 10, 11 and 12) |
| Vercel Ignored Build Step (second layer) | **Configured and read back** (run 6). **Not proven to block a Git build**: that needs a test build on a separate branch, not done (section 9) |

### Manual device evidence

| Check | Result |
|---|---|
| The owner's own sign-in, setup, refresh and sign-out on the preview (22 Nov, earlier build) | Passed, reported by the owner and confirmed from server records (section 7) |
| The main journeys on a real phone with `dpl_DoAEN2q7gxKTrfvL9pZw1nGGEekn` | **Not done (pending).** Checklist for the owner in `PROGRESS.md` |
| External tester, 23 Nov, cloud Chrome browser with the owner's test account on `adfe49b` | Their report: four defects (now fixed) and the checks they passed; not a real phone |
| iOS Safari, Android Chrome, screen reader, 200% zoom | **Not done** |

### Not claimed

This report does not say that every button or feature works. It says which outcomes were checked, where, and on which build. Everything still open is in the two lists at the top ("Launch blockers that remain" and "Tests still not performed").
