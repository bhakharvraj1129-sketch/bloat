# Progress

Last updated: 26 Nov 2026 (Today and logging review: four defects found and fixed locally, **not yet published**; the preview still serves `f8fcd9d`). The fixes are on branch `claude/bloat-continuation-9mjd46`; only a push to `claude/bloat-software-build-uxzoru` runs the publishing workflow.

This file has four parts: **current status** (what is true now, with the evidence), **what remains** (your decisions, launch requirements, tests not yet performed), **your phone checklist**, and **history** (completed work by date, kept as it was then). How the preview is published and run is in `DEPLOYMENT.md`; what was tested, where and on which build is in `docs/verification-report.md`.

## Current status (verified 26 Nov 2026)

| What | State | How it was verified |
|---|---|---|
| Testing preview | `https://bloat-preview.vercel.app` and the branch address serve commit `f8fcd9d`, Vercel deployment `dpl_7N1RRQjq8qFDNmw9x3ihfcxk9iBD`. Today's two fixes are in it: keyboard focus after a sheet closes (K1) and the message after a failed account deletion (P2) | Published by the Preview workflow, run 14 (24 Nov, 09:56 UTC), after all its checks passed. Vercel reports both addresses on this deployment; all 210 source files Vercel lists for it match the commit, and the two changed files it does not list were found in it by content fingerprint |
| Main addresses | `bloat-olive.vercel.app`, `bloat-typeshi2.vercel.app` and `bloat-git-main-typeshi2.vercel.app` still show an **older** build, `83fe4da` (`dpl_DoAEN2q7gxKTrfvL9pZw1nGGEekn`), **without the K1 and P2 fixes**. They were pointed there by hand on 24 Nov (your decision; not a launch). The workflow moves only the two preview addresses, so they stay there until you ask for them to be moved. Same settings as the preview: `bloat-test`, mock AI, mock billing, test mode off | Vercel address list read before run 13 and after runs 13 and 14 (`test-evidence/ledger/deploy-7N1R.txt`) |
| **Freeze** | **Frozen again for your feature-by-feature review.** Nothing is published unless you send a reproducible issue; a fix then goes through the same workflow and gets its own entry in the report. Notes-only commits carry `[skip ci]` and cannot publish | No workflow run and no new deployment since run 14 (GitHub run list and Vercel deployment and address lists read on 26 Nov) |
| **Today and logging review (26 Nov)** | Four defects found and fixed, **local only, not published** (T1 to T4, below, under "Today and logging review"). Three gaps against the plan need your decision: D21, D22, D23 | New checks `tests/e2e/today.spec.ts`: 6 failed on the old build, 6 passed on the fixed build. Full local results in `TEST_RESULTS.md` |
| Tests on this build | Local on `f8fcd9d`: rule 97 passed, API 141 passed, browser 261 passed; 0 expected failures, 0 skipped, 0 failed. CI (run 14): all checks passed, incl. 6 live checks before and after publishing. Live signed-in checks ran on the build before (`9c6ed14`, which differs only in the deletion message): full hosted suite 16 passed, 0 skipped, and the keyboard-focus check 1 passed. Tests not performed are listed below, never counted as passed | `docs/verification-report.md`, top, and `TEST_RESULTS.md` |
| Sign-in | Email and password, for accounts you make in Supabase. Sign-ups are off in Supabase itself. Test mode is off (`BLOAT_TEST_LOGIN=0`) | Hosted check "nobody can create an account" passed on this build; Vercel variables read on 24 Nov |
| Your test account | `bloat-tester@bloat.test` exists, with its sample meal, bloating record and report; Pro without a purchase; not staff | Read-only fingerprint identical before and after the hosted run and before and after run 14, 24 Nov |
| Synthetic test accounts | None remain. The 8 made for the 24 Nov run were deleted through the app and checked gone | Read-only check after the run (24 Nov): 0 accounts with a test marker, photo bucket empty |
| Publishing | Only the Preview workflow moves the preview, after its checks pass. Its `VERCEL_TOKEN` secret is in place (since 22 Nov) | Runs 6, 9, 10, 11, 12, 13 and 14 published; Vercel lists no other deployment since `af950f5` |
| Real AI, payments, email delivery, sign-ups | Off: labelled mock AI (no AI key in the project), mock billing, no custom email sender, sign-ups off | Vercel variables read on 24 Nov; no Production variables exist |

**What happens next:** you review the preview feature by feature and send reproducible issues. Each one is reproduced by a test, fixed in a focused commit and published through the workflow.

## What remains

### Your decisions

All in one table: `DECISIONS.md`, "Open decisions" (D1 to D19), each with what is built now and a recommended default. They are grouped by **who can use the affected feature on the preview today**, not by whether people pay:

- **On now for every signed-in tester (4):** D1 ("Is it still happening?" asks again on every app open), D2 (countries not yet reviewed), D18 (account deletion during a storage outage), D23 (Add activity has no time choice).
- **On now for everyone, signed out too, on the public pages (3):** D8 ("English only" note), D11 (company name and support address), D12 (legal text).
- **On now for Pro testers (9):** D4, D7, D9, D13, D14, D15, D16, D21 (no screen asks EP-04, "something you suspect"), D22 (no "Looks like ... Is this right?" step after a meal photo).

The former D20 (the message after a failed account deletion) was a wrong message, not a product question: it is fixed (defect P2, below).
- **Not on for anyone (6):** D3, D5, D6, D10, D17, D19 (off, paused, hidden or not built).

Settled questions, including the light-only design, are listed under "Settled" and are not reopened. None of D1 to D19 or D21 to D23 has been built yet (D20 is closed).

### Launch requirements (before anyone outside is invited)

1. Email-code sign-in with a working email sender (`DEPLOYMENT.md`, "Before inviting anyone outside"). The password sign-in is for testing only.
2. A real AI provider: your approval of a key and a spending limit, then the accuracy test (reference sets: 0 of 300 dishes, 0 of 100 photos so far).
3. Plan gates: legal text (Gate 1); business entity, payment provider and real payments (Gate 2; payments stay off until then); the live project `bloat-live`.
4. Founder tools on a hosted site need a staff address in `BLOAT_STAFF_EMAILS` and an authenticator app.
5. Founder alert emails (Resend) and error monitoring (Sentry): not connected.
6. Google sign-in: off in Supabase, so not exercised (the button is hidden while it is off).

### Tests not yet performed

1. Real phones (iOS Safari, Android Chrome), and any screen reader (VoiceOver, TalkBack, NVDA): none performed. (200% browser zoom and keyboard-only journeys pass in desktop Chromium, locally; keyboard focus after a sheet closes also passes live.)
2. A real AI provider (photo and typed dish).
3. Founder tools on the hosted preview (no staff account there, by design).
4. On the hosted preview: the doctor reminder in History, the experiment answer on Today and "Not useful" on Today (they need several days of records; checked locally and by the workflow).
5. On the hosted preview, the failure cases that can only be forced on a local database: a storage outage during account deletion and a refused write in the recalled-meals offer. Both pass locally, including a partial photo removal.
6. The control crawl, the link-by-link navigation run and the five-width check on the final build (last run on 22 Nov, app code `2f22cc4`).
7. Whether Vercel's Ignored Build Step really blocks a Git build (configured and read back by every run; not proven).
8. A real backup restore on `bloat-test` (re-applying deletions after a restore is checked locally only).
9. The 19 screens without approved designs have not been compared with designs (only the 20 Slice A screens have them).
10. Any check on the three main addresses after 23 Nov (they serve `83fe4da`, which was tested on 23 Nov).
11. The signed-in hosted suite on the final build `f8fcd9d` (it ran on `9c6ed14`), and the new deletion message on the live preview (it needs a storage failure, which can only be caused locally).
12. The 26 Nov Today fixes (T1 to T4) on the hosted preview: they are not published yet.

### Account deletion when storage fails (message fixed, P2)

If storage fails while an account is being deleted, the account and the diary are **not** deleted and the person can try again. Photos are removed first, so kept photos removed before the failure stay removed. The sheet used to say "Nothing was deleted", which was wrong in that case. It now says: "We couldn't finish deleting your account. Your account and diary are still available, but some saved meal photos may already have been deleted. Try again to finish." (your wording). How deletion works did not change. Only Pro accounts can keep photos.

### Today and logging review (26 Nov 2026): fixed locally, not published

Each defect was reproduced first by a check in `tests/e2e/today.spec.ts` that failed on the current preview code, then fixed. Nothing about what is saved changed; these are messages, focus and one disabled button.

| # | What was wrong | Now |
|---|---|---|
| T1 | A save started on Today said nothing. The sheet closed and, on a phone, the new meal was listed below the fold, so the screen looked the same as before. The plan's wording is "Meal saved." and "Noted: no bloating so far today." After a new strength reading, "Saved" disappeared with the form | A short line under the button that started it: "Bloating saved.", "Noted: no bloating so far today.", "Meal saved.", "Activity saved.", "Exercise saved.", "Bowel movement saved.". It is announced to screen readers, shown only after the server confirms, and cleared when another sheet opens. "Saved" stays after a new reading |
| T2 | "No bloating so far today", an experiment answer (Yes, Partly, No) and "Not useful" remove their own button once saved, and keyboard focus fell back to the page (the same kind of defect as K1) | Focus moves to I feel bloated, to Open experiment, or to the screen title |
| T3 | After "No bloating so far today" the score showed "0 / 10" but a screen reader was told "Nothing logged yet" | Both say 0 out of 10 |
| T4 | With "Earlier" or "Choose time" picked and the date field emptied, Save stayed on and the reply was only "Some answers were not valid." | Save waits for a time, and the field says "Choose a date and time to save." (Log bloating, Bloating ended, Add meal, exercise, bowel movement, and the edit sheets on the day screen) |

Gaps against the plan that need your decision (not built): D21 (EP-04 "something you suspect" is never asked, so "Your suspicion" and the P5 card cannot appear), D22 (no dish confirmation after a meal photo), D23 (no time choice on Add activity). Looked at and found as the plan describes: the Today layout, the progress counter, warning chips, one open episode at a time, update, end with "I don't know", "Is it still happening?" and the Review yesterday steps.

## Owner checklist: the main journeys on your phone

Use `https://bloat-preview.vercel.app` and your test account `bloat-tester@bloat.test`. Type made-up entries only, never real health details. Tick each line only if you saw the result written after the arrow.

1. Open the address in your phone's browser. → The homepage shows "Sign in", not "Get started". No Vercel login page.
2. Sign in. → You land on Today. Pull to refresh → you are still signed in.
3. Log bloating, pick a strength, Save. → It shows on Today as "Bloating ongoing". Update strength. → The new reading is listed. End it. → "Bloating ended" with how long it lasted. (Once the 26 Nov fixes are published: "Bloating saved." under the button, and "Saved" after the new reading.)
4. Add a meal (type a dish). If the ingredient check is offered, run it, then Save. → The meal shows in "Today so far" and on History. (Once the 26 Nov fixes are published: "Meal saved." under Add meal.)
5. History: open today, edit the meal's text, Save. Then delete it. → After a refresh it is gone.
6. Log a bowel movement and some exercise (Pro). Delete one of them from the day screen. → It is gone after a refresh.
7. Patterns and Experiments: open both. → Patterns shows charts or says there is not enough yet; on Experiments, "Choose" is greyed out with a reason until you have 4 confirmed days in the past week.
8. You: change units; add a medicine, then remove it. → Each shows "Saved" and stays after a refresh.
9. Doctor report: make one with Medicines and Health switched off. → The preview leaves both out. Create a share link, open it in a private tab (it opens), revoke it, reload the private tab (it no longer opens).
10. Export JSON and CSV. → Both files download and open.
11. Back: use the app's Back and your phone's Back on a few screens, and with a sheet open. → You return to the screen you came from; an open sheet closes first.
12. Turn on flight mode, try to save a meal. → A clear message and your text is kept. Turn flight mode off, tap Save again. → It saves once (one entry, not two).
13. Sign out, then press Back. → You see Sign in, not your entries.

Do not use "Delete my account" on `bloat-tester@bloat.test`: it removes the account and its sample records for good. To change its password, use `DEPLOYMENT.md`, "Change the test account's password": that keeps the account and every record.

## Built and tested

| Slice | What | Tested by |
|---|---|---|
| Foundation | 56 tables with row-level security, server-only writes, idempotent saves, time-zone rules, design tokens, installable app shell | `tests/api/privacy.test.ts`, `tests/unit/rules.test.ts` |
| A Core diary | Landing, country, waitlist, help page, sign-in, consent, setup, Today, log/ongoing/end/still-happening, warning signs, meals, morning review, Bloat Score, History, day detail, edit, delete, export, delete account | `tests/api/slice-a-*.test.ts`, `tests/e2e/core.spec.ts` |
| B Habits and Pro | Habit taps, periods, medicines, bowel and exercise logs, Pro episode detail, server Pro locking | `tests/api/slice-bd-pro.test.ts` |
| C Meal AI | Text and photo check behind a provider layer, three-state answers, saved dishes, recalled check, spending limit, alerts, rate limits, retry rule, kill switch | `tests/api/slice-c-meal-ai.test.ts` |
| D Insights and reports | Coverage, previous-evening window, possible triggers, Your usual, baseline markers, cycle, medicine before/after, Personal Focus, next best log, charts, weekly report, Your journey, doctor PDF and share links, Keep an eye on it | `tests/unit/insights.test.ts`, `tests/api/slice-bd-pro.test.ts` |
| E Experiments and learning | 7 habit and 5 swap experiments with safety and wellbeing checks, daily cards, Learn library, What helps you | `tests/api/slice-ef.test.ts`, `tests/unit/cards.test.ts` |
| F Account and subscriptions | Mock billing with idempotent, ordered webhook; pause, resume, cancel; privacy-safe events; founder tools | `tests/api/slice-ef.test.ts` |

Screens: 39 of the plan's 39 have a working screen. The approved designs exist only for the 20 Slice A screens; the other 19 follow the same tokens and rules and have not been checked against approved designs.

## History: completed work by date

These entries record what was done and true **on that date**. Later work may have changed them; where an entry said something was still pending, a note in brackets says how it ended. For what is true now, use "Current status" above.

### 26 Nov 2026

- Started from a new Claude account. Checked the handoff against the repository, Vercel, GitHub and Supabase with this session's own access: D20 had already been fixed and published (P2, run 14), and the stale notes it mentioned had already been corrected. The preview addresses serve `dpl_7N1RRQjq8qFDNmw9x3ihfcxk9iBD` (`f8fcd9d`), the three main addresses still serve `dpl_DoAEN2q7gxKTrfvL9pZw1nGGEekn` (`83fe4da`), run 14 is the last workflow run, and `bloat-test` has the same six migrations as the repository. The `bloat-olive` bypass link expired on 24 Nov at 18:48 UTC. `bloat-tester` was not opened or changed.
- Local suites on `f8fcd9d` in a fresh session: rule 97, API 141, browser 261, all passed.
- Today and logging review: four defects found and fixed locally (T1 to T4, above); three gaps recorded as decisions D21 to D23. Not published.

### 24 Nov 2026

- Fixed P2 (formerly decision D20): after a failed account deletion the sheet said "Nothing was deleted", though kept photos removed before the failure stay removed. It now shows your wording on any server failure; a refusal before anything is removed still says nothing was deleted. Deletion itself is unchanged. The storage-down and partial-removal checks (API and screen) now check the message and the successful retry; they failed on the build before. Published as `f8fcd9d` (run 14); deployed source checked against the commit; `bloat-tester` untouched; the main addresses not moved. Stale notes corrected (K1 fixed; 200% zoom tested in desktop Chromium only; `CLAUDE.md` tells the preview apart from the main addresses). Frozen again.
- Fixed K1, found during the freeze: when a save removed the button that opened a sheet, keyboard focus fell back to the page. Focus now goes to the same button, else its replacement ("I feel bloated" and "Bloating ongoing" swap), else the section heading, else the screen title, and never takes focus back once the person moves on. The expected-failure check became 5 ordinary checks that also press Tab once. Published as `9c6ed14` (run 13); hosted suite 16 of 16 and a live keyboard-focus check passed; the 8 synthetic accounts were deleted and checked gone; `bloat-tester` untouched. The three main addresses were not moved (still `83fe4da`). The preview was then frozen again.
- Reporting corrected: the freeze-time browser count "256 of 256" counted the K1 expected failure as a pass (it was 255 passed and 1 expected failure); results now list passed, expected failure, skipped and not performed separately. The decisions table is grouped by who can use each feature now.

### 23 Nov 2026

- During the freeze (local only, no publish): the two failure tests (storage failure during account deletion, now including a partial removal; a failure midway through the recalled-meals offer, with rollback and a duplicate-free retry) pass on the frozen code. Keyboard-only journeys and 200% browser zoom tested; one defect found (K1; fixed on 24 Nov). The open owner questions became one table in `DECISIONS.md`.
- Fixed the four defects of the external report (B1 to B4), published as `0d537d2` (run 9) and re-checked live.
- Ran the full signed-in hosted suite on that build with 7 synthetic accounts: 16 of 16; the accounts were deleted and checked gone.
- Checked the 12 remaining actions of report section 5 on the screen. Three buttons showed nothing when their save failed; fixed in `7713098` (run 10).
- Reconciled every test count with the raw results. Fixed three more defects: the recalled-meals offer could be left half-saved, export said "check your connection" for a server error, founder tools sent two changes on a double tap. Published as `62431c7` (run 11); hosted suite 16 of 16.
- Deleting an account could leave kept photos in storage if storage failed. Photos are now removed first, with retries, and the account is deleted only when they are gone. Published as `83fe4da` (run 12); hosted suite 16 of 16; a live check kept 2 synthetic photos and saw them removed with the account. The preview was then frozen.

### 22 Nov 2026 (afternoon and evening): closing the gaps, publishing gate

Application commit `2f22cc4`.
1. The open actions from the morning were checked on the screen, three ways each (saves and persists, failure shown with retry, double tap saves once): "Is it still happening?", deleting bloating and bowel records, experiment daily answer, End early, weekly check, add back, resume, Learn "Un-hide", meal with ingredient check, share link create and revoke, account deletion. 51 actions in all, 159 of 159 passed.
2. Four defects found and fixed: no retry for a failed ingredient check; an experiment's End error hidden behind its sheet; account deletion with a lost reply ending at Sign in; and the Pro coverage endpoint, which `.gitignore` had kept out of every commit (found by the first CI run on a clean checkout).
3. What a deleted account's earlier tokens can still do was measured locally (report, section 6).
4. Publishing gate: Vercel's automatic builds off; the Preview workflow publishes only after the checks pass. (Its `VERCEL_TOKEN` secret was added by the owner the same evening; run 6 was the first publish.)
5. (The signed-in hosted checks and the clean-up of the 19 earlier temporary accounts were completed the same evening: the owner ran the guarded deletion, verified with read-only queries; hosted suite 15 of 15 on `adfe49b`.)

### 22 Nov 2026 (morning): verification round 1

See `docs/verification-report.md`. Outcomes checked, not just clicks: 37 save and edit actions (data change, refresh, failure with retry, double tap), and 238 link clicks (destination and Back) at phone and desktop width. Four defects found and fixed (hidden delete failure, experiments offered before they could start, two Back cases, sign-in steps left in history). The owner switched Supabase sign-ups off and made `bloat-tester@bloat.test`; the sign-up check passes and the owner's own sign-in journey was confirmed from server records.

### 19 Nov 2026 (afternoon): Bloat / Silver design applied

The owner attached the design package; it is in `docs/design/silver/`. Applied to the whole app:
1. Tokens: white, silver grey and black (`src/app/globals.css`, `docs/design/tokens.json` v2), system fonts, 12px controls, 20px cards, 3px ink focus ring, light theme only (DECISIONS.md, engineering choice 21).
2. Shared parts restyled once: buttons, options (selected = black with a tick), strength scale, score marks, cards, inputs, warning-sign advice (red kept, with an icon), sheets (bottom sheet on phones, centred dialog from tablet width).
3. New frames: signed-in sidebar from 768px and four bottom tabs on phones (Today, History, Patterns, You); public header with a phone menu listing every public page; footer.
4. Screens: homepage ("Sign in" while sign-ups are closed), new About page, Privacy, Terms, Contact and How Bloat works as reading pages, sign-in and country screens as a centred card, setup, Today as a two-column dashboard on desktop.
5. Defect found and fixed: filled link buttons had text in the same colour as their fill on the live site. A browser test now checks every filled control.
6. A dedicated address for the testing preview: `https://bloat-preview.vercel.app`. The production address `bloat-olive.vercel.app` stays unused: no production site.

### 19 Nov 2026 (morning): navigation and action repairs

1. Control ledger: a crawler lists and presses every control on 30 screens for signed-out, Free and Pro visitors (740 rows). Fixed build: 620 pass, 0 fail, 49 checked by named tests, 71 listed. Earlier build with the same crawler: 19 fail. See `docs/control-ledger.md`.
2. 14 defects reproduced first, then repaired: contextual Back with a safe parent; phone Back closes sheets; focus returns to the opener; setup steps in history; "close without saving?" and "leave without saving?"; honest "Check save status"; health background no longer hides failures; recall screen asks before turning on the AI check; confirm before withdraw and remove; single export on double tap; return to the same screen after an expired session; inline form messages; Help page Back on a direct link; profile switches that stay put while saving.
3. Every save button now uses the shared save hook: "Saving…", locked against double taps, clear error, and "Check save status" after a lost reply.
4. Five widths (320, 390, 768, 1024, 1440): no sideways scrolling on any of 23 screens.
(The design package could not be opened that morning; the owner attached it the same afternoon and it was applied, above.)

### 18 Nov 2026 (afternoon): email-and-password sign-in

1. `BLOAT_SIGN_IN_METHOD` switch: `password` on the preview, `email_code` (default) everywhere else. Only one sign-in is ever shown.
2. Sign-in form: email and password, accessible field errors, one generic "Email or password is incorrect." message, loading state, password cleared after each try, no way for the password to land in a URL.
3. No sign-up in the app; signed-in visitors are sent on; the 18+ confirmation is kept before setup.
4. The hosted test suite signs in through the real form and checks wrong details, refresh, sign-out (including that an older session's token stops working) and that nobody can create an account.
5. Hosted Supabase settings checked: Site URL and redirect are the preview's `/auth/callback`; custom SMTP is off. (Sign-ups were still on at the time; the owner switched them off on 22 Nov.)

### 18 Nov 2026 (morning)

1. Doctor report privacy: switched-off sections appear nowhere (summary, preview, PDF, shared page, old stored reports).
2. Exports: never partial, stable paging, clear retry, row counts.
3. Content: "Adapted from NHS, Bloating" everywhere; kiwifruit experiment paused and card kept as a draft; proposed source-backed corrections written for review.
4. Email sign-in screens: real failures shown, resend with the right cooldown, no account enumeration; Google button only when Google is on.
5. Public preview: test mode off, designated Pro test accounts, deployment protection removed, verified in a fresh browser.
6. Signed-in users can no longer call the 14 server functions; duplicate Vercel project's builds skipped; migration history reconciled.

## Later (ideas not in the plan, so not built)

(empty)
