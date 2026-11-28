# Bloat: standing rules for Claude

Bloat is an installable mobile-web bloating tracker, shown to people as "Bloat Buddy" since the owner renamed it on 27 Nov 2026. It is a general wellness tracker, never a medical product. The owner (Krunal) is a first-time builder: use plain words and short sentences, and explain any technical term in one line.

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
- UI uses the design tokens only (`src/app/globals.css`: design v2 of 27 Nov 2026, light and dark themes, DECISIONS.md choice 31). No shadows, no new colours.
- No production build, no payments, no real health data. The branch preview (`bloat-preview.vercel.app` and the branch address) is public by the owner's decision (18 Nov 2026), shows the current test build and must keep `BLOAT_TEST_LOGIN=0`; only the Preview workflow moves those two addresses. Since 24 Nov 2026 the main Vercel addresses (`bloat-olive`, `bloat-typeshi2`, `bloat-git-main-typeshi2`) show an older test build, `83fe4da`, set by hand at the owner's decision; the workflow does not move them, and this is not a launch. Supabase: only the `bloat-test` project (`qntazirusbuwfmnmihzu`). Never touch the owner's other projects.

## Toolkit

The owner's chosen tools (27 Nov 2026). **Rule: prefer these tools over others when building anything.** Since the motion passes of 27 and 28 Nov 2026 (DECISIONS.md choices 34 and 35) the app uses Motion, GSAP ScrollTrigger (start page only), AutoAnimate, Sonner, Vaul, Recharts, React Hook Form + Zod, shadcn Command and Popover, Lucide and india-pincode; Lottie is installed but unused.

Motion rules (owner's spec, 27 Nov 2026):
- One source for timing: `--dur-press` 120ms, `--dur-fast` 150ms, `--dur-base` 250ms, `--dur-slow` 400ms and `--ease-out` in `globals.css`, mirrored in `src/lib/motion.ts`. No timed animation longer than 400ms, no bounce or spring overshoot, nothing that makes the person wait. Scroll-driven effects move only as fast as the person scrolls; ambient loops (the start page's dot drift, ticker and sample phone) never block anything and stop with "Pause animation".
- The start page is a story you can play with (DECISIONS.md choice 35, the owner's 28 Nov request; countquill.com was the level of life, not a design to copy). Every control in the app gives a deliberate response (tab pill, chip tick, number pick, week fill, arrow nudge, theme cross-fade). Anything new should do the same, within these limits.
- A tap answers within 150ms (buttons shrink to 0.97 when pressed). A button whose label ends in "…" shows a loader. A finished save shows a toast with a tick (`savedToast()` in `src/lib/client/feedback.tsx`), not an inline notice.
- Sheets are Vaul drawers (`Sheet` in `ui.tsx`) and keep the unsaved-changes check. Loading shows a page skeleton (`Loading`), never a blank screen or a lone spinner.
- "Reduce motion" turns every animation off (a global CSS rule plus `useReducedMotion()`/`reducedMotion()` in code).
- Form problems appear under the field (`FieldMessage`), in ink with an icon: the alert red stays for warning signs and destructive actions. The PIN code only fills in the state; it is never saved.

- **Animation:** Motion (`motion`) for UI animation, GSAP (`gsap`) for scroll effects, AutoAnimate (`@formkit/auto-animate`) for lists, Lottie (`lottie-react`) for animated icons and loaders. Respect the phone's "reduce motion" setting.
- **UI:** shadcn/ui + Lucide (`lucide-react`) for components and icons; Sonner (`sonner`) for toasts; Vaul (`vaul`) for bottom sheets.
- **Charts:** Recharts (`recharts`) for animated charts.
- **Forms:** React Hook Form (`react-hook-form`) + Zod (`zod`, with `@hookform/resolvers`).
- **India data:** `india-pincode` for PIN-code autofill; state dropdowns use all 28 states + 8 union territories (already in `src/lib/regions.ts`). The package carries about 3.7 MB of data: use it on the server only, never in a client component.
- **Services:** Supabase for data and auth, Razorpay for payments, Vercel for hosting, Figma for designs.

How they are set up, and how they fit the rules above (the rules above win):
- **MCP servers** in `.mcp.json` (project scope): `figma` (https://mcp.figma.com/mcp), `supabase` (https://mcp.supabase.com/mcp, scoped to `bloat-test` only with `project_ref=qntazirusbuwfmnmihzu`), `vercel` (https://mcp.vercel.com), `razorpay` (https://mcp.razorpay.com/mcp). Figma, Supabase and Vercel sign in through `/mcp` in Claude Code. Razorpay reads its key from the environment variable `RAZORPAY_MCP_TOKEN` (base64 of `key_id:key_secret`, test-mode keys only); never write a key into `.mcp.json` or the repository.
- **shadcn/ui:** `components.json` uses the `radix-nova` style (Radix, like the app's existing sheets) and puts components in `src/components/shadcn` (`pnpm dlx shadcn@latest add <name>`), so they never clash with the app's own `src/components/ui.tsx`. `globals.css` and the fonts were deliberately left unchanged at init: when the first shadcn component is added, map shadcn's colour variables to the design tokens (no new colours, no shadows), keep the bundled fonts (no Geist, no font service), and check both themes.
- **Payments stay off** until the owner decides D19; Razorpay is for later and for test mode only.

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
