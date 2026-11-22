# Verification report

What has been checked, how, and what is still not proven. "Clicked" and "verified" are kept apart:
a control that responded is not counted as working unless its outcome was checked. Local results
(local Supabase in Docker, synthetic accounts, test mode on) and hosted results (the public preview
and `bloat-test`) are kept apart, and nothing here comes from a real phone. Rebuild with
`python3 scripts/verification-report.py`.

## Results at a glance

**Application commit: `2f22cc4`** (22 Nov 2026). Two builds are involved, and they are kept apart:

- **Local results** below ran on this workspace's files. Their app code is exactly `2f22cc4`: it included the coverage endpoint that `.gitignore` had hidden from every commit until `2f22cc4` (section 4, defect 8).
- **The public preview serves `af950f5`** (deployment `dpl_FDVnqFxAx4MHaGhq9g9HLiim7Tzj`), which lacks that one endpoint. No screen calls it. `2f22cc4` is not published: the new publishing gate needs the owner's `VERCEL_TOKEN` first (section 9).

Words used: **Passed** (the outcome was checked and was right), **Failed**, **Skipped** (left out on purpose, with the reason), **Blocked** (could not run; the reason is given), **Not done**.

### Local evidence (this workspace: local Supabase in Docker, synthetic accounts, test mode on)

| Check | Result |
|---|---|
| Rule tests `pnpm test` | **Passed**, 96 of 96 |
| API tests `pnpm test:api` (real HTTP against the local app), incl. a deleted account's earlier tokens (section 6) | **Passed**, 135 of 135 |
| Browser tests `tests/e2e`, phone screen (Chromium, Pixel 7 size) | **Passed**, 190 of 190, 0 flaky |
| &nbsp;&nbsp;of which save and edit outcomes, 51 actions x 3 plus 6 single checks (section 3) | **Passed**, 159 of 159 |
| Navigation by real clicks, destination and Back, signed-out, Free and Pro, 412px and 1440px (section 2) | **Passed**, 238 clicks: 238 right destination, 238 Back returned |
| Control crawl (section 1) | 1,292 rows: **834 passed** (74 screen loads, 244 clicked and responded, 516 link targets loaded without clicking), 0 failed, 49 skipped on purpose (20 destructive, each covered by a named test; 29 outside links), 409 excluded (332 hidden at phone width, 32 disabled, 45 fields), 0 blocked |
| Five widths, 320 to 1440px | **Passed**, 0 of 185 with sideways scrolling |
| Type check and lint | **Passed**, 0 errors (5 old warnings) |

### CI evidence (GitHub Actions, clean checkout of the commit)

| Check | Result |
|---|---|
| Run 3 on `2f22cc4`: typecheck, lint, rule tests, local Supabase, build, API tests | **Passed** (135 API tests) |
| Run 3 on `2f22cc4`: browser tests | **Passed** (11 minutes for all checks) |
| Earlier runs 1 and 2 | **Failed**: a workflow setup mistake, then the missing PDF tool and a real defect (section 9); all fixed |

### Hosted evidence (the public preview and the `bloat-test` database)

| Check | Result |
|---|---|
| Account-free checks (6) on `af950f5`, deployment `dpl_FDVnqFxAx4MHaGhq9g9HLiim7Tzj`, 14:36 UTC | **Passed**, 6 of 6 |
| Sign-ups off at the provider (part of the six) | **Passed**: `disable_signup: true`, sign-up refused with 422 |
| Signed-in hosted checks (9), on the served build | **Blocked**: the 7 approved accounts need the old `pro-tester@bloat.test` deleted first, with the 19 (section 7) |
| A deleted account's earlier tokens, on the hosted project | **Blocked**, same reason |
| Deleting the 19 temporary accounts from 19 Nov | **Not done**: list verified again at 18:18 UTC; the delete was sent and its approval prompt timed out (section 8) |
| Publishing steps of the gate (Vercel build, hosted checks on it, moving the addresses) | **Blocked, as designed**: run 3 stopped at "VERCEL_TOKEN is not set"; nothing was published (section 9) |

### Manual device evidence

| Check | Result |
|---|---|
| The owner's own sign-in, setup, refresh and sign-out on the preview (22 Nov, before this round's fixes) | Passed, reported by the owner and confirmed from server records (section 7) |
| The main journeys on a real phone with this commit | **Not done.** Checklist for the owner in `PROGRESS.md` |
| iOS Safari, Android Chrome, screen reader, 200% zoom | **Not done** |

### Not claimed

This report does not say that every button or feature works. It says which outcomes were checked, where, and on which build. The actions still checked only partly are listed in section 5. The milestone is **not complete** while the hosted signed-in suite, the account cleanup and the real-phone checks are open.

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

The other browser tests on the same build: admin.spec.ts 1 of 1, core.spec.ts 11 of 11, email-code.spec.ts 5 of 5, navigation.spec.ts 14 of 14.

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

Hosted: the same check is planned for the temporary accounts of the next hosted run (section 7), after they are deleted. Not yet done.

## 7. Hosted preview evidence

Kept apart from the local results above. Nothing here comes from a real phone.

| Check | Build | Result |
|---|---|---|
| Account-free hosted checks (6): signed-out return path, Back on public pages, empty-form messages, opens with no Vercel login, signed-out data refused, nobody can create an account | `af950f5`, deployment `dpl_FDVnqFxAx4MHaGhq9g9HLiim7Tzj`, 22 Nov 14:36 UTC, through the branch address (this workspace's network blocks `bloat-preview.vercel.app`; Vercel reports both addresses on this deployment) | **Passed, 6 of 6.** The same six passed on `fcbce97` earlier the same day |
| Sign-ups off at the provider | 22 Nov | **Passed.** Supabase reports `disable_signup: true`; direct and email-code sign-up refused with 422 `signup_disabled`; old test login 404; 0 accounts created by the attempt |
| The owner's own login journey (`bloat-tester@bloat.test`), without the password leaving the owner | 22 Nov, 12:14 to 12:17 UTC, the build the address served then | **Passed (owner, by hand).** Owner reported every step working. Server records: created 11:47 UTC (confirmed, one email identity); one successful password sign-in 12:14:56 UTC, no failed attempts; setup saved; sign-out 12:17:24 UTC; afterwards 0 sessions and 0 live refresh tokens. Designated Pro test address, no staff access |
| Signed-in hosted checks (9: test-only switches off, saving and History, the diary flow, two-account isolation, report privacy and share links, exports, password sign-in and sign-out, two signed-in navigation checks) | The served build (`af950f5` now; `2f22cc4` once published) | **Blocked.** It needs the 7 temporary accounts the owner approved on 22 Nov: `run-public`, `run-p1`, `run-diary`, `run-isoa`, `run-isob` and `run-export` at `bloat.test`, and `pro-tester@bloat.test` (after the old one is deleted), all marked `synthetic_test_run = 2026-11-22`. They were not created: the old `pro-tester@bloat.test` must be deleted first (with the 19), and that deletion is waiting for approval (section 8). The creation statement is prepared and was rehearsed locally (7 stand-in accounts made, signed in with the one-off password, wrong password refused, then deleted). Last run of all 15 hosted checks: commit `10cd14e`, 19 Nov, 14 of 15 (the failure was the sign-up switch, now fixed) |
| Deleted-account token check on the hosted project | - | **Blocked** with the suite above |

## 8. Temporary test accounts

Destroying the one-off password stopped new password sign-ins only. Sessions already issued stay valid until revoked or until the account is deleted; on this project they have no fixed end (`not_after` empty). On 22 Nov the run's accounts still had **34 live sessions**. Their tokens existed only in the memory of test browsers that have closed; a scan of this workspace's test folders found none saved.

The 19 accounts from the 19 Nov runs were read from `bloat-test` on 22 Nov (ID, email and the `synthetic_test_run = 2026-11-19` marker) and compared with this exact list. They matched, with no unexpected account carrying the marker:

- `public-1119@bloat.test`, `p1-1119@bloat.test`, `diary-1119@bloat.test`, `isoa-1119@bloat.test`, `isob-1119@bloat.test`, `export-1119@bloat.test`
- `public-1119b@bloat.test`, `p1-1119b@bloat.test`, `diary-1119b@bloat.test`, `isoa-1119b@bloat.test`, `isob-1119b@bloat.test`, `export-1119b@bloat.test`
- `public-1119c@bloat.test`, `p1-1119c@bloat.test`, `diary-1119c@bloat.test`, `isoa-1119c@bloat.test`, `isob-1119c@bloat.test`, `export-1119c@bloat.test`
- `pro-tester@bloat.test`

Together they hold 12 meals, 4 bloating records, 3 reports and 3 share links, none still open, and no stored files. The owner's addresses (including `bloat-tester@bloat.test`, which has no marker) and `vraj@example.com` are not on the list.

**Status: not deleted.** The owner chose deletion through the connector's approval prompt. At 18:18 UTC the list was read again (the same 19 IDs, all with the marker, 34 live sessions, no other marked account), and the delete of exactly those 19 was sent; its approval prompt timed out at about 18:22 UTC, as on every earlier try (6 in all). Nothing was deleted. The prepared statement deletes only rows that match both the marker and one of the 19 IDs, and returns the emails it deleted. After deletion, read-only queries must show 0 users, 0 sessions, 0 refresh tokens, 0 identities and 0 app rows for these IDs. The same delete and check statements were rehearsed on the local database with 7 stand-in accounts: all counts were 0 afterwards.

## 9. Which build the addresses serve, and what publishes it

**Served now:** `https://bloat-preview.vercel.app` and the branch address serve commit `af950f5`, deployment `dpl_FDVnqFxAx4MHaGhq9g9HLiim7Tzj` (Vercel reports both addresses on it). Up to and including `af950f5`, the addresses followed every successful Vercel build of the branch, with no tests in between.

**The publishing gate (from commit `4640ac2`):**

- `vercel.json` switches off Vercel's automatic Git builds. Checked: Vercel made no deployment for `4640ac2`, `7d6fd03` or `2f22cc4`, so pushing no longer changes what testers see.
- `.github/workflows/preview.yml` runs on every push. **Blocks publishing:** typecheck, lint, rule tests, the local Supabase stack, the app build, API tests and browser tests on a clean checkout; then a Vercel build that nothing public points at yet; then the six account-free hosted checks against that new build. **Only then** both addresses move to it, and the workflow confirms through Vercel which deployment `bloat-preview.vercel.app` serves. **Afterwards, reporting only:** the same six checks on the public address. **Manual:** the signed-in hosted checks (they need owner-approved accounts).
- The only secret is `VERCEL_TOKEN`, a GitHub repository secret, never in the workflow file or the log. It is not set yet, so no run can publish: `2f22cc4` waits for it.

**The workflow's runs so far (GitHub Actions, "Preview"):**

| Run | Commit | Result | Why |
|---|---|---|---|
| 1 | `4640ac2` | Failed at setup | A mistake in the new workflow: `actions/setup-node@v5` looks for pnpm before corepack provides it. Fixed in `7d6fd03` |
| 2 | `7d6fd03` | Failed in the API tests (130 of 135 passed) | Four report tests need the `pdftotext` tool, which the GitHub machine lacks (now installed by the workflow). One was a real defect: section 4, defect 8. Both fixed in `2f22cc4` |
| 3 | `2f22cc4` | **Checks passed** (18:17 to 18:28 UTC); publishing stopped, as designed | Typecheck, lint, rule tests, API tests (135) and browser tests all passed on a clean checkout. The next step stopped at "the VERCEL_TOKEN repository secret is not set", so nothing was built on Vercel or published |

## 10. Limits of this verification

- No real phones (iOS Safari, Android Chrome); phone behaviour was emulated in Chromium at 412px and 390px. The owner's checklist in `PROGRESS.md` covers the main journeys on a real phone.
- No screen reader; accessible names and focus were checked through the accessibility tree.
- 200% browser zoom not tested; text uses rem units so the phone's text-size setting scales it.
- Lost replies and server failures were simulated in the browser; no real network faults.
- The local suites test a local build of the commit, with test mode on and a local database. The preview is a separate Vercel build of the same commit, with test mode off and `bloat-test`. Only the hosted checks run against the published build itself.
- AI uses the labelled mock provider; payments are switched off; email delivery is not used on the preview.
- The CI workflow's publishing steps (Vercel build, hosted checks on the new build, moving the addresses) have not run yet: they need the owner's `VERCEL_TOKEN`.
- Light theme only, as the owner confirmed on 22 Nov; no dark theme was added.

