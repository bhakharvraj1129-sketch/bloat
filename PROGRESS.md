# Progress

Last updated: 18 Nov 2026. Branch: `claude/bloat-software-build-uxzoru`.

## Where things stand

The whole app is built end to end. A **public preview** runs on Vercel against the hosted `bloat-test` database, with synthetic data, a labelled mock AI and mock billing. It has never run against the real AI and takes no payments.

- Public preview: `https://bloat-git-claude-bloat-software-build-uxzoru-typeshi2.vercel.app` (no Vercel login). Test mode is off there: no password sign-in, no mock purchase, no test clock.
- Hosted database: six checked-in migrations applied to `bloat-test`, matching the files by version.
- Hosted browser suite (8 checks) passed on the public preview, commit `b70e7ed`: see TEST_RESULTS.md.
- **Blocked: email sign-in codes are not delivered on the hosted project.** Supabase cannot finish sending through the custom SMTP server saved on 17 Nov (every request times out after 10 seconds; checked again 18:50 UTC on 17 Nov). The owner must fix the SMTP settings in Supabase. Until then nobody can sign in to the public preview by email. The app now says so plainly instead of waiting silently.

Read next: `TEST_RESULTS.md` (what is proven, local and hosted kept apart), `DECISIONS.md` (what needs your yes), `DEPLOYMENT.md`.

## Done in the 18 Nov round

1. Doctor report privacy: switched-off sections appear nowhere (summary, preview, PDF, shared page, old stored reports).
2. Exports: never partial, stable paging, clear retry, row counts.
3. Content: "Adapted from NHS, Bloating" everywhere; kiwifruit experiment paused and card kept as a draft; proposed source-backed corrections written for review.
4. Email sign-in screens: real failures shown, resend with the right cooldown, no account enumeration; Google button only when Google is on. Hosted delivery still blocked (above).
5. Public preview: test mode off, designated Pro test accounts, deployment protection removed, verified in a fresh browser.
6. Signed-in users can no longer call the 14 server functions; duplicate Vercel project's builds skipped; migration history reconciled.

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

Screens: 39 of the plan's 39 have a working screen. The approved designs exist only for the 20 Slice A screens; the other 19 follow the same tokens and rules and **have not been checked against approved designs** (they were never copied out of the "Bloat App Screens" artifact).

## Not done

1. **Email code delivery on the hosted project** (owner: SMTP settings). Then prove it end to end with the test mailbox: a fresh email arrives, its code signs in, the session survives a refresh, a resend works after 60 seconds, a wrong or old code is refused. The local stack proves all of this with real emails from its mail catcher; the hosted proof needs the mailbox (the Gmail connection in this session must be signed in again).
2. **Google sign-in**: switched off in Supabase, so not exercised. The button is hidden while it is off.
3. **Founder MFA on the hosted app**: built and tested locally; needs the staff email address to set `BLOAT_STAFF_EMAILS` on the preview.
4. **Real AI** and the **AI accuracy test**: the harness uses the app's own code path. Reference examples: 0 of 300 dishes, 0 of 100 photos (25 of them meant to be unclear). Paid calls need the owner's yes on the key and spending limit.
5. Owner decisions in `DECISIONS.md`: kiwifruit correction, seven card wording corrections, AI failure alert threshold, country pause wording, medicine sensitivity view, help page version.
6. The 19 later screens have not been compared with approved designs (they are not in `docs/design/screens/`).
7. Founder alert emails (Resend), error monitoring (Sentry), real payments (Gate 2).

## Next steps, in order

1. Owner: fix the SMTP settings in Supabase (DEPLOYMENT.md, "Email codes"). Owner: sign the Gmail connector in again for the test mailbox, or do the one manual check in the handoff.
2. Prove hosted email delivery and sign-in (item 1 above). **This is the exact next unfinished task.**
3. Owner: give the staff email for founder tools; then set `BLOAT_STAFF_EMAILS` and test MFA on the preview.
4. Owner decisions in DECISIONS.md; then apply the approved content corrections.
5. Design comparison once the 19 screens are copied in.

## Later (ideas not in the plan, so not built)

(empty)
