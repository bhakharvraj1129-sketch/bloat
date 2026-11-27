# Progress

Last updated: 27 Nov 2026. The **first invited acceptance round** is prepared: experiments off, Pro test access, made-up data only, AI off. Published by run 18 as `35c947b`, **accepted by you** for the fictional-data round, and **frozen**. Nobody has been invited. Working branch `claude/bloat-continuation-9mjd46`; publishing branch `claude/bloat-software-build-uxzoru` (app at `35c947b`; the notes commits after it carry `[skip ci]` and publish nothing). Only a push to the publishing branch runs the publishing workflow.

This file has four parts: **current status** (what is true now, with the evidence), **what remains** (your decisions, launch requirements, tests not yet performed), **your phone checklist**, and **history** (completed work by date, kept as it was then). How the preview is published and run is in `DEPLOYMENT.md`; what was tested, where and on which build is in `docs/verification-report.md`.

## Current status (verified 27 Nov 2026)

| What | State | How it was verified |
|---|---|---|
| **Acceptance-round candidate (testing preview)** | `https://bloat-preview.vercel.app` and the branch address serve commit `35c947b`, Vercel deployment `dpl_LxVJ6VzoY4iswtpfhy78kN3B76jj` (made 27 Nov 06:56 UTC). It has every fix so far (T1 to T4, R1, H1, R2, X1, A1 and this round's) and the round's settings: AI off; Learn, daily cards and experiments off. Plan, limits and the tester documents: `docs/beta/` | Published by the Preview workflow, run 18 (pushed 06:42 UTC, published 06:58, after-checks passed 06:59; first attempt). Vercel reports both preview addresses on this deployment; the 220 repository files Vercel lists for it are byte-identical to `35c947b` (23 of the 29 changed files are among them; the other 6 sit in folders Vercel lists only partly) |
| Main addresses | `bloat-olive.vercel.app`, `bloat-typeshi2.vercel.app` and `bloat-git-main-typeshi2.vercel.app` still show the **older** build `83fe4da` (`dpl_DoAEN2q7gxKTrfvL9pZw1nGGEekn`). Left unchanged, as you asked | Vercel aliases read on 27 Nov after run 18 |
| **Accepted** | You accepted `35c947b` for the planned fictional-data acceptance round (27 Nov) | Your message of 27 Nov |
| **Freeze** | **Frozen.** Nothing more is published, no setting changed, no account created for a tester and nobody invited until you give the testers' details and approve the invitations. Notes-only commits carry `[skip ci]` and cannot publish | Run 18 is the last workflow run (read 27 Nov) |
| **Your decisions of 27 Nov** | 3 to 5 trusted testers, Pro test access without payment, experiments off, made-up data only; AI, photos, Learn, daily cards, payments and public sign-ups stay off; reporting through an existing channel (awaiting your selection) | `DECISIONS.md`, "The owner's decisions since" |
| **This round's fixes** | Experiments switched off everywhere (they were still offered on Today, in the morning review, Possible triggers, History, Your journey, the weekly report, the Pro page and the start page; records already made are kept); the Pro page no longer says "Manage, pause or cancel in Me." to Pro given for testing; no "save your usual dishes" suggestion while AI is off. Each first failed a check on the published code | Below; `TEST_RESULTS.md`, top |
| **Reviews** | All planned reviews are done: Today and logging, History and editing (26 Nov); Patterns, reports and sharing, exports, experiments, Learn, account and settings (26 Nov); and, for this round, the Pro features it keeps (27 Nov). Defects fixed: T1 to T4, R1 and H1, R2, X1 and A1 (26 Nov), and this round's E1 to E4, A1b and S1 (27 Nov): 15 in all. Missing capabilities recorded as decisions, not built: D21 to D24, D30 | Sections below |
| Round settings (Preview variables) | `BLOAT_AI_PROVIDER=off`, `BLOAT_OFF_FEATURES=learn_library,daily_cards,experiments_habit,experiments_swap` (experiments added on 27 Nov before run 18 built), `BLOAT_TEST_LOGIN=0`, `BLOAT_BILLING_PROVIDER=mock`, `BLOAT_SIGN_IN_METHOD=password`; `BLOAT_PRO_TEST_EMAILS` unchanged (testers' addresses are added when you invite them) | Variable changed and read back on 27 Nov |
| Tests on this build | Local on `35c947b`: rule 107, API 157, browser 274 passed on the normal server; the round's 10 API and 3 browser checks passed against a second server with the round's settings (and failed on `da4bb77`, at each defect). CI, run 18 (from its log): rule 107, API 157 and browser 274 passed, and the 6 signed-out live checks before and after publishing; **the round's 10 API and 3 browser checks were skipped in CI** (they need the second server), and the signed-in hosted files are not part of CI, so none of the round's checks counts as a CI pass. **Hosted, signed in, on the deployed candidate:** 27 Nov, 8 synthetic accounts made for the run: the core hosted suite 16 of 16 passed; the round's checks 4 of 4 passed (Free: save lines, empty-time hint, habit deletion, AI and Learn not offered; password change; share links revoked after a correction or deletion; and the new round check: Pro test access says there is no subscription on You and the Pro page, experiments refused on their routes and in a review and linked from no screen, a direct visit says Not available, no dish suggestion, and Possible triggers, Your journey, History, health background, bowel, exercise, Keep an eye on it and the doctor report work). Tests not performed are listed below | `TEST_RESULTS.md`, top |
| Sign-in | Email and password, for accounts you make in Supabase. Sign-ups off in Supabase itself. Test mode off. Testers change their password in You | Hosted checks "nobody can create an account" and the password change |
| Your test account | `bloat-tester@bloat.test` was not used or changed: 1 meal, 1 bloating record with 2 strength readings, 1 report, no share links; last updated 23 Nov 06:25 UTC, last sign-in 23 Nov 04:23 UTC; same password hash; Pro without a purchase; not staff | Read-only check after the hosted run |
| Synthetic test accounts | None remain. The 8 made for the 27 Nov run 18 check were deleted through the app (each answered "deleted"; its old sign-in was refused straight after): no account, identity, session, refresh token, profile, meal, bloating, bowel or exercise record, report, share link, medicine, habit answer or photo left; 0 accounts with a test-run marker; 4 users in all, as before. The run's password file was destroyed | Read-only check after the hosted run |
| Experiment records on `bloat-test` | None existed before the switch (0 experiments, 0 experiment days, 0 checks), so none could be lost; keeping records was checked locally with a seeded experiment | Read-only count, 27 Nov |
| Supabase `bloat-test` | Same six migrations as the repository; no migration needed | Migration list read 27 Nov |
| Real AI, payments, email delivery, sign-ups | Off | Vercel variables read 27 Nov |

**What happens next:** you give the 3 to 5 testers' details (the roster: `docs/beta/tester-roster-template.md`) and your explicit approval to create their accounts. Then the accounts are created, the addresses added to the Pro test list and the workflow run once (`docs/beta/owner-checklist.md`).

## What remains

### Your decisions

All in one table: `DECISIONS.md`, "Open decisions" (D1 to D19), each with what is built now and a recommended default. They are grouped by **who can use the affected feature on the preview today**, not by whether people pay:

- **On now for every signed-in tester (5):** D1 ("Is it still happening?" asks again on every app open), D2 (countries not yet reviewed), D18 (account deletion during a storage outage), D23 (Add activity has no time choice), D24 (editing more than times).
- **On now for everyone, signed out too, on the public pages (3):** D8 ("English only" note), D11 (company name and support address), D12 (legal text).
- **On now for Pro testers (9):** D4, D7, D9, D13, D14, D15, D16, D21 (no screen asks EP-04, "something you suspect"), D22 (no "Looks like ... Is this right?" step after a meal photo).

The former D20 (the message after a failed account deletion) was a wrong message, not a product question: it is fixed (defect P2, below).
- **Not on for anyone (6):** D3, D5, D6, D10, D17, D19 (off, paused, hidden or not built).

- **Before real health data is entered (not needed for a made-up-data round):** D27 (where testers' records live: Supabase free plan without backups, or Pro), D28 (error alerts), D29 (leaked-password protection), D30 (food groups without AI). D11 and D12 above also matter: a contact for testers (for this round: the reporting channel you choose) and a short tester notice. D25 and D26 were decided on 27 Nov.

Settled questions, including the light-only design, are listed under "Settled" and are not reopened. None of D1 to D19 or D21 to D30 has been built yet (D20 is closed; D25 and D26 are decided).

### Launch requirements (before anyone outside is invited)

1. Email-code sign-in with a working email sender (`DEPLOYMENT.md`, "Before inviting anyone outside"). The password sign-in is for testing only.
2. A real AI provider: your approval of a key and a spending limit, then the accuracy test (reference sets: 0 of 300 dishes, 0 of 100 photos so far).
3. Plan gates: legal text (Gate 1); business entity, payment provider and real payments (Gate 2; payments stay off until then); the live project `bloat-live`.
4. Founder tools on a hosted site need a staff address in `BLOAT_STAFF_EMAILS` and an authenticator app.
5. Founder alert emails (Resend) and error monitoring (Sentry): not connected.
6. Google sign-in: off in Supabase, so not exercised (the button is hidden while it is off).
7. Backups with a tested restore, and alert delivery (D27, D28). Not needed for a few invited testers if you accept the weekly steps in `docs/beta/owner-checklist.md`; needed before a public launch.

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
11. The new deletion message on the live preview (it needs a storage failure, which can only be caused locally).
12. On the hosted candidate, signed in, only some of the 26 Nov fixes were exercised (27 Nov): the save lines, the empty-time hint, habit deletion, password change, AI, Learn and cards not offered, and share links revoked after a bloating record is deleted or corrected and after a medicine is deleted. The other cases of R2 (tests, health background, lactose details, family history, context answers), X1 and A1 passed locally and in run 17, not signed in on the hosted preview.
13. The candidate on a real phone, and a tester's own first sign-in from an invitation (nobody is invited). The checklist is `docs/beta/real-phone-checklist.md`.
14. The round's API and browser checks in the publishing workflow: it runs one normal server, so they are skipped there; they ran locally against a second server, and the deployed candidate was checked by the hosted file.

### Account deletion when storage fails (message fixed, P2)

If storage fails while an account is being deleted, the account and the diary are **not** deleted and the person can try again. Photos are removed first, so kept photos removed before the failure stay removed. The sheet used to say "Nothing was deleted", which was wrong in that case. It now says: "We couldn't finish deleting your account. Your account and diary are still available, but some saved meal photos may already have been deleted. Try again to finish." (your wording). How deletion works did not change. Only Pro accounts can keep photos.

### Today and logging review (26 Nov 2026): fixed and published (run 15, `8ef62e7`)

Each defect was reproduced first by a check in `tests/e2e/today.spec.ts` that failed on the current preview code, then fixed. Nothing about what is saved changed; these are messages, focus and one disabled button.

| # | What was wrong | Now |
|---|---|---|
| T1 | A save started on Today said nothing. The sheet closed and, on a phone, the new meal was listed below the fold, so the screen looked the same as before. The plan's wording is "Meal saved." and "Noted: no bloating so far today." After a new strength reading, "Saved" disappeared with the form | A short line under the button that started it: "Bloating saved.", "Noted: no bloating so far today.", "Meal saved.", "Activity saved.", "Exercise saved.", "Bowel movement saved.". It is announced to screen readers, shown only after the server confirms, and cleared when another sheet opens. "Saved" stays after a new reading |
| T2 | "No bloating so far today", an experiment answer (Yes, Partly, No) and "Not useful" remove their own button once saved, and keyboard focus fell back to the page (the same kind of defect as K1) | Focus moves to I feel bloated, to Open experiment, or to the screen title |
| T3 | After "No bloating so far today" the score showed "0 / 10" but a screen reader was told "Nothing logged yet" | Both say 0 out of 10 |
| T4 | With "Earlier" or "Choose time" picked and the date field emptied, Save stayed on and the reply was only "Some answers were not valid." | Save waits for a time, and the field says "Choose a date and time to save." (Log bloating, Bloating ended, Add meal, exercise, bowel movement, and the edit sheets on the day screen) |

Gaps against the plan that need your decision (not built): D21 (EP-04 "something you suspect" is never asked, so "Your suspicion" and the P5 card cannot appear), D22 (no dish confirmation after a meal photo), D23 (no time choice on Add activity).

### History and editing review (26 Nov 2026): fixed and published (run 16, `0ffc99a`)

| # | What was wrong | Now |
|---|---|---|
| R1 | **Privacy rule.** The plan says a deleted or corrected record flags stored reports that used it and revokes their share links (B05; doctor PDF; tests Q54, Q89). Only meals did this. Deleting or correcting a bloating record, deleting a bowel or exercise record, removing a habit answer or changing a review left a shared doctor report live, still showing what had been removed | Every delete and correction flags the stored reports whose dates cover the record and revokes their links, in the same transaction. A flagged report keeps its snapshot unchanged. A weekly report asked for again after a correction is made anew (DECISIONS.md, choice 25, which you can reverse) |
| H1 | A habit answer could not be corrected anywhere: no Edit or Delete on the day screen, and Add activity can only add | Delete on each habit on the day screen; the answer becomes unknown, never "No" |

Gap that needs your decision (not built): D24 (only times, and a meal's name, can be edited; not strength readings, warning signs, symptoms, a meal's portion and ingredients, or bowel and exercise details). Looked at and found as the plan describes: the History list and statuses, Free locked cards, the 7-day average, the chart with Week / Month / All, report links, "your usual" markers, the day screen's sections, the review link for finished days, and "Reload this day" after a conflict. Looked at and found as the plan describes: the Today layout, the progress counter, warning chips, one open episode at a time, update, end with "I don't know", "Is it still happening?" and the Review yesterday steps.

### Patterns, reports, exports, experiments, Learn and account review (26 Nov 2026): fixed and published (run 17, `da4bb77`)

Looked at on a phone screen with 20 days of synthetic records (local): Patterns, Your journey, the weekly report, the doctor report, Experiments, Learn, the daily cards, You, Health background, History and the Pro page. Then the routes behind them.

| # | What was wrong | Now |
|---|---|---|
| R2 | **Privacy rule** (same as R1, plan B05). The doctor report also shows records without a date: medicines, tests, health background, lactose details, family history and the optional context answers. Deleting a medicine or a test, or correcting one of the others, left shared doctor reports live, still showing the old record | Every stored doctor report is flagged and its share links revoked, in the same transaction. Adding new information flags nothing. 6 new checks failed on `0ffc99a`; 15 of 15 staleness checks pass |
| X1 | The export (plan B04: "all owner-visible records") left out four tables the person can read: their report share links, saved ingredient suggestions, product events and export jobs | Added; hashes of link tokens stay out of the file. The file's version label is now `bloat-export-2` |
| A1 | Pro given for testing (no purchase) said "Renews on the end of the period." and offered Pause and Cancel; Pause wrote a billing record for a subscription that does not exist | You says "Switched on for testing. There is no subscription, so nothing renews and nothing is charged." and shows neither button; the server refuses Pause without a subscription (Cancel already did) |

Noted, not changed in this candidate (both small; neither can be reached through the app's own links by the account concerned):

- A Free account that types the doctor report's address sees the whole form, and learns that it is part of Pro only after pressing Preview report. From the app, Free accounts reach Pro features only through locked cards and rows that lead to the Pro page.
- A leftover of A1: an account with Pro given for testing that types the Pro page's address (`/upgrade`) reads "Manage, pause or cancel in Me.", although You no longer offers Pause or Cancel to it. Nothing in the app links a Pro account to that page. The fix is one line (say "Switched on for testing" there too); it was found after the candidate had been published and verified, so it waits for the next publish rather than a new publish and a new hosted run now.

Looked at and found as the plan describes: possible triggers with day counts, both halves and the "not a medical measure" line; Your journey; the weekly report with the NHS line; the doctor report's sections and share links (made, opened signed out, revoked); Experiments (one at a time, each with its source, "Check with your doctor before changing your diet. Stop if you feel worse."); Learn and the cards (outlines and unreviewed drafts, which is why the beta switches them off); units, time zone, medicines, export and delete account in You.

### Invited beta candidate without AI (26 and 27 Nov 2026)

Prepared with your approval, published by run 17, frozen. Everything was put in `docs/beta/` (rewritten for the acceptance round on 27 Nov, below). Two new switches (DECISIONS.md, choice 26), a password change for testers (choice 27) and A1 (choice 28). Nobody was invited, no domain was moved, sign-ups stay off, payments stay off.

### First invited acceptance round (27 Nov 2026): fixed and published (run 18, `35c947b`)

Your decisions: 3 to 5 trusted testers, Pro test access without payment, experiments off, made-up data only. Experiments went off with the existing switch (`BLOAT_OFF_FEATURES`). The experiment routes already refused; the screens below did not, which the round's checks showed on the published code `da4bb77` before the fix.

| # | What was wrong (with experiments switched off) | Now |
|---|---|---|
| E1 | Today showed a running experiment, its daily question and an Experiments shortcut; the morning review asked about it and the server accepted and saved the answer | Not shown or asked; an answer sent anyway is refused ("not available"). The experiment record stays as it was |
| E2 | Possible triggers offered "Try an experiment" and an Experiments button; History linked to experiments | No offer, button or link |
| E3 | Your journey's next step said "A short experiment can test one pattern at a time." and linked to experiments; the weekly report said the experiment was running | No experiment next step; earlier experiments still listed, without links; the weekly report shows none running |
| E4 | The Pro page listed "Habit and food-swap experiments"; the start page listed "Possible triggers and experiments" and "Ingredient check and saved dishes" | Left out (the start page says "Possible triggers") |
| A1b | The Pro page said "Manage, pause or cancel in Me." to Pro given for testing (the leftover of A1, reported on 27 Nov) | "Switched on for testing. There is no subscription, so nothing renews and nothing is charged." |
| S1 | With AI off, Today suggested "Try saving your usual dishes so meals are one tap.", which nobody can do without the ingredient step | Not suggested while AI is off |

A direct visit to an experiment page says "Not available" with a link to Today. Judgement calls (DECISIONS.md, choices 29 and 30) are easy to reverse.

**Review of the Pro features this round keeps** (local, round's settings, two made-up accounts with 15 days each): Today, Possible triggers, Your journey, the weekly report, the doctor report and preview, You, Health background, History, a day, the Pro page, the meal sheet. No console errors or failed requests. Besides S1, one missing capability, recorded as **D30**: typed meals carry no food groups without the ingredient step, so in normal logging Possible triggers compares habits only; Keep an eye on it mode still compares up to 5 food groups. The tester guide says so.

**Tester documents** (`docs/beta/`): `tester-guide.md`, `feedback-template.md`, `real-phone-checklist.md`, `owner-checklist.md` (replaces the runbook), `README.md`. No support address is invented: testers report to the person who invited them, through an existing channel that is **awaiting your selection**. The guide and form are also on a private page you can share: https://claude.ai/artifact/BPVEopLxQwbCRMfhNZBdv8.

## Owner checklist: the main journeys on your phone

Use `https://bloat-preview.vercel.app` and your test account `bloat-tester@bloat.test`. Type made-up entries only, never real health details. Tick each line only if you saw the result written after the arrow.

1. Open the address in your phone's browser. → The homepage shows "Sign in", not "Get started". No Vercel login page.
2. Sign in. → You land on Today. Pull to refresh → you are still signed in.
3. Log bloating, pick a strength, Save. → "Bloating saved." under the button, and it shows on Today as "Bloating ongoing". Update strength. → "Saved", and the new reading is listed. End it. → "Bloating ended" with how long it lasted.
4. Add a meal (type a dish), then Save. (The ingredient check and photos are switched off in the beta candidate.) → "Meal saved." under Add meal; the meal shows in "Today so far" and on History.
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
- Today and logging review: four defects found and fixed (T1 to T4, above); three gaps recorded as decisions D21 to D23. With your yes, published by run 15 as `8ef62e7` (`dpl_EZyj38upABHtKaQidLokQB4n6cxo`). Its first attempt stopped before any app test (port 54324 already in use on GitHub's machine; nothing published); the re-run passed and published. The main addresses were not moved.
- History and editing review: two defects found and fixed locally (R1, H1, above); one gap recorded as D24. Not published: the push to the publishing branch was held back because your yes covered the Today fixes only.
- A full work report for this session: `docs/session-reports/2026-11-26-work-report.md`.
- With your approvals (later on 26 Nov): the History fixes were published by run 16 (`0ffc99a`, `dpl_CoBNVMnW…`). The review of Patterns, reports and sharing, exports, experiments, Learn and account settings found R2, X1 and A1 (above). The invited beta candidate without AI was prepared (`docs/beta/`). A new branch `claude/unzip-push-main-04req7`, made by someone else and pointing at an old planning commit, was left untouched.

### 27 Nov 2026

- Set the two beta variables on Vercel (Preview only), then published `da4bb77` through the workflow (run 17, `dpl_DMcN8fjTd9f99QHXjxA5Rc7uerhR`). The main addresses were not moved.
- So that the signed-in hosted checks could reach `bloat-test`, this cloud session's network settings were widened to allow its Supabase address (your approval of the hosted run; it changes nothing in the app).
- Hosted run on the deployed candidate with 8 synthetic accounts made for it (marked as test-run accounts, password kept only in a private file that was destroyed afterwards): core suite 16 of 16 and beta checks 3 of 3 passed. All 8 accounts were deleted through the app and checked gone. `bloat-tester` was not used and is unchanged.
- Frozen for your acceptance.
- Later on 27 Nov, your decisions for the first invited acceptance round. Experiments switched off with the existing switch (`BLOAT_OFF_FEATURES` on Vercel, Preview), and the screens that still offered them fixed (E1 to E4), with the Pro page wording (A1b) and the dish suggestion (S1), each first failing a check on `da4bb77`. Review of the Pro features this round keeps; D30 recorded. Tester documents in `docs/beta/` and on a private page. Run 18 published `35c947b` as `dpl_LxVJ6VzoY4iswtpfhy78kN3B76jj` (06:58 UTC); the main addresses were not moved. Hosted run with 8 synthetic accounts: core suite 16 of 16, the round's checks 4 of 4; the accounts deleted through the app and checked gone; `bloat-tester` unchanged. No migration. No tester account made, nobody invited. Frozen.
- You accepted `35c947b` for the fictional-data round. Documentation-only corrections (`[skip ci]`): the tester guide now describes account deletion as it works (including a failed or interrupted deletion and the deletion record that is kept), says which day the morning review scores, and puts the food-comparison limit in its own section near the top; shareable copies in `docs/beta/share/` (PDF, HTML file, plain text); a first-session checklist and a tester roster template; the notes say plainly that the round's checks ran locally and live and were skipped in CI. Nothing published, no account created, nobody invited.

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
