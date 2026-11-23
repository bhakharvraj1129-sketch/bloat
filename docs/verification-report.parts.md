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

Still open:

| Action | What is verified | What is not |
|---|---|---|
| Photo ingredient check | The screen path above, with the local mock and with a stored provider answer | A real AI provider reading a real photo. Not connected; it needs your approval of the key and a spending limit. **Pending** |
| Founder tools (`/admin`) | Locally, on the screen: staff sign-in with an authenticator code; Set limit saves and still shows after a refresh; the AI kill switch turns off and back on, each saved and shown; a refused change says "That change was refused." and changes nothing | A double tap sends **two** requests (the buttons are not disabled while saving). Both set the same value, so the saved result is the same, and each is written to the audit log. Noted, not changed. Not tried on the hosted preview (no staff account there, by design) |
| "Is it still happening?" after answering Yes or Not sure | The answer is recorded and the record stays open | Whether the question should come back on the next app open (it does, by design, while the record is open 8 hours or more). Question for the owner, not a defect |
| Mock purchase | Local test mode only; hidden on the preview (hosted check) | Not part of the product |
| Every check in this section on a real phone | Not done | **Pending** (owner checklist in `PROGRESS.md`) |

Also observed, not changed:

- When the export request itself fails with a server error, the message reads "That didn't work. Check your connection and try again." even when the connection is fine. Wording only.
- The recalled-meals offer records "offered" in one database step and the answer (with its duplicate-tap record) in a second. If the first step succeeded and the second failed, trying again would be refused as "already offered". Not seen in any test; noted against the rule that a save and its duplicate-tap record land together.
- The morning review accepts a day from before the account existed, but such days never count anywhere (the app ignores days before an account's start). Harmless.
- Account deletion removes kept meal photos before the account; if that photo removal fails, the account is still deleted and the photos may stay in storage (the removal result is not checked). No test account holds stored files.

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

## 9. Which build the addresses serve, and what publishes it

**Served now (23 Nov, from 10:01 UTC):** `https://bloat-preview.vercel.app` and the branch address serve deployment `dpl_E8w2BwFqLPuj59xLtcptnRVWT1fB` (`bloat-dhi38m7bd-typeshi2.vercel.app`), built by GitHub run 10 from commit `7713098`, which adds the S1 to S3 fix (section 4). Tied together the same way as for run 6 below: the run started on the push of `7713098` and reports that commit; its hosted-check step tested exactly `https://bloat-dhi38m7bd-typeshi2.vercel.app`; its publish step confirmed through the Vercel API that `bloat-preview.vercel.app` serves that build; Vercel lists 207 of the deployment's source files (its listing is partial) and all 207 are byte-identical to `7713098`, including `src/components/doctorline.tsx` and `src/components/today/pro.tsx`, which differ from the previous build; Vercel reports both addresses on it, and it is the only deployment made since run 9. Before that: `dpl_59A4HADi2dEAD26ivcfdoXVWPf9K` from run 9 (`0d537d2`, B1 to B4 fixes), then `dpl_GYCc4U8LgKQJWhKBizXioK2fw2FQ` from run 6 (`adfe49b`, 22 Nov), then `af950f5` (`dpl_FDVnqFxAx4MHaGhq9g9HLiim7Tzj`), the last build made by Vercel's own Git builds.

**Tested revision = deployed revision, and how that is known:**

- Run 6 was started by hand (`workflow_dispatch`) on the branch after confirming its head was `adfe49b803f88c8300a01afe27cca8bb7ff449d4`; GitHub reports that exact commit for the run, and each job checks out the run's commit.
- The run's Vercel build is the only deployment made since `af950f5` (Vercel's list), and the run's hosted-check step records the URL it tested: `https://bloat-1gx9xzdwr-typeshi2.vercel.app`.
- Source files: Vercel listed 205 of the deployment's files (its listing is partial); all 205 are byte-identical to `adfe49b` (SHA-1 of content). The `tests/hosted` folder was listed in full and holds exactly `adfe49b`'s five files, not the script added later in `b755b1b`.
- The run's own last step compared the build with what `bloat-preview.vercel.app` serves, through the Vercel API, and passed.
- Not available: the commit label the workflow attaches to the deployment does not show in the Vercel tool used here, so it was not used as evidence.

**The publishing gate (from commit `4640ac2`):**

- `vercel.json` switches off Vercel's automatic Git builds. Checked: no Git-triggered deployment for any push since `af950f5`; the only deployments since are the three the workflow made (runs 6, 9 and 10).
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

## 10. Limits of this verification

- No real phones (iOS Safari, Android Chrome); phone behaviour was emulated in Chromium at 412px and 390px. The owner's checklist in `PROGRESS.md` covers the main journeys on a real phone.
- No screen reader; accessible names and focus were checked through the accessibility tree.
- 200% browser zoom not tested; text uses rem units so the phone's text-size setting scales it.
- Lost replies and server failures were simulated in the browser; no real network faults.
- The local suites test a local build of the commit, with test mode on and a local database. The preview is a separate Vercel build of the same commit, with test mode off and `bloat-test`. Only the hosted checks run against the published build itself.
- AI uses the labelled mock provider; payments are switched off; email delivery is not used on the preview. The photo check's "items seen in the photo" path was checked with a stored provider answer that the app's own server replays; no real AI read a real photo. A real-provider evaluation is pending your approval of a key and a spending limit.
- The three save messages fixed on 23 Nov (S1 to S3) were checked locally and by the gate on the deployed commit, not on the live preview: showing them there needs several days of back-dated records, which the preview cannot create without editing the database by hand.
- Light theme only, as the owner confirmed on 22 Nov; no dark theme was added.
