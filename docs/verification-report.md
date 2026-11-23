# Verification report

What has been checked, how, and what is still not proven. "Clicked" and "verified" are kept apart:
a control that responded is not counted as working unless its outcome was checked. Local results
(local Supabase in Docker, synthetic accounts, test mode on) and hosted results (the public preview
and `bloat-test`) are kept apart, and nothing here comes from a real phone. Rebuild with
`python3 scripts/verification-report.py`.

## Results at a glance

**Tested and published revision: `0d537d27fcbaf4ea047fff6f3b01a1e0b6c0a420`** (23 Nov 2026), served at `https://bloat-preview.vercel.app` as Vercel deployment **`dpl_59A4HADi2dEAD26ivcfdoXVWPf9K`**. It holds the fixes for the four defects of the external report of 23 Nov (section 4, B1 to B4). Its app code equals `d0d7383`; `0d537d2` only added notes.

How tested and deployed are tied together (section 9): GitHub run 9 was started by hand on the branch and reports commit `0d537d2`; it built `dpl_59A4HADi2dEAD26ivcfdoXVWPf9K` and ran its hosted checks against exactly that URL before publishing; every source file Vercel listed for that deployment (207 of 628; its listing is partial) is byte-identical to `0d537d2`; Vercel reports both preview addresses on it. The previous published build was `adfe49b` (`dpl_GYCc4U8LgKQJWhKBizXioK2fw2FQ`, 22 Nov).

### Fixes from the external report (23 Nov)

| Defect | Local (old code, then fix) | Live, on `dpl_59A4HADi2dEAD26ivcfdoXVWPf9K` |
|---|---|---|
| B1: changing only a meal's name failed or moved its time when the phone and account zones differed | Reproduced (14 of 15 new checks failed); all 15 pass | **Passed**: account in Asia/Kolkata, browser in America/Los_Angeles; rename saved, saved time identical |
| B2: "Keep" had no effect | Reproduced; passes | **Passed**: Keep chosen, kept the time after another time was picked |
| B3: backwards date range on Patterns (and Your journey) for a new account | Reproduced on both screens; pass | **Passed** on Patterns ("No finished days yet."); Your journey checked locally only |
| B4: "Nothing was logged" on a day with a meal | Reproduced; passes | **Passed** ("No bloating was logged and there is no review.") |

Words used: **Passed** (the outcome was checked and was right), **Failed**, **Skipped** (left out on purpose, with the reason), **Blocked** (could not run; the reason is given), **Not done**.

### Local evidence (this workspace: local Supabase in Docker, synthetic accounts, test mode on)

Rule, API and browser tests re-run on 23 Nov on the final code; the crawl, the navigation run and the width check are from 22 Nov (`2f22cc4` app code; the four fixes since change the day screen's edit sheets and two date lines).

| Check | Result |
|---|---|
| Rule tests `pnpm test` | **Passed**, 97 of 97 |
| API tests `pnpm test:api` (real HTTP against the local app), incl. a deleted account's earlier tokens (section 6) | **Passed**, 135 of 135 |
| Browser tests `tests/e2e`, phone screen (Chromium, Pixel 7 size), incl. 20 new checks for B1 to B4 | **Passed**, 210 of 210, 0 flaky (23 Nov, final code) |
| &nbsp;&nbsp;of which save and edit outcomes, 51 actions x 3 plus 6 single checks (section 3) | **Passed**, 159 of 159 |
| Navigation by real clicks, destination and Back, signed-out, Free and Pro, 412px and 1440px (section 2) | **Passed**, 238 clicks: 238 right destination, 238 Back returned |
| Control crawl (section 1) | 1,292 rows: **834 passed** (74 screen loads, 244 clicked and responded, 516 link targets loaded without clicking), 0 failed, 49 skipped on purpose (20 destructive, each covered by a named test; 29 outside links), 409 excluded (332 hidden at phone width, 32 disabled, 45 fields), 0 blocked |
| Five widths, 320 to 1440px | **Passed**, 0 of 185 with sideways scrolling |
| Type check and lint | **Passed**, 0 errors (5 old warnings) |

### CI evidence (GitHub Actions, clean checkout of the commit)

| Check | Result |
|---|---|
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

On `dpl_59A4HADi2dEAD26ivcfdoXVWPf9K` (23 Nov): the 6 account-free checks passed twice inside run 9, the B1 to B4 live check passed with one synthetic account (`pro-tester@bloat.test`, marked `2026-11-23`), and that account was then deleted through "Delete my account" and verified gone (0 rows anywhere; one hash-only deletion record). The full signed-in suite (15 checks) was **not** re-run on this build; it last passed on `dpl_GYCc4U8LgKQJWhKBizXioK2fw2FQ`, below.

On `dpl_GYCc4U8LgKQJWhKBizXioK2fw2FQ` (`adfe49b`, 22 Nov):

| Check | Result |
|---|---|
| Full hosted suite, 22 Nov about 20:26 UTC: 6 account-free and 9 signed-in checks (saving and History, the diary flow, two-account isolation, report privacy and share links, exports, password sign-in and sign-out, test-only switches off, signed-in navigation) | **Passed**, 15 of 15 |
| The coverage endpoint missing from the old build (section 4, row 8) | **Passed**: answers 401 (exists, needs sign-in), where `af950f5` answered 404 |
| A deleted account's earlier session: protected data (section 6) | **Passed**: same unexpired session read data before; after deletion every app data request 401 with no data, Supabase user lookup 403, refresh 400, direct database reads 0 rows, writes 403 |
| The same session: screen (reported separately) | `/history` redirects to Sign in. Not counted as evidence that data is protected |
| Deleting the 19 temporary accounts from 19 Nov (owner ran the guarded SQL) | **Passed**: read-only check at 20:12 UTC shows 0 users, sessions, refresh tokens, identities, stored files and rows in all 48 app tables; the owner's `bloat-tester@bloat.test` is intact |
| Deleting the 7 accounts of this run (through the app's own "Delete my account") | **Passed**: 7 of 7 answered "deleted" and their tokens were refused at once; read-only check shows 0 users, sessions, refresh tokens, identities, stored files and app rows; the app kept only its 7 deletion records (a hash of each account ID). No account with a test marker remains |
| Git builds off through `vercel.json` | **Passed**: no Git-triggered deployment for any of the 14 pushes since `af950f5` (to 23 Nov) |
| Vercel Ignored Build Step (second layer) | **Configured and read back** (run 6). **Not proven to block a Git build**: that needs a test build on a separate branch, not done (section 9) |

### Manual device evidence

| Check | Result |
|---|---|
| The owner's own sign-in, setup, refresh and sign-out on the preview (22 Nov, earlier build) | Passed, reported by the owner and confirmed from server records (section 7) |
| The main journeys on a real phone with `dpl_59A4HADi2dEAD26ivcfdoXVWPf9K` | **Not done (pending).** Checklist for the owner in `PROGRESS.md` |
| External tester, 23 Nov, cloud Chrome browser with the owner's test account on `adfe49b` | Their report: four defects (now fixed) and the checks they passed; not a real phone |
| iOS Safari, Android Chrome, screen reader, 200% zoom | **Not done** |

### Not claimed

This report does not say that every button or feature works. It says which outcomes were checked, where, and on which build. The actions still checked only partly are listed in section 5. Real-phone checks are pending, and the Ignored Build Step's effect on a Git build is not proven.

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
| experiments cannot be chosen before there are enough confirmed days, and the screen says why | pass | | |
| 'Is it still happening?': No, it ended opens the end time, and saving it closes the record | pass | | |
| ingredient check fails: the message shows, the dish is kept, Try the check again works, and the meal still saves | pass | | |
| ingredient check fails and the person saves anyway: the meal saves without ingredients | pass | | |
| deleting the account with a lost reply: it says so, and Check and finish completes it once | pass | | |
| after an account is deleted on one device, the other device's earlier sign-in stops working | pass | | |

Result: 159 of 159 passed (51 actions x 3, plus 6 single checks: the rows without three columns).

Before fix 1 in section 4 (earlier the same day), on the same checks:
- Delete a meal: a server failure is shown, nothing changes, and the same button then saves: Error: failure message on screen

The other browser tests on the same build: admin.spec.ts 1 of 1, core.spec.ts 11 of 11, email-code.spec.ts 5 of 5, empty-states.spec.ts 5 of 5, navigation.spec.ts 14 of 14, time-edits.spec.ts 15 of 15.

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

## 5. What is still not verified for every outcome

Closed in this round (now in section 3 with all three outcomes on the screen): "Is it still happening?" Yes and Not sure (No, it ended has its own test); deleting a bloating record and a bowel record through the day screen; the experiment daily answer, End early, the weekly check during a swap, Finish and add back, Resume; Learn "Un-hide"; saving a meal with its ingredient check, plus a failed check with retry and with Save anyway; creating and revoking a report share link; deleting the account, plus a lost reply and a second device.

Still open. "Server tests" means `tests/api` checks the endpoint's data change and its refusals, not the screen.

| Action | What is verified | What is not |
|---|---|---|
| Warning signs and symptoms logged with bloating (Pro fields) | Saved and shown (core test); they go through the same Save as "Log bloating" (all three outcomes checked) | Failure and double tap for the Pro symptom fields specifically |
| Ingredient check: photo input, marking items, saved dishes; recall screen saving ingredients | Typed-dish check on the screen (section 3); server tests | Photo path and saved dishes on the screen; a real AI provider (not connected) |
| Experiment swap safety check (the questions asked before each food swap; the tests answer them through the API) | Server tests | The screen |
| Card "Not relevant", doctor reminder answer, dismissing a suggestion | Server tests (most) | The screens |
| Upgrade: recalled-meals offer answer | Server tests | The screen |
| Export JSON and CSV | Complete files and one request on double tap (browser tests) | A failed export on the screen in this round (covered in the 18 Nov round) |
| Founder tools (`/admin`) actions | Staff sign-in with an authenticator code; server tests for the actions | The founder screens' buttons |
| "Is it still happening?" after answering Yes or Not sure | The answer is recorded and the record stays open | Whether the question should come back on the next app open (it does, by design, while the record is open 8 hours or more). Question for the owner, not a defect |
| Mock purchase | Local test mode only; hidden on the preview (hosted check) | Not part of the product |

Also observed, not changed: the morning review accepts a day from before the account existed, but such days never count anywhere (the app ignores days before an account's start). Harmless; noted for the owner. Account deletion removes kept meal photos before the account; if that photo removal fails, the account is still deleted and the photos may stay in storage (the removal result is not checked). The 19 temporary accounts hold no stored files; noted as a limitation, not changed in this round.

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

## 9. Which build the addresses serve, and what publishes it

**Served now (23 Nov):** `https://bloat-preview.vercel.app` and the branch address serve deployment `dpl_59A4HADi2dEAD26ivcfdoXVWPf9K` (`bloat-fe4z4x081-typeshi2.vercel.app`), built by GitHub run 9 from commit `0d537d2`, which holds the B1 to B4 fixes. Tied together the same way as for run 6 below: the run's commit, the URL its hosted step tested, the 207 listed source files (all byte-identical to `0d537d2`, including notes that exist only in that commit), and Vercel's answer for both addresses. Before that (22 Nov): `dpl_GYCc4U8LgKQJWhKBizXioK2fw2FQ` from run 6 (`adfe49b`); before that `af950f5` (`dpl_FDVnqFxAx4MHaGhq9g9HLiim7Tzj`), the last build made by Vercel's own Git builds.

**Tested revision = deployed revision, and how that is known:**

- Run 6 was started by hand (`workflow_dispatch`) on the branch after confirming its head was `adfe49b803f88c8300a01afe27cca8bb7ff449d4`; GitHub reports that exact commit for the run, and each job checks out the run's commit.
- The run's Vercel build is the only deployment made since `af950f5` (Vercel's list), and the run's hosted-check step records the URL it tested: `https://bloat-1gx9xzdwr-typeshi2.vercel.app`.
- Source files: Vercel listed 205 of the deployment's files (its listing is partial); all 205 are byte-identical to `adfe49b` (SHA-1 of content). The `tests/hosted` folder was listed in full and holds exactly `adfe49b`'s five files, not the script added later in `b755b1b`.
- The run's own last step compared the build with what `bloat-preview.vercel.app` serves, through the Vercel API, and passed.
- Not available: the commit label the workflow attaches to the deployment does not show in the Vercel tool used here, so it was not used as evidence.

**The publishing gate (from commit `4640ac2`):**

- `vercel.json` switches off Vercel's automatic Git builds. Checked: no Git-triggered deployment for any of the 14 pushes since `af950f5` (17 commits); the only deployments since are the two the workflow made (runs 6 and 9).
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

## 10. Limits of this verification

- No real phones (iOS Safari, Android Chrome); phone behaviour was emulated in Chromium at 412px and 390px. The owner's checklist in `PROGRESS.md` covers the main journeys on a real phone.
- No screen reader; accessible names and focus were checked through the accessibility tree.
- 200% browser zoom not tested; text uses rem units so the phone's text-size setting scales it.
- Lost replies and server failures were simulated in the browser; no real network faults.
- The local suites test a local build of the commit, with test mode on and a local database. The preview is a separate Vercel build of the same commit, with test mode off and `bloat-test`. Only the hosted checks run against the published build itself.
- AI uses the labelled mock provider; payments are switched off; email delivery is not used on the preview.
- Light theme only, as the owner confirmed on 22 Nov; no dark theme was added.

