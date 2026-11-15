# Decisions

Every choice made while building goes here with the date. A decision needs the owner's yes. Claude Code reads this file at the start of every session.

## Open: waiting for the owner's yes

These came up on 15 Nov 2026 while writing the Slice A brief. The full detail is in `docs/slices/slice-a.md`, sections 9 and 10. Until each one is answered, Claude Code follows the plan and asks before building the part it touches.

1. **The Slice A brief itself.** `docs/slices/slice-a.md` is a proposal: its screens, its 52 acceptance tests and its 12 parts need the owner's yes.
2. **Bottom tabs.** Plan A06 says three tabs (Today · History · Me). The approved screens, the design README and the Build Guide show four (Today · History · Insights · Me). Needed before the Today screen is built.
3. **Onboarding steps.** The approved screens show 8 steps. The plan has 11. Plan screens 08 (location, time and units), 11 (your food) and 14 (how Bloat works) have no design, question ON-08 is missing from the design, and the design's sign-up screen has no Google button. Suggested: build what the plan says, in the style of the approved screens.
4. **Morning reminder.** Three approved screens show a "Morning review reminder, every day at 8:00 AM". Plan A18 says no push notifications or reminders in this release. Suggested: build no reminder.
5. **Day 1, Day 3, Day 7 and Day 14 screens.** They are in the approved screens but not in the plan's 39 screens. Suggested: not in Slice A; decide between slices and update the plan first.
6. **AI consent (CN-04).** The approved Consent screen shows it as an optional fourth tick at sign-up. The plan asks it before the first AI ingredient check (Pro). Suggested: follow the plan; it arrives in Slice C.
7. **Small rule differences between the approved screens and the plan.** Suggested: the plan wins for every rule, number and wording, and the screens win for the look. The list is in the brief, section 9.
8. **Habits and medicines inside Slice A.** Onboarding screens 12 and 13 and the morning review (DY-04) touch habits and medicines, which plan B06 puts in Slice B. Suggested: build these onboarding and review steps in Slice A, and leave habit logging and medicine changes for Slice B.
9. **Slice A is Free only.** Plan locking arrives in Slice B. Suggested: Slice A shows only the free parts, with no "Pro" labels or locks yet.
10. **Progress counter on Today.** Suggested: build it in Slice A. The "14 confirmed days needed" comes from plan A04 (7 days with and 7 days without). Confirm that number.
11. **Waitlist address.** Screen 03 saves a waitlist email, but plan B03 lists no endpoint for it. Suggested: add `POST /v1/waitlist`.
12. **Optional profile cards (PF-01 to PF-06) and question ON-03.** They are in the question list but on no screen. Suggested: not in Slice A.
13. **Consents in Me.** The plan does not say what happens when a required consent is withdrawn. Suggested: Slice A shows consents (type, version, date) without a withdraw button.
14. **Landing page links.** Terms, Privacy Policy, Contact and the "How Bloat works" method page do not exist until Gate 1. Suggested: build the landing page in Slice A and add each link when its page exists.
15. **Skeleton choices (step 2).** The list of libraries, automatic checks on GitHub, and adding `@supabase/ssr` when sign-in is built. See PROGRESS.md, "Next".

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
