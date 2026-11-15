---
name: bloat-session-routine
description: How every Bloat build session runs: read the memory files, plan first, tests first, build one slice part, check, commit. Use at the start of any Bloat coding session, when starting or finishing a slice or part, or when a fix keeps failing.
---

# Bloat session routine

The user is a first-time builder and the product owner. Explain in plain words, short sentences, and give a one-line meaning for any technical term. The master plan (Bloat Complete Master Plan v4.5) is the single source of truth. Build what it says and nothing else.

## Where things live
- docs/plan/ : the master plan split by part (A product, B engineering, C tests, D launch)
- docs/slices/ : one brief per slice (screens, question IDs, tests, tables, endpoints)
- docs/data/ : the three JSON files (questions, acceptance tests, configuration). Load questions, tests and settings only from these. Ignore older versions.
- docs/design/ : design tokens and approved screens
- PROGRESS.md and DECISIONS.md : memory between sessions. Never rely on your own memory.

## Start of every session
1. Read CLAUDE.md, PROGRESS.md and DECISIONS.md.
2. Say in plain words what you will do today: one slice, one part. Name the plan sections, screens, question IDs and acceptance tests that cover it.
3. Propose a plan. Write no code until the user approves it.

## Build order
- One slice at a time (A to F, plan B06), one part per session. Never start the next slice while the previous one is half-finished.
- Server first: ownership, transactions, revisions, time handling, unknown-stays-unknown and Pro locking on the server, before visual polish.
- Tests first: write the part's acceptance tests, see them fail, write the code, then run ALL tests. A part without a passing test is not done.
- Slices A and B use synthetic US, Canada and India accounts and a labelled mock AI. The real AI starts in slice C. Every production feature flag stays false.
- Preview links are fine. Do not publish a public production site and do not take payments.

## Hard rules
- No new library, table, screen, wording, number or rule that is not in the plan or in DECISIONS.md. If something is unclear or looks wrong, stop and ask.
- New ideas go on a "Later" list in PROGRESS.md. Do not build them.
- Database changes only move forward: each change is a new migration file in the repo, and an applied migration is never edited. Apply changes to the bloat-test Supabase project only. Never touch any other Supabase project (the user has unrelated ones). Never touch bloat-live before Gate 1.
- Secrets live only in environment variables. Never print, commit or paste a key.
- Two tries, then stop. If a fix fails twice, stop, explain the problem in plain words, and wait for the user. Do not keep guessing.

## End of every session
1. Run all tests, including the two-user privacy test (user A can never read user B's rows).
2. Report: changed files, migrations, the tests run with their actual results (never "should pass"), and open issues.
3. Give the preview link and tell the user exactly what to try on a phone.
4. Update PROGRESS.md (done, next) and DECISIONS.md (every choice made, with the date).
5. After the user says it is good, commit with a clear message. A session ends with passing tests and a commit, or the work is undone. Never leave half-done work.
6. When a whole slice is finished, tag it (slice-a-done, slice-b-done, and so on).

## A slice is done only when all four are true
1. Every acceptance test for the slice passes automatically.
2. The user tried it on an iPhone and an Android phone, in light and dark mode. You cannot do this, so ask.
3. Screens match the approved designs and the wording rules (see the bloat-design-system and bloat-wording-and-safety skills).
4. The two-user privacy test still passes.

## Review checklist to give the user after every part
- All tests pass, including the privacy test
- Works on iPhone and Android, light and dark
- Looks like the approved design (colours, fonts, spacing, round shapes)
- Wording follows the rules; no medical claims
- Nothing shows "Saved" before the server confirms
- No new feature, number or rule that is not in the plan
