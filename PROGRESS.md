# Progress

Last updated: 15 Nov 2026. Current stage: Stage 0 (accounts and tools) and the repo set-up part of Stage 2. No application code exists yet.

## Done

- Repo created (private) and set up with this structure: `CLAUDE.md`, `PROGRESS.md`, `DECISIONS.md`, `docs/`, `.claude/skills/`.
- Plan v4.5 split into one file per section in `docs/plan/` (same words as the PDF, page footers removed). Original PDFs in `docs/source-pdfs/`.
- The three data files (91 questions, 200 acceptance tests, configuration) in `docs/data/`.
- Design tokens and rules in `docs/design/`, copied byte for byte from the Bloat Design System.
- Skills in `.claude/skills/`: three Bloat skills and six outside skills (versions in `docs/skills-sources.md`).
- Supabase `bloat-test` created on 15 Nov 2026 in `us-east-1` (ref `qntazirusbuwfmnmihzu`). Empty: no tables, no migrations yet. `bloat-live` waits until Gate 1.

## Not done yet

- **Supabase keys:** the project URL and keys are not in any environment file yet. They go into `.env.local` (never committed) and Vercel when the app skeleton is built.
- **Vercel:** not connected to this repo yet.
- **Resend and Sentry accounts:** not created yet.
- **Approved screens:** 43 screen files are in the "Bloat App Screens" artifact and are not copied into `docs/design/screens/` yet. They are copied per slice.
- **Slice A brief** (`docs/slices/slice-a.md`): not written.
- **App skeleton** (Next.js, TypeScript strict, pnpm, Tailwind from tokens, Vitest, Playwright): not created.

## Next

1. Owner answers the open items in `DECISIONS.md` (the closing lines first).
2. Connect Vercel to this repo.
3. Session 1: write and agree the Slice A brief, then build the app skeleton.
4. Then Slice A, one part per session.

## Later (ideas that are not in the plan, so not built)

(empty)
