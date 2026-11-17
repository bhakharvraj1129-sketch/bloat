# Progress

Last updated: 17 Nov 2026. Branch: `claude/bloat-software-build-uxzoru`.

## Where things stand

The whole app is built end to end. It runs locally, and a **private preview is deployed on Vercel** against the hosted `bloat-test` database (synthetic accounts, labelled mock AI, mock billing). It has never run against the real AI.

- Preview: `https://bloat-git-claude-bloat-software-build-uxzoru-typeshi2.vercel.app` (behind Vercel sign-in).
- Hosted database: the three checked-in migrations are applied to `bloat-test` and match the files.
- **Blocker right now:** `BLOAT_SERVER_SECRET` is not set in Vercel yet, so the preview opens but cannot save or create accounts. The owner adds it (DEPLOYMENT.md, "The one step left"). Until then only the signed-out protection check has passed on the preview.

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

1. **Server secret in Vercel** (owner, 2 minutes). Then redeploy and run `pnpm test:hosted`.
2. **Hosted browser tests.** Written (`tests/hosted/preview.spec.ts`): sign-out protection (passed), save a meal and see it in History after a refresh, diary flow, two-account isolation, doctor-report share link open then revoke. The last four wait on item 1.
3. **Real AI.** Needs an Anthropic key and the owner's yes on spending limits. The provider code has never made a real call.
4. **AI accuracy test.** The harness now runs the same code path as the app (see `docs/eval/README.md`). Reference examples available: 0 of 300 dishes, 0 of 100 photos. All still need sourcing and a human check.
5. **Email code and Google sign-in on the hosted project.** Not exercised. Needs the email template and Google provider set in Supabase, and a test mailbox.
6. **Founder alert emails** (Resend), **error monitoring** (Sentry), **real payments** (Gate 2), **MFA for founder tools**.
7. Items marked "Not implemented" or "Partial" in `TEST_RESULTS.md`, and the open questions in `DECISIONS.md`.
8. The 19 later screens have not been checked against approved designs.
9. There is a second, unused Vercel project `bloat-zlrr` linked to the same repo. It has no settings from us. The owner may delete it.

## Next steps, in order

1. Owner: add `BLOAT_SERVER_SECRET` in Vercel (Preview only, Sensitive).
2. Redeploy, run `pnpm test:hosted`, record results, send the owner the URL and phone steps.
3. Owner: decide on the AI key and spending limits; supply or approve sources for the accuracy set.
4. Beta completion: MFA, content and source review, missing acceptance items, design refinements.

## Later (ideas not in the plan, so not built)

(empty)
