# Progress

Last updated: 17 Nov 2026. Branch: `claude/bloat-software-build-uxzoru`.

## Where things stand

The whole app is built end to end against a local database, with synthetic accounts, a labelled mock AI and mock billing. All automated tests pass locally. **It is not deployed anywhere**, and it has never run against the real AI.

Read next: `TEST_RESULTS.md` (what is proven), `DECISIONS.md` (what needs your yes), `DEPLOYMENT.md` (what is blocked).

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

1. **Hosted database: not applied.** The two migrations in `supabase/migrations/` run cleanly on the local stack only. `bloat-test` is still empty. This build container cannot reach Supabase directly (its network blocks it), and pasting 50 KB of SQL by hand through the connector risks the hosted database drifting from the files. Apply them with the Supabase CLI (`supabase link` then `supabase db push`) from a machine that can reach Supabase, or allow this environment to reach `qntazirusbuwfmnmihzu.supabase.co` and supply the database password.
2. **Vercel preview.** Blocked: the owner must approve Vercel access for team `typeshi2`. Then follow DEPLOYMENT.md.
3. **Real AI.** Needs an Anthropic key in the environment. The provider code is written but has never made a real call.
4. **AI accuracy test.** Harness ready (`scripts/ai-eval.mts`); needs the 300 dishes and 100 photos.
5. **Email code and Google sign-in on the hosted project.** Needs the email template and Google provider set in Supabase.
6. **Founder alert emails** (Resend), **error monitoring** (Sentry), **real payments** (Gate 2).
7. Items marked "Not implemented" or "Partial" in `TEST_RESULTS.md`, and the open questions in `DECISIONS.md`.
8. Browser tests cover the core diary and one Pro path. The Pro screens for journey, reports, experiments, health background and doctor PDF are tested through the API but not yet clicked through in a browser.

## Next steps, in order

1. Owner: approve Vercel access; answer the "needs the owner" items in DECISIONS.md.
2. Apply migrations to `bloat-test`, set the server secret hash, create the Vercel preview with deployment protection on.
3. Run the API tests against the preview (`BLOAT_BASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, keys) with synthetic accounts.
4. Add browser tests for each Pro screen; compare the 19 later screens with the approved designs once they are copied into `docs/design/screens/`.
5. Connect the real AI with a small provider-side spending cap, then run the accuracy test.

## Later (ideas not in the plan, so not built)

(empty)
