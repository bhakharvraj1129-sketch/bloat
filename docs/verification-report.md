# Verification report

What has been checked, how, and what is still not proven. "Clicked" and "verified" are kept apart:
a control that responded is not counted as working unless its outcome was checked. Local results
(local Supabase in Docker, synthetic accounts, test mode on) and hosted results (the public preview
and `bloat-test`) are kept apart. Rebuild with `python3 scripts/verification-report.py`.

## 1. The control crawl, reconciled

Crawl of the final build on 2026-11-22 13:15 UTC, phone width, signed-out, Free and Pro visitors.
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

`tests/ledger/navigate.spec.ts`, final build, run 2026-11-22 12:57 UTC. Every distinct visible in-app link on every
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

`tests/e2e/mutations.spec.ts`, final build, local. Each action is checked three ways, with a new synthetic account each time:

- **Saves and persists:** the save request succeeds, the intended record changes when read back from the API (or the local
  database for the waitlist), and after a full page refresh the screen still shows it.
- **Failure:** the server is made to fail. The failure message must appear on screen, the form must stay open with what
  was entered, nothing may change, and pressing the same button again must save it.
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

Result: 112 of 112 passed (37 actions x 3, plus 1 rule check).

Before the fix in section 4, on the same checks:
- Delete a meal: a server failure is shown, nothing changes, and the same button then saves: Error: failure message on screen

The other browser tests on the same build: admin.spec.ts 1 of 1, core.spec.ts 11 of 11, email-code.spec.ts 5 of 5, navigation.spec.ts 14 of 14.

Five widths (320, 390, 768, 1024, 1440px): 185 screen and width checks, 0 with sideways scrolling.

## 4. Defects found and fixed in this verification round

Each was reproduced by a test on the build before the fix and passes after it.

| # | Defect | Evidence before | Fix |
|---|---|---|---|
| 1 | Deleting an entry on a day: when the server failed, the confirmation closed and no error was shown, so it looked deleted | `mutations-before-delete-fix.json`: "Delete a meal: a server failure is shown": failure message not found | The confirmation stays open until the server confirms; a failure stays on screen; a lost reply offers "Check save status" (`src/app/(app)/day/[date]/day.tsx`) |
| 2 | Experiments: "Choose" was enabled for a user without the 4 confirmed days the server requires, so "Start today" was always refused (422 "Log normally for a few more days first...") | Server reply captured for a new Pro account: `NOT_ENOUGH_DAYS`, `confirmed_days: 0` while six experiments showed an enabled Choose | "Choose" is disabled until the days are there; the screen already said why (`experiments.tsx`). No rule changed. Test: "experiments cannot be chosen before there are enough confirmed days" |
| 3 | Back from "I'm new here" (and from the offline page's Try again) skipped the Sign in or offline screen and went to the homepage | `navigate-before-back-fix.json`: 8 Back failures | Back only skips the code-entry step, the auth callback and setup (`src/lib/client/nav.ts`); a full page load from another Bloat page keeps the journey (`src/components/nav.tsx`) |
| 4 | Email-code sign-in left the sign-in and code steps in the browser history after signing in, so the phone's Back could return to the code screen | Code review of the success path (`router.push`), the password path already used `replace` | Both email-code success paths now replace the sign-in steps (`sign-in/form.tsx`, `sign-in/code/form.tsx`). The email-code tests pass; this path is not live on the preview (password sign-in is) |

## 5. Important actions still not verified for every outcome

Listed so nothing is assumed. "Server tests" means `tests/api` checks the endpoint's data change and its refusals, not the screen.

| Action | What is verified | What is not |
|---|---|---|
| "Is it still happening?" answers | Server tests | The screen: saving, failure, double tap |
| Delete a bloating record or a bowel record | Same confirmation code as meal and exercise delete (both fully checked) | These two record types were not deleted through the screen |
| Warning signs and symptoms logged with bloating | Saved and shown (core test); they go through the same Save as "Log bloating" (fully checked) | Failure and double tap for the Pro symptom fields specifically |
| Ingredient check: typed dish, photo, marking items, saved dishes (Pro) | Happy path in the core tests with the labelled mock AI; server tests | Failure and double tap on the screen; a real AI provider (not connected) |
| AI agreement in the meal sheet; recall screen saving ingredients | Agreement asked first (tested); double-tap guard in code | Failure and double tap measured on the screen |
| Share a doctor report by link, revoke the link | Hosted Priority 2c: created, opened in a fresh browser, revoked, stops opening; server tests | Failure and double tap on the screen |
| Experiment daily answer, end, add back, wellbeing check, swap safety check | Server tests | The screens |
| Card "Not relevant", Learn "Un-hide", doctor reminder answer, dismissing a suggestion | Server tests (most) | The screens |
| Upgrade: recalled-meals offer answer | Server tests | The screen |
| Delete account | Success and sign-out (navigation test); server tests | Failure and lost-reply recovery on the screen |
| Export JSON and CSV | Complete files and one request on double tap (browser tests) | A failed export on the screen in this round (covered in the 18 Nov round) |
| Founder tools (`/admin`) actions | Staff sign-in with an authenticator code; server tests for the actions | The founder screens' buttons |
| Mock purchase | Local test mode only; hidden on the preview (hosted check) | Not part of the product |

Also observed, not changed: the morning review accepts a day from before the account existed, but such days never count anywhere (the app ignores days before an account's start). Harmless; noted for the owner.

## 6. Hosted preview evidence

- **Sign-up is off at the provider (19 Nov failure, now passing).** Supabase settings report `disable_signup: true`. The hosted check `nobody can create an account` passed on 22 Nov: direct sign-up and email-code sign-up both refused with 422 `signup_disabled`, the old test login answers 404, and no account was created by the attempt (0 rows). The first attempt that day was refused by this workspace's network proxy for `bloat-preview.vercel.app` (403 from the proxy, not the app); the passing run used the branch address, which serves the same deployment.
- **The owner's own login journey (`bloat-tester@bloat.test`), without the password leaving the owner.** The owner signed in on `https://bloat-preview.vercel.app` and reported every step working. Server records confirm it: the account was created in the dashboard at 11:47 UTC (confirmed, password set, one email identity); one successful password sign-in at 12:14:56 UTC and no failed attempts; setup completed (profile, the three required consents and the help-page view saved); session checks succeeded through 12:17; sign-out at 12:17:24 UTC; afterwards 0 sessions and 0 live refresh tokens. The account has the designated Pro test address and no staff access.
- **Signed-in hosted checks** last ran on commit `10cd14e` (19 Nov): 14 of 15 passed, the failure being the sign-up switch now fixed. They were not re-run on the final commit, because that needs new temporary accounts while the previous ones still await deletion (section 7). The code changes since then are covered by the local tests above.

## 7. Temporary test accounts

Correction: destroying the one-off password stopped new password sign-ins only. Sessions already issued stay valid until revoked; on this project they have no expiry (`not_after` empty). On 22 Nov the run's accounts still had **34 live sessions**. Their tokens existed only in the memory of test browsers that have closed; a scan of this workspace's test folders found none saved. The bcrypt hashes of the one-off passwords appear in this session's SQL calls; the passwords were 24 random bytes and are not recoverable from them.

The 19 accounts made for the hosted runs (all marked `synthetic_test_run = 2026-11-19`; together they hold 12 meals, 4 bloating records, 3 reports and 3 share links, none still open, and no stored files):

- `public-1119@bloat.test`, `p1-1119@bloat.test`, `diary-1119@bloat.test`, `isoa-1119@bloat.test`, `isob-1119@bloat.test`, `export-1119@bloat.test`
- `public-1119b@bloat.test`, `p1-1119b@bloat.test`, `diary-1119b@bloat.test`, `isoa-1119b@bloat.test`, `isob-1119b@bloat.test`, `export-1119b@bloat.test`
- `public-1119c@bloat.test`, `p1-1119c@bloat.test`, `diary-1119c@bloat.test`, `isoa-1119c@bloat.test`, `isob-1119c@bloat.test`, `export-1119c@bloat.test`
- `pro-tester@bloat.test`

Deleting them (and with them every row and session they own) needs the owner's approval in the Supabase connector. The request was made on 22 Nov; the approval prompt timed out, as it did twice before. They have not been deleted. No other account is affected: the owner's addresses and `vraj@example.com` are not on this list.

## 8. Which build the dedicated address serves

`https://bloat-preview.vercel.app` is a Vercel project domain tied to the branch `claude/bloat-software-build-uxzoru`. Vercel moves it to the newest deployment of that branch as soon as the build succeeds. It is **not** gated by tests: the repository has no CI workflow, and Vercel does not run the test suites. A build that fails does not replace it. On 22 Nov it served deployment `dpl_5Lkpq9RHC7pzZZJJzrCk2RDYDtou` (commit `4dcd41d`, app code identical to `10cd14e`). The commit for this round's fixes is recorded in TEST_RESULTS.md once deployed.

## 9. Limits of this verification

- No real phones (iOS Safari, Android Chrome); phone behaviour was emulated in Chromium at 412px and 390px.
- No screen reader; accessible names and focus were checked through the accessibility tree.
- 200% browser zoom not tested; text uses rem units so the phone's text-size setting scales it.
- Lost replies and server failures were simulated in the browser; no real network faults.
- AI uses the labelled mock provider; payments are switched off; email delivery is not used on the preview.
- Light theme only, as the owner confirmed on 22 Nov; no dark theme was added.

