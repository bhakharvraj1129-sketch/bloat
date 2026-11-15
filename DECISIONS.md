# Decisions

Every choice made while building goes here with the date. A decision needs the owner's yes. Claude Code reads this file at the start of every session.

## Open: waiting for the owner's yes

1. **Closing lines under results.** The plan uses two lines in different places. Proposed reading (not confirmed): under every comparison, "This is a difference in your records, not a medical measure." (test Q175, plan A14 and 0.3, and your design README). As the footer under the whole possible-triggers list, "These are patterns in your own records, not proof of a cause." (A14). A few plan examples (Part I, Part II) end a result with a third wording; the tests and A14 win over those examples. Until confirmed, Claude Code follows the proposed reading and asks if a screen is unclear.
2. **The word "cause".** Your design README says never to use "cause", but the A14 footer in item 1 contains it ("not proof of a cause"). Confirm that one exception, or give a reworded footer. Until confirmed, use the A14 footer only where A14 puts it.
3. **Streak count.** Plan A18 says "Streaks count logging only, never change analysis". Your design README and plan Part II say no streaks or streak pressure. Until answered, build no streak display.
4. **Icon set.** The design README suggests an outline set such as Lucide at 1.75px stroke, flagged as temporary. Until answered, Claude Code asks before adding any icon library.
5. **Brand name.** Plan D06 leaves open whether to keep "Bloat" or choose a more distinctive name (needed before the brand design is final). Until answered, "Bloat" is the working name.
6. **Supabase region for `bloat-live`.** Decided for test (see below). Suggested: `us-east-1` for live too, so test matches live. The free plan allows two active projects and both are in use, so delete or pause "BloatTracker" before creating `bloat-live`.
7. **Which acceptance tests belong to which slice.** The 200 tests in `docs/data/` are not tagged by slice. The first session of each slice proposes the list from plan B06 and C02, and the owner approves it in `docs/slices/`.

## Decided in the plan (copied from D06 so they are not forgotten)

- 7 Nov 2026: "Is it still happening?" asked after 8 hours, on app open only. No overall budget cap (the AI spending limit was reinstated on 8 Nov, plan 0.4). Mobile web first (Next.js, installable), app stores later via Capacitor. Next step is brand and key-screen design, then Slice A.
- The NHS ovarian sentence is stored word for word: "Sometimes, bloating that does not go away can be a sign of something more serious such as ovarian cancer."
- v4.3.1: AI pass marks are missed 10% or less, wrong 15% or less, correct abstain 80% or more. New Pro users can add ingredients to the last 7 days of free meals (RC-01). No outside review of any kind.
- Still open in the plan: business entity and payment provider (needed by Gate 2), legal template service (needed by Gate 1).

## Decided while setting up the repo (14 Nov 2026)

- The 172-page plan is split into one text file per section in `docs/plan/` (same words, page footers removed). The v4.2 change record sits in `docs/plan/archive/` because plan section 0 says not to load it into a coding agent.
- The three data files were copied unchanged from the plan PDF into `docs/data/`.
- `docs/design/tokens.json` and `docs/design/README.md` were copied byte for byte from the Bloat Design System (checked by file hash).
- Six outside skills were added with exact versions recorded in `docs/skills-sources.md`. `web-design-guidelines` was changed to read a saved copy of its rules instead of fetching them from the web each time.
- Bloat's own plan and skills win over any outside skill (see CLAUDE.md).

## Decided 15 Nov 2026

- Code lives in GitHub `bhakharvraj1129-sketch/bloat` (private). The older `hp181718-max/bloat` repo is not used.
- Supabase account: organization "vraj11discord@gmail.com's Org". Test project `bloat-test`, ref `qntazirusbuwfmnmihzu`, region `us-east-1`. This is the only project Claude Code may change.
- The same organization also has an empty project "BloatTracker" (Sydney, ap-southeast-2), created by the owner. Not used for Bloat. Never apply migrations to it. The owner may delete it later to free a slot for `bloat-live`.
