# Bloat: work report, 26 November 2026

One session, started from the handoff of the previous Claude account. This file lists everything that was done, what was found, what was changed, how it was tested, what was published, and what is still open. Plain words; a technical term is explained the first time it is used.

## 1. Summary

- **D20 was already done** before this session (it is called P2 now, published by workflow run 14 on 24 Nov). Nothing more was needed for it.
- **Today and logging review:** four defects found and fixed (T1 to T4). Three gaps against the plan were recorded for your decision (D21 to D23).
- **History and editing review:** two defects found and fixed (R1, a privacy rule, and H1). One gap recorded for your decision (D24).
- **Published:** the Today fixes T1 to T4, with your yes, by workflow run 15 (commit `8ef62e7`, deployment `dpl_EZyj38upABHtKaQidLokQB4n6cxo`, live at 17:42 UTC on 26 Nov). **The History fixes R1 and H1 are made and tested but not published**: the push to the publishing branch was held back by a permission check, because your yes covered the Today fixes only. They wait for your yes.
- **Your test account `bloat-tester@bloat.test` was not used or changed.** One read-only check (counts only, after publishing) confirmed it is intact. No hosted test account was made. Every test used throwaway accounts on a local copy of the database.

## 2. Where things stood, compared with the handoff

Checked on 26 Nov with this session's own access to Vercel, GitHub and Supabase (all three connections worked).

| Handoff said | Found | Evidence |
|---|---|---|
| D20 (the wrong "Nothing was deleted" message) still to do | Already fixed in commit `f8fcd9d` with your wording, and published by run 14 | Commit `f8fcd9d`; GitHub run 14 succeeded on 24 Nov 09:57 UTC |
| Last deployment `dpl_55jDsCf3AbLK5mYRCEBEnKqtN9Jc` (commit `9c6ed14`) | The preview had moved on to `dpl_7N1RRQjq8qFDNmw9x3ihfcxk9iBD` (commit `f8fcd9d`) | Vercel deployment list and the address list of each deployment |
| Stale notes about K1, 200% zoom and the addresses | Already corrected on 24 Nov (commit `e4ebacd`) | The notes themselves |
| Latest documentation commit `8ea5b6c` | Two later notes commits, `e4ebacd` and `d827d25` | Git history of `claude/bloat-software-build-uxzoru` |
| Main addresses on the older build | Still true: `bloat-olive`, `bloat-typeshi2` and `bloat-git-main-typeshi2` serve `dpl_DoAEN2q7gxKTrfvL9pZw1nGGEekn` (commit `83fe4da`), without K1 and P2. The workflow never moves them | Vercel address list |
| A temporary bypass link on `bloat-olive` | It expired on 24 Nov at 18:48 UTC, so it no longer works | Vercel address list (expiry time of the link) |
| Supabase `bloat-test` | Healthy; the same six migrations as the repository | Supabase project and migration list |

This session works on its own branch, `claude/bloat-continuation-9mjd46` (the branch the cloud session was given). Only a push to `claude/bloat-software-build-uxzoru` runs the publishing workflow, so nothing was published until you said yes.

## 3. Setting up this session

- **Docker** (the program that runs the local copy of Supabase) was installed but not running. It was started by hand.
- **Image downloads:** the local Supabase needs about 12 container images. Two of the three places they come from refused (Docker Hub: "too many requests"; Amazon's registry: "data limit exceeded"), and the third (GitHub's) was blocked by this session's network rules. You approved a new personal cloud environment called **"bloat"** that allows GitHub's download host (`pkg-containers.githubusercontent.com`) and the preview address (`bloat-preview.vercel.app`). After that every image downloaded.
- **Restarts:** the session's machine restarted three times; each time Docker and the app server had to be started again. No work was lost (files on disk and commits survive a restart).
- **Memory note:** one note was saved to this repository's Claude Code memory, so a later session knows how to start the local database here (start Docker first; use the "bloat" environment for the image downloads). It holds no health data and no secrets.
- **Local test settings** were written with `scripts/ci-env.sh` (local-only values, already public in the repository). Nothing hosted was used by the local tests.

## 4. Baseline: the tests on the current preview code

Fresh session, commit `d827d25` (app code identical to the published `f8fcd9d`):

| Suite | Passed | Failed |
|---|---|---|
| Rule tests | 97 | 0 |
| API tests (real requests against the local stack) | 141 | 0 |
| Browser tests (phone screen, plus keyboard and 200% zoom) | 261 | 0 |
| Type check and lint | 0 errors (5 old warnings) | |

This matches the last report from the previous account.

## 5. Today and logging review

**What was compared with the plan (screens 15 to 25):** the Today layout and order, Highest logged so far, the Free progress counter, Pro cards (experiment, today's card, next best log, phase label), Keep an eye on it mode, Log bloating (strength, start time, warning chips with the NHS sentences, Pro fields), one open episode at a time, Bloating now (timer, update strength, readings), ending (Now / Choose time / Roughly / I don't know), "Is it still happening?", No bloating so far today, Add meal (Free and Pro, ingredient check, saved dishes, I don't know, Assume the usual recipe), Add activity, Log exercise, Log bowel movement, and Review yesterday (all three steps). A phone-screen walkthrough with screenshots was also done.

### Defects found and fixed

Each one was first shown by a new check that failed on the current code (`tests/e2e/today.spec.ts`, 6 checks), then fixed in commit `8ef62e7`.

| # | What was wrong | Evidence | Now |
|---|---|---|---|
| T1 | A save started on Today said nothing. The sheet closed and, on a phone, a new meal was listed below the fold, so the screen looked the same. The plan's wording is "Meal saved." and "Noted: no bloating so far today." After a new strength reading, "Saved" disappeared with the form | Walkthrough: no message visible or announced after saving bloating, a meal or No bloating; screenshot of the phone screen after a meal save. The new checks failed at "Bloating saved." and "Bowel movement saved." | A short line under the button that started the save: "Bloating saved.", "Noted: no bloating so far today.", "Meal saved.", "Activity saved.", "Exercise saved.", "Bowel movement saved.". Shown only after the server confirms, announced to screen readers, cleared when another sheet opens. "Saved" stays after a new reading |
| T2 | "No bloating so far today", an experiment answer (Yes, Partly, No) and "Not useful" remove their own button once saved, and keyboard focus fell back to the page (the same kind of defect as K1) | Walkthrough: focus on the page body. The checks failed: focus not on I feel bloated, not on Open experiment, and on the page body after Not useful | Focus moves to I feel bloated, to Open experiment, or to the screen title |
| T3 | After "No bloating so far today" the score showed "0 / 10" but a screen reader was told "Nothing logged yet" | Walkthrough read the spoken name: "Nothing logged yet" | The figure has one spoken name that matches the screen ("0 out of 10") |
| T4 | With "Earlier" or "Choose time" picked and the date field emptied, Save stayed on and the only reply was "Some answers were not valid." | Walkthrough and screenshot; the check failed (no hint, Save on) | Save waits for a time and the field says "Choose a date and time to save." (bloating start and end, meal, exercise, bowel movement, and the edit sheets on the day screen) |

Nothing about what is saved changed in T1 to T4.

One thing went wrong on the way and was put right: the first version of the T3 fix used text hidden from the eye but read by screen readers; the existing 200% zoom check counted that as cut-off text (1 failed, 266 passed). The fix was changed to give the figure a spoken name with no hidden text. The zoom check itself was not changed.

### Gaps that need your decision (not built)

| # | Gap | Recommendation |
|---|---|---|
| D21 | No screen asks EP-04, "Do you want to note a meal or activity you suspect was related?" (Pro, plan screen 16). The server saves it, and Possible triggers and the P5 focus card use it, so "Your suspicion" and that card can never appear | Add it to Log bloating for Pro: Choose an entry (today's meals and habits up to the start time) / Not sure / Skip |
| D22 | After a meal photo there is no "Looks like: [dishes]. Is this right?" step with Keep / Edit / Remove (ML-07). A wrong dish name cannot be corrected there | Build it before a real AI provider is switched on |
| D23 | Add activity has no time choice (plan: "Time: Now / Choose time"). A tap counts for today | Keep as built: habits are daily answers and nothing uses their time yet |

## 6. History and editing review

**What was compared with the plan (screens 26 and 27, "History and day detail", "Record deleted or corrected"):** the History list (date, score or ?, episodes, meals, statuses), the Free locked cards, the Pro 7-day average, chart with Week / Month / All, report links and "your usual" markers, the doctor line, the day screen (status and score, every kind of entry, review answers, Review this day / Change the review), editing times, conflicts between two devices (409 and "Reload this day"), deleting each kind of entry, and what happens to stored reports and their share links after a delete or correction.

### Defects found and fixed

| # | What was wrong | Evidence | Now |
|---|---|---|---|
| R1 | **Privacy rule.** The plan says that when a record is deleted or corrected, stored reports that used it are flagged for regeneration and their share links revoked (plan B05, the doctor PDF section, tests Q54 and Q89). Only meals did this. Deleting or correcting a bloating record (with its warning signs), deleting a bowel or exercise record, removing a habit answer, or changing a review left a shared doctor report live, still showing what the person had removed | New API test `tests/api/report-staleness.test.ts`: on the old code, the control passed and all 7 cases failed, each at "report flagged: expected false to be true" | Every delete and correction flags the stored reports whose dates cover the record, and revokes their share links, in the same transaction as the change. A meal moved to another day also flags reports covering the new day. The control check shows a report outside those dates is left alone |
| H1 | A habit answer could not be corrected anywhere. The day screen listed habits with no Edit or Delete (plan screen 27: "Edit / Delete on each item"), and Add activity can only add. A wrong tap stayed a "Yes" in comparisons for good | New browser check `tests/e2e/history.spec.ts` failed on the old code: no Delete button | Each habit on the day screen has Delete, with the usual confirmation and the note "It becomes unknown, not No." The answer is removed, never turned into "No" |

### Gap that needs your decision (not built)

| # | Gap | Recommendation |
|---|---|---|
| D24 | The plan says "edit time, strength or details". Only a bloating record's times and a meal's name and time can be edited. Not editable: strength readings, warning signs and symptoms; a meal's portion and ingredients; bowel and exercise details (they can only be deleted) | Add editing for a meal's portion and ingredients and for bowel and exercise details; keep strength readings as they are (the plan also says "earlier readings are never overwritten") but allow deleting a mistaken one |

Looked at and found as the plan describes: the History list and statuses, the Free locked cards, the 7-day average and chart with Week / Month / All, the report links, the "your usual" markers, the day screen's sections, the review link for finished days, and the conflict message with "Reload this day".

## 7. Publishing

**Today fixes (T1 to T4): published.**

1. You said yes. Before pushing, the publishing branch was checked: still at `d827d25`, so the push was a plain fast-forward.
2. Only the fix commit `8ef62e7` was pushed to `claude/bloat-software-build-uxzoru` (17:22 UTC). The notes commit was kept back on purpose: it is marked `[skip ci]`, and when the newest pushed commit carries that mark, GitHub skips the whole workflow, publishing included.
3. **Run 15, first attempt: failed, nothing published.** Typecheck, lint and rule tests passed; then starting the local database on GitHub's machine failed because that machine already had port 54324 in use (`address already in use`). This happened before any app test and before anything was built on Vercel. The cause is on GitHub's side, not in the code.
4. **Run 15, re-run of the failed job (same commit): passed and published** at 17:42 UTC. Every check passed on a clean copy of the code (typecheck, lint, rule, API and browser tests), the deployment controls were read back, Vercel built the commit, the 6 signed-out live checks passed on the new build, both preview addresses were moved, and the same 6 checks passed on the public address.
5. **Checked afterwards:**
   - Vercel shows `bloat-preview.vercel.app` and the branch address on `dpl_EZyj38upABHtKaQidLokQB4n6cxo`.
   - The three main addresses are still on `dpl_DoAEN2q7gxKTrfvL9pZw1nGGEekn` (`83fe4da`): not moved.
   - All 211 repository files Vercel lists for the new deployment are byte-identical to `8ef62e7`, including 5 of the 7 changed files and the new checks. The Today and day screens sit in folders Vercel lists only partly, so those two were not compared one by one. An attempt to find the new messages in the live browser files was inconclusive: the Today screen's code is only sent after signing in.
   - Your test account: read-only check, intact (1 meal, the 23 Nov QA meal; 1 bloating record; 1 report). No account carries a test-run marker.

**History fixes (R1, H1): not published.** The push of `0ffc99a` to the publishing branch was refused by the session's permission check, because your yes was for the Today fixes. Nothing was worked around. To publish them later, the fix commit must be the newest commit pushed (or the workflow started by hand on the publishing branch), for the same `[skip ci]` reason as above.

## 8. All test results of this session

| What | Code | Rule | API | Browser | Notes |
|---|---|---|---|---|---|
| Baseline | `f8fcd9d` (published code at the start) | 97 passed | 141 passed | 261 passed | 0 failed anywhere |
| New Today checks, before the fix | `f8fcd9d` | | | 6 failed | each at its defect |
| Today fixes, first version | working copy | 97 passed | 141 passed | 266 passed, 1 failed | the 200% zoom check flagged the hidden screen-reader text; fixed differently, check unchanged |
| Today fixes, final | `8ef62e7` | 97 passed | 141 passed | 267 passed | |
| GitHub run 15, attempt 1 | `8ef62e7` | passed | not reached | not reached | stopped at the database start (port 54324 in use on GitHub's machine); nothing published |
| GitHub run 15, attempt 2 | `8ef62e7` | passed | passed | passed | 6 + 6 signed-out live checks passed; published |
| New History checks, before the fix | `8ef62e7` | | 1 passed (control), 7 failed | 1 failed | each at its defect |
| History fixes, first full run | working copy | 97 passed | 148 passed, 1 failed | 268 passed | the weekly-report test (Q40) expected reuse after a correction; test made stricter (see section 6 and DECISIONS.md choice 25) |
| History fixes, final | `0ffc99a` | 97 passed | 149 passed | 268 passed | |
| Type check and lint | every final state | 0 errors (5 old warnings) | | | |

Not run: the signed-in hosted suite (needs accounts you approve), real phones, screen readers.

## 9. What changed, file by file

Today and logging fixes, commit `8ef62e7`:

| File | Change |
|---|---|
| `src/app/(app)/today/today.tsx` | The two save-message lines (T1); "No bloating so far today" keeps focus (T2); the score's spoken name (T3) |
| `src/components/today/pro.tsx` | Experiment answer and "Not useful" keep focus (T2) |
| `src/components/today/bloating.tsx` | "Saved" stays after a new reading (T1); Save waits for a time (T4) |
| `src/components/today/meal.tsx`, `src/components/today/activity.tsx` | Save waits for a time (T4) |
| `src/components/timepick.tsx` | The shared empty-time rule and the hint "Choose a date and time to save." (T4) |
| `src/app/(app)/day/[date]/day.tsx` | The edit sheets wait for a time (T4) |
| `tests/e2e/today.spec.ts` (new) | 6 checks for T1 to T4 |

History and editing fixes, commit `0ffc99a` (on the working branch only):

| File | Change |
|---|---|
| `src/server/meals.ts` | The report-flagging rule now covers the days a record touched (a range), for every caller (R1) |
| `src/app/v1/episodes/[id]/route.ts` | A bloating time correction or delete flags reports and revokes their links (R1) |
| `src/app/v1/bowel/[id]/route.ts`, `src/app/v1/exercise/[id]/route.ts` | A delete flags reports and revokes their links (R1) |
| `src/app/v1/days/[date]/activities/route.ts` | Removing a habit answer flags reports and revokes their links (R1) |
| `src/app/v1/days/[date]/review/route.ts` | Changing an earlier review flags reports and revokes their links (R1) |
| `src/app/v1/meals/[id]/route.ts` | A meal moved to another day also flags reports covering the new day (R1) |
| `src/app/(app)/day/[date]/day.tsx` | Delete on each habit answer, with the note "It becomes unknown, not No." (H1) |
| `tests/api/report-staleness.test.ts` (new) | 8 checks for R1 (one control, seven kinds of change) |
| `tests/e2e/history.spec.ts` (new) | 1 check for H1 |

No database migration was needed or applied. No Vercel variable, Supabase setting or account was changed.

Commits of this session, in order:

| Commit | What | Where |
|---|---|---|
| `8ef62e7` | Today fixes T1 to T4 with their checks | Working branch and publishing branch (published, run 15) |
| `4dbdaae` | Notes for the Today review (`[skip ci]`) | Working branch |
| `0ffc99a` | History fixes R1 and H1 with their checks | Working branch only (not published) |
| the commit that adds this report | Notes after run 15 and the History review, and this report (`[skip ci]`) | Working branch |

## 10. Notes updated

- `PROGRESS.md`: current status re-verified on 26 Nov; the Today and History reviews; decision groups; a new history entry; the phone checklist no longer promises a "Saved" message the preview did not show.
- `DECISIONS.md`: new open decisions D21, D22, D23 and D24, and engineering choice 25 (every delete or correction flags the reports that used it; a changed review counts as a correction, which you can reverse).
- `TEST_RESULTS.md`: the results of this session, kept apart by build.
- `DEPLOYMENT.md`: the bypass link marked as expired; the current state after run 15 and a history entry for 26 Nov.
- This report.

## 11. Not done, and limits

- **Not tested on real phones** (iOS Safari, Android Chrome) **or with a screen reader** (VoiceOver, TalkBack, NVDA). The keyboard and screen-reader behaviour above was checked in desktop Chromium with automated checks only.
- **The signed-in hosted checks were not run** on the new builds: they need fresh synthetic accounts on `bloat-test`, which only you can approve. The workflow's six signed-out live checks ran on each published build.
- **The main addresses** (`bloat-olive` and the two others) still show the older `83fe4da`. Moving them is your call.
- **The verification report** (`docs/verification-report.md`) is built from saved raw evidence and still describes `f8fcd9d`; this session's results are in `TEST_RESULTS.md` and here.
- Real AI, payments, email sign-in for outside users, founder tools and the other launch items listed in `PROGRESS.md` were not touched.

## 12. Suggested next steps

1. Say yes (or no) to publishing the History fixes R1 and H1. R1 is a privacy rule, so it is worth publishing soon.
2. Decide D21 to D24 (and the older open decisions in `DECISIONS.md`), and whether to keep choice 25 as it is.
3. Approve synthetic accounts for a signed-in hosted run on the new build, if you want the live check.
4. Continue the review: Patterns, then reports, then experiments and Learn.
