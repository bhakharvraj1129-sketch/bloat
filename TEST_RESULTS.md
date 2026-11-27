# Test results

Last run: 27 Nov 2026 (design v2, "Bloat Buddy", commit `3120a26`, published by run 20 as `dpl_7DidTdSjyyaiPWeW52ER3docj8dm`). Before that: the first invited acceptance round, commit `35c947b`. The newest results are first; older sections follow. Local, CI and hosted results are kept apart below. Synthetic accounts and mock billing everywhere; labelled mock AI in local tests only (the candidate has AI off).

Each result is one of: **passed** (it ran and the outcome was right), **expected failure** (marked to fail until a known defect is fixed; never counted as passed), **skipped** (did not run), **failed**, or **not performed** (nobody has run it).

## Design v2, "Bloat Buddy" (27 Nov 2026): run 20, deployment `dpl_7DidTdSjyyaiPWeW52ER3docj8dm`

Published revision `3120a2643f88a23c529418aeed466f5337ab2c8b` on `https://bloat-preview.vercel.app` and the branch address (12:36 UTC). Preview variables unchanged (the round's settings). The three main addresses still serve `dpl_DoAEN2q7gxKTrfvL9pZw1nGGEekn` (`83fe4da`).

| Check | Passed | Failed | Notes |
|---|---|---|---|
| GitHub run 20, from its log | Typecheck, lint; rule tests; API tests; browser 278 (3 skipped); the account-free live checks before and after publishing | 0 | Clean checkout, one normal server. **Skipped there, not passed:** the round's 10 API and 3 browser checks (run locally against the second server, below) |
| Tested = deployed | | | Both preview addresses on `dpl_7DidTdSjyyaiPWeW52ER3docj8dm`; all 220 repository files Vercel lists are byte-identical to `3120a26` (SHA-1 of contents), 69 of the 96 files changed since `895a05a` among them; Vercel lists 493 of 667 files, so the rest could not be compared |
| Core hosted suite (`navigation`, `preview`, `signed-in-journey`, `signed-in-navigation`), 16 checks | 16 | 0 | 8 fresh disposable accounts marked `synthetic_test_run = 2026-11-27-run20` |
| `tests/hosted/beta-candidate.spec.ts`, 4 checks | 4 | 0 | The round's settings live: saves say what was saved, Pro test access, experiments not offered, AI and Learn not offered |
| Live screenshots (signed out, and a disposable Pro account in light and dark) | | | Start page shows "Invite-only test" and Sign in; Today shows the new layout and no Experiments shortcut |
| Cleanup: the 8 accounts deleted through the app | 8 | 0 | Each answered "deleted"; the same sign-in was refused (401) straight after; the one-off password file destroyed |
| Read-only check of `bloat-test` after the cleanup | | | 0 accounts by ID or address, 0 with a test-run marker, 0 identities, sessions or refresh tokens, 0 rows for them in all 48 tables with a user column, 0 stored files; `bloat-tester` unchanged (1 meal, 1 bloating record, 2 readings, 1 report, same sign-in times and password hash); the 5 participant accounts unchanged by the checks (same IDs, sign-in and update times before and after) |

**Not performed:** real phones and screen readers (browser emulation only).

### Local results

The owner's redesign (DECISIONS.md choice 31): new name, logo, colour, light and dark themes, start page, bottom bar with a log button, Today, and the Patterns card before anything is compared. Local stack, synthetic accounts only, the normal server on port 3100 and a second server on port 3200 with this round's settings (`BLOAT_AI_PROVIDER=off`, `BLOAT_OFF_FEATURES=learn_library,daily_cards,experiments_habit,experiments_swap`).

| Suite | Result |
|---|---|
| Type check and lint | Passed (lint: 0 errors, 5 warnings, all present before) |
| Rule tests | 107 passed |
| API tests (normal server) | 160 passed, 10 skipped (the round's checks, which need the second server). New: `tests/api/redesign.test.ts`, 3 passed (the week list is Monday first, sends no score and fills in a day only once something is logged, "No bloating so far today" included; Patterns sends real confirmed-day counts to Pro and nothing to Free) |
| API, the round's checks (`acceptance-round.test.ts`, second server) | 10 passed |
| Browser tests on a phone screen (normal server) | 277 passed, 3 skipped (the round's checks), 1 failed: the 200% zoom check counted screen-reader-only text (the week strip's day names and the log button's name, clipped to 1px on purpose) as "text cut off". The check now skips only text that is screen-reader-only by design; re-run: 9 of 9 passed in that file |
| Browser, the round's checks (`acceptance-round.spec.ts`, second server) | 3 passed |

Tests changed with the layout, none removed or loosened: the start page check looks for the "Patterns in your records" card instead of the old Free/Pro table row; the bottom bar lists Today, History, Log bloating, Patterns, You; Today is found by its "How are you feeling?" heading; T3 now checks that nothing (no figure, no "?") is shown before anything is logged and that "0 out of 10" is read and shown after "No bloating so far today". The phone layout test now checks text contrast on every filled button and link in **both** themes (12 screen visits instead of 6) and the two theme colours. New browser checks: the log button from another screen (opens Log bloating, then Bloating now once one is open; the address goes back to `/today`), the week strip, "It's gone", the Appearance switch (applies at once, kept after a reload, cleared by "Same as device") and the Patterns progress card with the folded list.

**Not performed:** real phones and screen readers (browser emulation only), and the hosted checks, which follow the publishing run.

## Participant accounts (27 Nov 2026): run 19, deployment `dpl_2QsTiDKAVFB4NaQr99RVjTtAGdvt`

Run 19 was started by hand on the publishing branch to apply the extended Pro test list. It built `9cb6ee3` (app code identical to the accepted `35c947b`) and passed every step: typecheck, lint, rule, API and browser tests on a clean checkout (the round's server-specific checks skipped there, as in run 18), the 6 signed-out live checks before and after publishing. All 221 repository files Vercel lists for the deployment (86 app files among them) are byte-identical to `9cb6ee3`.

| Check, on the live site | Result |
|---|---|
| Each of the 5 participant addresses checked before creating anything | None existed; all 5 created (confirmed, one identity each, marked as participants) |
| Each participant account: sign in once with its temporary password | 5 of 5 signed in |
| `/v1/me/state` | 5 of 5: plan Pro; not yet set up (`onboarded: false`, as intended: testers set up their own account and give their own consents) |
| Experiments, Learn, daily cards, the AI recalled-meals offer | 5 of 5: each answered 404 "not available" |
| Sign out, then the same sign-in again | 5 of 5 signed out; refused afterwards (401) |
| Read-only check of `bloat-test` afterwards | 0 open sessions and 0 live refresh tokens for the participants; no profile, entitlement or consent rows (nothing written by the check); 9 users (4 earlier, 5 participants); 0 test-run accounts; `bloat-tester` unchanged |

The check set each participant account's "last sign-in" time. No password or token was printed.

## First invited acceptance round (27 Nov 2026): commit `35c947b`

The owner's decisions: experiments off, Pro test access without payment, made-up data only. Changes: experiments switched off on every screen and route (choice 29), the Pro page's wording for Pro given for testing (A1, Pro page), and no "save your usual dishes" suggestion while AI is off (choice 30). Synthetic `@example.com` accounts on the local stack.

**Where each beta-specific check ran.** The round's checks were run locally and live; in CI they were skipped. They are not CI passes.

| Check | Local | CI (GitHub run 18, from its log) | Live (deployed candidate) |
|---|---|---|---|
| `tests/api/acceptance-round.test.ts` (10 checks) | Passed 10 of 10 against a second local server with the round's settings (7 failed on `da4bb77`) | **Skipped** (log: "10 tests, 10 skipped"): CI runs one normal server | Not run: these call the local stack |
| `tests/e2e/acceptance-round.spec.ts` (3 checks) | Passed 3 of 3 against the second local server (2 failed on `da4bb77`) | **Skipped** (log: "3 skipped") | Not run |
| `tests/hosted/beta-candidate.spec.ts` (4 checks) | Passed 4 of 4 against a local server with password sign-in and the round's settings | **Not part of CI** (CI runs only the 6 signed-out live checks) | Passed 4 of 4, run from this session with synthetic accounts |
| Core signed-in hosted suite (16 checks) | | **Not part of CI** | Passed 16 of 16, run from this session |
| Rule tests for the switches and the dish suggestion (`tests/unit/beta.test.ts`), and `tests/e2e/beta.spec.ts` (switched-off screens with the state answer changed in the browser; A1 and its Pro page) | Passed | Passed, within rule 107, browser 274 (they need no special server) | |

### Hosted, signed in (the deployed candidate, run 18)

Published revision `35c947bb1dc0c059a57e16db25a9f2221c3affb0`, Vercel deployment `dpl_LxVJ6VzoY4iswtpfhy78kN3B76jj` (made 27 Nov 06:56 UTC), on `https://bloat-preview.vercel.app` and the branch address. Preview variables: `BLOAT_AI_PROVIDER=off`, `BLOAT_OFF_FEATURES=learn_library,daily_cards,experiments_habit,experiments_swap`, `BLOAT_TEST_LOGIN=0`, `BLOAT_BILLING_PROVIDER=mock`. The three main addresses still serve `83fe4da`. 8 synthetic accounts made for the run (`@bloat.test`, marked `synthetic_test_run = 2026-11-27`, one password kept in a private file and never printed; the file was destroyed after the cleanup). Made-up entries only; `bloat-tester` not used.

| Check | Passed | Failed | Notes |
|---|---|---|---|
| GitHub run 18 (first attempt), from its log | Typecheck, lint; rule 107; API 157; browser 274; the 6 signed-out live checks before and after publishing | 0 | Clean checkout, one normal server. **Skipped there, not passed:** the round's 10 API checks and 3 browser checks. The signed-in hosted files are not part of CI. Controls read back; Vercel build; publish 06:58 UTC |
| Tested = deployed | | | Both preview addresses on `dpl_LxVJ6VzoY4iswtpfhy78kN3B76jj`; all 220 repository files Vercel lists are byte-identical to `35c947b` (SHA-1 of contents), 23 of the 29 changed files among them; the other 6 sit in folders Vercel lists only partly |
| Core hosted suite (`navigation`, `preview`, `signed-in-journey`, `signed-in-navigation`), 16 checks | 16 | 0 | |
| `tests/hosted/beta-candidate.spec.ts`, 4 checks | 4 | 0 | First attempt. Check 4 is new: Pro test access says there is no subscription (You and the Pro page; entitlement status "none"); experiment routes and an experiment answer in a review refused ("not available"); no link to experiments on Today, History, Possible triggers or Your journey; a direct visit says Not available; no "save your usual dishes" suggestion; Possible triggers, Your journey, History, health background, bowel and exercise logs, Keep an eye on it and the doctor report work; the start page lists neither experiments nor the ingredient check |
| Cleanup: the 8 accounts deleted through the app | 8 | 0 | Each answered "deleted"; the same sign-in was refused (401) straight after |
| Read-only check of `bloat-test` after the cleanup | | | 0 accounts by ID or address, 0 with a test-run marker, 0 identities, sessions or refresh tokens, 0 profiles, meals, bloating, bowel or exercise records, reports, share links, medicines, habit answers or photo rows for them; photo bucket empty; 4 users in all, as before. Experiment tables: 0 rows before the switch and after. `bloat-tester` unchanged: 1 meal, 1 bloating record, 2 strength readings, 1 report, 0 share links, last updated 23 Nov 06:25 UTC, last sign-in 23 Nov 04:23 UTC, same password hash |

**Not performed** (not counted above): real phones; any screen reader; a real AI provider; a backup restore; a tester's own first sign-in (nobody is invited).

### Local: before and after the fix

The round's checks need a server started with the round's settings, so two local servers ran from the same build and database: the normal one (port 3100, nothing switched off) and one with `BLOAT_AI_PROVIDER=off BLOAT_OFF_FEATURES=learn_library,daily_cards,experiments_habit,experiments_swap` (port 3200). The published code `da4bb77` ran the same way on port 3300 for the "before" runs.

| Check | Code | Passed | Failed |
|---|---|---|---|
| `tests/api/acceptance-round.test.ts` (10 checks; an account with a running experiment and typed meals, another with habit records) | Published `da4bb77`, round's settings | 3 (the settings are in place; every experiment route already refused; the other Pro features work) | 7, each at the defect: Today showed the running experiment "No straws"; the review accepted an experiment answer (200, and saved it for 10 Sep); Possible triggers offered "Eat more slowly"; Your journey said "A short experiment can test one pattern at a time."; the weekly report said the experiment was running; Today suggested `save_dishes`; the export then held the extra experiment day |
| The same 10 checks | Fixed, round's settings | 10 | 0 |
| `tests/e2e/acceptance-round.spec.ts` (3 checks, phone-sized browser) | Published `da4bb77`, round's settings | 1 (the other Pro screens open) | 2: a link to `/experiments` on Today; "Habit and food-swap experiments" on the Pro page |
| The same 3 checks | Fixed, round's settings | 3 | 0 |
| A1, Pro page (`tests/e2e/beta.spec.ts`) | Published `da4bb77` | 0 | 1 ("Switched on for testing. There is no subscription, so nothing renews and nothing is charged." not shown on `/upgrade`) |
| The same check | Fixed | 1 | 0 |
| Rule tests (102 before, plus 3 for experiments and 2 for the dish suggestion) | Fixed | 107 | 0 |
| API tests, all files, normal server | Fixed | 157 (10 skipped: the round's checks, which ran against the second server, above) | 0 |
| Browser tests, all files, normal server | Fixed | 274 (3 skipped: the round's checks, above) | 0 |
| The hosted file `tests/hosted/beta-candidate.spec.ts` (4 checks, including the new round check), against a local server with password sign-in and the round's settings | Fixed | 4 | 0 |
| Type check, lint | Fixed | 0 errors (the same 5 old warnings) | |

**On the way (test-side, not app defects):** the first "before" run had two checks that looked at a new field before the real behaviour, and a weekly report asked for an unfinished week; they were reordered and corrected, and the "before" run repeated. The export link in the new API check was first made on the test clock and had expired on the real clock; it is now made on the real clock. In the review walkthrough, the seed accounts were first set up on the real clock with records dated before they existed (an account never shows earlier days), and some seed days had a score lower than a logged reading (the app rightly asked for a correction); both were seed mistakes and were redone.

### Review of the Pro features this round keeps (local, round's settings, phone-sized browser)

Two made-up Pro accounts with 15 days of records on the test clock: one in normal logging (typed meals, two followed habits), one in Keep an eye on it mode (two watched food groups). Screens: Today, Possible triggers, Your journey, the weekly report, the doctor report and its preview, You, Health background, History, a day, the Pro page, the meal sheet. No console errors and no failed requests. Found: the "save your usual dishes" suggestion (fixed, above) and the food-groups gap (D30, not a defect): in normal logging "Ate quickly" became worth watching and every food group stayed at "No usable days yet"; in Keep an eye on it mode "Fizzy drinks" became worth watching.

## Invited beta candidate (27 Nov 2026): published build `da4bb77` (run 17), checked signed in on the hosted preview

Published revision `da4bb7752524758acc8447b9cd96b4910febcc64`, Vercel deployment `dpl_DMcN8fjTd9f99QHXjxA5Rc7uerhR` (made 27 Nov 03:56 UTC), served at `https://bloat-preview.vercel.app` and the branch address. Preview variables for this build: `BLOAT_AI_PROVIDER=off`, `BLOAT_OFF_FEATURES=learn_library,daily_cards`, `BLOAT_TEST_LOGIN=0`, `BLOAT_BILLING_PROVIDER=mock`. The three main addresses still serve `83fe4da`.

### Hosted, signed in (the deployed candidate, 27 Nov)

8 synthetic accounts made for the run in `bloat-test` (addresses ending `@bloat.test`, marked as test-run accounts, one password kept in a private file and never printed; the file was destroyed after the cleanup). Made-up entries only. `bloat-tester` was not used.

| Check | Passed | Failed | Notes |
|---|---|---|---|
| Core hosted suite (`navigation`, `preview`, `signed-in-journey`, `signed-in-navigation`), 16 checks | 16 | 0 | Includes signed-out access, sign-ups off, two accounts unable to see each other's records, the doctor report with sections left out, its share link, exports, Back and sheets |
| Beta check 1 (Free): "Bloating saved.", "Meal saved." and "Activity saved." lines; the empty-time hint with Save off; a habit deleted from the day screen stays deleted after a refresh and is not stored as No; no ingredient check or photo offered; Learn and the AI routes answer "not available" | 1 | 0 | First run |
| Beta check 2 (Free): change the temporary password (a too-short one is refused with "Use at least 10 characters."), the old password then fails, the new one signs in; the sign-in screen's "Forgot your password?" line | 1 (re-run) | 1 (first run) | **First run failed in the test itself**: it looked the first field up by its label, which also contains the field's hint, and timed out. The test now finds the two fields in order; nothing in the app changed. The re-run passed, and put the run's password back so the account could be deleted like the others |
| Beta check 3 (Pro test account): no ingredient check, photo or daily card; three reports shared; deleting yesterday's bloating record revokes the link of the report covering it, which a signed-out visitor then cannot open ("This link no longer works"), while a report not covering that day still opens; that flagged report cannot be shared again (409); correcting another day's time revokes the other report; deleting a medicine revokes a shared doctor report | 1 (re-run) | 0 | Did not run in the first attempt (the checks run in order and stop after a failure); passed in the re-run |
| Cleanup: the 8 accounts deleted through the app (You, Delete account, the same request) | 8 | 0 | Each answered "deleted"; the same sign-in was refused (401) straight after |
| Read-only check of `bloat-test` after the cleanup | | | 0 accounts by ID or address, 0 with a test-run marker, 0 sign-in identities, sessions or refresh tokens, 0 profiles, meals, bloating records, reports, share links, medicines, habit answers or photo rows for them; the photo bucket is empty. `bloat-tester` unchanged: 1 meal, 1 bloating record, 2 strength readings, 1 report, 0 share links, last updated 23 Nov 06:25 UTC, last sign-in 23 Nov 04:23 UTC |

### CI and publishing (run 17)

| Check | Where | Result |
|---|---|---|
| GitHub run 17 (first attempt) | CI and live | **All passed**: typecheck, lint, rule, API and browser tests on a clean checkout; controls read back; Vercel build; the 6 signed-out live checks on the new build, then publish, then the same 6 on the public address (finished 03:59 UTC) |
| Tested = deployed | Vercel | Both preview addresses on `dpl_DMcN8fjTd9f99QHXjxA5Rc7uerhR`; all 216 repository files Vercel lists for it are byte-identical to `da4bb77` (SHA-1 of contents). 26 of the 37 changed files are among them; the other 11 (the You and Pro screens and nine routes) sit in folders Vercel lists only partly, so they were not compared one by one |

### Local (synthetic `@example.com` accounts)

| Check | Code | Passed | Failed |
|---|---|---|---|
| New R2 checks in `tests/api/report-staleness.test.ts` (1 control, 6 kinds of change), with the 8 R1 checks | Before the fix (`0ffc99a`) | 9 (the R2 control and the 8 R1 checks) | 6, each at the defect (medicine deleted, test deleted, health background changed, lactose details changed, family history changed, context answers changed) |
| The same 15 checks | Fixed | 15 | 0 |
| New X1 check `tests/api/export-complete.test.ts` | Before the fix (the server running `0ffc99a`) | 0 | 1 (old version label `bloat-export-1`; the file also lacked the four tables, seen directly in the old server's export) |
| The same check | Fixed | 1 | 0 |
| A1 server check (Pause refused without a subscription, no billing record written), in `tests/api/slice-ef.test.ts` | Before the fix | 0 | 1 ("expected 200 to be 409") |
| The same check | Fixed | 1 | 0 |
| New browser checks `tests/e2e/beta.spec.ts` (AI off for Pro and for Free, Learn and cards off, a control with nothing off, A1 on You) | Before the fix (`0ffc99a`), final version of the checks | 1 (the control) | 4 |
| The same 5 checks | Fixed | 5 | 0 |
| Rule tests (97 before, plus 5 for the switch rule and the password messages) | Fixed | 102 | 0 |
| API tests, all files | Fixed | 157 | 0 |
| Browser tests, all files | Fixed | 272 in the full run, plus 1 re-run alone | 1 in the full run (below) |
| Type check, lint | Fixed | 0 errors (the same 5 old warnings) | |

**On the way:** (1) In the full browser run, the existing export check in `core.spec.ts` failed because it expected the old version label `bloat-export-1`; it was updated to `bloat-export-2` (the change X1 made on purpose) and passed when run again alone; CI then ran the whole suite on a clean checkout and passed. (2) A first version of the beta absence checks also passed on the old code, because it looked before the screen had loaded. The checks now wait for the loaded content first; on the old code they then failed 4 of 5, as they should. (3) Two checks left a page while a closing sheet was still undoing its history entry, which aborted the next navigation; they now wait for the sheet to close.

**Not performed** (not counted above): real phones; any screen reader; a real AI provider; a backup restore; on the hosted preview, the R2 cases other than a deleted medicine, and X1 and A1 (local and CI only).

## History and editing review (26 Nov 2026): local only, not published

*(Later on 26 Nov, with the owner's yes, published by run 16 as `0ffc99a`, deployment `dpl_CoBNVMnW9ivkcLvNRuKc3PML3eks`, finished 20:18 UTC; all 212 repository files Vercel lists for it are byte-identical to `0ffc99a`. Its fixes were checked signed in on the hosted preview on 27 Nov, in build `da4bb77`, above.)*

Fixes R1 (every delete or correction flags the stored reports that used it and revokes their share links) and H1 (habit answers can be deleted), commit `0ffc99a` on `claude/bloat-continuation-9mjd46`. Local stack, synthetic `@example.com` accounts only. Not published: the push to the publishing branch was held back because the owner's yes covered the Today fixes only.

| Check | Where | Passed | Expected failure | Skipped | Failed |
|---|---|---|---|---|---|
| New R1 API checks `tests/api/report-staleness.test.ts` (1 control, 7 kinds of change) | Local, code before the fix (`8ef62e7`) | 1 (the control) | 0 | 0 | 7, each at "report flagged: expected false to be true" (bloating time corrected, bloating deleted, bowel deleted, exercise deleted, habit removed, review changed, meal moved onto a reported day) |
| The same 8 checks | Local, fixed code | 8 | 0 | 0 | 0 |
| New H1 browser check `tests/e2e/history.spec.ts` | Local, code before the fix | 0 | 0 | 0 | 1 (no Delete on a habit) |
| The same check | Local, fixed code | 1 | 0 | 0 | 0 |
| Rule tests | Local, fixed code | 97 | 0 | 0 | 0 |
| API tests, all files | Local, fixed code | 149 | 0 | 0 | 0 |
| Browser tests, all files | Local, fixed code | 268 | 0 | 0 | 0 |
| Type check, lint | Local, fixed code | 0 errors (5 old warnings) | | | |

**On the way:** the first full API run on the fixed code had 1 failure: the weekly-report test labelled Q40 expected a week's report to be reused after a review in that week was changed. Under the plan's rule (B05) a changed review is a correction, so the stored week is now flagged (its snapshot kept exactly as stored) and the next request makes a new one; deleting a meal already worked that way. The test was made stricter, not looser: it still checks that asking again with nothing changed reuses the same snapshot, and now also checks that the stored snapshot is unchanged and flagged after a correction. This choice is recorded in `DECISIONS.md`, choice 25, and can be reversed.

**Not performed:** anything on the hosted preview (not published).

## Today fixes (26 Nov 2026): published build `8ef62e7` (run 15)

Published revision `8ef62e71c97310ac0ac332fad3287ee0f95a5e22`, Vercel deployment `dpl_EZyj38upABHtKaQidLokQB4n6cxo` (made 17:39 UTC), served at `https://bloat-preview.vercel.app` and the branch address. The three main addresses still serve `83fe4da` (`dpl_DoAEN2q7gxKTrfvL9pZw1nGGEekn`).

| Check | Where | Result |
|---|---|---|
| GitHub run 15, first attempt | CI | **Stopped before any app test**: typecheck, lint and rule tests passed, then "Start the local Supabase stack" failed because GitHub's machine already had port 54324 in use (`failed to bind host port 0.0.0.0:54324/tcp: address already in use`). Nothing was built on Vercel or published |
| GitHub run 15, re-run of the failed job (same commit) | CI and live | **All passed**: typecheck, lint, rule, API and browser tests on a clean checkout; controls read back; Vercel build; the 6 signed-out live checks on the new build, then publish, then the same 6 on the public address (finished 17:42 UTC) |
| Tested = deployed | Vercel | Both preview addresses on `dpl_EZyj38upABHtKaQidLokQB4n6cxo`; all 211 repository files Vercel lists for it are byte-identical to `8ef62e7` (SHA-1 of contents), including 5 of the 7 changed files and the new checks. The Today screen and the day screen sit in folders Vercel lists only partly, so they were not compared one by one |
| `bloat-tester` read-only check after run 15 | `bloat-test` | Exists; 1 meal (the 23 Nov QA meal), 1 bloating record, 1 report; no account with a test-run marker |

**Not performed** (not counted above): the signed-in hosted suite on `8ef62e7` (needs accounts the owner approves); real phones; any screen reader.

## Today and logging review (26 Nov 2026): local results

New session, new Claude account. At the start the preview served `f8fcd9d` (`dpl_7N1RRQjq8qFDNmw9x3ihfcxk9iBD`). Local stack in Docker, synthetic `@example.com` accounts only. The fixes are commit `8ef62e7`, published later the same day (above).

| Check | Where | Passed | Expected failure | Skipped | Failed |
|---|---|---|---|---|---|
| Rule tests | Local, `f8fcd9d` (current preview code, fresh session) | 97 | 0 | 0 | 0 |
| API tests | Local, `f8fcd9d` | 141 | 0 | 0 | 0 |
| Browser tests (phone screen, plus keyboard and 200% zoom) | Local, `f8fcd9d` | 261 | 0 | 0 | 0 |
| New Today checks `tests/e2e/today.spec.ts` (T1 to T4, 6 checks), final version | Local, `f8fcd9d` app code (before the fixes) | 0 | 0 | 0 | 6, each at the defect: no "Bloating saved." line; no "Bowel movement saved." line; focus not on I feel bloated after "No bloating so far today"; focus not on Open experiment after an answer; focus on the page body after "Not useful"; no hint and Save still on with an empty time |
| T3 on the old code, by a separate walkthrough | Local, `f8fcd9d` | | | | After "No bloating so far today" the score showed "0 / 10" and its spoken name was "Nothing logged yet" |
| The same 6 checks | Local, fixed code | 6 | 0 | 0 | 0 |
| Rule tests | Local, fixed code | 97 | 0 | 0 | 0 |
| API tests | Local, fixed code | 141 | 0 | 0 | 0 |
| Browser tests, all files (the 261 before, plus the 6 new) | Local, fixed code | 267 (none retried) | 0 | 0 | 0 |
| Type check, lint | Local, fixed code | 0 errors (the same 5 old warnings) | | | |

**On the way:** the first version of the score fix put the spoken text in visually hidden text; the existing 200% zoom check counted that as cut-off text (1 failed, 266 passed). The score now has one spoken name instead (an image role with a label), with no hidden text, and the zoom check was not changed.

**Not performed** (not counted above): real phones; any screen reader; the signed-in hosted suite.

## P2 fix (24 Nov 2026): published build `f8fcd9d`, frozen again

Published revision `f8fcd9d4045ddf456d38bfd2e35283ec05d86f0d`, Vercel deployment `dpl_7N1RRQjq8qFDNmw9x3ihfcxk9iBD`, served at `https://bloat-preview.vercel.app` and the branch address (GitHub run 14). The fix: after a failed account deletion the sheet said "Nothing was deleted", though kept photos removed before the failure stay removed (formerly decision D20). The three main addresses still serve `83fe4da`.

| Check | Where | Passed | Expected failure | Skipped | Failed |
|---|---|---|---|---|---|
| Updated deletion checks: API storage down, API partial removal, screen storage down, screen partial removal, screen general server failure | Local, build before the fix (`9c6ed14`) | 0 | 0 | 0 | 5 (the old wording; the partial screen case failed exactly at the new sentence) |
| The same checks | Local, `f8fcd9d` | 5 (plus the 2 unchanged deletion API checks) | 0 | 0 | 0 |
| Rule tests | Local, `f8fcd9d` | 97 | 0 | 0 | 0 |
| API tests | Local, `f8fcd9d` | 141 | 0 | 0 | 0 |
| Browser tests (phone screen, plus keyboard and 200% zoom) | Local, `f8fcd9d` | 261 (none retried) | 0 | 0 | 0 |
| Type check, lint | Local | 0 errors (5 old warnings) | | | |
| GitHub run 14: all checks on a clean checkout, controls read back, Vercel build, 6 live checks before and after publishing | CI and live | all | 0 | 0 | 0 |
| Tested = deployed: both preview addresses on `dpl_7N1RRQjq8qFDNmw9x3ihfcxk9iBD`; 210 of 210 listed source files byte-identical to `f8fcd9d`; the changed route and screen found in it by content fingerprint | Vercel | yes | | | |
| `bloat-tester` fingerprint before and after run 14 | `bloat-test` | identical | | | |

**Not performed** (not counted above): the signed-in hosted suite on `f8fcd9d` (16 of 16 passed on `9c6ed14`, which differs only in this message); the new message on the live preview (it needs a storage failure); real phones; any screen reader; everything else listed under the K1 section below.

What each case shows now: storage down or partial removal (503), or a failure after the photos are gone (500): "We couldn't finish deleting your account. Your account and diary are still available, but some saved meal photos may already have been deleted. Try again to finish." A refusal before anything is removed (below 500): "That didn't work. Nothing was deleted. Try again." A lost reply: unchanged ("Connection lost..." with "Check and finish"). Inexact either way: a time-out reported by Vercel itself, with no answer from the app.

## K1 fix (24 Nov 2026): published build `9c6ed14`, frozen again

Published revision `9c6ed1428320a6ea316f7ed5d2efdf8d32f64d4f`, Vercel deployment `dpl_55jDsCf3AbLK5mYRCEBEnKqtN9Jc`, served at `https://bloat-preview.vercel.app` and the branch address (GitHub run 13). The three main addresses still serve `dpl_DoAEN2q7gxKTrfvL9pZw1nGGEekn` (`83fe4da`, without this fix); the workflow does not move them.

| Check | Where | Passed | Expected failure | Skipped | Failed |
|---|---|---|---|---|---|
| Focus after a save removes the opening button (5 checks: Log bloating, ending bloating, deleting one of two meals, deleting the only bloating record, normal return kept and focus never taken back), each case followed by one Tab | Local, frozen code `83fe4da` (before the fix) | 1 | 0 | 0 | 4 (defect shown: focus on the page body) |
| Same 5 checks, now ordinary checks | Local, fixed code `9c6ed14` | 5 | 0 | 0 | 0 |
| Rule tests | Local, `9c6ed14` | 97 | 0 | 0 | 0 |
| API tests | Local, `9c6ed14` | 141 | 0 | 0 | 0 |
| Browser tests (phone screen, plus keyboard and 200% zoom) | Local, `9c6ed14` | 260 (none retried) | 0 | 0 | 0 |
| Type check, lint | Local | 0 errors (5 old warnings) | | | |
| GitHub run 13: all checks on a clean checkout (browser 260 passed), controls read back, Vercel build, 6 live checks before and after publishing | CI | all | 0 | 0 | 0 |
| Tested = deployed: both preview addresses on `dpl_55jDsCf3AbLK5mYRCEBEnKqtN9Jc`; 210 of 210 listed source files byte-identical to `9c6ed14` | Vercel | yes | | | |
| Full hosted suite, 7 fresh accounts marked `2026-11-24` | Live | 16 | 0 | 0 | 0 |
| Keyboard focus after the four sheet saves, and the next Tab from each, own account | Live | 1 | 0 | 0 | 0 |
| 8 accounts deleted through the app, then read-only checks | Live, `bloat-test` | 0 rows anywhere, no marked accounts, photo bucket empty; `bloat-tester` identical before and after | | | |

**Not performed** (not counted above): real phones; any screen reader; a real AI provider; founder tools on the preview; the 3 history-dependent screens on the preview; storage and recalled-offer failures on the preview (local only); the control crawl, link-by-link run and five-width check on the final code; any check on the three main addresses after 23 Nov.

**About account deletion when storage fails:** the account and diary are not deleted and the person can try again, but kept photos removed before the failure stay removed (local partial-removal check). At the time the message said "Nothing was deleted", which was wrong in that case; fixed later the same day (P2, above).

## During the freeze (23 Nov 2026): local checks on the frozen code `83fe4da`

Nothing was published then; the preview served `dpl_DoAEN2q7gxKTrfvL9pZw1nGGEekn`. Local stack, synthetic disposable accounts, local fault injection (temporary database triggers). `bloat-tester` was not used.

| Check | Result |
|---|---|
| Account deletion with kept photos: no failure; storage failing then recovering; failure clearing during the automatic retries; **partial removal** (storage removes 2 of 3 photos and silently keeps one) | **4 of 4 passed**. Partial removal: the route notices the photo left behind and does not delete the account; the account and diary stay, but the 2 photos already removed stay removed, although the screen says "Nothing was deleted" (decision D20); it alerts the founder (`files_left: 1`), and the retry removes the last photo and the account |
| Recalled-meals offer: the database refuses the answer, then (second check) the duplicate-tap record | **2 of 2 passed**: everything rolled back (offer not used up, no answer, no record); the same request then saves exactly once and a repeat writes nothing |
| Keyboard only (Tab, Shift+Tab, Enter, Space, Escape): sign in, log bloating, Escape, add, edit and delete a meal, units, export, sign out; desktop at 100% and at 200% zoom; both sign-in modes | **Passed**. Visible focus ring on every checked control; focus returns after Escape and after adding or editing a meal |
| Focus after a save that removes the opening button | **Failed: defect K1** (saving Log bloating, ending bloating, confirming Delete for a meal or a bloating record). Recorded as an expected-to-fail check; not fixed while frozen (fixed on 24 Nov, above) |
| 200% browser zoom (1280 x 800 window), 11 main screens | **Passed**: no sideways scrolling, no control off screen, no clipped text, nothing hidden under the tab bar |
| 200% zoom, sheets: Log bloating, Add meal, Edit meal | **Passed**: the sheet scrolls, Save is reachable and saves |
| Rule / API / browser suites | Rule 97 passed; API 141 passed; browser 256 run: **255 passed, 1 expected failure** (the K1 check, marked to fail until fixed), 0 skipped. (Corrected on 24 Nov: this row first said "256 of 256", which counted the expected failure as a pass.) |
| Screen reader | **Not performed** (none available here; accessibility-tree checks are not counted) |

## Last fix before the freeze (23 Nov 2026): published build `83fe4da`

Published revision `83fe4daf773f35b74b93b633db8a77b8f0f1f580`, Vercel deployment `dpl_DoAEN2q7gxKTrfvL9pZw1nGGEekn`, served at `https://bloat-preview.vercel.app` (GitHub run 12). Frozen for review until the K1 fix on 24 Nov.

| Check | Where | Result |
|---|---|---|
| Delete account with kept photos while storage refuses deletes (synthetic photos, disposable account) | Local, published code `62431c7` | **Failed**: answered "deleted"; account gone, photo row and file left in storage |
| Same, plus no-failure and recovery-during-retries checks (3 API checks) and the screen check | Local, fixed code | **4 of 4 passed**: no failure: photos then account removed; failing: nothing deleted, message shown, founder alert with counts only; after recovery: one tap removes photos and account |
| The earlier fixes R1 to R3 (recalled offer, export messages, founder double tap) | Local, final code | Passed again |
| Rule tests / API tests / browser tests | Local, final code | 97 of 97 / 140 of 140 / **251 of 251**, none retried |
| Type check, lint | Local | 0 errors (5 old warnings) |
| GitHub run 12 | CI | All checks passed (browser 251 of 251); built `dpl_DoAEN2q7gxKTrfvL9pZw1nGGEekn`; 6 of 6 live checks before and after publishing |
| Tested = deployed | Vercel | Both addresses on `dpl_DoAEN2q7gxKTrfvL9pZw1nGGEekn`; 209 of 209 listed source files byte-identical to `83fe4da` |
| Full hosted suite, 7 fresh accounts | Live | **16 of 16 passed** |
| Export messages; kept photos then deletion | Live | **2 of 2 passed**; 2 synthetic photos stored, then 0 after "Delete my account" |
| 7 accounts deleted through the app, read-only checks | Live, `bloat-test` | 0 rows anywhere, no marked accounts, photo bucket empty; `bloat-tester` identical before and after |
| Real phones / real AI provider / founder tools on the preview / the 3 history-dependent screens on the preview / storage and recalled-offer failures on the preview | - | **Not performed** |

## Final round (23 Nov 2026): published build `62431c7`

Published revision `62431c71ffe13e48404db7b21e31c0823eb73dfb`, Vercel deployment `dpl_AvmuUC34HMhQpEj34UsAk6ekV2Lm`, served at `https://bloat-preview.vercel.app` (GitHub run 11).

| Check | Where | Result |
|---|---|---|
| Counts reconciled with the raw results file | Local | 250 browser checks; save file 63 x 3 + 9 = 198; section 5: 36 + 4. One wording error corrected ("207 of 629") |
| Recalled-meals offer, database refuses the answer, then its duplicate-tap record (2 checks) | Local, published code `7713098` | **2 failed**: offer left used with no answer; the same request again refused (409) and the answer lost |
| Same 2 checks | Local, fixed code | **2 of 2 passed**: nothing left behind; the same request then saves once |
| Export: server error vs lost connection, for the request and the file | Local, published code / fixed | **Failed** (a server error said "Check your connection") / **passed** |
| Founder tools: double tap side effects | Local, published code | Measured: 2 requests, 2 setting writes, 2 change and 2 reload audit records; lost connection showed nothing |
| Founder tools check: 1 request, 1 write, 1 change record, 1 reload record; slower second tap ignored; lost connection shown | Local, fixed code | **Passed** |
| Rule tests / API tests | Local, final code | 97 of 97 / 137 of 137 |
| Browser tests, all | Local, final code | First full run: 249 of 250 (the delete-account check raced the app's own move to the start page; 45 of 45 on repeat). Check fixed (test only). Then **250 of 250**, 0 retried |
| Type check, lint | Local | 0 errors (5 old warnings) |
| GitHub run 11 (push of `62431c7`) | CI | All checks passed (API 137, browser 250); controls read back; built `dpl_AvmuUC34HMhQpEj34UsAk6ekV2Lm`; 6 of 6 live checks before publishing; published; served deployment confirmed; 6 of 6 again after |
| Tested = deployed | Vercel | Both addresses on `dpl_AvmuUC34HMhQpEj34UsAk6ekV2Lm`; 207 of 207 listed source files byte-identical to `62431c7` (490 of 630 files listed) |
| Full hosted suite, first attempt (7 accounts) | Live | 15 of 16: the diary check's navigation raced the app's history step after a sheet closed; data saved correctly. Check fixed (test only) |
| Full hosted suite, repeat with 7 fresh accounts | Live | **16 of 16 passed** |
| Export messages | Live | **Passed** |
| 14 accounts deleted through the app, then read-only checks | Live, `bloat-test` | 0 rows anywhere, no marked accounts; `bloat-tester` identical before and after |
| Real phones / real AI provider / founder tools on the preview / the 3 history-dependent screens on the preview | - | **Pending** |

## Hosted suite on the published build, then section 5 on the screen (23 Nov 2026)

**Hosted, on `dpl_59A4HADi2dEAD26ivcfdoXVWPf9K` (`0d537d2`), not republished for it.** Seven separate synthetic accounts, created with only a password hash; the owner's `bloat-tester@bloat.test` and its sample entries were not used or changed.

| Check | Where | Result |
|---|---|---|
| Full hosted suite: the 15 existing checks plus Your journey with no finished day (no backwards date range) | Live, 09:28 to 09:30 UTC | **16 of 16 passed** |
| The 7 accounts deleted through "Delete my account" | Live | 7 of 7 deleted; each token refused at once |
| Read-only database check afterwards (repeated about 10:00 UTC) | `bloat-test` | 0 users by ID and email, 0 marked accounts, 0 sessions, identities, files, profiles, meals, bloating records. `bloat-tester` unchanged (1 meal, 1 bloating record) |

**Local, section 5 actions on the screen** (local Supabase, synthetic accounts, labelled mock AI, no paid AI call). Each action: saves and persists after a refresh; a server failure is shown and nothing changes, then the same button saves; a double tap sends one write.

| Check | Result |
|---|---|
| 12 new actions x 3 outcomes, on the published app code (`d0d7383`) | 33 passed, **3 failed**: the failure checks of the doctor reminder (History), the experiment answer (Today) and "Not useful" (Today). A failed save showed nothing |
| Same 36 after the fix (`7713098`) | **36 of 36 passed** |
| Single checks: photo with the local mock; "Yes, go through them" and Skip; a failed export (two ways) then a retry; founder tools (Set limit, kill switch off and on, a refused change) | **4 of 4 passed** |
| Founder tools double tap | Two requests go out (buttons not disabled while saving); same saved value. Noted, not changed |

**Fix published** (focused: the app's usual save message under the three buttons, `7713098`).

| Check | Where | Result |
|---|---|---|
| Rule tests / API tests | Local, `7713098` | 97 of 97 / 135 of 135 |
| Browser tests, all | Local, `7713098` | **250 of 250**, 0 flaky |
| Type check, lint | Local | 0 errors (5 old warnings) |
| GitHub run 10 (push of `7713098`) | CI | All checks passed (browser 250 of 250); controls read back; built `dpl_E8w2BwFqLPuj59xLtcptnRVWT1fB`; 6 of 6 live checks before publishing; published; served deployment confirmed; 6 of 6 again on the public address |
| Tested = deployed | Vercel | Both addresses on `dpl_E8w2BwFqLPuj59xLtcptnRVWT1fB`; 207 of 207 listed source files byte-identical to `7713098`, incl. both changed files |
| The three save messages on the live preview | Live | **Not run**: needs several days of back-dated records, which the preview cannot create without editing the database by hand. The gate ran them on the deployed commit |
| Real phones | - | **Pending** |
| Real AI provider (photo and dish check) | - | **Pending** (not connected; needs your approval of a key and a spending limit) |


## External report fixes (23 Nov 2026): published build `0d537d2`

An independent tester (cloud Chrome, the owner's test account, build `adfe49b`) reported four defects. Each was reproduced by a new test on the old code, fixed in its own commit, and published through the gate.

Published revision `0d537d27fcbaf4ea047fff6f3b01a1e0b6c0a420` (app code equals `d0d7383`), Vercel deployment `dpl_59A4HADi2dEAD26ivcfdoXVWPf9K`, served at `https://bloat-preview.vercel.app`.

| Check | Where | Result |
|---|---|---|
| B1/B2 time edits: 15 checks (phone behind, ahead, same zone; Keep; meal and bloating; midnight; both clock changes) | Local, old code | 14 of 15 failed (B1 and B2 reproduced) |
| Same 15 checks | Local, fixed code | 15 of 15 passed |
| B3/B4: 5 checks (Patterns and Journey on a new account; range with finished days; day with only a meal; empty day) | Local, old code / fixed | 3 failed (the defects), 2 controls passed / 5 of 5 passed |
| Rule tests, incl. the new date-range rule | Local | 97 of 97 |
| API tests | Local | 135 of 135 |
| Browser tests, all | Local | 210 of 210, 0 flaky |
| Type check, lint | Local | 0 errors (5 old warnings) |
| GitHub run 7 (`8d7ae58`) | CI | Failed on one outdated check; nothing published |
| GitHub run 8 (`d0d7383`) | CI | Failed: GitHub machine port clash before tests; nothing published |
| GitHub run 9 (`0d537d2`, started by hand) | CI | All checks passed; controls read back; built, checked live (6 of 6), published, served deployment confirmed, checked again (6 of 6) |
| B1 to B4 on the published build (account Asia/Kolkata, browser America/Los_Angeles) | Live | Passed |
| Test account deleted through "Delete my account" and verified | Live and `bloat-test` | 0 rows anywhere; one hash-only deletion record |
| Full signed-in hosted suite (15) on this build | Live | Not re-run at the time; re-run later the same day: 16 of 16 (above) |
| Real phones | - | **Pending** |

## Live verification (22 Nov 2026, evening): published build `adfe49b`

Tested and published revision `adfe49b803f88c8300a01afe27cca8bb7ff449d4`, Vercel deployment `dpl_GYCc4U8LgKQJWhKBizXioK2fw2FQ`, served at `https://bloat-preview.vercel.app`. App code identical to `2f22cc4`. Details and how tested and deployed are tied together: `docs/verification-report.md`, sections 7 to 9.

| Check | Where | Result |
|---|---|---|
| Typecheck, lint, rule, API and browser tests on a clean checkout | GitHub run 6 (started by hand on `adfe49b`) | Passed |
| Deployment controls read back before building | GitHub run 6 | Passed (`vercel.json` Git builds off; Ignored Build Step matches) |
| Account-free hosted checks on the new build, then on the public address | GitHub run 6 | 6 of 6, both times |
| Full hosted suite with the 7 approved accounts | Live, about 20:26 UTC | **15 of 15 passed** |
| Deleted account's earlier session: protected data | Live | Passed (data before; after: app 401 with no data, auth 403, refresh 400, database 0 rows, writes 403) |
| Same session: screen | Live | Redirects to Sign in (reported apart) |
| Coverage endpoint restored | Live | 401 signed out (was 404 on `af950f5`) |
| 19 old accounts deleted (owner ran the guarded SQL) | `bloat-test` | Verified: all counts 0; owner account intact |
| 7 run accounts deleted through "Delete my account" | Live and `bloat-test` | Verified: 7 of 7 deleted, all counts 0, 7 hash-only deletion records kept by design |
| Git builds off through `vercel.json` | Vercel | No Git-triggered deployment for 10 pushes |
| Ignored Build Step blocks a Git build | - | **Not proven** (configured and read back only) |
| Real phones | - | **Pending** |

## Verification round 2 (22 Nov 2026, afternoon): closing the gaps

Application commit **`2f22cc4`** (local results ran on files whose app code is exactly `2f22cc4`). The public preview serves **`af950f5`** (deployment `dpl_FDVnqFxAx4MHaGhq9g9HLiim7Tzj`), which lacks one API endpoint that `.gitignore` had hidden (defect below). Full detail: `docs/verification-report.md`. Local, hosted and manual-device evidence are kept apart.

### Local (local Supabase in Docker; synthetic accounts; test mode on)

| Check | Result |
|---|---|
| Rule tests `pnpm test` | 96 passed, 0 failed |
| API tests `pnpm test:api` (adds "a deleted account's earlier tokens") | 135 passed, 0 failed |
| Browser tests `tests/e2e`, phone screen | 190 passed, 0 failed, 0 flaky (7.3 minutes) |
| Save and edit outcomes (`mutations.spec.ts`): 51 actions x 3 (saves and persists; failure shown inside the open sheet, nothing changes, retry saves; double tap saves once) plus 6 single checks | 159 of 159 |
| Navigation by real clicks, destination and Back (`tests/ledger/navigate.spec.ts`) | 238 clicks: 238 right destination, 238 Back returned |
| Control crawl, reconciled | 1,292 rows: 834 passed (74 screen loads, 244 clicked and responded, 516 link targets loaded without clicking), 0 failed, 49 skipped on purpose (20 destructive, each covered by a named test; 29 outside links), 409 excluded (332 hidden at phone width, 32 disabled, 45 fields), 0 blocked |
| Five widths, sideways scrolling | 0 of 185 with sideways scrolling |
| Type check, lint | 0 errors (5 old warnings) |

Defects found and fixed (each reproduced first): no way to retry a failed ingredient check; an experiment's End error hidden behind its sheet; account deletion with a lost reply ending at Sign in instead of finishing; and, found by the first CI run on a clean checkout, the Pro coverage endpoint `/v1/insights/coverage` was never committed (an ignore rule for test-coverage output matched it), so every Vercel build lacked it. No screen calls it.

A deleted account's earlier tokens, measured locally: app API 401 at once; Supabase user lookup 403; refresh refused (400); direct database read 200 with 0 rows (the token stays signature-valid until it expires, but nothing is left); direct write 403.

### Hosted (`bloat-test`, the public preview)

| Check | Result |
|---|---|
| Account-free hosted checks (6) on `af950f5`, deployment `dpl_FDVnqFxAx4MHaGhq9g9HLiim7Tzj`, 22 Nov 14:36 UTC, through the branch address (this workspace's network blocks `bloat-preview.vercel.app`; Vercel reports both addresses on this deployment) | 6 of 6 passed |
| Signed-in hosted checks (9), on the served build | **Blocked**: the 7 approved accounts need the old `pro-tester@bloat.test` deleted first, with the 19 below |
| Deleted-account token check on the hosted project | **Blocked** (same reason) |
| 19 temporary accounts from 19 Nov | **Not deleted.** List checked again at 18:18 and about 19:30 UTC (same 19 email-and-ID pairs, marker, 34 sessions; data counted); the delete was sent both times and both approval prompts got no answer (7 tries since 19 Nov). Nothing deleted |

### Manual device

| Check | Result |
|---|---|
| Main journeys on a real phone with `af950f5` | **Not done.** Owner checklist in `PROGRESS.md` |

### Publishing gate (CI)

`vercel.json` switches off Vercel's automatic Git builds (checked: no deployment for `4640ac2`, `7d6fd03` or `2f22cc4`); `.github/workflows/preview.yml` publishes only after its checks pass. Runs: 1 (`4640ac2`) failed at setup (a mistake in the new workflow), fixed; 2 (`7d6fd03`) failed in the API tests, 130 of 135 (four needed the missing `pdftotext` tool, one found the hidden endpoint), both fixed; 3 (`2f22cc4`): every check passed on a clean checkout, browser tests included (11 minutes), then it stopped at the missing `VERCEL_TOKEN`, as designed: nothing published. Publishing needs the owner's `VERCEL_TOKEN` secret (DEPLOYMENT.md, "Publishing the preview"): still missing at 19:38 UTC, so `2f22cc4` is not on the preview. Second layer against other paths: the Vercel project's Ignored Build Step was set (about 19:40 UTC) to skip Git-triggered builds. **Configured, not verified**: not read back and not tested by a Git build; the workflow now reads it back before every publish.

## Verification round 1 (22 Nov 2026, morning)

Full detail, with every count reconciled: `docs/verification-report.md` as of commit `56cdc01` (the current report covers round 2). "Clicked" and "verified" are kept apart there.

### Local (local Supabase in Docker; synthetic accounts)

| Check | Result |
|---|---|
| Rule tests `pnpm test` | 96 passed, 0 failed |
| API tests `pnpm test:api` | 134 passed, 0 failed |
| Browser tests `tests/e2e` (adds `mutations.spec.ts`: 37 save and edit actions x 3 outcome checks, plus 1 rule check) | 143 passed, 0 failed |
| Save and edit outcomes (data change read back, refresh, failure shown with retry, double tap saves once) | 112 of 112 |
| Navigation by real clicks: destination and Back, phone and desktop, signed-out, Free and Pro (`tests/ledger/navigate.spec.ts`) | 238 clicks: 238 right destination, 238 Back returned (8 Back failures before the fixes) |
| Control crawl, reconciled | 1,292 rows: 834 passed (74 screen loads, 244 clicked and responded, 516 link targets loaded without clicking), 0 failed, 49 skipped on purpose (20 destructive, 29 outside links), 409 excluded (332 hidden at phone width, 32 disabled, 45 fields), 0 blocked |
| Five widths, sideways scrolling | 0 of 185 |
| Type check, lint | 0 errors (5 old warnings) |

Defects found and fixed: a failed delete on the day screen was hidden; experiments could be chosen when starting was
always refused; Back skipped the Sign in and offline screens; email-code sign-in left its steps in history.

### Hosted

| Check | Result |
|---|---|
| Sign-ups off at the provider; direct and email-code sign-up refused (422 `signup_disabled`); old test login 404; no account created | Passed (22 Nov, after the owner switched sign-ups off) |
| Owner's own journey with `bloat-tester@bloat.test` on `bloat-preview.vercel.app`: sign-in, setup, refresh, sign-out | Owner reported all steps worked; server records confirm one successful password sign-in (12:14:56 UTC), setup saved, sign-out (12:17:24 UTC), 0 sessions afterwards. The password never left the owner |
| Account-free hosted checks on build `fcbce97` (deployment `dpl_4LQ7BSEBSQ39QfkxEvR5smXULMm5`, served at `bloat-preview.vercel.app` and the branch address) | 6 of 6 passed |
| Signed-in hosted checks on `fcbce97` | **Not re-run**: they need new temporary accounts while the 19 earlier ones still await deletion. Last run on `10cd14e`: 14 of 15 (the failure was the sign-up switch, now fixed) |
| 19 temporary accounts from the 19 Nov runs | **Still present, 34 live sessions.** Deletion requested through the Supabase connector; the approval prompt timed out |

## Bloat / Silver design (19 Nov 2026, afternoon)

### Local (local Supabase in Docker; nothing hosted)

| Check | Result |
|---|---|
| Rule tests `pnpm test` (adds 2 tab-ownership tests) | 96 passed, 0 failed |
| API tests `pnpm test:api` (backend unchanged) | 134 passed, 0 failed |
| Browser tests `pnpm test:e2e` (tab labels, 3px focus ring, light theme and a new check that every filled button and link has readable text) | 31 passed, 0 failed |
| Control ledger crawler on the new design, signed-out, Free and Pro, 31 screens incl. the new About page | 1,292 rows: 840 pass, 0 fail, 49 checked by named tests, 403 listed (fields, disabled, inside sheets, and the sidebar that is hidden on a phone) |
| Five widths (320, 390, 768, 1024, 1440) on 24 screens: sideways scrolling | 0 of 185 |
| Live site before this round: text colour of the "Get started" button | rgb(30, 94, 84) on rgb(30, 94, 84): invisible. Fixed; covered by the readable-text check |
| Type check, lint | 0 errors (5 old warnings) |

Not tested then: real phones, 200% browser zoom (only the phone's text-size path via rem), screen readers. (200% zoom and keyboard-only use were tested later, in desktop Chromium, on 23 and 24 Nov; real phones and screen readers are still not tested.)

### Hosted preview

Environment: commit `10cd14e`, deployment `dpl_Gga7Z3gVatwKDMxTbtFrp1D65o3Y` (READY), served at both
`https://bloat-git-claude-bloat-software-build-uxzoru-typeshi2.vercel.app` and the new dedicated address
`https://bloat-preview.vercel.app` (both aliases confirmed on this deployment; the new address answered 200 with the
new About page). `BLOAT_SIGN_IN_METHOD=password`, `BLOAT_TEST_LOGIN=0`, Supabase `bloat-test`. Synthetic accounts made
for the run (one-off password, only its hash sent; destroyed after the run).

| Check | Result |
|---|---|
| Signed out: return path after sign-in, contextual Back on public pages, empty-form messages | Passed (3) |
| Public visit with no Vercel login; homepage offers Sign in (not Get started) while sign-ups are closed; password-only sign-in | Passed |
| Test switches off; signed-out API and database calls refused | Passed (2) |
| Priority 1, 2a, 2b, 2c (meal persists, diary flow, two-account isolation, Pro doctor report privacy) | Passed (4) |
| Exports; password sign-in, refresh and sign-out | Passed (2) |
| Signed in: Back from a day, phone Back closes a sheet, focus return, close-without-saving, leave-without-saving | Passed (2) |
| **Nobody can create an account** | **Failed: Supabase sign-ups still on (owner's dashboard switch).** |

Totals: 14 passed, 1 failed. A first attempt on reused accounts failed 4 more checks only because those accounts
already held the earlier run's entries (the suite expects fresh accounts), and one setup lookup matched the new
"Add to today" and "Today so far" headings; the lookup is now exact and the run above used fresh accounts.

## Navigation and action repairs (19 Nov 2026)

### Local (local Supabase in Docker; nothing hosted)

Fixed build = commit `b888008` plus the Contact link change, served on port 3100. Earlier build = commit
`dc88b37` (the last deployed one), served from a separate copy on port 3200 against the same local database.

| Check | Result |
|---|---|
| Rule tests `pnpm test` (adds 2 return-path tests) | 94 passed, 0 failed |
| API tests `pnpm test:api` | 134 passed, 0 failed |
| Browser tests `pnpm test:e2e` (adds 14 navigation tests; one older test updated for the corrected waitlist label) | 31 passed, 0 failed |
| The 14 navigation tests on the earlier build | **14 failed**, each at the defect it checks (see `docs/control-ledger.md`, "Defects reproduced and repaired") |
| Control ledger crawler, fixed build: 740 controls and pages for signed-out, Free and Pro | 620 pass, 0 fail, 49 checked by named tests, 71 listed |
| Control ledger crawler, earlier build | 598 pass, **19 fail** (empty "Send code" and "Join waitlist" did nothing visible) |
| Five widths (320, 390, 768, 1024, 1440) on 23 screens: sideways scrolling | 0 of 180 in both builds |
| Outside source links (NHS, NIDDK, BDA, CDC, PMC): 7 addresses | All HTTP 200 |
| Type check, lint | 0 errors (5 old warnings) |

Not tested: real phones (iOS Safari, Android Chrome); a slow or flaky real network (lost replies were simulated
by blocking requests in the browser); screen readers other than the accessibility tree.

### Hosted preview

Environment: `https://bloat-git-claude-bloat-software-build-uxzoru-typeshi2.vercel.app`, commit `e029f9d`
(deployment `dpl_D3QpxCgr3cZXJR7UesavJbGVhWF6`, READY, alias confirmed on this deployment), `BLOAT_SIGN_IN_METHOD=password`,
`BLOAT_TEST_LOGIN=0`, Supabase `bloat-test`. Run 19 Nov 2026, signed out only.

| Check | Result |
|---|---|
| `/me` signed out goes to `/sign-in?next=%2Fme`; an outside address in `next` is ignored | Passed |
| Contact, then its help link, then Back returns to Contact; Privacy, Terms and How Bloat works opened directly: Back goes to the start page; Help opened directly: its Back button goes to the start page | Passed |
| Empty waitlist and empty sign-in: an inline message in the app's own wording | Passed |
| Earlier public checks: fresh browser, no Vercel login, password-only sign-in, no sign-up, no code screen | Passed |
| Earlier public checks: signed-out API and direct database calls read and change nothing | Passed |
| Test switches off: old test login 404, no test password on the sign-in screen | Passed |

Then, the same day, with 7 synthetic accounts made for this run through the Supabase connector (one-off
password kept in a local file, only its hash sent; `pro-tester@bloat.test` is the designated Pro address),
the full hosted suite plus the new signed-in navigation checks, on the same deployment:

| Check | Result |
|---|---|
| Test switches off for a signed-in account: mock purchase and test clock refused, plan stays Free, checkout off | Passed |
| Priority 1: a meal saves and is still in History after a refresh | Passed |
| Priority 2a: diary flow with a warning sign, refresh, end, meal, sign out, sign back in | Passed |
| Priority 2b: two accounts cannot see or change each other's records (app and database) | Passed |
| Priority 2c: Pro doctor report with Medicines and Health off; preview, PDF and shared page leave them out; share link stops after revoke | Passed |
| Exports: complete JSON and CSV for the owner, refused to anyone else | Passed |
| Password sign-in: generic message for wrong details, refresh keeps the session, sign-out ends screens, APIs and the old token | Passed |
| Signed in: Back from a day returns to Today; the phone's Back closes a sheet and stays; focus returns to the opener; "Close without saving?" keeps typed text | Passed |
| Signed in: "Leave without saving?" from Health background by tab bar and Back | Passed |
| **Nobody can create an account** | **Failed.** Supabase still allows new sign-ups. The connector has no tool for this setting; the owner must switch it off in the dashboard. |

Totals on the hosted preview: 17 passed, 1 failed (the sign-up switch).

Clean-up: the one-off password file was destroyed after the run, so nobody can sign in to the 7 accounts.
Deleting the accounts themselves needs the owner's yes in the Supabase connector; the question timed out
unanswered, so they still exist (marked `synthetic_test_run = 2026-11-19`; deleting them removes all their rows).

## Email-and-password sign-in (18 Nov 2026)

### Local (local Supabase in Docker; nothing hosted)

| Check | Result |
|---|---|
| Rule tests `pnpm test` (adds 3 sign-in message and validation tests) | 92 passed, 0 failed |
| API tests `pnpm test:api` (default email-code mode) | 134 passed, 0 failed |
| Browser tests `pnpm test:e2e` (default email-code mode, incl. 5 email-code tests with real local emails) | 17 passed, 0 failed |
| Type check, lint | 0 errors (5 old warnings) |
| Rehearsal: the hosted suite against a local copy in password mode (`BLOAT_SIGN_IN_METHOD=password`, `BLOAT_TEST_LOGIN=0`) with 7 synthetic local accounts | **9 passed, 1 failed by design.** Passed: public visit and password-only sign-in screen; test switches off; signed-out API and database access refused; meal saved and still there after refresh; diary flow incl. sign out and sign back in through the form; two-account isolation; report privacy and share-link revoke; exports; and the sign-in check (empty-form field errors, wrong password and unknown address get the same message, password cleared, no input names, no password in any URL, correct sign-in, refresh keeps the session, sign-out ends screens and APIs, and a second session's token stops working). Failed by design: "nobody can create an account", because local sign-ups stay on for the API tests; the test stopped before sending any sign-up request. |

### Hosted preview

Environment: `https://bloat-git-claude-bloat-software-build-uxzoru-typeshi2.vercel.app`, commit `940a00d` (deployment `dpl_92qDryyhPyPmfHvD7zVQbQLT6sXR`), `BLOAT_SIGN_IN_METHOD=password`, `BLOAT_TEST_LOGIN=0`, Supabase `bloat-test`. Run 18 Nov 08:30–08:45 UTC.

| Check | Result |
|---|---|
| A fresh signed-out browser opens the preview (200, no Vercel login); `/today` goes to the app's sign-in; the sign-in shows email and password only, says new accounts can't be created; no "Send code", no sign-up links, no Google button; `/sign-in/code` sends you back to `/sign-in` | Passed (browser) |
| Signed out: history, state, a day, reports and an export link 401; a meal save 401; founder tools 404; direct database reads with the public key return nothing or "permission denied"; a direct insert refused | Passed (browser and API) |
| Empty form: field error shown and the field marked invalid; unknown email and wrong password: only "Email or password is incorrect."; password field cleared; 0 inputs with a `name`; the password appeared in no requested URL; the page stayed on `/sign-in` with no query | Passed (browser) |
| Old test-login route | 404, passed |
| Supabase logs since 08:00 UTC: the 2 wrong-password attempts show as `invalid_credentials`; 0 log lines contain password text (auth, edge and database logs) | Passed |
| **Direct requests cannot create accounts** | **Not passed.** Supabase still has sign-ups on (`disable_signup` false). The test checks this first and sends no sign-up request while it is on. Owner action: DEPLOYMENT.md, "Sign-in method", step 1. |
| Correct credentials sign in; refresh keeps the session; sign-out ends screens, APIs and the old token; two-account isolation, on hosted | **Not run on hosted.** The temporary verification accounts could not be created: the Supabase connector asked the owner to confirm the SQL and got no answer, so nothing was created (checked: a sign-in for one of them answered `invalid_credentials`). The same checks passed in the local rehearsal above. |
| Owner's own test account `bloat-tester@bloat.test` | Not created yet (owner action). |

## Local suites

Run on the local stack (built app on port 3100, local Supabase in Docker with all six migrations), 18 Nov 2026, on the code of commit `b70e7ed` plus the test-only fix below.

| Suite | Command | Result |
|---|---|---|
| Type check | `pnpm typecheck` | Passed, 0 errors |
| Lint | `pnpm lint` | Passed, 0 errors, 5 warnings |
| Build | `pnpm build` | Passed |
| Rule tests (Vitest) | `pnpm test` | 89 passed, 0 failed |
| API tests (Vitest, real HTTP and database) | `pnpm test:api` | 134 passed, 0 failed |
| Browser tests (Playwright, phone screen) | `pnpm test:e2e` | 17 tests. Full run: 16 passed, 1 failed (see below). After the fix: the failing file rerun, 5 of 5 passed, and the failing test passed 3 times in a row. |

The one failure was in the test, not the app: the email-code failure test forces a 504 by intercepting the request, and the app's offline service worker sometimes took over the page first, so the interception missed it. The email-code tests now block the service worker. Local email tests use real emails from the local mail catcher.

New regression tests this round: report privacy (4 API with PDF text and shared page, 3 unit, 1 browser; all 4 API tests fail on the old code); exports (3 API incl. 1,234 records in JSON and CSV, 2 unit incl. a failure on a later page and a retry, 1 browser); email codes (4 unit, 5 browser); kiwifruit pause (1 API, 1 unit); attribution guard (1 unit); Pro test accounts (1 API); server functions (all 14, in the privacy test).

## Hosted preview (public)

Environment: `https://bloat-git-claude-bloat-software-build-uxzoru-typeshi2.vercel.app`, Vercel project `bloat`, commit `b70e7ed` (deployment `dpl_6W3brAYiyqyDoeyYuCM8yNgyq3Ga`), Vercel protection off, `BLOAT_TEST_LOGIN=0`, Supabase `bloat-test` with migrations up to `20261117182606`. Real Chromium, phone screen, fresh contexts. Command: `pnpm test:hosted` (setup in DEPLOYMENT.md, "Hosted test run"). Result: **8 passed, 0 failed.** The same suite was first rehearsed against a local copy running in public mode (8 of 8).

| Check | Result |
|---|---|
| A fresh signed-out browser opens the preview: status 200, no redirect to vercel.com, landing page shown; `/today` sends it to the app's own sign-in | Passed |
| Test switches off: `POST /v1/auth/test-login` 404; no test password form; mock purchase 404; test clock header ignored; no "Mock purchase" on `/me` or `/upgrade`; plan Free; checkout off | Passed |
| Signed out: `/v1/history`, `/v1/me/state`, a day, reports, an export link all 401; a meal save 401; founder tools 404; direct database reads with the public key return nothing or "permission denied"; a direct insert is refused | Passed |
| A signed-in synthetic user saves a meal and still sees it in History and the day view after refreshes | Passed |
| Diary flow: bloating with a warning sign (shows "Adapted from NHS, Bloating"), refresh, end, meal, sign out, sign back in, records still there | Passed |
| Two accounts: B sees none of A's day, cannot edit or delete A's meal (404), B's export holds nothing of A's, B's own session cannot read or change A's meal directly in the database; A's meal unchanged | Passed |
| Report privacy on hosted: a designated Pro test account (no purchase) makes a doctor report with Medicines and Health off; the preview, the PDF text and the shared page hold no medicine name, pregnancy or condition; the question still appears; the share link opens in a stranger's browser, then shows "This link no longer works" after revoke | Passed |
| Exports on hosted: JSON and CSV complete with row counts; the download link gives a stranger 401 | Passed |
| Server functions on `bloat-test` (direct calls, 17 Nov 18:5x UTC): all 14 refuse a wrong secret (42501 SERVER_SECRET_INVALID); signed-in role can call 0 of 14 (checked in the database catalogue) | Passed |
| Email code delivery | **Failed on the hosted project, not an app test.** One real request for the test mailbox (18:50 UTC, 17 Nov) timed out in Supabase Auth after 10 s (504 "context deadline exceeded"), with no email sent. Same pattern since the custom SMTP settings were saved at 06:12 UTC. See DEPLOYMENT.md. |
| Google sign-in | Not exercised: switched off in Supabase. The sign-in page hides the button while it is off (local browser test). |
| Founder MFA on hosted | Not exercised: no staff address is set on the preview. |
| Real AI, real payments | Not exercised (mock, by design) |

Live spot check on the newest build, commit `3b25b5f` (deployment `dpl_BUXKcfPiby9DtyGNQp58WB5Uv2Cu`; only tests and docs changed after `b70e7ed`, no app code): home 200 with no Vercel redirect; `/today` 307 to `/sign-in`; test-login 404; `/v1/history` 401 signed out; founder tools 404; sign-in page shows "Send code", no test password form, no Google button; help page (rendered in a browser) says "Adapted from NHS, Bloating" with the nhs.uk link, "Call your local emergency number now" with no country and "Call 911 now" for the United States.

Earlier hosted runs (protected preview, 17 Nov, commits `c25610a`, `cdc2ebc`, `1540294`): 5 of 5 each time.

## The 200 acceptance tests

A test is marked Passed only when a test that names its ID ran and passed.

| Status | Count |
|---|---|
| Passed with executable evidence | 173 |
| Partial (the tested part passes; the note says what is missing) | 14 |
| Blocked by something outside the code | 4 |
| Not implemented | 9 |
| Failed | 0 |

Most evidence is at the API and rule level. Only a small part of it is also exercised through the screens in a browser.

## Not tested, stated plainly

- The real AI provider (no key). All ingredient checks used the labelled mock.
- The Meal AI accuracy test (300 dishes, 100 photos): harness built, **not run**. No accuracy figure exists.
- Email code delivery on the hosted project (blocked by its SMTP settings) and Google sign-in (switched off). Locally, email codes are tested end to end with real emails from the local mail catcher.
- On the hosted preview: only the eight checks listed above. The full API suite runs locally only.
- A real backup restore, real payments, a screen reader session, and most Pro screens in a browser (they are covered through the API).

## Table

| ID | Scenario | Status | Evidence (tests/) | Note |
|---|---|---|---|---|
| Q01 | Start episode, reply lost, retry same action | Passed | api/slice-a-episodes.test.ts |  |
| Q02 | Second tab starts while episode open | Passed | api/slice-a-episodes.test.ts |  |
| Q03 | End before start or future end | Passed | api/slice-a-episodes.test.ts |  |
| Q04 | 23:00-02:00 episode | Passed | api/slice-a-episodes.test.ts, unit/rules.test.ts |  |
| Q05 | DST transition and ambiguous clock time | Passed | api/slice-a-episodes.test.ts, unit/rules.test.ts |  |
| Q06 | Travel changes device time zone | Passed | api/slice-a-account.test.ts, unit/rules.test.ts |  |
| Q07 | Unknown end after forgotten close | Passed | api/slice-a-episodes.test.ts |  |
| Q08 | Episode still open for 25 hours but user forgot | Passed | api/slice-a-episodes.test.ts |  |
| Q09 | No bloating so far, later episode | Passed | api/slice-a-days.test.ts |  |
| Q10 | Final daily zero conflicts with a severity sample | Passed | api/slice-a-days.test.ts |  |
| Q11 | No meal records but valid daily symptom answer | Passed | api/slice-a-meals.test.ts |  |
| Q12 | Full meals with no category and confirmed symptom zero | Passed | unit/insights.test.ts |  |
| Q13 | Confirmed category present but partial food coverage | Passed | unit/insights.test.ts |  |
| Q14 | Accepted typical recipe guess | Passed | api/slice-c-meal-ai.test.ts, unit/insights.test.ts |  |
| Q15 | Activity not tapped | Passed | api/slice-a-days.test.ts |  |
| Q16 | Late daily recall | Passed | api/slice-a-days.test.ts, unit/insights.test.ts |  |
| Q17 | 7 with / 7 without and a zero difference | Passed | unit/insights.test.ts |  |
| Q18 | 7 with / 7 without and negative difference | Passed | unit/insights.test.ts |  |
| Q19 | Only exposed days | Passed | unit/insights.test.ts |  |
| Q20 | Two foods always together | Passed | unit/insights.test.ts |  |
| Q21 | New medicine added with MD-04 group during a comparison window | Partial | – | Medicine changes are shaded on charts and the before/after view is tested (Q168, Q169). The separate 'sensitivity view' that records exclusions is not built. |
| Q22 | AI malformed JSON / prompt injection / timeout | Passed | api/slice-c-meal-ai.test.ts, unit/rules.test.ts |  |
| Q23 | User edits private recipe | Passed | api/slice-c-meal-ai.test.ts |  |
| Q24 | Shared catalogue taxonomy updated | Not implemented | – | There is no shared food catalogue. Each ingredient row stores the model and prompt version. |
| Q29 | Swap experiment requested with FX answers Not sure / Prefer not to say | Passed | api/slice-ef.test.ts |  |
| Q30 | FX-03 Yes (coeliac, allergy or IBD) or HC-01 coeliac | Passed | api/slice-ef.test.ts |  |
| Q31 | Direct API request to start a swap experiment by an ineligible Pro user | Passed | api/slice-ef.test.ts |  |
| Q32 | Cross-user row ID / report ID / recipe ID | Passed | api/privacy.test.ts |  |
| Q33 | Delete account then restore backup | Partial | api/slice-a-account.test.ts | Deletion, token refusal and re-applying tombstones are tested. A real backup restore on Supabase has not been rehearsed. |
| Q34 | Signed report link expires or sharing revoked | Passed | api/slice-bd-pro.test.ts |  |
| Q35 | Duplicate or out-of-order payment webhook | Passed | api/slice-ef.test.ts |  |
| Q37 | Country becomes unsupported | Passed | api/slice-ef.test.ts |  |
| Q38 | Country without a listed emergency number | Passed | api/slice-a-account.test.ts, unit/rules.test.ts |  |
| Q39 | User signs out on shared device | Passed | e2e/core.spec.ts, unit/rules.test.ts |  |
| Q40 | Rule/formula/model version changes | Partial | api/slice-bd-pro.test.ts | Reports store rule versions and are immutable snapshots (tested). A versioned rollout process for rule changes is not built. |
| Q41 | Recipe saved from AI guess | Passed | api/slice-c-meal-ai.test.ts, unit/insights.test.ts |  |
| Q42 | All episodes closed; review untouched | Passed | api/slice-a-days.test.ts |  |
| Q43 | Partial or cannot-remember recall | Passed | api/slice-a-days.test.ts |  |
| Q44 | Today versus completed day | Passed | api/slice-a-days.test.ts |  |
| Q45 | Average with three usable dates | Passed | api/slice-bd-pro.test.ts |  |
| Q47 | Google redirect after the help page | Blocked | – | Google sign-in needs the Google provider switched on in Supabase (owner). The help acknowledgement is kept in the tab across the redirect by design; untested. |
| Q48 | Authenticated onboarding commit loses reply | Passed | api/slice-a-account.test.ts |  |
| Q51 | Personal Focus dismissal/edit/expiry | Passed | api/slice-bd-pro.test.ts |  |
| Q52 | Upgrade prompt for a free user | Passed | e2e/core.spec.ts |  |
| Q53 | Downgrade with old PDF and recipes | Passed | api/slice-bd-pro.test.ts |  |
| Q54 | Delete meal referenced by report | Passed | api/slice-bd-pro.test.ts |  |
| Q55 | Delete while job is running | Passed | api/slice-a-account.test.ts |  |
| Q56 | Source update races older recompute | Not implemented | – | Not built as written: results are worked out on read from current records, so there is no stored result for an older job to overwrite. |
| Q57 | Free account calls insights APIs | Passed | api/slice-bd-pro.test.ts |  |
| Q58 | Founding-member payment before gate | Passed | api/slice-ef.test.ts |  |
| Q59 | Screen-reader/keyboard/mobile flow | Partial | e2e/core.spec.ts | Keyboard use, names and focus ring are browser-tested on core recording. No screen-reader session was run. |
| Q60 | Client sends invented tag/other-user child ID | Passed | api/privacy.test.ts, api/slice-c-meal-ai.test.ts, unit/rules.test.ts |  |
| Q61 | USA, Canada and India synthetic accounts complete Slice A | Passed | api/slice-a-account.test.ts, e2e/core.spec.ts |  |
| Q62 | Country ready for tracking but not payments | Passed | api/slice-ef.test.ts |  |
| Q63 | Unknown country configuration | Passed | api/slice-a-account.test.ts |  |
| Q64 | Residence differs from current location | Passed | api/slice-a-account.test.ts |  |
| Q65 | Device locale MM/DD differs from DD/MM | Passed | unit/rules.test.ts |  |
| Q66 | DST, half-hour/quarter-hour zones and travel | Passed | api/slice-a-episodes.test.ts, unit/rules.test.ts |  |
| Q67 | Non-English food name in English interface | Passed | api/slice-a-meals.test.ts |  |
| Q68 | Same brand/product name in different markets | Not implemented | – | No brand or product catalogue exists. |
| Q69 | Cuisine preference differs from residence | Not implemented | – | Cuisine preferences are stored; nothing is ordered by them yet (there is no dish suggestion list). |
| Q70 | Help page not available in the user's language | Not implemented | – | The app is English only; the 'English only' note is not shown (wording needs the owner's yes). |
| Q71 | Foreign currency offer and renewal | Passed | unit/rules.test.ts |  |
| Q72 | Billing country changes | Passed | unit/rules.test.ts |  |
| Q73 | Payment provider unavailable in selected market | Passed | api/slice-ef.test.ts |  |
| Q74 | Regional consent withdrawn | Passed | api/slice-a-account.test.ts |  |
| Q75 | Deletion spans regional stores/processors | Blocked | – | Database rows and stored photos are deleted (tested under Q33). Notifying outside processors needs those accounts. |
| Q76 | Cross-region staff or tenant access attempt | Passed | api/slice-ef.test.ts, e2e/admin.spec.ts |  |
| Q77 | Notification at recipient local time | Not implemented | – | No notifications or reminders exist in this release (plan A18). |
| Q79 | Global beta aggregate masks one poor cohort | Not implemented | – | No beta cohort reporting. |
| Q80 | Policy suspension during job/checkout | Passed | api/slice-ef.test.ts |  |
| Q85 | Multi-select submits an exclusive option with another option (e.g. none + gas) | Passed | api/slice-a-episodes.test.ts, unit/rules.test.ts |  |
| Q86 | EP-01 severity 0 or 11, DY-01 value 11 or 3.5 | Passed | api/slice-a-days.test.ts, api/slice-a-episodes.test.ts, unit/rules.test.ts |  |
| Q87 | EP-08 Constipation on 3 completed dates in 14 | Passed | api/slice-bd-pro.test.ts |  |
| Q88 | PATCH episode with stale If-Match, or edit that creates an overlap | Passed | api/slice-a-episodes.test.ts |  |
| Q89 | DELETE a meal referenced by a stored report | Passed | api/slice-bd-pro.test.ts |  |
| Q90 | Profile with residence IN, locale en-CA, time zone America/Toronto | Passed | api/slice-a-account.test.ts |  |
| Q91 | Residence country outside the enabled launch wave | Passed | api/slice-a-account.test.ts, e2e/core.spec.ts |  |
| Q92 | New user reaches sign-up | Passed | api/slice-a-account.test.ts, e2e/core.spec.ts |  |
| Q93 | Search every screen | Passed | api/slice-a-account.test.ts, unit/rules.test.ts |  |
| Q94 | Episode with tummy pain and nausea at strength 10 | Passed | e2e/core.spec.ts |  |
| Q95 | 14 days of scores 8-10 | Passed | api/slice-a-days.test.ts |  |
| Q96 | Search all outputs, cards, summaries and PDFs | Passed | unit/rules.test.ts |  |
| Q97 | Free account calls each Pro endpoint | Passed | api/slice-a-episodes.test.ts, api/slice-a-meals.test.ts, api/slice-bd-pro.test.ts |  |
| Q98 | Pro typed dish 'chicken burrito with beans' | Passed | api/slice-c-meal-ai.test.ts, unit/rules.test.ts |  |
| Q99 | Save with 2 of 5 items marked Had, 3 marked Didn't have | Passed | api/slice-c-meal-ai.test.ts |  |
| Q100 | Save with 2 marked Had and 3 untouched | Passed | api/slice-c-meal-ai.test.ts, unit/insights.test.ts |  |
| Q101 | AI times out twice | Passed | api/slice-c-meal-ai.test.ts |  |
| Q102 | Photo with GPS metadata | Passed | api/slice-c-meal-ai.test.ts, e2e/core.spec.ts, unit/rules.test.ts |  |
| Q103 | Inspect AI request | Passed | api/slice-c-meal-ai.test.ts |  |
| Q104 | Any meal screen | Passed | api/slice-a-meals.test.ts, unit/rules.test.ts |  |
| Q105 | Stool type 7 logged 3 times | Passed | api/slice-bd-pro.test.ts |  |
| Q106 | Start experiment with 3 confirmed days in prior 7 | Passed | api/slice-ef.test.ts |  |
| Q107 | Second experiment while one runs | Passed | api/slice-ef.test.ts |  |
| Q108 | 6 + 7 confirmed days, 5 Yes days | Passed | api/slice-ef.test.ts |  |
| Q109 | 3 Yes days | Passed | api/slice-ef.test.ts |  |
| Q110 | Ended early: I felt worse | Passed | api/slice-ef.test.ts |  |
| Q111 | Card opened twice same day, then day 5 | Passed | api/slice-ef.test.ts, unit/cards.test.ts |  |
| Q112 | Card marked Worse | Passed | api/slice-ef.test.ts, unit/cards.test.ts |  |
| Q113 | Publish card without source link | Partial | unit/cards.test.ts | Publishing rule is enforced in the content schema (tested). The founder publishing screen is not built. |
| Q114 | Free user logs Fever or chills (EP-08a) | Passed | api/slice-a-episodes.test.ts, e2e/core.spec.ts |  |
| Q115 | Free user opens Pro logging fields | Passed | api/slice-a-days.test.ts, api/slice-a-episodes.test.ts |  |
| Q116 | Free user logs bloating on 13 of the last 30 days | Passed | api/slice-a-days.test.ts |  |
| Q117 | FX-02 Yes | Passed | api/slice-ef.test.ts |  |
| Q118 | WB-01 Yes during a swap experiment | Passed | api/slice-ef.test.ts |  |
| Q119 | Swap step reaches 2 weeks | Passed | api/slice-ef.test.ts |  |
| Q120 | Scan UI strings | Passed | unit/rules.test.ts |  |
| Q121 | ML-10 I don't know | Passed | api/slice-c-meal-ai.test.ts |  |
| Q122 | ML-11 Assume usual recipe | Passed | api/slice-c-meal-ai.test.ts, unit/insights.test.ts |  |
| Q123 | Saved dish reused | Passed | api/slice-c-meal-ai.test.ts |  |
| Q124 | Possible triggers with 6 days with | Passed | api/slice-bd-pro.test.ts, unit/insights.test.ts |  |
| Q125 | Next best log suggestion | Passed | api/slice-ef.test.ts |  |
| Q126 | Daily cards | Passed | api/slice-ef.test.ts, unit/cards.test.ts |  |
| Q127 | Before/after scores | Passed | api/slice-ef.test.ts, unit/cards.test.ts |  |
| Q128 | HC-01 coeliac | Passed | api/slice-ef.test.ts |  |
| Q129 | Network inspection on all screens | Partial | e2e/core.spec.ts, unit/rules.test.ts | Browser tests visit 22 screens as a Pro user plus the whole sign-up flow: zero third-party requests, no server errors, no page errors (e2e/core.spec.ts). Not visited by that check: experiment detail, morning review, the sign-in code screen and the public share page. |
| Q130 | Helpline and emergency numbers | Passed | api/slice-a-account.test.ts, unit/rules.test.ts |  |
| Q131 | Ingredient left untouched on the checklist | Passed | api/slice-c-meal-ai.test.ts, unit/insights.test.ts |  |
| Q132 | ML-08 None of these, then one item changed to Had | Passed | api/slice-c-meal-ai.test.ts |  |
| Q133 | Restaurant meal: onion Not sure, dairy Didn't have; rest of day fully known | Passed | unit/insights.test.ts |  |
| Q134 | Onion eaten at 20:00 on day D-1, none on day D | Passed | unit/insights.test.ts |  |
| Q135 | DY-03 Mostly | Passed | unit/insights.test.ts |  |
| Q136 | Possible triggers with 5 groups compared | Passed | unit/insights.test.ts |  |
| Q137 | Difference 1.4 overall but opposite direction in the two halves | Passed | unit/insights.test.ts |  |
| Q138 | Group present on 85% of usable days after 21 days | Passed | unit/insights.test.ts |  |
| Q139 | Free user with 14 logged and 9 confirmed days | Passed | api/slice-a-days.test.ts |  |
| Q140 | User upgrades with 12 free meals in last 7 days | Passed | api/slice-bd-pro.test.ts |  |
| Q141 | Keep an eye on it mode with KM-02 No for dairy | Passed | api/slice-bd-pro.test.ts, unit/insights.test.ts |  |
| Q142 | Every allowed card shown within 14 days | Passed | unit/cards.test.ts |  |
| Q143 | Third swap experiment within 180 days | Passed | api/slice-ef.test.ts |  |
| Q144 | API request for wheat or multi-group experiment | Passed | api/slice-ef.test.ts |  |
| Q145 | User pauses Pro for 2 months | Passed | api/slice-ef.test.ts |  |
| Q146 | User logs an unfollowed habit on 10 days | Passed | unit/insights.test.ts |  |
| Q147 | AI accuracy harness run | Blocked | unit/ai-eval.test.ts | Harness built and unit-tested. The real run needs the 300 dishes, 100 photos and an AI key. No accuracy number is claimed. |
| Q148 | Scan UI, cards and help page | Partial | unit/cards.test.ts, unit/rules.test.ts | Help text matches the stored copy and is now labelled 'Adapted from NHS, Bloating' (rule test blocks any 'word for word' claim). Every published card links a source. Automated source check 17-18 Nov (docs/content/): kiwifruit card draft (broken source), seven cards have proposed corrections awaiting review, CDC page blocks automated checks. Not a human review. |
| Q149 | Restaurant paneer curry: AI lists dairy and chilli, misses garlic; user marks both Had | Passed | unit/insights.test.ts |  |
| Q150 | Home-made meal (ML-06 Home): AI lists dairy only; user marks it Had | Passed | unit/insights.test.ts |  |
| Q151 | Strongest episode starts 11:00; onion eaten at 20:00 the same day | Passed | unit/insights.test.ts |  |
| Q152 | DY-03 Mostly; dairy logged at lunch; no fizzy drinks logged | Passed | unit/insights.test.ts |  |
| Q153 | Kiwifruit experiment requested with FX-03 Yes or not answered | Passed | api/slice-ef.test.ts |  |
| Q154 | Registry consistency check | Passed | unit/rules.test.ts |  |
| Q155 | Bloating on exactly 12 of the last 30 days | Passed | api/slice-a-days.test.ts, unit/rules.test.ts |  |
| Q156 | Bloating on 13 of 30 days; user opens Today | Passed | api/slice-a-days.test.ts |  |
| Q157 | 13 of 30 days; ON-14 50-59 and ON-15 Yes | Passed | api/slice-a-days.test.ts, unit/rules.test.ts |  |
| Q158 | 13 of 30 days; ON-14 skipped, or 40-49, or ON-15 No / Prefer not to say | Passed | api/slice-a-days.test.ts, unit/rules.test.ts |  |
| Q159 | AI request, analytics events and cards for a user with ON-14 / ON-15 / FH-01 / ON-10 answers | Passed | api/slice-c-meal-ai.test.ts, api/slice-ef.test.ts, unit/cards.test.ts |  |
| Q160 | Each EP-08a option selected in turn | Passed | api/slice-a-episodes.test.ts |  |
| Q161 | User selects 'Sudden, severe stomach ache with a swollen tummy' in a country without a listed number | Passed | unit/rules.test.ts |  |
| Q162 | Pro user ticks Abdominal pain in EP-08 twice in one day | Passed | api/slice-bd-pro.test.ts |  |
| Q163 | Blood in poo selected | Passed | api/slice-a-episodes.test.ts |  |
| Q164 | CY-01 visible without ON-10 Cycle context | Passed | api/slice-a-days.test.ts, unit/insights.test.ts |  |
| Q165 | Your cycle with 2 complete cycles logged | Passed | unit/insights.test.ts |  |
| Q166 | Your cycle with 3+ cycles and 7+ usable days per window | Passed | unit/insights.test.ts |  |
| Q167 | ON-10 Perimenopause or menopause selected | Passed | unit/insights.test.ts |  |
| Q168 | Medicine with MD-04 'Iron' started; 9 usable days before and 8 after within 14 days | Passed | unit/insights.test.ts |  |
| Q169 | Medicine change with only 4 usable days after | Passed | unit/insights.test.ts |  |
| Q170 | WK-01 answered on Monday | Passed | api/slice-a-days.test.ts |  |
| Q171 | EP-03 Clothes felt tighter | Passed | api/slice-bd-pro.test.ts |  |
| Q172 | Days with a large meal (ML-04 Large) vs without, 7+ each | Passed | unit/insights.test.ts |  |
| Q173 | Your usual with 14+ confirmed days | Passed | unit/insights.test.ts |  |
| Q174 | Possible-trigger result where 6 of 9 'with' days also had poor sleep | Passed | unit/insights.test.ts |  |
| Q175 | Any comparison result | Passed | api/slice-bd-pro.test.ts |  |
| Q176 | Pro user in week 2, after first possible trigger, and in Keep an eye on it mode | Passed | api/slice-bd-pro.test.ts |  |
| Q177 | 90 days since Pro start | Partial | api/slice-bd-pro.test.ts | A quarterly snapshot is created after 90 days (tested once). The quarterly summary screen is labelled 'later' in the plan and is not built. |
| Q178 | AI result for a photo and for a typed dish | Partial | api/slice-c-meal-ai.test.ts | Typed dishes are tested. Photo labels depend on a real AI provider, which is not connected. |
| Q179 | Doctor PDF generated | Passed | api/slice-bd-pro.test.ts |  |
| Q180 | FH-01 answered | Passed | api/slice-bd-pro.test.ts |  |
| Q181 | HC-04 'Anaemia found' recorded | Passed | api/slice-bd-pro.test.ts |  |
| Q182 | AI provider switched in configuration | Partial | unit/rules.test.ts | Both providers share one fixed schema and the mock passes it. Switching to the real provider is untested (no key). |
| Q183 | AI failure rate above threshold, or a background job stuck | Not implemented | – | AI failure counts show in the founder tools and a failed check is shown plainly to the user (tested under Q130). No automatic alert yet: the plan gives no threshold, so the owner must choose one (DECISIONS.md). |
| Q184 | Security suite: expired export link, revoked share link, deleted account, admin access, restored backup | Partial | api/slice-a-account.test.ts, api/slice-ef.test.ts | Expired export link, revoked share, deleted account and founder access are tested. Restored backup: see Q33. |
| Q185 | Product analytics events | Passed | api/slice-ef.test.ts |  |
| Q186 | Feature registry | Passed | unit/rules.test.ts |  |
| Q187 | Any research or secondary-use request | Not implemented | – | No research or secondary use exists anywhere; a refusal path is not built because there is nothing to request. |
| Q188 | AI accuracy harness | Blocked | unit/ai-eval.test.ts | Harness reports the regional Indian set separately (unit-tested). Real run blocked as Q147. |
| Q189 | Learn library | Partial | api/slice-ef.test.ts, unit/cards.test.ts | All 15 articles are listed with sources, as outlines. The full article texts are not written. |
| Q190 | Monthly AI spending limit reached | Passed | api/slice-c-meal-ai.test.ts |  |
| Q191 | AI spend reaches 50%, 80% and 100% of the monthly limit | Partial | api/slice-c-meal-ai.test.ts | Alerts are created once per level in the founder outbox with no user data (tested). Sending them by email needs Resend, which is not connected. |
| Q192 | 11th AI check by one user within an hour | Passed | api/slice-c-meal-ai.test.ts |  |
| Q193 | 41st AI check by one user in a day | Passed | api/slice-c-meal-ai.test.ts |  |
| Q194 | Dish text of 250 characters | Passed | api/slice-c-meal-ai.test.ts |  |
| Q195 | Photo still over 2 MB after shrinking to 1600px | Passed | unit/rules.test.ts |  |
| Q196 | AI provider returns errors | Passed | api/slice-c-meal-ai.test.ts |  |
| Q197 | Same meal submitted twice with the same save key | Passed | api/slice-c-meal-ai.test.ts |  |
| Q198 | Founder turns the AI kill switch on | Passed | api/slice-c-meal-ai.test.ts |  |
| Q199 | Configuration names a model not on the approved list | Passed | unit/rules.test.ts |  |
| Q200 | One request's cost is 3 times the expected cost or more | Passed | api/slice-c-meal-ai.test.ts |  |
| Q201 | Client bundle, logs and error reports scanned | Partial | unit/rules.test.ts | Source scan for keys and client env use passes. Separate test and live keys cannot be checked: no real key exists yet. |
| Q202 | Pro user opens Your journey | Passed | api/slice-bd-pro.test.ts |  |
| Q203 | Free user taps Your journey | Passed | api/slice-bd-pro.test.ts, e2e/core.spec.ts |  |
| Q204 | ON-16 'Getting ready for a doctor visit' chosen | Passed | api/slice-bd-pro.test.ts |  |
| Q205 | 'Make doctor report' tapped in Your journey | Passed | api/slice-bd-pro.test.ts |  |
| Q206 | ON-16 changed in Me | Passed | api/slice-bd-pro.test.ts |  |
| Q207 | Baseline markers with fewer than 14 confirmed days | Passed | api/slice-bd-pro.test.ts, unit/insights.test.ts |  |
| Q208 | User has never used 'Ate out' or 'Constipated' in 30 days (after 14 days of use) | Passed | api/slice-bd-pro.test.ts |  |
| Q209 | Add meal opened by a user with saved dishes and frequent meals | Passed | api/slice-bd-pro.test.ts |  |
| Q210 | New user signs up | Passed | api/slice-a-account.test.ts |  |
| Q211 | User buys the 3-month plan | Passed | api/slice-ef.test.ts |  |
| Q212 | User picked India at sign-up but pays with a US card | Passed | api/slice-ef.test.ts, unit/rules.test.ts |  |
| Q213 | Price shown on web, iPhone and Android in each country | Passed | unit/rules.test.ts |  |
