# Bloat: standing rules for Claude

Bloat is an installable mobile-web bloating tracker. It is a general wellness tracker, never a medical product. The owner (Krunal) is a first-time builder: use plain words and short sentences, and explain any technical term in one line.

## Source of truth

- The two PDFs in `docs/source-pdfs/`: Master Plan v4.5 (wins on any conflict; its section 0.4 overrides older sections) and the Build Guide.
- `docs/data/`: the three JSON files extracted from the Master Plan PDF (91 questions, 200 acceptance tests, configuration). Load questions, tests and settings only from these. Never retype them.
- `docs/design/`: the owner's design tokens, design rules and 20 approved Slice A screens.
- `PROGRESS.md` (what is done and what is next), `DECISIONS.md` (choices and open questions), `TEST_RESULTS.md` (real results only), `DEPLOYMENT.md`.
- Never change a rule, threshold, safety wording or price on your own. If something is unclear, record it in DECISIONS.md and ask.

## How the code is laid out

- `src/lib/`: rules with no side effects. `registry.ts` (reads the JSON), `time.ts`, `wording.ts` (fixed sentences), `domain/` (day status, exposure, insights, experiments, cards, focus).
- `src/server/`: server only. `http.ts` (`route()` wrapper: sign-in check, Zod, Pro check, idempotency, error envelope), `db.ts` (`tx()` writes), `ai/`, `reports.ts`, `billing.ts`.
- `src/app/v1/`: the API. `src/app/(app)/`: signed-in screens. `src/components/`: UI.
- `content/`: daily cards and Learn outlines. `supabase/migrations/`: forward-only SQL.
- `tests/unit` (rules), `tests/api` (real HTTP against the local stack), `tests/e2e` (Playwright, phone screen).

## Rules that must always hold

- Privacy: clients can only read their own rows (RLS) and cannot write to any table. Every write goes through `srv_tx` with the server secret. `tests/api/privacy.test.ts` must always pass.
- Every mutation uses `route({ mutation: true })` and `ctx.commit()`, so the save and its idempotency record land in one transaction.
- Pro checks happen on the server via `feature:` in `route()`. Fail closed: anything uncertain is Free.
- Unknown stays unknown. Never turn "not sure", "skipped" or "not tapped" into "No".
- Meals always save, whatever the AI does.
- Insights are deterministic code. AI never writes a result, advice or a health judgement.
- No health data in logs, analytics events or error reports. Secrets only in environment variables.
- User-facing text: sentence case, plain "and", no emoji, none of the banned words (`BANNED_PHRASES` in `src/lib/wording.ts`). Medical-help text is the fixed copy adapted from the NHS bloating page, labelled "Adapted from NHS, Bloating"; never rewrite it, never call it word for word.
- UI uses the design tokens only (`src/app/globals.css`). No shadows, no new colours.
- Do not deploy a public site, do not take payments, do not use real health data. Supabase: only the `bloat-test` project (`qntazirusbuwfmnmihzu`). Never touch the owner's other projects.

## Commands

```bash
pnpm db:start            # local Supabase (needs Docker)
./scripts/serve.sh       # build and serve on port 3100 for tests
pnpm test                # rule tests
pnpm test:api            # API tests (needs the two lines above)
pnpm test:e2e            # browser tests on a phone screen
pnpm typecheck && pnpm lint
python3 scripts/acceptance-report.py   # rebuild docs/acceptance-table.md
```

After changing a migration that is not yet applied to `bloat-test`, run `pnpm db:reset`. Never edit a migration that has been applied; add a new one.
