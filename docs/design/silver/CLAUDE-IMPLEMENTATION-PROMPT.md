# Paste this into Claude Code and attach the whole ZIP

Implement the attached Bloat / Silver design package and repair the app's navigation and action failures. I authorize development and deployment to the existing testing preview, not production. Keep the same product behavior and backend unless a verified bug requires a focused fix.

Repo: bhakharvraj1129-sketch/bloat
Existing development branch: claude/bloat-software-build-uxzoru
Supabase: bloat-test / qntazirusbuwfmnmihzu only
Vercel: bloat / typeshi2

First read the repository instructions, source PDFs, current design/registry files, PROGRESS.md, TEST_RESULTS.md, DEPLOYMENT.md, and every file in this package. Inspect the actual latest branch and deployed commit. The package reviewed dc88b37; do not overwrite later changes. The prior ChatGPT email-link edits were local only and never pushed. Password login was subsequently added by Claude; verify its current state rather than restoring the old flow.

Deliver two connected outcomes:
1. A premium white/silver-grey/black responsive UI matching Preview.html and Design-and-UX-Spec.md.
2. Working navigation and action controls with evidence, including Back/Close, authentication, logging, saving, editing, reports and settings.

The HTML is a visual prototype, not application code or real authentication. Its demo actions must be replaced by the existing real services. Never copy its mock success messages, synthetic charts, draft policy guidance or placeholder support behavior into the deployed app. Use tokens.css as the new visual token proposal and update the project's token source and CSS consistently. Preserve approved medical-help wording and source-of-truth business rules.

Execution:
- Build a complete control ledger from the actual current app; use source-control-inventory.csv as a starting point, not a complete or verified bug list. Expand loops, shared components, plan restrictions, disabled states and dialogs. Reproduce reported failures before assigning root causes.
- Fix access/setup blockers necessary to test, without bypassing authentication or enabling BLOAT_TEST_LOGIN. If owner action is required for a secure password or provider signup setting, give the exact action and continue independent work.
- Implement shared tokens, components and responsive shells first, then the homepage, sign-in, setup, Today, History, Patterns, reports, You and all remaining routes in the specification. Keep route compatibility and explicit navigation ownership.
- Implement contextual Back with safe fallback, dirty-draft handling, modal focus return and mobile browser-Back behavior. Do not simply replace every back link with router.back().
- Apply consistent validation, pending/disabled states, acknowledged success, failure/retry and unknown-save recovery to every mutation. Retain existing idempotency. Fix actual dead handlers, wrong destinations and blocked pointer/focus layers.
- Keep only configured authentication methods visible. Do not add phone/Google/Apple buttons until their real integrations work. Current testing password login must remain secure and public self-signup must match the testing policy.
- Build professional About, Contact, Privacy and Terms layouts using verified content. Preserve reviewed policies. Request missing company/support details only when necessary; do not invent them or claim a support form sends without a real destination.
- Preserve RLS, entitlements, report exclusions across all formats, exports, score logic, country rules, registry questions, safety copy and content review restrictions.
- Do not add features merely because a reference app has them. No wearable metrics, AI interpretations, fake testimonials, fake progress or invented medical claims.

Verification:
Run relevant type/lint/unit/API/browser checks. Exercise every ledger item across applicable roles and states. Test 320/390/768/1024/1440 widths, keyboard access, focus return, deep links, refresh, session expiry, empty/loading/error/offline, duplicate submits and lost responses. Separate local results from hosted results. Never call a click successful without observing the intended navigation or persisted state. Test with synthetic data only.

Commit verified work in coherent milestones on the development branch after checking for concurrent changes. Update PROGRESS.md, TEST_RESULTS.md and the control ledger after each milestone. Deploy the testing preview and verify its exact commit. Keep unfinished items and external blockers explicit; never mark “all fixed” while tests are pending.

Finish with: preview URL and deployed commit, before/after desktop and mobile views, short design summary, repaired defects with evidence, pass/fail/blocked counts, and exact remaining owner actions. Do not finish with another planning-only report if implementation is possible.
