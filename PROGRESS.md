# Progress

Last updated: 15 Nov 2026 (session 1). Current stage: Stage 2, before the app skeleton. No application code exists yet.

## Done

- Repo created (private) and set up with this structure: `CLAUDE.md`, `PROGRESS.md`, `DECISIONS.md`, `docs/`, `.claude/skills/`.
- Plan v4.5 split into one file per section in `docs/plan/` (same words as the PDF, page footers removed). Original PDFs in `docs/source-pdfs/`.
- The three data files (91 questions, 200 acceptance tests, configuration) in `docs/data/`.
- Design tokens and rules in `docs/design/`, copied byte for byte from the Bloat Design System.
- Skills in `.claude/skills/`: three Bloat skills and six outside skills (versions in `docs/skills-sources.md`).
- Supabase `bloat-test` created on 15 Nov 2026 in `us-east-1` (ref `qntazirusbuwfmnmihzu`). Empty: no tables, no migrations yet. `bloat-live` waits until Gate 1.
- **Session 1 (15 Nov 2026):**
  - The owner's seven decisions recorded in `DECISIONS.md` and removed from the open list.
  - Slice A brief written and approved by the owner: `docs/slices/slice-a.md` (24 plan screens plus the goal step, 39 questions, 52 acceptance tests, 12 parts after the skeleton).
  - The 20 approved screens that Slice A uses copied into `docs/design/screens/`.
  - The approved screens compared with the plan. Twelve differences found and settled: the plan wins for rules, numbers and wording, the screens win for the look (brief, section 9).

## Not done yet

- **Supabase keys:** the project URL and keys are not in any environment file yet. They go into `.env.local` (never committed) and Vercel when the app skeleton is built.
- **Vercel:** not connected to this repo yet. Needed for preview links from step 2.
- **Resend and Sentry accounts:** not created yet.
- **Approved screens for later slices:** 19 more screen files are still only in the "Bloat App Screens" artifact. They are copied per slice. The four "first two weeks" screens are also not copied (not in Slice A).
- **Designs missing for Slice A:** plan screens 08 (location, time and units), 11 (your food) and 14 (how Bloat works). Decided: built in the style of the other setup screens; the owner sees each one before it is finished.
- **App skeleton** (Next.js, TypeScript strict, pnpm, Tailwind from tokens, Vitest, Playwright): not created.

## Slice A parts (from `docs/slices/slice-a.md`, section 7)

- [ ] A0 App skeleton (step 2)
- [ ] A1 Database and privacy wall (step 3)
- [ ] A2 Saving rules and time rules on the server
- [ ] A3 Before sign-up: landing, country, waitlist, help page
- [ ] A4 Sign-up, sign-in and consent
- [ ] A5 Setup questions
- [ ] A6 Episodes on the server
- [ ] A7 Today and the episode screens
- [ ] A8 Meals
- [ ] A9 Morning review and Bloat Score
- [ ] A10 History and day detail
- [ ] A11 Me and download my data
- [ ] A12 Finish Slice A and tag `slice-a-done` (step 5)

## Next

1. Owner connects Vercel to this repo.
2. Step 2, the app skeleton. Proposed in session 1, to be confirmed at the start of step 2:
   - An empty app only: one page showing "Bloat" in the design's fonts and colours, light and dark. No tabs, sign-in, tables or icons yet.
   - Libraries: Next.js (App Router), React, TypeScript (strict), Tailwind CSS, Radix (dialog and dropdown menu), Zod, Supabase's client, Vitest, Playwright, and the ESLint setup that comes with Next.js. Newest stable versions, pinned. Nothing else.
   - Colours, type, spacing and radii come only from `docs/design/tokens.json`. Fonts are stored with the app, so a phone never calls Google.
   - One unit test and one phone-screen test.
   - `.env.example` with names only; real keys never committed.
   - To confirm then: automatic checks on GitHub for every change, and adding `@supabase/ssr` when sign-in is built.
3. Step 3, Slice A database and privacy (part A1).
4. Then Slice A, one part per session.

## Later (ideas that are not in the plan, so not built)

(empty)
