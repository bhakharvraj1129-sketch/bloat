# Slice A brief: the core diary

Status: **proposal, waiting for the owner's yes** (written 15 Nov 2026, session 1). No code is written from this brief until it is approved. Open points are in sections 9 and 10.

Sources: plan B06 (slices), A05 to A11 and A17 (screens and rules), B01 to B05 (engineering), C01 and C02 (questions and tests), section 0.3 and 0.4 (latest fixes), the Build Guide, and the approved screens in `../design/screens/`.

## 1. Scope

Plan B06, Slice A: "Onboarding with help page and consents, episodes with warning chips, basic meals, morning review, history, day detail, corrections, export; synthetic US/CA/IN accounts; ownership, revisions, time rules first."

In plain words, at the end of Slice A a person can:

- Choose their country, read "When to get medical help", sign up, and agree to the three consents.
- Answer the setup questions, including their personal goal.
- Tap "I feel bloated", pick a strength from 1 to 10, mark any of the nine NHS warning signs, update the strength, and end the episode.
- Add a meal by typing its name, with time and portion.
- Do the morning review, which sets yesterday's Bloat Score.
- See past days in History, open a day, and edit or delete any record.
- Download all their data.

Underneath, the server rules come first (plan B06 and the session routine):

- **Ownership**: each person can only ever read and change their own rows. The database enforces it (Row Level Security: a database rule that hides other people's rows).
- **No duplicates**: every save carries a unique key, so a retry never saves twice.
- **Revisions**: every edit gets a new version number, and a stale edit is refused.
- **Time rules**: every record stores the exact time, the time zone, and how exact it is. Days never move when the person travels.
- **Unknown stays unknown**: a skipped answer is never turned into "No" or zero.

Everyone in Slice A is on the Free plan. Test accounts are made-up people from the USA, Canada and India, in `bloat-test` only. Every production switch stays off.

## 2. Screens

Plan numbers are from A05 and A06. Design files are in `../design/screens/` (copied 15 Nov 2026 from the "Bloat App Screens" artifact). The design files have their own numbering, which is different from the plan's.

| Plan # | Screen | Approved design file | In Slice A |
|---|---|---|---|
| 01 | Landing page | `Landing.dc.html` | Yes. Wording differs from the plan: see 9.8 |
| 02 | Where do you live? | `Country.dc.html` | Yes |
| 03 | Not available yet | inside `Country.dc.html` | Yes (waitlist email) |
| 04 | When to get medical help | `Help.dc.html` | Yes. Text is the plan's fixed NHS text: see 9.9 |
| 05 | Sign up / sign in | `SignUp.dc.html` | Yes |
| 06 | Enter email code | inside `SignUp.dc.html` | Yes |
| 07 | Consent | `Consent.dc.html` | Yes (CN-01, CN-02, CN-03 only: see 9.6) |
| 08 | Location, time and units | **no design** | Yes: see 9.2 |
| 09 | About your bloating | `OnbSymptoms.dc.html` | Yes |
| 10 | Other symptoms you often get | inside `OnbSymptoms.dc.html` | Yes |
| 11 | Your food | **no design** | Yes: see 9.2 |
| 12 | Health context | `OnbContext.dc.html` | Yes: see 10.1 |
| 13 | Habits to follow | `OnbHabits.dc.html` | Yes: see 10.1 |
| 14 | How Bloat works | **no design** | Yes: see 9.2 |
| (0.4) | Your goal (ON-16) | `OnbGoal.dc.html` | Yes. In plan section 0.4; it has no number in A05 |
| 15 | Today | `Main.dc.html` | Free parts only: date, Review yesterday card, Today card ("Highest logged so far"), I feel bloated, Add meal, timeline, tabs |
| 16 | Log bloating | `LogBloating.dc.html` | Free parts: EP-01, EP-02, EP-08a, help link |
| 17 | Bloating ongoing | `Ongoing.dc.html` | Yes (without EP-09, which is Pro) |
| 18 | Bloating ended | `EndEpisode.dc.html` | Free part: EP-06 and the summary |
| 19 | Is it still happening? | `StillHappening.dc.html` | Yes |
| 20 | Add meal | `AddMeal.dc.html` | Free parts: typed dish, Recent, time, portion, pace, where made. Button says Save, not "Check ingredients" |
| 25 | Review yesterday | `MorningReview.dc.html`, `ReviewFood.dc.html` | Free parts: DY-01 to DY-04, WK-01 on Mondays |
| 26 | History | `History.dc.html` | Free day list only (date, score or ?, episodes, meals) |
| 27 | Day detail | `DayDetail.dc.html` | Yes: status, score, timeline, review answers, edit and delete |
| 39 | Me | `Me.dc.html` | Slice A parts: profile (country, time zone with preview, units), consents, download my data, When to get medical help, sign out |

Every screen must handle these states (plan A05): loading, empty, saved, error with retry, connection lost ("Check save status"), signed out. Back and focus order must work with a keyboard and a screen reader.

The approved screens mostly show a Pro user. Slice A builds the free view of each one.

## 3. Questions

IDs from `../data/Bloat_Questions_v4.3.json`. Options, labels and rules are loaded from that file, never typed by hand.

- **Before sign-up and sign-up**: ON-02 (country), HP-01, ON-01, CN-01, CN-02, CN-03.
- **Setup**: ON-02 (region and time zone), ST-01, ON-16, ON-06, ON-07, ON-08, ON-12, ON-11, ON-04, ON-05, ON-09, ON-10, ON-14, ON-15, ON-13. With ON-09 "Yes, add names": MD-01 and MD-04 (see 10.1).
- **Episodes**: EP-01, EP-02, EP-05, EP-06, EP-07, EP-08a.
- **Today**: DY-05.
- **Meals**: ML-01 (Type it and Recent only), ML-02, ML-04, ML-05, ML-06.
- **Morning review**: DY-01, DY-02, DY-03, DY-04, WK-01.

That is 39 of the 91 questions (37 if 10.1 is not approved). Not in Slice A: ON-03 and PF-01 to PF-06 (see 10.5); every Pro question (EP-03, EP-04, EP-08, EP-09, ML-03, ML-07 to ML-12, BW, EX, HC, FH, XP, FX, WB, GC, AR, KM, RC, PD); CN-04 (Slice C); CY-01, CY-02 and MD-02 (Slice B); DN-01 (Slice E).

## 4. Acceptance tests (proposed list: the owner approves)

IDs from `../data/Bloat_Acceptance_v4.3.json`. The 200 tests are not tagged by slice, so this list is a proposal. 52 tests belong to Slice A (51 without Q139).

| Area | Tests |
|---|---|
| Episodes and time | Q01, Q02, Q03, Q04, Q05, Q06, Q07, Q08, Q66, Q86, Q88 |
| Morning review and score | Q09, Q10, Q16, Q42, Q43, Q44, Q170 |
| Country, help page, sign-up, setup | Q38, Q47, Q48, Q63, Q64, Q70, Q85, Q90, Q91, Q92, Q130 |
| Warning signs | Q114, Q160, Q161, Q163 |
| Meals | Q67, Q104 |
| Privacy and server rules | Q32, Q39, Q56, Q60, Q184 |
| Whole-slice checks | Q59, Q61, Q65, Q93, Q95, Q96, Q120, Q129, Q148, Q154, Q186 |
| Progress counter | Q139 (only if 10.3 is approved) |

Plus the **two-user privacy test** (user A can never read or change user B's rows), which runs in every session from step 3 onward.

Some tests have a second half that can only be checked later. Slice A proves the first half now, and the later slice runs the whole test again:

- Q16, Q43: the day status (Late, Provisional) now; "left out of averages and comparisons" in Slice D.
- Q56: older recalculation never overwrites a newer day score now; insights in Slice D.
- Q60: another person's record ID is refused now; invented food tags in Slice C.
- Q67: food text kept exactly as typed now; AI behaviour in Slice C.
- Q95: no labels on the History list now; charts in Slice D.
- Q130: emergency numbers now; eating-disorder helplines in Slice E.
- Q170: WK-01 saved and asked once a week now; shown on Your usual and the doctor PDF in Slice D.
- Q184: expired download link now; shares, deletion and backups in Slices D and F.
- Q32, Q93, Q96, Q104, Q120, Q129, Q148: run on Slice A's screens now, and again at the end of every later slice.

Tests that look like Slice A but wait for a later slice:

- Q15 (habit not tapped), Q94 (other symptoms), Q97 and Q115 (Pro locks), Q162, Q164, Q208, Q209, Q210: Slice B.
- Q11, Q45, Q89 (charts, averages, reports): Slice D.
- Q74 (withdrawing an optional consent): Slice C, with the first optional consent.
- Q116, Q155 to Q158 (doctor line): Slice E, as in the Build Guide.
- Q33, Q37, Q55, Q62, Q75 (deletion, countries and payments): Slice F.

## 5. Tables and endpoints

### Tables (plan B02)

Every table gets Row Level Security. Each table change is a new migration file (a numbered script that changes the database), applied to `bloat-test` only.

| B02 # | Tables in Slice A |
|---|---|
| 01 | `profiles` |
| 02 | `consents` |
| 04 | `question_definitions`, `question_responses` |
| 05 | `help_page_views` |
| 06 | `episodes` |
| 07 | `strength_samples` |
| 08 | `warning_signs` only |
| 09 | `day_reviews`, `day_scores` |
| 10 | `meals` |
| 15 | `activity_definitions`, `followed_activities`, `activity_observations` (only if 10.1 is approved) |
| 18 | `medicines` (only if 10.1 is approved) |
| 26 | `country_capabilities`, `content_versions` |
| 27 | `audit_log`, `command_log`, `recompute_outbox`, `export_jobs`, `waitlist` |

Not in Slice A: `entitlements`, `episode_symptoms`, `episode_suspicions`, `meal_ingredients`, `meal_photos`, saved dishes, `food_suggestions`, exercise, bowel, `medicine_changes`, health background, comparisons, reports, focus cards, experiments, cards, `deletion_jobs`.

For step 3 to settle: plan B02 says episodes and meals carry a `revision` number and that deleting a record removes its revisions, but it does not name a table for the old versions. Step 3 proposes how to store them and asks before creating anything.

### Endpoints (plan B03)

An endpoint is an address on the server that the app calls. All of these run on the server only, check who is asking, and follow the conventions in plan B01 (error shape, unique save key, revision check, time format).

- `GET /v1/me/state`
- `GET /v1/help?country=`, `POST /v1/help/ack`
- `POST /v1/onboarding/commit`
- `PATCH /v1/me/profile`
- `PUT /v1/me/followed-activities` (only if 10.1 is approved)
- `POST /v1/consents` (viewing and granting; withdrawal: see 10.6)
- `POST /v1/episodes`, `POST /v1/episodes/{id}/samples`, `POST /v1/episodes/{id}/end`, `POST /v1/episodes/{id}/still-happening`, `PATCH /v1/episodes/{id}`, `DELETE /v1/episodes/{id}`
- `POST /v1/episodes/{id}/warning-signs`
- `POST /v1/days/{date}/no-bloating-so-far`, `PUT /v1/days/{date}/review`
- `POST /v1/meals`, `PATCH /v1/meals/{id}`, `DELETE /v1/meals/{id}`
- `GET /v1/history?from&to&cursor` (also used by Day detail, for one day)
- `POST /v1/export`, `GET /v1/export/{job}`
- `GET /v1/commands/{key}` (answers "did my save go through?")
- `POST /v1/medicines` (only if 10.1 is approved)
- `POST /v1/waitlist` (**not in plan B03**: see 10.4)

Sign-up and sign-in themselves use Supabase Auth (Google and email code), not a `/v1` route.

## 6. Out of scope

These wait for a later slice. If one comes up while building Slice A, it is not built.

- **Slice B**: logging habits (Add activity), medicine changes, periods, bowel and exercise logs, Pro episode detail (EP-03, EP-04, EP-08, EP-09), Free and Pro locking, "Pro" labels and the Upgrade screen, lists that adapt to use.
- **Slice C**: the meal AI, photos, ingredient check, saved dishes, the AI consent, the AI spending limit.
- **Slice D**: charts, 7-day average, Your usual, possible triggers, Your journey, weekly report, doctor PDF and sharing, Keep an eye on it mode, the Insights screens.
- **Slice E**: experiments, daily cards, Learn library, the doctor line at the top of History, Your cycle, medicine before and after.
- **Slice F**: delete account, backups, analytics events, payments and Pause Pro.
- **Not in this release at all**: streak display (decided 15 Nov 2026), push notifications and reminders (plan A18), real users, a public site, payments.
- **Not decided yet**: the Day 1, Day 3, Day 7 and Day 14 screens (9.4), optional profile cards (10.5), install to the home screen (plan A07 offers it "after first value"; the app icon needs the logo, which is not designed).

## 7. Parts (one part per session, in build order)

Steps are the step numbers in "00 Start here". Each part starts with its tests, then the code, then all tests are run.

| Part | Step | What is built | Screens | Tests that prove it |
|---|---|---|---|---|
| A0 | 2 | **App skeleton.** Empty app with Bloat's colours and fonts and working testers. Not part of the slice's tests. | none | one unit test, one phone-screen test |
| A1 | 3 | **Database and privacy wall.** Slice A's tables, Row Level Security on each, the two-user privacy test, three made-up accounts (US, CA, IN). | none | two-user privacy test, Q32, Q60 |
| A2 | 4 | **Saving rules and time rules on the server.** The standard error message shape, no duplicates on retry, revision check, "did my save go through?", time storage and the pinned day boundary, loading the three data files with a check that they agree, all feature switches off. Nothing to see on a phone in this part; the tests are the proof. | none | Q154, Q186, and the rule-level halves of Q05, Q06, Q65, Q66 |
| A3 | 4 | **Before sign-up.** Landing page, country choice, "not available yet" with waitlist, the help page with the right emergency number. | 01, 02, 03, 04 | Q38, Q63, Q64, Q70, Q91, Q129, Q130, Q148 |
| A4 | 4 | **Sign-up, sign-in and consent.** Google and email code, the 18+ question, the help-page acknowledgement saved after sign-up, three consents, sign-out that clears the phone. | 05, 06, 07 | Q39, Q47, Q92 |
| A5 | 4 | **Setup questions.** Location, time and units, goal, about your bloating, other symptoms, food, health context, habits to follow, How Bloat works. All answers saved together in one go. | 08 to 14, goal | Q48, Q85, Q90 |
| A6 | 4 | **Episodes on the server.** Start, new strength readings, end, "still happening", warning signs, edit, delete. One open episode per person, no overlaps, midnight handled. No screens yet. | none | Q01, Q02, Q03, Q04, Q05, Q07, Q08, Q66, Q86, Q88 |
| A7 | 4 | **Today and the episode screens.** Today with the "I feel bloated" button and tabs, the Log bloating sheet with the nine warning chips, Bloating ongoing, Bloating ended, Is it still happening? | 15, 16, 17, 18, 19 | Q44, Q114, Q160, Q161, Q163 |
| A8 | 4 | **Meals.** Add meal (typed dish, Recent, time, portion, pace, where made), saved on the server, shown in Today's timeline. A meal always saves. | 20 | Q67, Q104 |
| A9 | 4 | **Morning review and Bloat Score.** The Review yesterday card, the review steps, "No bloating so far today", and the day status (Confirmed, Late, Provisional, Conflict, Unknown). The progress counter if approved. | 25, 15 | Q09, Q10, Q16, Q42, Q43, Q44, Q86, Q170, (Q139) |
| A10 | 4 | **History and day detail.** The free day list, a day's timeline and review answers, edit and delete on each item, recalculation after a correction. | 26, 27 | Q06, Q56, Q65, Q88, Q95 |
| A11 | 4 | **Me and download my data.** Profile with time-zone preview, units, consents, help page link, sign out, and the data download (JSON and CSV, link lasts 15 minutes). | 39 | Q39, Q90, Q184 |
| A12 | 5 | **Finish Slice A.** Every test run, the three countries end to end, keyboard and screen-reader pass, wording scans, the owner's phone checks, then the tag `slice-a-done`. | all | Q59, Q61, Q93, Q96, Q120, Q129, Q148, and every test above again |

Twelve parts after the skeleton is more than the Build Guide's two-week guess for Slice A. Parts A2 and A6 could be joined, and so could A10 and A11, if a session has room. They are never joined across a failing test.

## 8. Done means

Slice A is done only when all four are true (session routine and Build Guide):

1. Every acceptance test in section 4 passes automatically.
2. The owner tried it on an iPhone and an Android phone, in light and dark mode. Claude Code cannot do this, so it asks.
3. The screens match the approved designs and the wording rules (`bloat-design-system` and `bloat-wording-and-safety` skills).
4. The two-user privacy test still passes.

Then PROGRESS.md is updated, the commit is tagged `slice-a-done`, and it is pushed.

## 9. Where the approved screens and the plan disagree

Found on 15 Nov 2026 by reading the 20 Slice A design files next to plan A06. Suggested rule: **the plan wins for every rule, number and wording; the screens win for the look.** Each item still needs the owner's yes, because CLAUDE.md says never to change a rule alone.

1. **Tabs.** Plan A06: Today · History · Me. Screens, design README and Build Guide: Today · History · Insights · Me. Slice A has nothing to put in Insights. *Needs a decision before part A7.*
2. **Setup steps.** The screens show 8 steps (country, help, account, consent, goal, about your bloating, context, habits) and then go straight to Today. The plan has 11. Missing from the screens: 08 location, time and units (the time zone decides where each day starts and ends, so it cannot be skipped); 11 your food (ON-04, ON-05); 14 the four "How Bloat works" cards; question ON-08 "How long has this been happening?"; and a "Continue with Google" button. *Suggested: build all of them as the plan says, in the style of the other setup screens, and show the owner each new screen before it is finished.*
3. **Morning reminder.** `OnbHabits`, `Me` and the Day 1 screen show "Morning review reminder, every day at 8:00 AM". Plan A18: "No push notifications or WhatsApp reminders in this release." *Suggested: build no reminder.*
4. **Day 1, Day 3, Day 7 and Day 14 screens.** Four screens under "First two weeks: something to see before day 14". They are not among the plan's 39 screens and no plan section gives their rules. Some of their content needs Pro data. *Suggested: not in Slice A. Decide between slices and update the plan first.* These four files were not copied into the repo.
5. **Strength when updating an episode.** `Ongoing` shows 0 to 10. Plan EP-01 is 1 to 10, and test Q86 says 0 must be refused. *Suggested: 1 to 10.*
6. **AI consent at sign-up.** `Consent` shows CN-04 as an optional fourth tick. The plan asks CN-04 before the first AI ingredient check, for Pro. *Suggested: three ticks in Slice A; CN-04 arrives in Slice C.*
7. **"Not sure" on Is it still happening?** `StillHappening` says "Saved as end time unknown". Plan A06 and A08 say Not sure keeps the episode open. *Suggested: keeps it open.*
8. **Landing page.** The screen's headline is "See what your bloating follows", with a sample week. Plan A01 and A06 fix the headline as "Track your bloating. Spot your possible triggers. Bring real data to your doctor.", with three steps, a Free and Pro table, a method link, a privacy promise and a footer. *Suggested: the plan's wording and content in the screen's style. Needs the owner's eye.*
9. **Help page text.** `Help` shows short lists and its own opening line. The plan (A17) fixes the full text, quoted from the NHS word for word, and test Q148 checks it letter by letter. The screen also lists "Bloating on more than 12 of the last 30 days" where the NHS text says "you feel bloated regularly". *Suggested: the plan's fixed text in the screen's three-box layout.*
10. **Habits.** `OnbHabits` lets a person pick Pro habits (poor sleep, stressed) with no lock, and `ReviewFood` offers only Yes and No. Plan: Pro habits are locked for Free, and DY-04 is Yes / No / Not sure. *Suggested: follow the plan.*
11. **Meal time.** `AddMeal` shows "Now · 1:15 PM today · Yesterday evening". Plan ML-02 is "Now / Choose time". *Suggested: follow the plan.*
12. **Email code timing.** `SignUp` shows "Code lasts 10 minutes" and a 42-second countdown. Plan screen 06 says "Resend after 30 seconds" and gives no lifetime. *Suggested: 30 seconds; show no lifetime unless the owner adds one.*

## 10. Other open questions

1. **Habits and medicines inside Slice A.** Setup screens 12 and 13 and the morning review step DY-04 use habits and medicines, which B06 lists under Slice B. All setup answers must save together in one go (plan A07), so building setup twice is risky. *Suggested: in Slice A, a person can pick up to 3 free habits, answer them each morning, and add medicine names and types during setup. Slice B adds habit logging (Add activity), changing followed habits and medicines in Me, and medicine changes.* This brings the three habit tables and `medicines` into Slice A.
2. **Free only.** *Suggested: Slice A shows only free items. "Pro" labels, locked cards and the Upgrade screen arrive together in Slice B.*
3. **Progress counter on Today.** Free feature (plan A04, test Q139): "14 days logged · 9 of 14 confirmed days needed for possible triggers". *Suggested: build it in part A9, with real counts only. The "14" is two times the plan's setting of 7 days in each group. Confirm.*
4. **Waitlist endpoint.** Plan B03 has no endpoint for screen 03's waitlist. *Suggested: `POST /v1/waitlist`, saving email and country only.*
5. **Optional profile cards.** Plan A07 says PF-01 to PF-06 "appear one per day in the first week". No screen in A05 or A06 shows where, and ON-03 is in the question list but on no screen. *Suggested: not in Slice A.*
6. **Consents in Me.** Plan screen 07 says consents are "withdrawable in Me", but the plan does not say what happens when a required consent (terms, health data, wellness) is withdrawn. *Suggested: Slice A shows each consent with its version and date, with no withdraw button. Withdrawal arrives with the first optional consent in Slice C.*
7. **Landing page links.** Terms, Privacy Policy and Contact come from the legal template service at Gate 1 (plan D02), and the "How Bloat works" method page is not written. *Suggested: each link is added when its page exists; tracked as an open issue until Gate 1.*
8. **Small things to ask when their part comes.** Where "No bloating so far today" (DY-05) sits on Today (no screen shows it). The exact words of the "English only" note for test Q70 (not in the plan). How old versions of a record are stored (section 5).

## 11. What the owner sets up

- **Before step 2**: connect Vercel to this repo (see "00 Start here", section 4).
- **Before part A4**: Google sign-in needs a Google sign-in key made in Google's console and pasted into Supabase's settings. Claude Code gives the exact steps then. Email codes work without it.
- **Email codes**: Supabase's built-in email sender allows only a few emails an hour. That is enough for testing. Resend is needed before the beta.
- **Keys**: never in the chat. They go into environment settings; step 2 says exactly where.
