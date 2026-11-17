# Progress

Last updated: 17 Nov 2026. Branch: `claude/bloat-software-build-uxzoru`.

## Where things stand

The whole app is built end to end. It runs locally, and a **private preview is deployed on Vercel** against the hosted `bloat-test` database (synthetic accounts, labelled mock AI, mock billing). It has never run against the real AI.

- Preview: `https://bloat-git-claude-bloat-software-build-uxzoru-typeshi2.vercel.app` (behind Vercel sign-in).
- Hosted database: the three checked-in migrations are applied to `bloat-test` and match the files.
- The server secret is set in Vercel. Five hosted browser tests pass (see TEST_RESULTS.md): sign-out protection, meal persistence after refresh, diary flow, two-account isolation, doctor-report share link open then revoke.

Read next: `TEST_RESULTS.md` (what is proven, local and hosted kept apart), `DECISIONS.md` (what needs your yes), `DEPLOYMENT.md`.

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

1. Hosted checks beyond the five browser journeys (the full API suite has only run locally).
2. Browser tests for the other Pro screens (journey, experiments, health background), local and hosted.
3. **Real AI.** Needs an Anthropic key and the owner's yes on spending limits. The provider code has never made a real call.
4. **AI accuracy test.** The harness now runs the same code path as the app (see `docs/eval/README.md`). Reference examples available: 0 of 300 dishes, 0 of 100 photos. All still need sourcing and a human check.
5. **Email code and Google sign-in on the hosted project.** Not exercised. Needs the email template and Google provider set in Supabase, and a test mailbox.
6. **Founder alert emails** (Resend), **error monitoring** (Sentry), **real payments** (Gate 2), **MFA for founder tools**.
7. Items marked "Not implemented" or "Partial" in `TEST_RESULTS.md`, and the open questions in `DECISIONS.md`.
8. The 19 later screens have not been checked against approved designs.
9. There is a second, unused Vercel project `bloat-zlrr` linked to the same repo. It has no settings from us. The owner may delete it.

## Next steps, in order

1. Owner: open the preview on a phone and look around (steps in DEPLOYMENT.md).
2. Owner: decide on the AI key and spending limits; supply or approve sources for the accuracy set; say whether a test mailbox is available for email sign-in.
3. Beta completion (Priority 4): MFA for founder tools, content and source review, missing acceptance items, design refinements. **Exact next unfinished task: list the "Not implemented" and "Partial" rows of TEST_RESULTS.md and work through them, starting with MFA.**

## Later (ideas not in the plan, so not built)

(empty)
