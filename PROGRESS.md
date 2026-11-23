# Progress

Last updated: 23 Nov 2026 (documentation cleanup). Branch: `claude/bloat-software-build-uxzoru`.

This file has four parts: **current status** (what is true now, with the evidence), **what remains** (your decisions, launch requirements, tests not yet performed), **your phone checklist**, and **history** (completed work by date, kept as it was then). How the preview is published and run is in `DEPLOYMENT.md`; what was tested, where and on which build is in `docs/verification-report.md`.

## Current status (verified 23 Nov 2026)

| What | State | How it was verified |
|---|---|---|
| Testing preview | `https://bloat-preview.vercel.app` and the branch address serve commit `83fe4da`, Vercel deployment `dpl_DoAEN2q7gxKTrfvL9pZw1nGGEekn` | Published by the Preview workflow, run 12 (23 Nov, 15:36 UTC), after all its checks passed. Vercel reports both addresses on this deployment, and all 209 source files Vercel lists for it match the commit |
| **Freeze** | **Frozen for your feature-by-feature review.** Nothing is published unless you send a reproducible issue; a fix then goes through the same workflow and gets its own entry in the report. Notes-only commits carry `[skip ci]` and cannot publish | No workflow run and no new deployment since run 12 |
| Tests on this build | Local: rule 97 of 97, API 140 of 140, browser 251 of 251. CI (run 12): all checks passed. Live: full hosted suite 16 of 16 with 7 fresh synthetic accounts, plus a live check of export messages and of kept photos being removed with the account | `docs/verification-report.md`, top, and `TEST_RESULTS.md` |
| Sign-in | Email and password, for accounts you make in Supabase. Sign-ups are off in Supabase itself. Test mode is off (`BLOAT_TEST_LOGIN=0`) | Hosted check "nobody can create an account" passed on this build; Vercel variables read on 23 Nov |
| Your test account | `bloat-tester@bloat.test` exists, with its sample meal, bloating record and report; Pro without a purchase; not staff | Read-only fingerprint identical before and after every hosted run on 23 Nov |
| Synthetic test accounts | None remain. Every set made for a hosted run was deleted through the app and checked gone | Read-only check after the last run (23 Nov): 0 accounts with a test marker |
| Publishing | Only the Preview workflow moves the preview, after its checks pass. Its `VERCEL_TOKEN` secret is in place (since 22 Nov) | Runs 6, 9, 10, 11 and 12 published; Vercel lists no other deployment since `af950f5` |
| Real AI, payments, email delivery | Off: labelled mock AI (no AI key in the project), mock billing, no custom email sender | Vercel variables read on 23 Nov |

**What happens next:** you review the preview feature by feature and send reproducible issues. Each one is reproduced by a test, fixed in a focused commit and published through the workflow.

## What remains

### Your decisions

All in one table: `DECISIONS.md`, "Open decisions" (D1 to D19), each with what is built now, a recommended default and when it is needed. One affects your own testing: D1 ("Is it still happening?" asks again on every app open). Eleven are needed before an outside beta (D2 to D12; D6 does not block anything) and seven before a paid launch (D13 to D19). Settled questions, including the light-only design, are listed under "Settled" and are not reopened.

### Launch requirements (before anyone outside is invited)

1. Email-code sign-in with a working email sender (`DEPLOYMENT.md`, "Before inviting anyone outside"). The password sign-in is for testing only.
2. A real AI provider: your approval of a key and a spending limit, then the accuracy test (reference sets: 0 of 300 dishes, 0 of 100 photos so far).
3. Plan gates: legal text (Gate 1); business entity, payment provider and real payments (Gate 2; payments stay off until then); the live project `bloat-live`.
4. Founder tools on a hosted site need a staff address in `BLOAT_STAFF_EMAILS` and an authenticator app.
5. Founder alert emails (Resend) and error monitoring (Sentry): not connected.
6. Google sign-in: off in Supabase, so not exercised (the button is hidden while it is off).

### Tests not yet performed

1. Real phones (iOS Safari, Android Chrome), and any screen reader (VoiceOver, TalkBack, NVDA): none performed. (200% browser zoom and keyboard-only journeys were tested locally on 23 Nov; see below.)
2. A real AI provider (photo and typed dish).
3. Founder tools on the hosted preview (no staff account there, by design).
4. On the hosted preview: the doctor reminder in History, the experiment answer on Today and "Not useful" on Today (they need several days of records; checked locally and by the workflow).
5. On the hosted preview, the failure cases that can only be forced on a local database: a storage outage during account deletion and a refused write in the recalled-meals offer. Both pass locally, including a partial photo removal.
6. The control crawl, the link-by-link navigation run and the five-width check on the final build (last run on 22 Nov, app code `2f22cc4`).
7. Whether Vercel's Ignored Build Step really blocks a Git build (configured and read back by every run; not proven).
8. A real backup restore on `bloat-test` (re-applying deletions after a restore is checked locally only).
9. The 19 screens without approved designs have not been compared with designs (only the 20 Slice A screens have them).

### Found during the freeze, not fixed

**K1, keyboard focus lost (found 23 Nov, not fixed: the preview is frozen).** When a save removes the button that opened a sheet, focus falls back to the page itself: after saving "Log bloating", after ending bloating, and after confirming "Delete" for a meal or a bloating record. Reproduction: `tests/e2e/accessibility.spec.ts`, check "known defect K1" (marked as expected to fail). Impact: a keyboard or screen-reader user loses their place, and the next Tab starts again from the top of the page; nothing is lost or saved wrongly. Proposed focused fix (one shared function, `returnFocus` in `src/lib/client/nav.ts`): if the button that opened the sheet is gone, move focus to the control that replaced it (for example "Bloating ongoing") or else to the screen's main heading. The K1 check then passes and becomes a normal check. Waiting for your go-ahead.

## Owner checklist: the main journeys on your phone

Use `https://bloat-preview.vercel.app` and your test account `bloat-tester@bloat.test`. Type made-up entries only, never real health details. Tick each line only if you saw the result written after the arrow.

1. Open the address in your phone's browser. → The homepage shows "Sign in", not "Get started". No Vercel login page.
2. Sign in. → You land on Today. Pull to refresh → you are still signed in.
3. Log bloating, pick a strength, Save. → "Saved", and it shows on Today. Change the strength, then End it. → Each shows "Saved".
4. Add a meal (type a dish). If the ingredient check is offered, run it, then Save. → The meal shows on Today and on History.
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

### 23 Nov 2026

- During the freeze (local only, no publish): the two failure tests (storage failure during account deletion, now including a partial removal; a failure midway through the recalled-meals offer, with rollback and a duplicate-free retry) pass on the frozen code. Keyboard-only journeys and 200% browser zoom tested; one defect found (K1, above). The open owner questions became one table in `DECISIONS.md`.
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
