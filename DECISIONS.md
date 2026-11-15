# Decisions

Every choice made while building goes here with the date. A decision needs the owner's yes. Claude Code reads this file at the start of every session.

## Open: waiting for the owner's yes

1. **Skeleton choices (step 2).** To confirm at the start of step 2: the list of libraries in PROGRESS.md ("Next"), automatic checks on GitHub for every change, and adding `@supabase/ssr` when sign-in is built.
2. **Small things to ask when their part comes** (`docs/slices/slice-a.md`, 10.8): where "No bloating so far today" (DY-05) sits on Today; the exact words of the "English only" note for test Q70; how old versions of a record are stored (step 3).
3. **To decide between slices, with a plan update first:** whether to build the Day 1, Day 3, Day 7 and Day 14 screens; where the optional profile cards (PF-01 to PF-06) and question ON-03 appear; what happens when a required consent is withdrawn.

## Decided 15 Nov 2026: the Slice A brief (session 1)

The owner said yes to `docs/slices/slice-a.md` and to every suggestion in it.

1. **The brief.** Slice A's screens, its 52 acceptance tests and its 12 parts are approved.
2. **Plan against approved screens.** The plan wins for every rule, number and wording. The screens win for the look.
3. **Bottom tabs.** Three in Slice A (Today · History · Me), as in plan A06. The Insights tab is added in Slice D.
4. **Setup steps.** Build all of the plan's steps, including the ones with no design: 08 (location, time and units), 11 (your food), 14 (how Bloat works), question ON-08 and the "Continue with Google" button. They follow the style of the approved setup screens, and the owner sees each new screen before it is finished. The goal step (ON-16) sits where the approved screens put it.
5. **Morning reminder.** None. Plan A18 stands: no push notifications or reminders in this release.
6. **Day 1, Day 3, Day 7 and Day 14 screens.** Not in Slice A.
7. **AI consent (CN-04).** Not at sign-up. Asked before the first AI ingredient check, in Slice C.
8. **Small rule differences**, all following the plan: strength is 1 to 10 when updating an episode; "Not sure" on "Is it still happening?" keeps the episode open; the landing page and the help page use the plan's fixed wording; Pro habits are not selectable on Free; morning habit answers are Yes / No / Not sure; meal time is "Now / Choose time"; a new email code can be asked for after 30 seconds, and no code lifetime is shown.
9. **Habits and medicines inside Slice A.** In Slice A a person picks up to 3 free habits, answers them each morning, and can add medicine names and types during setup. Habit logging, changing them in Me, and medicine changes are Slice B. The three habit tables and `medicines` are created in Slice A.
10. **Slice A is Free only.** No "Pro" labels, locked cards or Upgrade screen until Slice B.
11. **Progress counter on Today.** Built in Slice A (part A9) with real counts only. The "14 confirmed days needed" is two times the plan's setting of 7 days in each group.
12. **Waitlist endpoint.** `POST /v1/waitlist` is added, saving email and country only. It is not in plan B03.
13. **Optional profile cards (PF-01 to PF-06) and ON-03.** Not in Slice A.
14. **Consents in Me.** Slice A shows each consent with its version and date, with no withdraw button. Withdrawal arrives with the first optional consent in Slice C.
15. **Landing page links.** The landing page is built in Slice A. Terms, Privacy Policy, Contact and the method page are linked when each page exists; tracked as an open issue until Gate 1.

## Decided 15 Nov 2026: the owner's answers to the seven open questions (session 1)

From "00 Start here", section 3. No session asks these again.

1. **Closing lines under results.** Under every comparison: "This is a difference in your records, not a medical measure." (test Q175, plan A14, section 0.3). Footer under the possible-triggers list: "These are patterns in your own records, not proof of a cause." (plan A14). Examples in Part I and Part II that differ do not count.
2. **The word "cause".** Allowed only inside the A14 possible-triggers footer. Nowhere else.
3. **Streak count (A18).** Build no streak display.
4. **Icon set.** Lucide, outline, 1.75px stroke, always with a word. The icon library is added when the first icon is needed.
5. **Brand name.** Keep "Bloat" for now.
6. **Region for `bloat-live`.** `us-east-1`, the same as `bloat-test`. Created at Gate 1. Delete or pause "BloatTracker" first to free a slot.
7. **Which tests belong to which slice.** Claude Code proposes the list in each slice brief; the owner approves it.

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
- Session 1 copied the 20 approved screens that Slice A uses from the "Bloat App Screens" artifact into `docs/design/screens/` (see the README there).
