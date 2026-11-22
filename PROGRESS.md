# Progress

Last updated: 22 Nov 2026. Branch: `claude/bloat-software-build-uxzoru`.

## Where things stand

The whole app is built end to end. A **public preview** runs on Vercel against the hosted `bloat-test` database, with synthetic data, a labelled mock AI and mock billing. No real payments, no real AI calls.

- Public preview: `https://bloat-git-claude-bloat-software-build-uxzoru-typeshi2.vercel.app` (no Vercel login).
- **Sign-in is now email and password, temporarily, for owner-provisioned test accounts only** (commit `940a00d`). Email codes stay in the code for later. See DEPLOYMENT.md, "Sign-in method".
- Test mode stays off on the preview (`BLOAT_TEST_LOGIN=0`): no old test login, no shared password, no mock purchase.
- **Waiting on the owner (two Supabase dashboard steps):** switch off "Allow new users to sign up", and create `bloat-tester@bloat.test` with a strong password. Until sign-ups are off, someone could still create an account by calling Supabase directly.
- The hosted checks that need a signed-in account (correct sign-in, refresh, sign-out, isolation) did not run on the hosted preview this time: the Supabase connector asked the owner to confirm creating the temporary test accounts and got no answer. They pass locally.

Read next: `TEST_RESULTS.md` (newest first, local and hosted kept apart), `DEPLOYMENT.md` (owner steps and how to restore email sign-in), `DECISIONS.md`.

## Done on 22 Nov: verification round

See `docs/verification-report.md`. Outcomes are now checked, not just clicks: 37 save and edit actions (data change,
refresh, failure with retry, double tap), and 238 link clicks (destination and Back) at phone and desktop width.
Four defects found and fixed (hidden delete failure, experiments offered before they could start, two Back cases,
sign-in steps left in history). The owner switched Supabase sign-ups off and made `bloat-tester@bloat.test`; the
sign-up check passes and the owner's own sign-in journey is confirmed from server records.

Still open: deleting the 19 temporary accounts (the connector's approval prompt timed out; see the report, section 7),
and the actions listed in the report's section 5, which are verified only partly or at server level.

## Done on 19 Nov (afternoon): Bloat / Silver design applied

The owner attached the design package; it is now in `docs/design/silver/`. Applied to the whole app:
1. Tokens: white, silver grey and black (`src/app/globals.css`, `docs/design/tokens.json` v2), system fonts,
   12px controls, 20px cards, 3px ink focus ring, light theme only (DECISIONS.md, Engineering choice 21).
2. Shared parts restyled once: buttons, options (selected = black with a tick), strength scale, score marks,
   cards, inputs, warning-sign advice (red kept, with an icon), sheets (bottom sheet on phones, centred dialog
   from tablet width).
3. New frames: signed-in sidebar from 768px and four bottom tabs on phones (Today, History, Patterns, You), with
   one ownership rule for the active tab; public header with a phone menu listing every public page; footer.
4. Screens: homepage (real Today screenshot with sample entries; "Sign in" while sign-ups are closed), new About
   page, Privacy, Terms, Contact and How Bloat works as reading pages, sign-in and country screens as a centred
   card, setup, Today as a two-column dashboard on desktop, page labels on History, Patterns and You screens.
5. Defect found and fixed: filled link buttons had text in the same colour as their fill on the live site
   ("Get started" measured rgb(30, 94, 84) on rgb(30, 94, 84)). A browser test now checks every filled control.
6. A dedicated address for the testing preview: `https://bloat-preview.vercel.app` (always the latest build of
   this branch). The production address `bloat-olive.vercel.app` stays unused: no production site.

## Done on 19 Nov: navigation and action repairs

The request had two parts: (1) apply the "Bloat / Silver" design package, (2) repair navigation and actions.

**(1) Design package: not started, blocked.** The package (Preview.html, Design-and-UX-Spec.md, tokens.css,
source-control-inventory.csv) was shared only as a ChatGPT library link. This environment cannot open
chatgpt.com (blocked by the network rules, and the link needs the owner's own login). It is not in the
owner's Google Drive, not on any branch of the repository, and Gmail needs the owner to sign in again.
No colours, layout or wording were invented in its place. Owner action: add the four files to
`docs/design/silver/` on this branch (or upload them into the chat).

**(2) Navigation and actions: done locally, deployed.** See `docs/control-ledger.md`.
1. Control ledger: a crawler lists and presses every control on 30 screens for signed-out, Free and Pro
   visitors (740 rows). Fixed build: 620 pass, 0 fail, 49 checked by named tests, 71 listed (fields, disabled,
   inside sheets). Earlier build with the same crawler: 19 fail.
2. 14 defects reproduced first on the earlier build, then repaired (each test fails before, passes after):
   contextual Back with a safe parent; phone Back closes sheets; focus returns to the opener; setup steps
   in history; "close without saving?" and "leave without saving?"; honest "Check save status"; health
   background no longer hides failures; recall screen asks before turning on the AI check; confirm before
   withdraw and remove; single export on double tap; return to the same screen after an expired session;
   inline form messages; Help page Back on a direct link; profile switches that stay put while saving.
3. Every save button found calling the server directly now uses the shared save hook: "Saving…", locked
   against double taps, clear error, and "Check save status" after a lost reply, keeping the same key.
4. Five widths (320, 390, 768, 1024, 1440): no sideways scrolling on any of 23 screens, in either build.

## Done on 18 Nov (afternoon): email-and-password sign-in

1. `BLOAT_SIGN_IN_METHOD` switch: `password` on the preview, `email_code` (default) everywhere else. Only one sign-in is ever shown.
2. New sign-in form: email and password, accessible field errors, one generic "Email or password is incorrect." message, loading state, password cleared after each try, no way for the password to land in a URL.
3. No sign-up in the app; signed-in visitors are sent on; the 18+ confirmation is kept before setup.
4. Hosted test suite now signs in through the real form and checks wrong details, refresh, sign-out (including that an older session's token stops working) and that nobody can create an account.
5. Checked hosted Supabase settings: Site URL and redirect are the preview's `/auth/callback`; custom SMTP is off; sign-ups are still on.

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

0. **Hosted proof of the password sign-in with a signed-in account** (correct sign-in, refresh, sign-out, isolation) and "nobody can create an account": waiting on the two owner steps and the connector confirmation (see Next steps).
1. **Email sign-in for real users** (replaced by password sign-in for testing on 18 Nov). Custom SMTP was switched off; the built-in mailer only reaches project-team addresses, 2 an hour. Must be restored and proven end to end before anyone outside is invited (DEPLOYMENT.md, "Before inviting anyone outside").
2. **Google sign-in**: switched off in Supabase, so not exercised. The button is hidden while it is off.
3. **Founder MFA on the hosted app**: built and tested locally; needs the staff email address to set `BLOAT_STAFF_EMAILS` on the preview.
4. **Real AI** and the **AI accuracy test**: the harness uses the app's own code path. Reference examples: 0 of 300 dishes, 0 of 100 photos (25 of them meant to be unclear). Paid calls need the owner's yes on the key and spending limit.
5. Owner decisions in `DECISIONS.md`: kiwifruit correction, seven card wording corrections, AI failure alert threshold, country pause wording, medicine sensitivity view, help page version.
6. The 19 later screens have not been compared with approved designs (they are not in `docs/design/screens/`).
7. Founder alert emails (Resend), error monitoring (Sentry), real payments (Gate 2).

## Next steps, in order

1. Owner: company name and a monitored support address for About and Contact. (Light-only design confirmed 22 Nov; no dark mode.)
2. Done 22 Nov: sign-ups are off and `bloat-tester@bloat.test` exists (verified).
3. Owner: approve deleting the 19 temporary accounts (listed in `docs/verification-report.md`, section 7), in the Supabase connector or the dashboard. Then re-run the signed-in hosted checks on the newest commit with fresh accounts and delete those too.
4. Before inviting anyone outside: restore email sign-in (DEPLOYMENT.md, "Before inviting anyone outside").
5. Owner: staff email for founder tools; open decisions in DECISIONS.md; AI key and spending limit when ready.

## Later (ideas not in the plan, so not built)

(empty)
