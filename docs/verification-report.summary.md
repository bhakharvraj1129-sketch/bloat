## Results at a glance

**Tested and published revision: `7713098f673cc6cb7d79804646339c680361d7ff`** (23 Nov 2026, 10:01 UTC), served at `https://bloat-preview.vercel.app` as Vercel deployment **`dpl_E8w2BwFqLPuj59xLtcptnRVWT1fB`** (`bloat-dhi38m7bd-typeshi2.vercel.app`). It adds one focused fix to the previous build: three buttons that showed nothing when their save failed now show the app's usual save message (section 4, S1 to S3).

How tested and deployed are tied together (section 9): GitHub run 10 started on the push of `7713098` and reports that commit; it built `dpl_E8w2BwFqLPuj59xLtcptnRVWT1fB` and ran its hosted checks against exactly that URL before publishing; every source file Vercel listed for that deployment (207 of 629; its listing is partial), including both changed files, is byte-identical to `7713098`; Vercel reports both preview addresses on it. The previous published build was `0d537d2` (`dpl_59A4HADi2dEAD26ivcfdoXVWPf9K`, 23 Nov 07:26 UTC), on which the full signed-in hosted suite passed 16 of 16 before this fix.

### Section 5 actions on the screen (23 Nov)

| Item | Local | Live |
|---|---|---|
| 12 actions checked only through the API before (Pro bloating fields, ingredient marking, saved dishes, photo check, recalled meals, swap safety questions, card, doctor reminder, two Today buttons): saves and persists, failure shown, double tap | **33 of 36 passed** on the published code; **3 failed** (S1 to S3: a failed save showed nothing). After the fix: **36 of 36 passed** | Not run live: these need several days of back-dated records, which the preview cannot create without editing the database by hand. The gate ran all 36 on the deployed commit |
| Single checks: photo with the local mock; "Yes, go through them"; a failed export, then a retry; founder tools | **4 of 4 passed** | Not run (founder tools have no staff account on the preview, by design) |
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

Rule, API and browser tests re-run on 23 Nov on the final code (`7713098`); the crawl, the navigation run and the width check are from 22 Nov (`2f22cc4` app code; the fixes since change the day screen's edit sheets, two date lines and three save messages).

| Check | Result |
|---|---|
| Rule tests `pnpm test` | **Passed**, 97 of 97 |
| API tests `pnpm test:api` (real HTTP against the local app), incl. a deleted account's earlier tokens (section 6) | **Passed**, 135 of 135 |
| Browser tests `tests/e2e`, phone screen (Chromium, Pixel 7 size), incl. 20 checks for B1 to B4 and 40 for section 5 | **Passed**, 250 of 250, 0 flaky (23 Nov, final code) |
| &nbsp;&nbsp;of which save and edit outcomes, 63 actions x 3 plus 9 single checks (sections 3 and 5) | **Passed**, 198 of 198 |
| Navigation by real clicks, destination and Back, signed-out, Free and Pro, 412px and 1440px (section 2) | **Passed**, 238 clicks: 238 right destination, 238 Back returned |
| Control crawl (section 1) | 1,292 rows: **834 passed** (74 screen loads, 244 clicked and responded, 516 link targets loaded without clicking), 0 failed, 49 skipped on purpose (20 destructive, each covered by a named test; 29 outside links), 409 excluded (332 hidden at phone width, 32 disabled, 45 fields), 0 blocked |
| Five widths, 320 to 1440px | **Passed**, 0 of 185 with sideways scrolling |
| Type check and lint | **Passed**, 0 errors (5 old warnings) |

### CI evidence (GitHub Actions, clean checkout of the commit)

| Check | Result |
|---|---|
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

On `dpl_E8w2BwFqLPuj59xLtcptnRVWT1fB` (`7713098`, 23 Nov 10:01 UTC): the 6 account-free checks passed twice inside run 10 (on the new build's own URL before publishing, then on the public address). The signed-in suite was not re-run on it: the change is three save messages, all checked by the gate on this commit.

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
| Git builds off through `vercel.json` | **Passed**: no Git-triggered deployment for any push since `af950f5`; Vercel lists only the three deployments the workflow made (runs 6, 9 and 10) |
| Vercel Ignored Build Step (second layer) | **Configured and read back** (run 6). **Not proven to block a Git build**: that needs a test build on a separate branch, not done (section 9) |

### Manual device evidence

| Check | Result |
|---|---|
| The owner's own sign-in, setup, refresh and sign-out on the preview (22 Nov, earlier build) | Passed, reported by the owner and confirmed from server records (section 7) |
| The main journeys on a real phone with `dpl_E8w2BwFqLPuj59xLtcptnRVWT1fB` | **Not done (pending).** Checklist for the owner in `PROGRESS.md` |
| External tester, 23 Nov, cloud Chrome browser with the owner's test account on `adfe49b` | Their report: four defects (now fixed) and the checks they passed; not a real phone |
| iOS Safari, Android Chrome, screen reader, 200% zoom | **Not done** |

### Not claimed

This report does not say that every button or feature works. It says which outcomes were checked, where, and on which build. The actions still checked only partly are listed in section 5. Real-phone checks and a real AI provider are pending, and the Ignored Build Step's effect on a Git build is not proven.
