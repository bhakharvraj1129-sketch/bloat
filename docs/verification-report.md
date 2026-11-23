# Verification report

What has been checked, how, and what is still not proven. "Clicked" and "verified" are kept apart:
a control that responded is not counted as working unless its outcome was checked. Local results
(local Supabase in Docker, synthetic accounts, test mode on) and hosted results (the public preview
and `bloat-test`) are kept apart, and nothing here comes from a real phone. Rebuild with
`python3 scripts/verification-report.py`.

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

## 1. The control crawl, reconciled

Crawl of the application commit named above, on 2026-11-22 14:45 UTC, phone width, signed-out, Free and Pro visitors.
Total rows: **1292** = 74 screen loads + 1218 control rows. The same control appears once per
screen and visitor (for example the four tabs on every signed-in screen), so there are 197 distinct controls.

| Group | Rows | What it means |
|---|---|---|
| Passed: screen loaded | 74 | The screen answered with HTTP below 400 and drew a heading. |
| Passed (weak): clicked and something happened | 244 | 176 changed what is on screen, 29 opened a sheet, 25 sent a save request, 4 changed screen, 10 were options already chosen. The outcome itself is checked only by the tests in sections 2 and 3. |
| Passed (weak): link target loads | 516 | The crawler requested the link's address and got HTTP below 400. **The link was not clicked here**; clicking, destination and Back are checked in section 2. |
| Failed | 0 | None. |
| Skipped on purpose: destructive | 20 | Delete (4), Mock purchase (9), Sign out (2), Delete account (2), Mock purchase: Pro for 3 month (1), Pause Pro (1), Keep my meal photos (off: a ph (1). Each is covered by a named test (section 3 and the core tests). |
| Skipped on purpose: outside sites | 29 | 7 distinct source links (NHS, NIDDK, BDA, CDC, PMC); each answered HTTP 200 when checked on 19 Nov. Not opened in the app tests. |
| Excluded: hidden at phone width | 332 | The desktop sidebar and desktop header links, present but hidden on a phone. Their clicks are checked at 1440px in section 2. |
| Excluded: disabled in that state | 32 | Continue (4): until a country is chosen (start), both questions are answered (review) or 6 digits are typed (code); Sign in with test password (18): local test mode only, until an email and an 8-character password are typed; Send a new code in 60 s (1): the resend wait after a code is sent; Edit times (2): while the bloating is still open; it is ended on Today first; Choose (6): until there are 4 confirmed days in the week before (the server's rule); Save feedback (1): until Tried or Not today is chosen. The enabled path of each is tested in section 3 or the core tests. |
| Excluded: text and choice fields | 45 | Fields are typed into by the section 3 tests, not clicked by the crawler. |
| Blocked | 0 | Nothing in the local crawl was blocked. |

Check: 74 + 244 + 516 + 0 + 20 + 29 + 332 + 32 + 45 = 1292.

## 2. Navigation: destination and Back, by real clicks

`tests/ledger/navigate.spec.ts`, application commit named above, run 2026-11-22 14:49 UTC. Every distinct visible in-app link on every
screen was clicked (header, footer and tab links from two screens each), for signed-out, Free and Pro visitors, at
412px (phone) and 1440px (desktop). The destination must be the link's own address, or the documented rule for
that visitor (signed out: Sign in with the screen remembered; Free on a Pro screen: Bloat Pro). Then Back was pressed:
the screen's own Back link when it has one, otherwise the browser's Back button. It must return to the starting screen.

| Visitor | Width | Clicks | Right destination | Back returned |
|---|---|---|---|---|
| signed-out | 412px | 36 | 36 | 36 |
| free | 412px | 31 | 31 | 31 |
| pro | 412px | 47 | 47 | 47 |
| signed-out | 1440px | 38 | 38 | 38 |
| free | 1440px | 35 | 35 | 35 |
| pro | 1440px | 51 | 51 | 51 |
| **All** | | **238** | **238** | **238** |

Back used: the screen's own Back link 168 times, the browser's Back 70 times.

Before the fixes in section 4, the same run had 8 Back failures:
- signed-out 412px: /sign-in → "I'm new here" → /start, Back went to / instead of /sign-in.
- signed-out 412px: /offline → "Try again" → /sign-in?next=%2Ftoday, Back went to / instead of /offline.
- signed-out 412px: /sign-in?next=%2Ftoday → "I'm new here" → /start, Back went to / instead of /sign-in?next=%2Ftoday.
- signed-out 412px: /sign-in?next=%2Fme → "I'm new here" → /start, Back went to / instead of /sign-in?next=%2Fme.
- signed-out 1440px: /sign-in → "I'm new here" → /start, Back went to / instead of /sign-in.
- signed-out 1440px: /offline → "Try again" → /sign-in?next=%2Ftoday, Back went to / instead of /offline.
- signed-out 1440px: /sign-in?next=%2Ftoday → "I'm new here" → /start, Back went to / instead of /sign-in?next=%2Ftoday.
- signed-out 1440px: /sign-in?next=%2Fme → "I'm new here" → /start, Back went to / instead of /sign-in?next=%2Fme.

## 3. Save and edit actions: real outcomes

`tests/e2e/mutations.spec.ts`, application commit named above, local. Each action is checked three ways, with a new synthetic account each time:

- **Saves and persists:** the save request succeeds, the intended record changes when read back from the API (or the local
  database for the waitlist), and after a full page refresh the screen still shows it.
- **Failure:** the server is made to fail. The failure message must appear on screen (inside the sheet, when one is open),
  the form must stay open with what was entered, nothing may change, and pressing the same button again must save it.
- **Double tap:** two quick taps must send one save request and change the record once.

| Action | Saves and persists | Failure shown, retry works | Double tap saves once |
|---|---|---|---|
| Log bloating | pass | pass | pass |
| Update the strength of ongoing bloating | pass | pass | pass |
| End bloating | pass | pass | pass |
| No bloating so far today | pass | pass | pass |
| Add a meal | pass | pass | pass |
| Add an activity | pass | pass | pass |
| Log exercise (Pro) | pass | pass | pass |
| Log a bowel movement (Pro) | pass | pass | pass |
| Edit a meal | pass | pass | pass |
| Delete a meal | pass | pass | pass |
| Change units | pass | pass | pass |
| Change habits to follow | pass | pass | pass |
| Add a medicine | pass | pass | pass |
| Remove a medicine | pass | pass | pass |
| Withdraw an optional consent | pass | pass | pass |
| Keep my meal photos (Pro) | pass | pass | pass |
| Pause Pro | pass | pass | pass |
| Switch on Keep an eye on it (Pro) | pass | pass | pass |
| Save health background (Pro) | pass | pass | pass |
| Add a health test (Pro) | pass | pass | pass |
| Make a doctor report (Pro) | pass | pass | pass |
| Give feedback on today's card (Pro) | pass | pass | pass |
| Edit the times of a bloating record | pass | pass | pass |
| Delete an exercise record (Pro) | pass | pass | pass |
| Answer 'Is it still happening?': Yes | pass | pass | pass |
| Answer 'Is it still happening?': Not sure | pass | pass | pass |
| Delete a bloating record | pass | pass | pass |
| Delete a bowel record (Pro) | pass | pass | pass |
| Answer today's experiment question (Pro) | pass | pass | pass |
| End an experiment early (Pro) | pass | pass | pass |
| Weekly check during a food swap (Pro) | pass | pass | pass |
| Finish a swap and start adding back (Pro) | pass | pass | pass |
| Resume a paused swap (Pro) | pass | pass | pass |
| Un-hide a card in Learn (Pro) | pass | pass | pass |
| Save a meal with its ingredient check (Pro) | pass | pass | pass |
| Create a report share link (Pro) | pass | pass | pass |
| Revoke a report share link (Pro) | pass | pass | pass |
| Delete my account | pass | pass | pass |
| Finish the morning review | pass | pass | pass |
| Change time zone | pass | pass | pass |
| Choose what you want to find out | pass | pass | pass |
| Record a medicine change | pass | pass | pass |
| Resume Pro | pass | pass | pass |
| Cancel Pro | pass | pass | pass |
| Hide charts | pass | pass | pass |
| Back to full logging (Pro) | pass | pass | pass |
| Remove a health test (Pro) | pass | pass | pass |
| Start an experiment (Pro) | pass | pass | pass |
| Hide today's card (Pro) | pass | pass | pass |
| Join the waitlist | pass | pass | pass |
| Finish setup | pass | pass | pass |
| Log bloating with a warning sign, how it feels and other symptoms (Pro) | pass | pass | pass |
| Mark ingredients one by one after the check (Pro) | pass | pass | pass |
| Save a dish with a meal (Pro) | pass | pass | pass |
| Add a meal from a saved dish (Pro) | pass | pass | pass |
| Photo ingredient check: items marked one by one and saved (Pro, provider result is a fixture) | pass | pass | pass |
| Answer the recalled-meals offer: Not now (Pro) | pass | pass | pass |
| Add ingredients to an earlier meal on the recall screen (Pro) | pass | pass | pass |
| Answer the safety questions before a food swap (Pro) | pass | pass | pass |
| Mark today's card Not relevant (Pro) | pass | pass | pass |
| Answer the doctor reminder in History: I've spoken to a doctor | pass | pass | pass |
| Answer the experiment on Today (Pro) | pass | pass | pass |
| Dismiss the next best log on Today: Not useful (Pro) | pass | pass | pass |
| experiments cannot be chosen before there are enough confirmed days, and the screen says why | pass | | |
| 'Is it still happening?': No, it ended opens the end time, and saving it closes the record | pass | | |
| ingredient check fails: the message shows, the dish is kept, Try the check again works, and the meal still saves | pass | | |
| ingredient check fails and the person saves anyway: the meal saves without ingredients | pass | | |
| deleting the account with a lost reply: it says so, and Check and finish completes it once | pass | | |
| after an account is deleted on one device, the other device's earlier sign-in stops working | pass | | |
| photo check with the local mock: it can't tell from the photo, the screen says so, and the typed meal saves | pass | | |
| recalled-meals offer: Yes, go through them opens the recall screen, and the offer is not shown again | pass | | |
| export: a server failure and a lost connection get different messages, for the request and for the file; nothing downloads; trying again downloads once | pass | | |

Result: 198 of 198 passed (63 actions x 3, plus 9 single checks: the rows without three columns).

Before fix 1 in section 4 (earlier the same day), on the same checks:
- Delete a meal: a server failure is shown, nothing changes, and the same button then saves: Error: failure message on screen

The other browser tests on the same build: admin.spec.ts 2 of 2, core.spec.ts 11 of 11, email-code.spec.ts 5 of 5, empty-states.spec.ts 5 of 5, navigation.spec.ts 14 of 14, time-edits.spec.ts 15 of 15.

Five widths (320, 390, 768, 1024, 1440px): 185 screen and width checks, 0 with sideways scrolling.

## 4. Defects found and fixed in this verification round

Rows 1, 3, 5, 6, 7 and 8 were reproduced by a test on the build before the fix, and that test passes after it (row 8: in CI run 3, see section 9). Row 2 was shown by a captured server reply, row 4 by reading the code; both now have passing tests. Rows 1 to 4 were fixed in commit `fcbce97`, rows 5 to 7 in `af950f5`, row 8 in `2f22cc4`.

| # | Defect | Evidence before | Fix |
|---|---|---|---|
| 1 | Deleting an entry on a day: when the server failed, the confirmation closed and no error was shown, so it looked deleted | `mutations-before-delete-fix.json`: "Delete a meal: a server failure is shown": failure message not found | The confirmation stays open until the server confirms; a failure stays on screen; a lost reply offers "Check save status" (`src/app/(app)/day/[date]/day.tsx`) |
| 2 | Experiments: "Choose" was enabled for a user without the 4 confirmed days the server requires, so "Start today" was always refused (422 "Log normally for a few more days first...") | Server reply captured for a new Pro account: `NOT_ENOUGH_DAYS`, `confirmed_days: 0` while six experiments showed an enabled Choose | "Choose" is disabled until the days are there; the screen already said why (`experiments.tsx`). No rule changed. Test: "experiments cannot be chosen before there are enough confirmed days" |
| 3 | Back from "I'm new here" (and from the offline page's Try again) skipped the Sign in or offline screen and went to the homepage | `navigate-before-back-fix.json`: 8 Back failures | Back only skips the code-entry step, the auth callback and setup (`src/lib/client/nav.ts`); a full page load from another Bloat page keeps the journey (`src/components/nav.tsx`) |
| 4 | Email-code sign-in left the sign-in and code steps in the browser history after signing in, so the phone's Back could return to the code screen | Code review of the success path (`router.push`), the password path already used `replace` | Both email-code success paths now replace the sign-in steps (`sign-in/form.tsx`, `sign-in/code/form.tsx`). The email-code tests pass; this path is not live on the preview (password sign-in is) |
| 5 | Ingredient check (Pro meal sheet): when the check request failed, there was no way to run it again. The only ways on were "Save without the check" or closing the sheet | `gaps-before-fix.json`: "ingredient check fails: ... Try the check again works" timed out; no such button existed | After a failed check the sheet keeps the dish and shows "Try the check again", which resends the same request (same save key, so no duplicate) (`src/components/today/meal.tsx`) |
| 6 | Ending an experiment early: when the server failed, the error appeared on the page behind the End sheet, not in the sheet the person was looking at | `experiment-end-before-fix.json`: "failure message on screen, inside the sheet" not found | The save status now shows inside the End sheet, with "Check save status" for a lost reply, and the button reads "Ending…" while it works (`src/app/(app)/experiments/[id]/experiment.tsx`) |
| 7 | Deleting the account when the reply was lost: the server had deleted the account, but "Check and finish" asked the server about the save as that account, which no longer exists, and the person was sent to Sign in (`/sign-in?next=%2Fme`) instead of being told it was done | `gaps-first-run.json`: "deleting the account with a lost reply": ended at `/sign-in?next=%2Fme` | "Check and finish" first asks whether the sign-in is still accepted. If not, the deletion went through and the app finishes (signs out, start page). If it is, it checks the save status as before (`src/app/(app)/me/me.tsx`) |
| 8 | The coverage insight endpoint (`/v1/insights/coverage`, Pro) was never committed. The ignore rule `coverage` in `.gitignore`, meant for test-coverage output, also matched `src/app/v1/insights/coverage/`. Local tests passed because the file was on disk; every Vercel build lacked it. No screen calls it (it is API only) | The first CI run on a clean checkout (run 2): "a Free account gets 403 PLAN_REQUIRED on every Pro endpoint" got 404 for this path; the preview also answers 404 there while its neighbour `/v1/insights/summary` answers 401 | The rule now matches only the top-level `/coverage` folder, and the endpoint is committed unchanged (`2f22cc4`). A clean checkout in CI on every push now catches any file that exists only locally |

The harness was also tightened while closing the gaps: when a sheet is open, the failure message must appear inside that sheet. Before that change, defect 6 passed the looser check because the text existed behind the sheet (`gaps-before-fix.json`).

### External report of 23 Nov 2026 (B1 to B4)

An independent tester checked the preview (`adfe49b`) with the owner's test account and found four defects. Each was reproduced by a new test on the old code before it was fixed, then fixed in its own commit.

| # | Defect (their wording, shortened) | Reproduced before the fix | Fix | Commit |
|---|---|---|---|---|
| B1 | Changing only a meal's name failed with "That time is in the future" when the phone's time zone was behind the account's (Asia/Kolkata) | `tests/e2e/time-edits.spec.ts`: 14 of 15 checks failed on the old code. Phone behind: the save was refused. Phone ahead, or even in the same zone: the save went through but silently moved the saved time or dropped its seconds (a meal at 23:50:17.123 New York time became 23:50 Tokyo time). Both clock changes also misread or moved times | The edit sheets showed the saved time in the account's zone but sent it labelled with the phone's zone. Now a name-only change sends no time, so the saved time stays exactly as it is; a new time is entered in the account's zone (the zone the day screen shows), the latest allowed time is now in that zone, and the sheet names the zone when the phone is elsewhere. The meal sheet also asks "which one" when a time happened twice, as the bloating sheet already did | `d863fa7` |
| B2 | "Keep" had no effect | Same file: Keep was never shown as chosen and could not restore the saved time | Keep is a real choice, chosen when the sheet opens; it sends no time and shows the time being kept ("Keeps the saved time: …"). Leaving Keep starts from the saved time. Saving with nothing changed closes without writing | `d863fa7` |
| B3 | Patterns showed "23 Nov to 22 Nov" for an account with no finished day | `tests/e2e/empty-states.spec.ts`: Patterns and Your journey both failed; a rule test for the new range helper failed (no helper) | The range runs from the first day to yesterday, so on the first day it starts after it ends. Both screens now say "No finished days yet." in that case; with finished days the range shows as before (checked in US and day-first formats) | `a746eb7` |
| B4 | A day with a saved meal said "Nothing was logged and there is no review." | Same file: failed on the old code | The day says "No bloating was logged and there is no review." when it has any entry, and keeps "Nothing was logged…" for an empty day | `f58103d` |

Live, on `dpl_59A4HADi2dEAD26ivcfdoXVWPf9K` (23 Nov): B1, B2, B3 (Patterns) and B4 passed with an account in Asia/Kolkata and a browser in America/Los_Angeles (`tests/hosted/reported-fixes.spec.ts`). Your journey's range was checked locally only.

One existing check changed with B2: "Edit the times of a bloating record" expected the reopened sheet to show "Roughly" chosen; it now opens on Keep and shows "Keeps the saved time: about …". GitHub run 7 (commit `8d7ae58`) failed on exactly that check and published nothing; the updated check is in `d0d7383`.

### Section 5 checks of 23 Nov (S1 to S3)

Found by the new screen checks in section 5, on the app code that was published (`d0d7383`, `dpl_59A4HADi2dEAD26ivcfdoXVWPf9K`). Each failure check failed before the fix (`test-evidence/ledger/section5-repro-2026-11-23.txt`: 3 failed, the 6 save and double-tap checks passed) and passes after it.

| # | Defect | Fix | Commit |
|---|---|---|---|
| S1 | History, doctor reminder: when saving "I've spoken to a doctor about this" failed, nothing was shown, so it looked saved | The app's usual save message now shows under the button: the reason when it fails, "Check save status" when the reply is lost (`src/components/doctorline.tsx`) | `7713098` |
| S2 | Today, running experiment: when saving Yes, Partly or No failed, nothing was shown | Same save message under the three buttons (`src/components/today/pro.tsx`) | `7713098` |
| S3 | Today, next best log: when "Not useful" failed, nothing was shown | Same save message under the button (same file) | `7713098` |

No wording, rule or design changed: it is the same message component every other save uses. A scan of every screen found no other save whose failure is never shown.

### Final round of 23 Nov (R1 to R3)

Each was shown by a new check on the then-published code (`7713098`), fixed in its own commit, and the check passes after the fix.

| # | Defect | Shown before the fix | Fix | Commit |
|---|---|---|---|---|
| R1 | Recalled-meals offer: "offered" was marked in one database step and the answer (with its duplicate-tap record) saved in a second. If the second step failed, the offer stayed used with no answer, and trying again was refused as "already offered" | `tests/api/atomic-writes.test.ts`: the database was made to refuse the answer, then (second check) its duplicate-tap record. Both times the offer was left marked as used with no answer; the same request again got 409 `ALREADY_OFFERED` and 0 answers (`test-evidence/ledger/atomic-before-fix.txt`) | All three writes go through `ctx.commit()` in one transaction, as CLAUDE.md requires; the mark must find the account's entitlement row (every set-up account has one; checked on `bloat-test`, including `bloat-tester`). Now a failure leaves nothing behind, and the same request then saves once and replays without writing again | `61a9c93` |
| R2 | Export: a server error on the export request said "Check your connection" | Browser check: a 500 on the request showed the connection message (`export-feedback-before-fix.txt`) | A server that answered with an error gets "That didn't work. Try again." (503 keeps "couldn't be finished"); only a request with no answer says to check the connection. Checked for the request and for the file, each way. Existing wording only | `2f3cb25` |
| R3 | Founder tools: a double tap sent two requests, and a lost connection showed nothing | Measured on the screen (`founder-double-tap-before-fix.json`): double tap on Set limit: 2 requests, 2 limit audit records and 2 reload audit records; on the AI switch: 2 requests, 2 switch audit records, 2 reload audit records (AI did end off). A lost connection: no message | The buttons wait while a change and the reload after it are on their way: a double tap now sends 1 request, writes the setting once, 1 audit record for the change and 1 for the reload; a slower second tap during the save is ignored. A lost connection shows "That didn't work. Check your connection and try again." | `b3c1212` |

Two timing races in the checks themselves (not the app) were also found and fixed. The local full run on the fixed code once failed one existing check, "Delete my account: saves" (`page.reload: Not attached to an active page`). It passed 45 of 45 times when repeated. Cause: after deleting, the app signs out and goes to the start page by itself, and the check's refresh raced that move. The check now waits for the start page first (`62431c7`, test only; 30 of 30 repeats, then the full run 250 of 250).
On the live preview, the first full hosted run failed the diary check once (`net::ERR_ABORTED` opening `/me`): a sheet closed by Save steps back in the browser history a moment later, the app's own links wait for that, and the check's direct navigation did not. The data was saved correctly (read from the database). The hosted check now waits for that step (`tests/hosted/preview.spec.ts`, test only; 5 of 5 local repeats); the repeat on the live preview passed 16 of 16.

## 5. What is still not verified for every outcome

Closed on 22 Nov (now in section 3 with all three outcomes on the screen): "Is it still happening?" Yes and Not sure (No, it ended has its own test); deleting a bloating record and a bowel record through the day screen; the experiment daily answer, End early, the weekly check during a swap, Finish and add back, Resume; Learn "Un-hide"; saving a meal with its ingredient check, plus a failed check with retry and with Save anyway; creating and revoking a report share link; deleting the account, plus a lost reply and a second device.

**Closed on 23 Nov**, on the screen, local stack, labelled mock AI, no paid AI call. For each action: (1) it saves the intended change, read back from the API, and the change is still there after a refresh; (2) a server failure is shown on the screen, nothing changes, and the same button then saves; (3) a double tap sends one write. 12 new actions, 36 checks, all passed after the fix in section 4 (S1 to S3):

| Action | Saved outcome that was checked |
|---|---|
| Log bloating with a warning sign, how it feels and another symptom (Pro) | Strength 6, "Vomiting", "Visible swelling" and "Nausea" all saved on the same record; NHS advice shown |
| Mark ingredients one by one after the check (Pro) | Exactly as marked: one Had, one Didn't have, every untouched item Not sure (never Didn't have) |
| Save a dish with a meal (Pro) | The dish and its place are saved and offered as a chip next time |
| Add a meal from a saved dish (Pro) | The meal saves with the dish's ingredients, marked as from a saved dish |
| Photo ingredient check, items marked one by one (Pro) | The meal saves as a photo meal; each item "Seen in photo" with its answer exactly as marked. The provider's answer is a stored fixture, replayed by the app's own server (the local mock cannot read photos) |
| Recalled-meals offer on Upgrade: Not now (Pro) | Recorded once; the offer does not come back |
| Recall screen: add ingredients to an earlier meal (Pro) | Saved as "added afterwards" (recalled), answers exactly as marked; then "All done" |
| Safety questions before a food swap (Pro) | Saved; swaps are then offered and the questions are not asked again |
| Today's card: Not relevant (Pro) | Feedback saved as not relevant |
| Doctor reminder in History: I've spoken to a doctor (13 bloating days in 30) | The reminder is shortened; the button goes; the NHS note stays |
| Today: answer the running experiment (Pro) | Today's answer saved ("Partly"); Today says it is saved |
| Today: "Not useful" on the next best log (Pro) | The suggestion is dismissed and does not show again |

Single checks, also passed: the photo with the local mock (it cannot tell, the screen says "The photo didn't show clearly what the dish is. Type the dish instead.", the typed meal saves, no photo is kept); "Yes, go through them" opens the recall screen, the offer is recorded once, and "Skip this meal" saves nothing; a failed export (request refused, then file not finished) shows a message each time and downloads nothing, and trying again downloads the file once; the founder tools (below).

**Counts, reconciled with the raw results** (`test-evidence/ledger/e2e-results.json`, final code): 250 browser checks, all passed first time, none retried. By file: save and edit outcomes 198 (63 actions x 3 = 189, plus 9 single checks), navigation 14, time edits 15, empty states 5, core 11, email code 5, founder tools 2. Section 5 accounts for 40 of them: 12 actions x 3 = 36, plus 4 single checks (photo with the mock, "Yes, go through them", export, founder tools).

Still open (the full list of remaining gaps is in the summary, "Remaining gaps"):

| Action | What is verified | What is not |
|---|---|---|
| Photo ingredient check | The screen path above, with the local mock and with a stored provider answer | A real AI provider reading a real photo. Not connected; it needs your approval of the key and a spending limit. **Pending** |
| Founder tools (`/admin`) | Locally, on the screen: staff sign-in with an authenticator code; Set limit saves and still shows after a refresh; the AI switch turns off and back on; a refused change says so and changes nothing; a lost connection says so; a double tap sends one request with one audit record for the change (R3, fixed) | Not tried on the hosted preview: there is no staff account there, by design. **Pending** |
| "Is it still happening?" after answering Yes or Not sure | The answer is recorded and the record stays open | Whether the question should come back on the next app open (it does, by design, while the record is open 8 hours or more). Question for the owner, not a defect |
| Mock purchase | Local test mode only; hidden on the preview (hosted check) | Not part of the product |
| Every check in this section on a real phone | Not done | **Pending** (owner checklist in `PROGRESS.md`) |

Also observed, not changed (the export wording and the recalled-meals offer, listed here before, are fixed: R1 and R2):

- The morning review accepts a day from before the account existed, but such days never count anywhere (the app ignores days before an account's start). Harmless.
- Account deletion removes kept meal photos before the account; if that photo removal fails, the account is still deleted and the photos may stay in storage (the removal result is not checked). No test account holds stored files.
- A founder change and its audit record are written in two separate database steps (the setting first, then the record). If the second step failed, the change would have no audit record. Not changed: it needs a new database function, which means a new migration applied to `bloat-test`; for your decision.
- Other writes outside a save's own transaction, checked in the code: an experiment moving to its next phase by date, the AI check's own record, the daily card choice, Your journey's milestones and a kept meal photo's record. Each is safe to repeat and leaves no half-made save; not changed.

## 6. A deleted account's earlier sign-in

Deleting an account does not make every token already issued invalid at that moment. What each layer does with a token issued before the deletion, measured locally (`tests/api/slice-a-account.test.ts`, "a deleted account's earlier tokens", with a second session made before the deletion and not yet expired):

| Where the old token is used | Result |
|---|---|
| The app's API (`/v1/...`) | 401 at once. Every request is checked with Supabase Auth, which no longer knows the user |
| Supabase Auth user lookup (`/auth/v1/user`) | 403 |
| Refresh token, to get a new session | 400: refused |
| Direct database read with the old access token | 200 with **0 rows**: the token's signature is still valid until it expires (Supabase's default lifetime is one hour), so the database does not refuse it, but every row went with the account |
| Direct database write with the old access token | 403: signed-in users can never write to tables directly |
| The app on a second device signed in before the deletion (browser test) | `/v1/me/state` answers 401 and a private screen sends it to Sign in |

**Protected data, not just the screen.** `tests/hosted/old-token.ts` runs the same session through every layer in two steps around a deletion: `capture` signs in and records what the session can do, `check` repeats it after the deletion. Rehearsed against the local stack on 22 Nov with a stand-in account that had a saved meal:

| Same session (access token unexpired: about 3,600 s left) | Before deletion | After deletion |
|---|---|---|
| App `/v1/me/state`, `/v1/history` (token and cookie) | 200 with the account's data (15 and 9 data fields) | **401, no data fields** |
| App `/v1/reports` (Pro, Free account) | 403 Pro needed | **401** |
| App: save a meal | 201 | **401** |
| Supabase Auth user lookup | 200 | **403** |
| Refresh token for a new session | (not used before) | **400** |
| Direct database read: meals, profiles | 200, 2 meals and 1 profile | **200, 0 rows** (token signature still valid; nothing left to read) |
| Direct database write | 403 | **403** |
| Screen: `/history` with the old cookie | 200, the screen | 307 to `/sign-in?next=%2Fhistory` (shown for completeness; the rows above are the evidence that data is protected) |

**Hosted, 22 Nov 20:27 to 20:28 UTC, on `dpl_GYCc4U8LgKQJWhKBizXioK2fw2FQ` (`adfe49b`).** Account `run-p1@bloat.test`, after the full hosted suite. Session A was captured; the account was then deleted through the app's own "Delete my account" using a separate session B (as from a second device); then session A was used again. Same results as the local rehearsal:

| Same session A (access token unexpired: about 3,590 s left) | Before deletion | After deletion |
|---|---|---|
| App `/v1/me/state`, `/v1/history` (token and cookie) | 200 with the account's data (15 and 9 data fields) | **401, no data fields** |
| App `/v1/reports` (Pro, Free account) | 403 Pro needed | **401** |
| App: save a meal | 201 | **401** |
| Supabase Auth user lookup | 200 | **403** |
| Refresh token for a new session | (not used before) | **400** |
| Direct database read: meals, profiles | 200, 2 meals and 1 profile | **200, 0 rows** |
| Direct database write | 403 | **403** |
| Screen: `/history` with the old cookie | 200, the screen | 307 to `/sign-in?next=%2Fhistory` (reported apart; not the evidence) |

Raw statuses and counts (no tokens): `test-evidence/ledger/hosted-old-token-before.json` and `-after.json` (local evidence folder, not committed). The session file was deleted after the check.

## 7. Hosted preview evidence

Kept apart from the local results above. Nothing here comes from a real phone. The hosted checks ran through the branch address, because this workspace's network blocks `bloat-preview.vercel.app`; Vercel reports both addresses on the same deployment.

| Check | Build | Result |
|---|---|---|
| Full hosted suite (16 checks), first attempt, 7 accounts marked `2026-11-23c` | `62431c7`, `dpl_AvmuUC34HMhQpEj34UsAk6ekV2Lm` (final), 23 Nov 12:24 to 12:26 UTC (`hosted-full-Avmu.txt`) | 15 of 16; the diary check's own navigation raced the app (section 4, end); data saved correctly |
| Full hosted suite (16 checks), repeat with 7 fresh accounts marked `2026-11-23d`, diary check fixed | Same, 12:29 to 12:31 UTC (`hosted-full-Avmu-final.txt`) | **Passed, 16 of 16** |
| Export messages (R2), `tests/hosted/export-feedback.spec.ts` | Same, 12:31 UTC (`hosted-export-feedback-Avmu.txt`) | **Passed** |
| "Delete my account" through the app, both sets of 7 | Same (`hosted-delete-Avmu-first.txt`, `hosted-delete-Avmu-final.txt`) | **Passed**: 14 of 14 deleted; each token refused at once afterwards; database check in section 8 |
| Full hosted suite (`pnpm test:hosted`), the 15 checks below plus "Your journey with no finished day says so and shows no backwards date range" (external report B3), 7 separate synthetic accounts | `0d537d2`, `dpl_59A4HADi2dEAD26ivcfdoXVWPf9K`, 23 Nov 09:28 to 09:30 UTC (`test-evidence/ledger/hosted-full-59A4.txt`) | **Passed, 16 of 16** |
| "Delete my account" through the app, those 7 accounts | Same | **Passed**: 7 of 7 deleted; each token refused at once afterwards (`hosted-delete-59A4.txt`); database check in section 8 |
| Full hosted suite (`pnpm test:hosted`, 15 checks): signed-out return path, Back on public pages, empty-form messages, opens with no Vercel login, test-only switches off, signed-out data refused, saving a meal and seeing it in History after a refresh, the diary flow, two-account isolation through the app and the database, report privacy with Medicines and Health off plus share link open and revoke, JSON and CSV exports, password sign-in and sign-out ending the old token, nobody can create an account, two signed-in navigation checks | `adfe49b`, `dpl_GYCc4U8LgKQJWhKBizXioK2fw2FQ`, 22 Nov about 20:26 UTC, with the 7 approved accounts | **Passed, 15 of 15** |
| Account-free checks (6), inside GitHub run 6: on the new deployment's own URL before publishing, and on `bloat-preview.vercel.app` after | Same | **Passed**, 6 of 6 both times |
| The coverage endpoint (section 4, row 8) | Same | **Passed**: 401 signed out (exists); `af950f5` answered 404 |
| A deleted account's earlier session (section 6) | Same | **Passed** |
| "Delete my account" through the app, 7 accounts | Same | **Passed**: 7 of 7 deleted; each token refused at once afterwards; database check in section 8 |
| Account-free checks on the previous build | `af950f5`, `dpl_FDVnqFxAx4MHaGhq9g9HLiim7Tzj`, 14:36 UTC | Passed, 6 of 6 |
| The owner's own login journey (`bloat-tester@bloat.test`), without the password leaving the owner | 22 Nov, 12:14 to 12:17 UTC, the build the address served then | **Passed (owner, by hand).** Server records: one successful password sign-in, setup saved, sign-out, then 0 sessions. Designated Pro test address, no staff access |

## 8. Temporary test accounts

Destroying the one-off password stopped new password sign-ins only. Sessions already issued stay valid until revoked or until the account is deleted; on this project they have no fixed end (`not_after` empty). On 22 Nov the run's accounts still had **34 live sessions**. Their tokens existed only in the memory of test browsers that have closed; a scan of this workspace's test folders found none saved.

The 19 accounts from the 19 Nov runs were read from `bloat-test` on 22 Nov (ID, email and the `synthetic_test_run = 2026-11-19` marker) and compared with this exact list. They matched, with no unexpected account carrying the marker:

- `public-1119@bloat.test`, `p1-1119@bloat.test`, `diary-1119@bloat.test`, `isoa-1119@bloat.test`, `isob-1119@bloat.test`, `export-1119@bloat.test`
- `public-1119b@bloat.test`, `p1-1119b@bloat.test`, `diary-1119b@bloat.test`, `isoa-1119b@bloat.test`, `isob-1119b@bloat.test`, `export-1119b@bloat.test`
- `public-1119c@bloat.test`, `p1-1119c@bloat.test`, `diary-1119c@bloat.test`, `isoa-1119c@bloat.test`, `isob-1119c@bloat.test`, `export-1119c@bloat.test`
- `pro-tester@bloat.test`

Together they hold 12 meals, 4 bloating records, 3 reports and 3 share links, none still open, and no stored files. The owner's addresses (including `bloat-tester@bloat.test`, which has no marker) and `vraj@example.com` are not on the list.

**Status: deleted and verified.** After the approval prompt had timed out 7 times, the owner ran the guarded SQL (`docs/ops/delete-19-synthetic-accounts-2026-11-19.sql`) in the Supabase SQL Editor. It lists the 19 first and deletes only if exactly those ID-and-email pairs carry the marker and no other account does. Read-only check at 20:12 UTC on 22 Nov: 0 users (by ID, by email and by marker), 0 sessions, 0 refresh tokens, 0 identities, 0 MFA factors, 0 stored files, and 0 rows for these IDs in all 48 app tables. The owner's `bloat-tester@bloat.test` is still there (no marker, its profile intact).

**This run's 7 accounts** (`run-public`, `run-p1`, `run-diary`, `run-isoa`, `run-isob`, `run-export` at `bloat.test`, and `pro-tester@bloat.test`, marked `2026-11-22`) were created at about 20:25 UTC with only the bcrypt hash of a one-off password sent; the password stayed in a private file. After the hosted suite and the old-token check, each was deleted through the app's own "Delete my account" (`tests/hosted/delete-accounts.ts`; `run-p1` as part of the old-token check). Read-only check afterwards: 0 users (by ID, by email and by marker), 0 sessions, 0 refresh tokens, 0 identities, 0 stored files, 0 rows in all 48 app tables; the app keeps its designed deletion record for each (7 rows holding only a SHA-256 hash of the account ID, so a restored backup cannot bring the account back). No account with any `synthetic_test_run` marker remains. The password, its hash and the session file were then deleted.

**23 Nov, B1 to B4 live check:** one account, `pro-tester@bloat.test` (marked `2026-11-23`, ID `6e37465a-86ac-483c-9476-e1599891d5a8`), created with only a password hash, used for `tests/hosted/reported-fixes.spec.ts`, then deleted through "Delete my account" (answer: deleted; its token refused at once). Read-only check afterwards: 0 users (by ID, email and marker), 0 sessions, refresh tokens, identities and stored files, 0 rows across all 48 app tables; one hash-only deletion record. The owner's `bloat-tester@bloat.test` and the external tester's synthetic meal and bloating record on it were not touched.

**23 Nov, full hosted suite on `dpl_59A4HADi2dEAD26ivcfdoXVWPf9K`:** seven new accounts (`run-public`, `run-p1`, `run-diary`, `run-isoa`, `run-isob`, `run-export` at `bloat.test`, and `pro-tester@bloat.test`, marked `2026-11-23`), created with only the bcrypt hash of a one-off password, which stayed in a private file. After the 16 checks each was deleted through "Delete my account" (answer: deleted; its token refused at once), and the password file was destroyed. Read-only check, repeated at about 10:00 UTC: 0 users by ID and by email, 0 accounts with any test marker, 0 sessions, identities and stored files, 0 profiles, meals and bloating records for these IDs. The owner's `bloat-tester@bloat.test` is untouched: still 1 meal and 1 bloating record (the external tester's synthetic entries).

**23 Nov, final round on `dpl_AvmuUC34HMhQpEj34UsAk6ekV2Lm`:** two sets of the same seven addresses, each created with only the bcrypt hash of a new one-off password (kept in a private file, destroyed after the set was deleted). Set one (marker `2026-11-23c`) ran the first hosted attempt; set two (`2026-11-23d`) ran the repeat and the live export check. Each set was deleted through "Delete my account" (14 of 14 answered deleted; each token refused at once). Read-only checks after each deletion: 0 users by ID and by email, 0 accounts with any test marker, 0 sessions, refresh tokens, identities and stored files, 0 profiles, meals, bloating records, reports, share links and audit rows for these IDs (`test-evidence/ledger/hosted-cleanup-Avmu.txt`). `bloat-tester@bloat.test` was not used: a fingerprint of its meals, bloating records, strength readings, report, profile, plan and sign-in details taken before the first run is identical after the last deletion.

## 9. Which build the addresses serve, and what publishes it

**Served now (23 Nov, from 12:19 UTC):** `https://bloat-preview.vercel.app` and the branch address serve deployment `dpl_AvmuUC34HMhQpEj34UsAk6ekV2Lm` (`bloat-as3j641fa-typeshi2.vercel.app`), built by GitHub run 11 from commit `62431c7`, which holds the R1 to R3 fixes (section 4). Tied together the same way as for run 6 below: the run started on the push of `62431c7` and reports that commit; its hosted-check step tested exactly `https://bloat-as3j641fa-typeshi2.vercel.app`; its publish step confirmed through the Vercel API that `bloat-preview.vercel.app` serves that build; Vercel listed 490 of the deployment's 630 files (its listing is partial), and all 207 source files among them are byte-identical to `62431c7`, including `src/app/admin/admin.tsx`, which differs from the previous build (the changed `me.tsx` and recalled-offer route are in folders the listing left out); Vercel reports both addresses on it, and it is the only deployment made since run 10.

Before that, the same day: `dpl_E8w2BwFqLPuj59xLtcptnRVWT1fB` from run 10 (`7713098`, S1 to S3; its 207 listed source files matched that commit), then `dpl_59A4HADi2dEAD26ivcfdoXVWPf9K` from run 9 (`0d537d2`, B1 to B4). Earlier: `dpl_GYCc4U8LgKQJWhKBizXioK2fw2FQ` from run 6 (`adfe49b`, 22 Nov), then `af950f5` (`dpl_FDVnqFxAx4MHaGhq9g9HLiim7Tzj`), the last build made by Vercel's own Git builds.

**Tested revision = deployed revision, and how that is known:**

- Run 6 was started by hand (`workflow_dispatch`) on the branch after confirming its head was `adfe49b803f88c8300a01afe27cca8bb7ff449d4`; GitHub reports that exact commit for the run, and each job checks out the run's commit.
- The run's Vercel build is the only deployment made since `af950f5` (Vercel's list), and the run's hosted-check step records the URL it tested: `https://bloat-1gx9xzdwr-typeshi2.vercel.app`.
- Source files: Vercel listed 205 of the deployment's files (its listing is partial); all 205 are byte-identical to `adfe49b` (SHA-1 of content). The `tests/hosted` folder was listed in full and holds exactly `adfe49b`'s five files, not the script added later in `b755b1b`.
- The run's own last step compared the build with what `bloat-preview.vercel.app` serves, through the Vercel API, and passed.
- Not available: the commit label the workflow attaches to the deployment does not show in the Vercel tool used here, so it was not used as evidence.

**The publishing gate (from commit `4640ac2`):**

- `vercel.json` switches off Vercel's automatic Git builds. Checked: no Git-triggered deployment for any push since `af950f5`; the only deployments since are the four the workflow made (runs 6, 9, 10 and 11).
- Second layer: the Vercel project's Ignored Build Step, set on 22 Nov about 19:40 UTC to `test -n "$VERCEL_GIT_COMMIT_SHA"`, meant to skip any Git-triggered build (a push, "Redeploy", a deploy hook) even if `vercel.json` changes. **Configured and read back:** run 6 read it through the Vercel API before building and it matched (the step stops the publish if it does not). **Not proven to block a Git build:** no Git build has been attempted since it was set (`vercel.json` already stops them), and proving it needs a test build on a separate branch that the dedicated address is not tied to, which was not done. Still possible by hand: a Vercel team member assigning the address in the dashboard or with their own CLI login (DEPLOYMENT.md lists every path).
- `.github/workflows/preview.yml` runs on every push. **Blocks publishing:** typecheck, lint, rule tests, the local Supabase stack, the app build, API tests and browser tests on a clean checkout; then a Vercel build that nothing public points at yet; then the six account-free hosted checks against that new build. **Only then** both addresses move to it, and the workflow confirms through Vercel which deployment `bloat-preview.vercel.app` serves. **Afterwards, reporting only:** the same six checks on the public address. **Manual:** the signed-in hosted checks (they need owner-approved accounts).
- The only secret is `VERCEL_TOKEN`, a GitHub repository secret added by the owner on 22 Nov (after 20:06 UTC), never in the workflow file or the log.

**The workflow's runs so far (GitHub Actions, "Preview"):**

| Run | Commit | Result | Why |
|---|---|---|---|
| 1 | `4640ac2` | Failed at setup | A mistake in the new workflow: `actions/setup-node@v5` looks for pnpm before corepack provides it. Fixed in `7d6fd03` |
| 2 | `7d6fd03` | Failed in the API tests (130 of 135 passed) | Four report tests need the `pdftotext` tool, which the GitHub machine lacks (now installed by the workflow). One was a real defect: section 4, defect 8. Both fixed in `2f22cc4` |
| 3 | `2f22cc4` | **Checks passed** (18:17 to 18:28 UTC); publishing stopped, as designed | Typecheck, lint, rule tests, API tests (135) and browser tests all passed on a clean checkout. The next step stopped at "the VERCEL_TOKEN repository secret is not set", so nothing was built on Vercel or published |
| 4 | `8877f49` | Cancelled | A newer push started run 5 (the workflow keeps one run per branch) |
| 5 | `5a78d98` | **Checks passed**; publishing stopped at 20:06 UTC, as designed | The token was not set yet |
| 6 | `adfe49b` (started by hand) | **Passed, published** (20:13 to 20:26 UTC) | Checks passed; deployment controls read back and matched; Vercel build `dpl_GYCc4U8LgKQJWhKBizXioK2fw2FQ`; 6 hosted checks passed on it; both addresses moved; served deployment confirmed; 6 hosted checks passed again on the public address |
| 7 | `8d7ae58` (B1 to B4 fixes) | **Failed, nothing published** (23 Nov) | 209 of 210 browser checks passed; "Edit the times of a bloating record" still expected the old "Roughly" chip when the sheet reopens. The gate did its job; the check was updated in `d0d7383` |
| 8 | `d0d7383` | **Failed, nothing published** | GitHub's machine could not start the local mail test service ("port 54324 already in use") before any test ran; a machine problem, not the app |
| 9 | `0d537d2` (started by hand; app code equals `d0d7383`) | **Passed, published** (07:12 to 07:26 UTC, 23 Nov) | Checks passed; controls read back and matched; Vercel build `dpl_59A4HADi2dEAD26ivcfdoXVWPf9K`; 6 hosted checks passed on it; addresses moved; served deployment confirmed; 6 hosted checks passed again on the public address |
| 10 | `7713098` (push; S1 to S3 fix) | **Passed, published** (09:48 to 10:03 UTC, 23 Nov) | Checks passed (browser 250 of 250, incl. the 40 new section 5 checks); controls read back and matched; Vercel build `dpl_E8w2BwFqLPuj59xLtcptnRVWT1fB`; 6 hosted checks passed on it; addresses moved; served deployment confirmed; 6 hosted checks passed again on the public address |
| 11 | `62431c7` (push; R1 to R3 fixes) | **Passed, published** (12:05 to 12:20 UTC, 23 Nov) | Checks passed (API 137, browser 250 of 250); controls read back and matched; Vercel build `dpl_AvmuUC34HMhQpEj34UsAk6ekV2Lm`; 6 hosted checks passed on it; addresses moved; served deployment confirmed; 6 hosted checks passed again on the public address |

## 10. Limits of this verification

- No real phones (iOS Safari, Android Chrome); phone behaviour was emulated in Chromium at 412px and 390px. The owner's checklist in `PROGRESS.md` covers the main journeys on a real phone.
- No screen reader; accessible names and focus were checked through the accessibility tree.
- 200% browser zoom not tested; text uses rem units so the phone's text-size setting scales it.
- Lost replies and server failures were simulated in the browser; no real network faults.
- The local suites test a local build of the commit, with test mode on and a local database. The preview is a separate Vercel build of the same commit, with test mode off and `bloat-test`. Only the hosted checks run against the published build itself.
- AI uses the labelled mock provider; payments are switched off; email delivery is not used on the preview. The photo check's "items seen in the photo" path was checked with a stored provider answer that the app's own server replays; no real AI read a real photo. A real-provider evaluation is pending your approval of a key and a spending limit.
- The three save messages fixed on 23 Nov (S1 to S3) were checked locally and by the gate on the deployed commit, not on the live preview: showing them there needs several days of back-dated records, which the preview cannot create without editing the database by hand.
- The recalled-meals fix (R1) is proven by making the local database refuse part of the save; that cannot be done on the live preview. Founder tools (R3) were checked locally only.
- Light theme only, as the owner confirmed on 22 Nov; no dark theme was added.

