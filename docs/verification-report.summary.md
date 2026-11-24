## Results at a glance

**Tested and published: commit `9c6ed1428320a6ea316f7ed5d2efdf8d32f64d4f`, Vercel deployment `dpl_55jDsCf3AbLK5mYRCEBEnKqtN9Jc`** (`bloat-10n5eeo9n-typeshi2.vercel.app`), published on 24 Nov 2026 at 09:09 UTC by GitHub run 13 and served at `https://bloat-preview.vercel.app` and the branch address. It adds one fix to the previous build: keyboard focus after a sheet closes (K1). **The preview is frozen again for feature-by-feature review.**

How tested and deployed are tied together (section 9): run 13 started on the push of `9c6ed14` and reports that commit; its hosted checks ran against exactly `https://bloat-10n5eeo9n-typeshi2.vercel.app` before publishing; its publish step confirmed that `bloat-preview.vercel.app` serves that build; Vercel listed 490 of the deployment's 635 files (the listing is partial) and all 210 source files among them are byte-identical to `9c6ed14`, including the two changed shared files (`src/lib/client/nav.ts`, `src/components/ui.tsx`); the changed day and Today screens are in folders the listing left out, and the live focus check exercised both; Vercel reports both addresses on it, and it is the only deployment since run 12.

**Addresses the workflow does not move (still on the previous build).** `bloat-olive.vercel.app`, `bloat-typeshi2.vercel.app` and `bloat-git-main-typeshi2.vercel.app` were pointed by hand at `dpl_DoAEN2q7gxKTrfvL9pZw1nGGEekn` (`83fe4da`) on 24 Nov by another session, at the owner's request. The workflow moves only `bloat-preview.vercel.app` and the branch address, so these three still serve `83fe4da`, which does **not** have the K1 fix. They were not moved in this work (no extra domain changes). Their configuration is the same as the preview's: a Preview-target deployment built with the Preview variables only (`bloat-test` database, labelled mock AI, mock billing, `BLOAT_TEST_LOGIN=0`, password sign-in); the project has no Production variables. `bloat-olive.vercel.app` also carries a temporary shareable-link protection bypass created on 24 Nov (not by this work).

### How results are counted

- **Passed:** the check ran and its outcome was right.
- **Expected failure:** a check marked to fail until a known defect is fixed; it reproduces the defect without blocking publishing. None remain: the one there was (K1) became an ordinary passing check with the fix.
- **Skipped:** a check that did not run (for example a hosted check with no accounts set). None in the runs below.
- **Not performed:** a test nobody has run; listed separately below, never counted as passed.

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
| K1 | Keyboard focus lost when a save removed the button that opened a sheet: after saving Log bloating, ending bloating, deleting a meal, deleting a bloating record | 4 checks failed (`83fe4da`) | `9c6ed14` | 4 of 4, plus normal return kept and focus never taken back (5 checks) | Passed (`9c6ed14`): the 4 cases and the next Tab, by keyboard on the public preview |
| P1 | Deleting an account ignored storage errors and could leave kept photos with no owner | 2 checks failed: account gone, photo row and file left (`62431c7`) | `83fe4da` | 3 of 3 API checks and 1 screen check: simulated storage failure, then recovery | Normal path passed (`83fe4da`): 2 synthetic photos kept, then removed with the account |

Two timing races in the checks themselves, not the app, were also fixed: the local delete-account check (`62431c7`) and the hosted diary check (`114f2a1`).

### Results on the final build (`9c6ed14`)

| Check | Where | Passed | Expected failure | Skipped | Failed |
|---|---|---|---|---|---|
| Rule tests | Local | 97 | 0 | 0 | 0 |
| API tests (real HTTP against the local app) | Local | 141 | 0 | 0 | 0 |
| Browser tests on a phone screen, incl. keyboard and 200% zoom | Local | 260 (none retried) | 0 | 0 | 0 |
| Run 13: type check, lint, rule, API and browser tests on a clean checkout (browser 260 passed), controls read back, Vercel build, 6 account-free checks before and after publishing | CI | all | 0 | 0 | 0 |
| Full hosted suite, 7 synthetic accounts (marked `2026-11-24`), 24 Nov | Live | 16 | 0 | 0 | 0 |
| Keyboard focus after the four sheet saves, own synthetic account | Live | 1 | 0 | 0 | 0 |
| The 8 accounts deleted through the app, then read-only checks | Live and `bloat-test` | Passed: 0 rows anywhere, no marked account, photo bucket empty; `bloat-tester` and its meal, bloating record and report identical before and after | | | |

Type check and lint: 0 errors (5 old warnings).

### Launch blockers that remain

1. **Real devices and assistive technology.** No iOS Safari or Android Chrome phone and no screen reader have been used. (Keyboard-only journeys and 200% zoom pass, locally and, for focus, live.)
2. **A real AI provider.** The photo and dish ingredient check has only run against the labelled mock. It needs your approval of a key and a spending limit, then an evaluation.
3. **Email sign-in.** The preview uses email-and-password for owner-made test accounts, marked temporary while email delivery is limited (`BLOAT_SIGN_IN_METHOD`). Real users need the email-code sign-in with working email delivery.
4. **Plan gates still open:** business entity and payment provider (Gate 2; payments stay off), legal text (Gate 1), the live project `bloat-live`.
5. **A failed account deletion can already have removed some kept photos.** Photos are removed first; if storage fails partway, the account and the diary stay and the person can try again, but photos removed before the failure stay removed. The screen now says exactly that (P2, fixed). A background deletion job for `bloat-live` needs a new secret (D18).
6. **The three main addresses serve the previous build** (`83fe4da`, without the K1 fix) until the owner asks for them to be moved.
7. **Open decisions:** `DECISIONS.md`, "Open decisions", grouped by who can use each feature now.

### Tests still not performed

1. Real phones (iOS Safari, Android Chrome) and any screen reader (VoiceOver, TalkBack, NVDA).
2. Real-provider AI evaluation (photo and typed dish).
3. Founder tools on the hosted preview (no staff account there, by design).
4. The three history-dependent checks on the hosted preview: the doctor reminder in History, the experiment answer on Today, "Not useful" on Today (checked locally and by the gate).
5. On the hosted preview, the failure paths that can only be forced on a local database: a refused write in the recalled-meals offer (R1) and a storage failure during account deletion, including a partial removal (P1). Both pass locally.
6. The control crawl, the click-through navigation run and the five-width check on the final code (last run on 22 Nov, app code `2f22cc4`; sections 1 and 2).
7. Whether Vercel's Ignored Build Step really blocks a Git build (configured and read back only).
8. A real backup restore on `bloat-test` (plan Q33): re-applying deletions after a restore is checked locally only.
9. Any check against the three main addresses after 23 Nov (they serve `83fe4da`, tested on 23 Nov).

### During the freeze (23 Nov): local checks on the frozen code `83fe4da`

Nothing was published. Local stack, synthetic disposable accounts, local fault injection; `bloat-tester` not used. Evidence: `test-evidence/ledger/failure-tests-83fe4da.txt`, `a11y-83fe4da.txt`.

| Check | Result |
|---|---|
| Storage failure during account deletion: total failure with recovery, failure clearing during retries, and **partial removal** (2 of 3 photos removed, one silently kept) | **4 of 4 passed**: the account and the diary are not deleted, but any kept photos removed before the failure stay removed (2 of 3 in the partial-removal check); the person is told to try again, the founder gets an alert with counts only, and the retry finishes |
| Failure midway through the recalled-meals offer (answer refused; duplicate-tap record refused) | **2 of 2 passed**: full rollback; the same request then saves once; a repeat writes nothing |
| Keyboard-only main journeys, desktop at 100% and at 200% zoom, both sign-in modes | **Passed**, except defect K1 (fixed on 24 Nov in `9c6ed14`) |
| 200% browser zoom: 11 main screens and 3 sheets | **Passed** |
| Screen reader | **Not performed** |
| Suites | Rule 97 passed; API 141 passed; browser 256 run: 255 passed, 1 expected failure (K1, then unfixed), 0 skipped. (Corrected on 24 Nov: first reported as "256 of 256".) |

**K1, keyboard focus lost: found 23 Nov, fixed 24 Nov in `9c6ed14` (approved by the owner; details in section 4).** When a save removed the button that opened a sheet, focus fell back to the page itself: after saving "Log bloating", after ending bloating, and after confirming "Delete" for a meal or a bloating record. Impact before the fix: a keyboard or screen-reader user lost their place and the next Tab started again from the top; nothing was lost or saved wrongly. Fixed: focus now goes to the same button, else the button that replaced it, else the section heading, else the screen title. The check that was marked as expected to fail is now 5 ordinary checks that pass locally; a separate keyboard-only check of the four cases passed on the live preview.

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

Results by build. The final build's rule, API and browser results are in the table above (`9c6ed14`: 97, 141 and 260 passed). The rows below with counts 137 and 250 ran on `62431c7`; the crawl, the navigation run and the width check ran on 22 Nov on app code `2f22cc4`.

| Check | Result |
|---|---|
| Rule tests `pnpm test` | **Passed**, 97 of 97 |
| API tests `pnpm test:api` on `62431c7`, incl. a deleted account's earlier tokens (section 6) and the two all-or-nothing checks (R1) | **Passed**, 137 of 137 (140 of 140 on `83fe4da`, 141 of 141 on `9c6ed14`) |
| Browser tests `tests/e2e` on `62431c7`, phone screen (Chromium, Pixel 7 size), incl. 20 checks for B1 to B4 and 40 for section 5 | **Passed**, 250 of 250, 0 retried (251 of 251 on `83fe4da`; 260 passed, 0 expected failures, 0 skipped on `9c6ed14`). One earlier full run on the same app code had 1 failure, a timing race in the delete-account check, since fixed in the check (section 4) |
| &nbsp;&nbsp;of which save and edit outcomes on `62431c7`, 63 actions x 3 plus 9 single checks (sections 3 and 5) | **Passed**, 198 of 198 (199 of 199 on `83fe4da` and on `9c6ed14`) |
| Navigation by real clicks, destination and Back, signed-out, Free and Pro, 412px and 1440px (section 2) | **Passed**, 238 clicks: 238 right destination, 238 Back returned |
| Control crawl (section 1) | 1,292 rows: **834 passed** (74 screen loads, 244 clicked and responded, 516 link targets loaded without clicking), 0 failed, 49 skipped on purpose (20 destructive, each covered by a named test; 29 outside links), 409 excluded (332 hidden at phone width, 32 disabled, 45 fields), 0 blocked |
| Five widths, 320 to 1440px | **Passed**, 0 of 185 with sideways scrolling |
| Type check and lint | **Passed**, 0 errors (5 old warnings) |

### CI evidence (GitHub Actions, clean checkout of the commit)

| Check | Result |
|---|---|
| Run 13 (push of `9c6ed14`): all checks (API 141, browser 260 passed), controls read back, Vercel build, 6 hosted checks before and after publishing | **Passed**, published `dpl_55jDsCf3AbLK5mYRCEBEnKqtN9Jc` (08:55 to 09:10 UTC, 24 Nov) |
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

On `dpl_55jDsCf3AbLK5mYRCEBEnKqtN9Jc` (`9c6ed14`, final, 24 Nov):

| Check | Result |
|---|---|
| 6 account-free checks, twice inside run 13 | **Passed** |
| Full hosted suite, 09:17 to 09:19 UTC, 7 accounts marked `2026-11-24` (`hosted-full-55jD.txt`) | **16 passed**, 0 skipped, 0 failed |
| Keyboard focus after saving Log bloating, ending bloating, deleting one of two meals and deleting the only bloating record; next Tab from each (`tests/hosted/keyboard-focus.spec.ts`, account `run-focus@bloat.test`; `hosted-focus-55jD.txt`) | **Passed** |
| The 8 accounts deleted through "Delete my account" (`hosted-delete-55jD.txt`), then read-only checks (`hosted-cleanup-55jD.txt`) | **Passed**: 8 of 8 deleted, tokens refused at once; 0 rows anywhere, no marked account, photo bucket empty; `bloat-tester` identical before and after |

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
| Git builds off through `vercel.json` | **Passed**: no Git-triggered deployment for any push since `af950f5`; Vercel lists only the six deployments the workflow made (runs 6, 9, 10, 11, 12 and 13) |
| Vercel Ignored Build Step (second layer) | **Configured and read back** (run 6). **Not proven to block a Git build**: that needs a test build on a separate branch, not done (section 9) |

### Manual device evidence

| Check | Result |
|---|---|
| The owner's own sign-in, setup, refresh and sign-out on the preview (22 Nov, earlier build) | Passed, reported by the owner and confirmed from server records (section 7) |
| The main journeys on a real phone with `dpl_55jDsCf3AbLK5mYRCEBEnKqtN9Jc` | **Not done (pending).** Checklist for the owner in `PROGRESS.md` |
| External tester, 23 Nov, cloud Chrome browser with the owner's test account on `adfe49b` | Their report: four defects (now fixed) and the checks they passed; not a real phone |
| iOS Safari, Android Chrome, any screen reader | **Not done** (200% zoom and keyboard-only use were tested in desktop Chromium only: section "During the freeze" and section 4, K1) |

### Not claimed

This report does not say that every button or feature works. It says which outcomes were checked, where, and on which build. Everything still open is in the two lists at the top ("Launch blockers that remain" and "Tests still not performed"), and in `DECISIONS.md`.
