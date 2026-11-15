# Bloat: standing rules for Claude

Bloat is an installable mobile-web bloating tracker. It is a general wellness tracker, never a medical product. The owner (Krunal) is a first-time builder: use plain words and short sentences, and explain any technical term in one line.

## Source of truth

- Plan: `docs/plan/` is Bloat Complete Plan v4.5, one text file per section (A01 to A18 product, B01 to B07 engineering, C01 to C03 questions, tests and settings, D01 to D06 launch). Start with `00-cover-and-contents.txt`. The PDFs are in `docs/source-pdfs/` for people to read.
- `docs/plan/archive/` is history. Never load its rules.
- Build guide: `docs/plan/build-guide.txt`.
- Data: `docs/data/` holds the three JSON files (91 questions, 200 acceptance tests, configuration). Load questions, tests and settings only from these.
- Design: `docs/design/tokens.json` and `docs/design/README.md`. Approved screens: see `docs/design/screens/README.md`.
- Memory between sessions: `PROGRESS.md` and `DECISIONS.md`. Read both at the start, update both at the end.
- Never change a rule, threshold, wording or price on your own. If something is unclear or looks wrong, stop and ask.

## How to work

- Start every session with the `bloat-session-routine` skill: read this file, PROGRESS.md and DECISIONS.md, say what you will do today, propose a plan, and write no code until the owner approves.
- One slice at a time (plan B06), one part per session. Write the slice's acceptance tests first, then the code, then run all tests.
- Two tries, then stop and explain the problem in plain words.
- No new libraries, tables, screens, wording or numbers without the owner's yes. New ideas go on the "Later" list in PROGRESS.md.
- Meals must always save, even when the AI is off or limited.
- Privacy: Row Level Security on every table; the two-user test must always pass; no health data in logs, analytics or error reports.
- Secrets only in environment variables. Never print or commit keys.
- Do not deploy a public site and do not take payments. Preview links are fine.

## Skills in `.claude/skills/`

Bloat's own (these decide):
- `bloat-session-routine`: how a session runs.
- `bloat-wording-and-safety`: read before writing any user-facing text or touching health information, AI output or food advice.
- `bloat-design-system`: read before building any screen or component.

Outside skills (these advise; sources and versions in `docs/skills-sources.md`):
- `supabase`, `supabase-postgres-best-practices`: database work.
- `react-best-practices`, `composition-patterns`: React and Next.js code.
- `web-design-guidelines`: reviewing UI code.
- `frontend-design`: craft and self-critique only.

## When an outside skill disagrees with Bloat

The plan and the Bloat skills win. In particular:
- **Supabase:** the outside skill suggests running SQL directly while iterating and setting up an account-wide Supabase MCP connection. For Bloat, every database change is a new migration file in the repo, applied to the `bloat-test` project only. Any Supabase MCP connection must be limited to the `bloat-test` project. The owner has unrelated Supabase projects (PharmOS). Never touch them. Never touch `bloat-live` before Gate 1.
- **web-design-guidelines:** its Title Case and "&" rules do not apply. Bloat uses sentence case and plain "and".
- **frontend-design:** the design tokens are the brief. Do not choose a palette, fonts or a "bold" look. Use it for craft only: hierarchy, states, self-critique.
- **react-best-practices:** do not add a library it mentions without the owner's yes.

## Stack (Build Guide)

Next.js App Router with TypeScript strict, Node LTS, pnpm. Tailwind with tokens only. Radix primitives for sheets, dialogs and menus. Zod on every request and every AI answer. Supabase (Postgres, Auth, private storage) with two projects, `bloat-test` and `bloat-live`; every table change is a forward-only migration. `/v1` routes from plan B03, on the server only, with Pro checks on the server. Hand-built SVG charts, no chart library. Doctor PDF made on the server with `@react-pdf/renderer`. AI is Claude Haiku behind a provider layer, with the spending limit and protections from plan section 0.4. Tests: Vitest for rules and calculations, Playwright for the 200 acceptance tests on a phone-sized screen. Vercel with a preview link for every change; main goes live only when all tests pass. Resend for email, Sentry with health data stripped, and Bloat's own privacy-safe events table (no third-party analytics). Payments come at Gate 2. Capacitor wraps the app for the stores later.
