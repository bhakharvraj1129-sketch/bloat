## Results at a glance

**Tested and published revision: `62431c71ffe13e48404db7b21e31c0823eb73dfb`** (23 Nov 2026, 12:19 UTC), served at `https://bloat-preview.vercel.app` as Vercel deployment **`dpl_AvmuUC34HMhQpEj34UsAk6ekV2Lm`** (`bloat-as3j641fa-typeshi2.vercel.app`). Compared with the build before it (`7713098`), it holds three focused fixes (section 4, R1 to R3): the recalled-meals offer now saves all or nothing; export tells a lost connection apart from a server error; founder tool buttons send one change per tap and say when the connection is lost.

How tested and deployed are tied together (section 9): GitHub run 11 started on the push of `62431c7` and reports that commit; it built `dpl_AvmuUC34HMhQpEj34UsAk6ekV2Lm` and ran its hosted checks against exactly that URL before publishing; its publish step confirmed that `bloat-preview.vercel.app` serves that build; Vercel listed 490 of the deployment's 630 files (its listing is partial), and all 207 source files among them are byte-identical to `62431c7`, including the changed founder-tools screen (the changed export screen and recalled-offer route are outside the listed part); Vercel reports both preview addresses on it, and it is the only deployment made since run 10.

**On this final build:** the full hosted suite passed **16 of 16** with 7 fresh synthetic accounts, plus a live check of the new export messages (1 of 1). All 14 accounts used in this round were deleted through the app and checked gone; `bloat-tester@bloat.test` and its sample records are unchanged (identical before and after).

### Final round (23 Nov): what was asked, and the result

| Item | Result |
|---|---|
| 1. Counts reconciled with the raw results file | **Done.** 250 browser checks, 250 passed first time, 0 retried. The save file holds 63 actions x 3 = 189 plus 9 single checks = 198; section 5 is 12 x 3 = 36 plus 4 single checks (3 in the save file, 1 founder-tools check). One wording error corrected: "207 of 629" meant 207 source files among the 490 files Vercel listed, not 207 of all files |
| 2. Recalled-meals offer, failure between its two database writes | **Reproduced** (offer left used with no answer; trying again refused). **Fixed** (R1, one transaction). Two new API checks pass: after a refused answer or a refused duplicate-tap record, nothing is left, and the same request then saves once. Local and in the gate; not possible to cause on the live preview |
| 3. Export: network failure vs server failure | **Reproduced** (a server error said "Check your connection"). **Fixed** (R2). Checked locally for the request and the file, each way; **live check passed** |
| 4. Founder tools, duplicate requests | **Measured:** a double tap sent 2 requests, 2 setting writes, 2 change audit records and 2 reload audit records; a lost connection showed nothing. **Fixed** (R3): 1 request, 1 write, 1 change record, 1 reload record; a slower second tap is ignored. Local only: no staff account on the preview |
| 5. Full hosted suite on the final deployment | **16 of 16 passed** (fresh accounts). A first attempt passed 15 of 16: the diary check's own navigation raced the app's tidy-up after a sheet closed (the data was saved correctly); the check now waits for it (test only), and the repeat passed |
| 6. Remaining gaps | One list below |

### Remaining gaps (the one list)

Pending, because they were not exercised:

1. **Real devices.** No iOS Safari or Android Chrome phone has been used; also no screen reader and no 200% zoom. Owner checklist in `PROGRESS.md`.
2. **Real-provider AI evaluation.** The photo and dish ingredient check has only run against the labelled mock and a stored provider answer. A real provider needs your approval of a key and a spending limit.
3. **Hosted staff-tool testing.** Founder tools were checked locally only; the preview has no staff account, by design.
4. **The three history-dependent hosted checks.** The doctor reminder in History (needs 13 bloating days in 30), the experiment answer on Today (needs 4 confirmed days and a running experiment) and "Not useful" on Today (needs a habit tapped on 6 days) were checked locally and by the gate on the deployed commit, not on the live preview: it cannot create back-dated records without editing the database by hand.

Other open items:

5. **The recalled-meals fix on the live preview.** A failure between database writes can only be caused on the local database; live, only the gate's run on the deployed commit covers it.
6. **Vercel's Ignored Build Step:** configured and read back, not proven to block a Git build (needs a test push to a separate branch, with your OK).
7. **A founder change and its audit record** are written in two separate database steps; if the second failed, the change would have no audit record. Fixing it needs a new migration on `bloat-test`: your decision.
8. **Older local runs not repeated on the final code:** the control crawl, the click-through navigation run and the five-width check are from 22 Nov (`2f22cc4` app code). The changes since are listed in section 4.
9. **For your decision, not defects:** "Is it still happening?" comes back on each app open while a record is open 8 hours or more (DECISIONS Q15); the morning review accepts a day from before the account existed, which never counts anywhere; on account deletion the result of removing kept meal photos is not checked.

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

Rule, API and browser tests re-run on 23 Nov on the final code (`62431c7`); the crawl, the navigation run and the width check are from 22 Nov (`2f22cc4` app code; the fixes since are listed in section 4).

| Check | Result |
|---|---|
| Rule tests `pnpm test` | **Passed**, 97 of 97 |
| API tests `pnpm test:api` (real HTTP against the local app), incl. a deleted account's earlier tokens (section 6) and the two all-or-nothing checks (R1) | **Passed**, 137 of 137 |
| Browser tests `tests/e2e`, phone screen (Chromium, Pixel 7 size), incl. 20 checks for B1 to B4 and 40 for section 5 | **Passed**, 250 of 250, 0 retried (23 Nov, final code). One earlier full run on the same app code had 1 failure, a timing race in the delete-account check, since fixed in the check (section 4) |
| &nbsp;&nbsp;of which save and edit outcomes, 63 actions x 3 plus 9 single checks (sections 3 and 5) | **Passed**, 198 of 198 |
| Navigation by real clicks, destination and Back, signed-out, Free and Pro, 412px and 1440px (section 2) | **Passed**, 238 clicks: 238 right destination, 238 Back returned |
| Control crawl (section 1) | 1,292 rows: **834 passed** (74 screen loads, 244 clicked and responded, 516 link targets loaded without clicking), 0 failed, 49 skipped on purpose (20 destructive, each covered by a named test; 29 outside links), 409 excluded (332 hidden at phone width, 32 disabled, 45 fields), 0 blocked |
| Five widths, 320 to 1440px | **Passed**, 0 of 185 with sideways scrolling |
| Type check and lint | **Passed**, 0 errors (5 old warnings) |

### CI evidence (GitHub Actions, clean checkout of the commit)

| Check | Result |
|---|---|
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

On `dpl_AvmuUC34HMhQpEj34UsAk6ekV2Lm` (`62431c7`, final, 23 Nov):

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
| Git builds off through `vercel.json` | **Passed**: no Git-triggered deployment for any push since `af950f5`; Vercel lists only the four deployments the workflow made (runs 6, 9, 10 and 11) |
| Vercel Ignored Build Step (second layer) | **Configured and read back** (run 6). **Not proven to block a Git build**: that needs a test build on a separate branch, not done (section 9) |

### Manual device evidence

| Check | Result |
|---|---|
| The owner's own sign-in, setup, refresh and sign-out on the preview (22 Nov, earlier build) | Passed, reported by the owner and confirmed from server records (section 7) |
| The main journeys on a real phone with `dpl_AvmuUC34HMhQpEj34UsAk6ekV2Lm` | **Not done (pending).** Checklist for the owner in `PROGRESS.md` |
| External tester, 23 Nov, cloud Chrome browser with the owner's test account on `adfe49b` | Their report: four defects (now fixed) and the checks they passed; not a real phone |
| iOS Safari, Android Chrome, screen reader, 200% zoom | **Not done** |

### Not claimed

This report does not say that every button or feature works. It says which outcomes were checked, where, and on which build. Everything still open is in the one list above ("Remaining gaps").
