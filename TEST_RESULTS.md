# Test results

Last run: 19 Nov 2026. The newest results (navigation and action repairs) are first; older sections follow. Local and hosted results are kept apart below. Synthetic accounts, labelled mock AI and mock billing everywhere.

## Navigation and action repairs (19 Nov 2026)

### Local (local Supabase in Docker; nothing hosted)

Fixed build = commit `b888008` plus the Contact link change, served on port 3100. Earlier build = commit
`dc88b37` (the last deployed one), served from a separate copy on port 3200 against the same local database.

| Check | Result |
|---|---|
| Rule tests `pnpm test` (adds 2 return-path tests) | 94 passed, 0 failed |
| API tests `pnpm test:api` | 134 passed, 0 failed |
| Browser tests `pnpm test:e2e` (adds 14 navigation tests; one older test updated for the corrected waitlist label) | 31 passed, 0 failed |
| The 14 navigation tests on the earlier build | **14 failed**, each at the defect it checks (see `docs/control-ledger.md`, "Defects reproduced and repaired") |
| Control ledger crawler, fixed build: 740 controls and pages for signed-out, Free and Pro | 620 pass, 0 fail, 49 checked by named tests, 71 listed |
| Control ledger crawler, earlier build | 598 pass, **19 fail** (empty "Send code" and "Join waitlist" did nothing visible) |
| Five widths (320, 390, 768, 1024, 1440) on 23 screens: sideways scrolling | 0 of 180 in both builds |
| Outside source links (NHS, NIDDK, BDA, CDC, PMC): 7 addresses | All HTTP 200 |
| Type check, lint | 0 errors (5 old warnings) |

Not tested: real phones (iOS Safari, Android Chrome); a slow or flaky real network (lost replies were simulated
by blocking requests in the browser); screen readers other than the accessibility tree.

### Hosted preview

Environment: `https://bloat-git-claude-bloat-software-build-uxzoru-typeshi2.vercel.app`, commit `e029f9d`
(deployment `dpl_D3QpxCgr3cZXJR7UesavJbGVhWF6`, READY, alias confirmed on this deployment), `BLOAT_SIGN_IN_METHOD=password`,
`BLOAT_TEST_LOGIN=0`, Supabase `bloat-test`. Run 19 Nov 2026, signed out only.

| Check | Result |
|---|---|
| `/me` signed out goes to `/sign-in?next=%2Fme`; an outside address in `next` is ignored | Passed |
| Contact, then its help link, then Back returns to Contact; Privacy, Terms and How Bloat works opened directly: Back goes to the start page; Help opened directly: its Back button goes to the start page | Passed |
| Empty waitlist and empty sign-in: an inline message in the app's own wording | Passed |
| Earlier public checks: fresh browser, no Vercel login, password-only sign-in, no sign-up, no code screen | Passed |
| Earlier public checks: signed-out API and direct database calls read and change nothing | Passed |
| Test switches off: old test login 404, no test password on the sign-in screen | Passed; the rest of that test (mock purchase and test clock refused for a signed-in account) **blocked**: needs a hosted test account |
| Anything signed in on the hosted preview (sheets, saves, Back inside the app, unsaved-change questions) | **Not run.** No hosted test account exists: Supabase sign-ups are still on and `bloat-tester@bloat.test` was not created (checked 19 Nov). These behaviours are proven locally only. |

## Email-and-password sign-in (18 Nov 2026)

### Local (local Supabase in Docker; nothing hosted)

| Check | Result |
|---|---|
| Rule tests `pnpm test` (adds 3 sign-in message and validation tests) | 92 passed, 0 failed |
| API tests `pnpm test:api` (default email-code mode) | 134 passed, 0 failed |
| Browser tests `pnpm test:e2e` (default email-code mode, incl. 5 email-code tests with real local emails) | 17 passed, 0 failed |
| Type check, lint | 0 errors (5 old warnings) |
| Rehearsal: the hosted suite against a local copy in password mode (`BLOAT_SIGN_IN_METHOD=password`, `BLOAT_TEST_LOGIN=0`) with 7 synthetic local accounts | **9 passed, 1 failed by design.** Passed: public visit and password-only sign-in screen; test switches off; signed-out API and database access refused; meal saved and still there after refresh; diary flow incl. sign out and sign back in through the form; two-account isolation; report privacy and share-link revoke; exports; and the sign-in check (empty-form field errors, wrong password and unknown address get the same message, password cleared, no input names, no password in any URL, correct sign-in, refresh keeps the session, sign-out ends screens and APIs, and a second session's token stops working). Failed by design: "nobody can create an account", because local sign-ups stay on for the API tests; the test stopped before sending any sign-up request. |

### Hosted preview

Environment: `https://bloat-git-claude-bloat-software-build-uxzoru-typeshi2.vercel.app`, commit `940a00d` (deployment `dpl_92qDryyhPyPmfHvD7zVQbQLT6sXR`), `BLOAT_SIGN_IN_METHOD=password`, `BLOAT_TEST_LOGIN=0`, Supabase `bloat-test`. Run 18 Nov 08:30–08:45 UTC.

| Check | Result |
|---|---|
| A fresh signed-out browser opens the preview (200, no Vercel login); `/today` goes to the app's sign-in; the sign-in shows email and password only, says new accounts can't be created; no "Send code", no sign-up links, no Google button; `/sign-in/code` sends you back to `/sign-in` | Passed (browser) |
| Signed out: history, state, a day, reports and an export link 401; a meal save 401; founder tools 404; direct database reads with the public key return nothing or "permission denied"; a direct insert refused | Passed (browser and API) |
| Empty form: field error shown and the field marked invalid; unknown email and wrong password: only "Email or password is incorrect."; password field cleared; 0 inputs with a `name`; the password appeared in no requested URL; the page stayed on `/sign-in` with no query | Passed (browser) |
| Old test-login route | 404, passed |
| Supabase logs since 08:00 UTC: the 2 wrong-password attempts show as `invalid_credentials`; 0 log lines contain password text (auth, edge and database logs) | Passed |
| **Direct requests cannot create accounts** | **Not passed.** Supabase still has sign-ups on (`disable_signup` false). The test checks this first and sends no sign-up request while it is on. Owner action: DEPLOYMENT.md, "Sign-in method", step 1. |
| Correct credentials sign in; refresh keeps the session; sign-out ends screens, APIs and the old token; two-account isolation, on hosted | **Not run on hosted.** The temporary verification accounts could not be created: the Supabase connector asked the owner to confirm the SQL and got no answer, so nothing was created (checked: a sign-in for one of them answered `invalid_credentials`). The same checks passed in the local rehearsal above. |
| Owner's own test account `bloat-tester@bloat.test` | Not created yet (owner action). |

## Local suites

Run on the local stack (built app on port 3100, local Supabase in Docker with all six migrations), 18 Nov 2026, on the code of commit `b70e7ed` plus the test-only fix below.

| Suite | Command | Result |
|---|---|---|
| Type check | `pnpm typecheck` | Passed, 0 errors |
| Lint | `pnpm lint` | Passed, 0 errors, 5 warnings |
| Build | `pnpm build` | Passed |
| Rule tests (Vitest) | `pnpm test` | 89 passed, 0 failed |
| API tests (Vitest, real HTTP and database) | `pnpm test:api` | 134 passed, 0 failed |
| Browser tests (Playwright, phone screen) | `pnpm test:e2e` | 17 tests. Full run: 16 passed, 1 failed (see below). After the fix: the failing file rerun, 5 of 5 passed, and the failing test passed 3 times in a row. |

The one failure was in the test, not the app: the email-code failure test forces a 504 by intercepting the request, and the app's offline service worker sometimes took over the page first, so the interception missed it. The email-code tests now block the service worker. Local email tests use real emails from the local mail catcher.

New regression tests this round: report privacy (4 API with PDF text and shared page, 3 unit, 1 browser; all 4 API tests fail on the old code); exports (3 API incl. 1,234 records in JSON and CSV, 2 unit incl. a failure on a later page and a retry, 1 browser); email codes (4 unit, 5 browser); kiwifruit pause (1 API, 1 unit); attribution guard (1 unit); Pro test accounts (1 API); server functions (all 14, in the privacy test).

## Hosted preview (public)

Environment: `https://bloat-git-claude-bloat-software-build-uxzoru-typeshi2.vercel.app`, Vercel project `bloat`, commit `b70e7ed` (deployment `dpl_6W3brAYiyqyDoeyYuCM8yNgyq3Ga`), Vercel protection off, `BLOAT_TEST_LOGIN=0`, Supabase `bloat-test` with migrations up to `20261117182606`. Real Chromium, phone screen, fresh contexts. Command: `pnpm test:hosted` (setup in DEPLOYMENT.md, "Hosted test run"). Result: **8 passed, 0 failed.** The same suite was first rehearsed against a local copy running in public mode (8 of 8).

| Check | Result |
|---|---|
| A fresh signed-out browser opens the preview: status 200, no redirect to vercel.com, landing page shown; `/today` sends it to the app's own sign-in | Passed |
| Test switches off: `POST /v1/auth/test-login` 404; no test password form; mock purchase 404; test clock header ignored; no "Mock purchase" on `/me` or `/upgrade`; plan Free; checkout off | Passed |
| Signed out: `/v1/history`, `/v1/me/state`, a day, reports, an export link all 401; a meal save 401; founder tools 404; direct database reads with the public key return nothing or "permission denied"; a direct insert is refused | Passed |
| A signed-in synthetic user saves a meal and still sees it in History and the day view after refreshes | Passed |
| Diary flow: bloating with a warning sign (shows "Adapted from NHS, Bloating"), refresh, end, meal, sign out, sign back in, records still there | Passed |
| Two accounts: B sees none of A's day, cannot edit or delete A's meal (404), B's export holds nothing of A's, B's own session cannot read or change A's meal directly in the database; A's meal unchanged | Passed |
| Report privacy on hosted: a designated Pro test account (no purchase) makes a doctor report with Medicines and Health off; the preview, the PDF text and the shared page hold no medicine name, pregnancy or condition; the question still appears; the share link opens in a stranger's browser, then shows "This link no longer works" after revoke | Passed |
| Exports on hosted: JSON and CSV complete with row counts; the download link gives a stranger 401 | Passed |
| Server functions on `bloat-test` (direct calls, 17 Nov 18:5x UTC): all 14 refuse a wrong secret (42501 SERVER_SECRET_INVALID); signed-in role can call 0 of 14 (checked in the database catalogue) | Passed |
| Email code delivery | **Failed on the hosted project, not an app test.** One real request for the test mailbox (18:50 UTC, 17 Nov) timed out in Supabase Auth after 10 s (504 "context deadline exceeded"), with no email sent. Same pattern since the custom SMTP settings were saved at 06:12 UTC. See DEPLOYMENT.md. |
| Google sign-in | Not exercised: switched off in Supabase. The sign-in page hides the button while it is off (local browser test). |
| Founder MFA on hosted | Not exercised: no staff address is set on the preview. |
| Real AI, real payments | Not exercised (mock, by design) |

Live spot check on the newest build, commit `3b25b5f` (deployment `dpl_BUXKcfPiby9DtyGNQp58WB5Uv2Cu`; only tests and docs changed after `b70e7ed`, no app code): home 200 with no Vercel redirect; `/today` 307 to `/sign-in`; test-login 404; `/v1/history` 401 signed out; founder tools 404; sign-in page shows "Send code", no test password form, no Google button; help page (rendered in a browser) says "Adapted from NHS, Bloating" with the nhs.uk link, "Call your local emergency number now" with no country and "Call 911 now" for the United States.

Earlier hosted runs (protected preview, 17 Nov, commits `c25610a`, `cdc2ebc`, `1540294`): 5 of 5 each time.

## The 200 acceptance tests

A test is marked Passed only when a test that names its ID ran and passed.

| Status | Count |
|---|---|
| Passed with executable evidence | 173 |
| Partial (the tested part passes; the note says what is missing) | 14 |
| Blocked by something outside the code | 4 |
| Not implemented | 9 |
| Failed | 0 |

Most evidence is at the API and rule level. Only a small part of it is also exercised through the screens in a browser.

## Not tested, stated plainly

- The real AI provider (no key). All ingredient checks used the labelled mock.
- The Meal AI accuracy test (300 dishes, 100 photos): harness built, **not run**. No accuracy figure exists.
- Email code delivery on the hosted project (blocked by its SMTP settings) and Google sign-in (switched off). Locally, email codes are tested end to end with real emails from the local mail catcher.
- On the hosted preview: only the eight checks listed above. The full API suite runs locally only.
- A real backup restore, real payments, a screen reader session, and most Pro screens in a browser (they are covered through the API).

## Table

| ID | Scenario | Status | Evidence (tests/) | Note |
|---|---|---|---|---|
| Q01 | Start episode, reply lost, retry same action | Passed | api/slice-a-episodes.test.ts |  |
| Q02 | Second tab starts while episode open | Passed | api/slice-a-episodes.test.ts |  |
| Q03 | End before start or future end | Passed | api/slice-a-episodes.test.ts |  |
| Q04 | 23:00-02:00 episode | Passed | api/slice-a-episodes.test.ts, unit/rules.test.ts |  |
| Q05 | DST transition and ambiguous clock time | Passed | api/slice-a-episodes.test.ts, unit/rules.test.ts |  |
| Q06 | Travel changes device time zone | Passed | api/slice-a-account.test.ts, unit/rules.test.ts |  |
| Q07 | Unknown end after forgotten close | Passed | api/slice-a-episodes.test.ts |  |
| Q08 | Episode still open for 25 hours but user forgot | Passed | api/slice-a-episodes.test.ts |  |
| Q09 | No bloating so far, later episode | Passed | api/slice-a-days.test.ts |  |
| Q10 | Final daily zero conflicts with a severity sample | Passed | api/slice-a-days.test.ts |  |
| Q11 | No meal records but valid daily symptom answer | Passed | api/slice-a-meals.test.ts |  |
| Q12 | Full meals with no category and confirmed symptom zero | Passed | unit/insights.test.ts |  |
| Q13 | Confirmed category present but partial food coverage | Passed | unit/insights.test.ts |  |
| Q14 | Accepted typical recipe guess | Passed | api/slice-c-meal-ai.test.ts, unit/insights.test.ts |  |
| Q15 | Activity not tapped | Passed | api/slice-a-days.test.ts |  |
| Q16 | Late daily recall | Passed | api/slice-a-days.test.ts, unit/insights.test.ts |  |
| Q17 | 7 with / 7 without and a zero difference | Passed | unit/insights.test.ts |  |
| Q18 | 7 with / 7 without and negative difference | Passed | unit/insights.test.ts |  |
| Q19 | Only exposed days | Passed | unit/insights.test.ts |  |
| Q20 | Two foods always together | Passed | unit/insights.test.ts |  |
| Q21 | New medicine added with MD-04 group during a comparison window | Partial | – | Medicine changes are shaded on charts and the before/after view is tested (Q168, Q169). The separate 'sensitivity view' that records exclusions is not built. |
| Q22 | AI malformed JSON / prompt injection / timeout | Passed | api/slice-c-meal-ai.test.ts, unit/rules.test.ts |  |
| Q23 | User edits private recipe | Passed | api/slice-c-meal-ai.test.ts |  |
| Q24 | Shared catalogue taxonomy updated | Not implemented | – | There is no shared food catalogue. Each ingredient row stores the model and prompt version. |
| Q29 | Swap experiment requested with FX answers Not sure / Prefer not to say | Passed | api/slice-ef.test.ts |  |
| Q30 | FX-03 Yes (coeliac, allergy or IBD) or HC-01 coeliac | Passed | api/slice-ef.test.ts |  |
| Q31 | Direct API request to start a swap experiment by an ineligible Pro user | Passed | api/slice-ef.test.ts |  |
| Q32 | Cross-user row ID / report ID / recipe ID | Passed | api/privacy.test.ts |  |
| Q33 | Delete account then restore backup | Partial | api/slice-a-account.test.ts | Deletion, token refusal and re-applying tombstones are tested. A real backup restore on Supabase has not been rehearsed. |
| Q34 | Signed report link expires or sharing revoked | Passed | api/slice-bd-pro.test.ts |  |
| Q35 | Duplicate or out-of-order payment webhook | Passed | api/slice-ef.test.ts |  |
| Q37 | Country becomes unsupported | Passed | api/slice-ef.test.ts |  |
| Q38 | Country without a listed emergency number | Passed | api/slice-a-account.test.ts, unit/rules.test.ts |  |
| Q39 | User signs out on shared device | Passed | e2e/core.spec.ts, unit/rules.test.ts |  |
| Q40 | Rule/formula/model version changes | Partial | api/slice-bd-pro.test.ts | Reports store rule versions and are immutable snapshots (tested). A versioned rollout process for rule changes is not built. |
| Q41 | Recipe saved from AI guess | Passed | api/slice-c-meal-ai.test.ts, unit/insights.test.ts |  |
| Q42 | All episodes closed; review untouched | Passed | api/slice-a-days.test.ts |  |
| Q43 | Partial or cannot-remember recall | Passed | api/slice-a-days.test.ts |  |
| Q44 | Today versus completed day | Passed | api/slice-a-days.test.ts |  |
| Q45 | Average with three usable dates | Passed | api/slice-bd-pro.test.ts |  |
| Q47 | Google redirect after the help page | Blocked | – | Google sign-in needs the Google provider switched on in Supabase (owner). The help acknowledgement is kept in the tab across the redirect by design; untested. |
| Q48 | Authenticated onboarding commit loses reply | Passed | api/slice-a-account.test.ts |  |
| Q51 | Personal Focus dismissal/edit/expiry | Passed | api/slice-bd-pro.test.ts |  |
| Q52 | Upgrade prompt for a free user | Passed | e2e/core.spec.ts |  |
| Q53 | Downgrade with old PDF and recipes | Passed | api/slice-bd-pro.test.ts |  |
| Q54 | Delete meal referenced by report | Passed | api/slice-bd-pro.test.ts |  |
| Q55 | Delete while job is running | Passed | api/slice-a-account.test.ts |  |
| Q56 | Source update races older recompute | Not implemented | – | Not built as written: results are worked out on read from current records, so there is no stored result for an older job to overwrite. |
| Q57 | Free account calls insights APIs | Passed | api/slice-bd-pro.test.ts |  |
| Q58 | Founding-member payment before gate | Passed | api/slice-ef.test.ts |  |
| Q59 | Screen-reader/keyboard/mobile flow | Partial | e2e/core.spec.ts | Keyboard use, names and focus ring are browser-tested on core recording. No screen-reader session was run. |
| Q60 | Client sends invented tag/other-user child ID | Passed | api/privacy.test.ts, api/slice-c-meal-ai.test.ts, unit/rules.test.ts |  |
| Q61 | USA, Canada and India synthetic accounts complete Slice A | Passed | api/slice-a-account.test.ts, e2e/core.spec.ts |  |
| Q62 | Country ready for tracking but not payments | Passed | api/slice-ef.test.ts |  |
| Q63 | Unknown country configuration | Passed | api/slice-a-account.test.ts |  |
| Q64 | Residence differs from current location | Passed | api/slice-a-account.test.ts |  |
| Q65 | Device locale MM/DD differs from DD/MM | Passed | unit/rules.test.ts |  |
| Q66 | DST, half-hour/quarter-hour zones and travel | Passed | api/slice-a-episodes.test.ts, unit/rules.test.ts |  |
| Q67 | Non-English food name in English interface | Passed | api/slice-a-meals.test.ts |  |
| Q68 | Same brand/product name in different markets | Not implemented | – | No brand or product catalogue exists. |
| Q69 | Cuisine preference differs from residence | Not implemented | – | Cuisine preferences are stored; nothing is ordered by them yet (there is no dish suggestion list). |
| Q70 | Help page not available in the user's language | Not implemented | – | The app is English only; the 'English only' note is not shown (wording needs the owner's yes). |
| Q71 | Foreign currency offer and renewal | Passed | unit/rules.test.ts |  |
| Q72 | Billing country changes | Passed | unit/rules.test.ts |  |
| Q73 | Payment provider unavailable in selected market | Passed | api/slice-ef.test.ts |  |
| Q74 | Regional consent withdrawn | Passed | api/slice-a-account.test.ts |  |
| Q75 | Deletion spans regional stores/processors | Blocked | – | Database rows and stored photos are deleted (tested under Q33). Notifying outside processors needs those accounts. |
| Q76 | Cross-region staff or tenant access attempt | Passed | api/slice-ef.test.ts, e2e/admin.spec.ts |  |
| Q77 | Notification at recipient local time | Not implemented | – | No notifications or reminders exist in this release (plan A18). |
| Q79 | Global beta aggregate masks one poor cohort | Not implemented | – | No beta cohort reporting. |
| Q80 | Policy suspension during job/checkout | Passed | api/slice-ef.test.ts |  |
| Q85 | Multi-select submits an exclusive option with another option (e.g. none + gas) | Passed | api/slice-a-episodes.test.ts, unit/rules.test.ts |  |
| Q86 | EP-01 severity 0 or 11, DY-01 value 11 or 3.5 | Passed | api/slice-a-days.test.ts, api/slice-a-episodes.test.ts, unit/rules.test.ts |  |
| Q87 | EP-08 Constipation on 3 completed dates in 14 | Passed | api/slice-bd-pro.test.ts |  |
| Q88 | PATCH episode with stale If-Match, or edit that creates an overlap | Passed | api/slice-a-episodes.test.ts |  |
| Q89 | DELETE a meal referenced by a stored report | Passed | api/slice-bd-pro.test.ts |  |
| Q90 | Profile with residence IN, locale en-CA, time zone America/Toronto | Passed | api/slice-a-account.test.ts |  |
| Q91 | Residence country outside the enabled launch wave | Passed | api/slice-a-account.test.ts, e2e/core.spec.ts |  |
| Q92 | New user reaches sign-up | Passed | api/slice-a-account.test.ts, e2e/core.spec.ts |  |
| Q93 | Search every screen | Passed | api/slice-a-account.test.ts, unit/rules.test.ts |  |
| Q94 | Episode with tummy pain and nausea at strength 10 | Passed | e2e/core.spec.ts |  |
| Q95 | 14 days of scores 8-10 | Passed | api/slice-a-days.test.ts |  |
| Q96 | Search all outputs, cards, summaries and PDFs | Passed | unit/rules.test.ts |  |
| Q97 | Free account calls each Pro endpoint | Passed | api/slice-a-episodes.test.ts, api/slice-a-meals.test.ts, api/slice-bd-pro.test.ts |  |
| Q98 | Pro typed dish 'chicken burrito with beans' | Passed | api/slice-c-meal-ai.test.ts, unit/rules.test.ts |  |
| Q99 | Save with 2 of 5 items marked Had, 3 marked Didn't have | Passed | api/slice-c-meal-ai.test.ts |  |
| Q100 | Save with 2 marked Had and 3 untouched | Passed | api/slice-c-meal-ai.test.ts, unit/insights.test.ts |  |
| Q101 | AI times out twice | Passed | api/slice-c-meal-ai.test.ts |  |
| Q102 | Photo with GPS metadata | Passed | api/slice-c-meal-ai.test.ts, e2e/core.spec.ts, unit/rules.test.ts |  |
| Q103 | Inspect AI request | Passed | api/slice-c-meal-ai.test.ts |  |
| Q104 | Any meal screen | Passed | api/slice-a-meals.test.ts, unit/rules.test.ts |  |
| Q105 | Stool type 7 logged 3 times | Passed | api/slice-bd-pro.test.ts |  |
| Q106 | Start experiment with 3 confirmed days in prior 7 | Passed | api/slice-ef.test.ts |  |
| Q107 | Second experiment while one runs | Passed | api/slice-ef.test.ts |  |
| Q108 | 6 + 7 confirmed days, 5 Yes days | Passed | api/slice-ef.test.ts |  |
| Q109 | 3 Yes days | Passed | api/slice-ef.test.ts |  |
| Q110 | Ended early: I felt worse | Passed | api/slice-ef.test.ts |  |
| Q111 | Card opened twice same day, then day 5 | Passed | api/slice-ef.test.ts, unit/cards.test.ts |  |
| Q112 | Card marked Worse | Passed | api/slice-ef.test.ts, unit/cards.test.ts |  |
| Q113 | Publish card without source link | Partial | unit/cards.test.ts | Publishing rule is enforced in the content schema (tested). The founder publishing screen is not built. |
| Q114 | Free user logs Fever or chills (EP-08a) | Passed | api/slice-a-episodes.test.ts, e2e/core.spec.ts |  |
| Q115 | Free user opens Pro logging fields | Passed | api/slice-a-days.test.ts, api/slice-a-episodes.test.ts |  |
| Q116 | Free user logs bloating on 13 of the last 30 days | Passed | api/slice-a-days.test.ts |  |
| Q117 | FX-02 Yes | Passed | api/slice-ef.test.ts |  |
| Q118 | WB-01 Yes during a swap experiment | Passed | api/slice-ef.test.ts |  |
| Q119 | Swap step reaches 2 weeks | Passed | api/slice-ef.test.ts |  |
| Q120 | Scan UI strings | Passed | unit/rules.test.ts |  |
| Q121 | ML-10 I don't know | Passed | api/slice-c-meal-ai.test.ts |  |
| Q122 | ML-11 Assume usual recipe | Passed | api/slice-c-meal-ai.test.ts, unit/insights.test.ts |  |
| Q123 | Saved dish reused | Passed | api/slice-c-meal-ai.test.ts |  |
| Q124 | Possible triggers with 6 days with | Passed | api/slice-bd-pro.test.ts, unit/insights.test.ts |  |
| Q125 | Next best log suggestion | Passed | api/slice-ef.test.ts |  |
| Q126 | Daily cards | Passed | api/slice-ef.test.ts, unit/cards.test.ts |  |
| Q127 | Before/after scores | Passed | api/slice-ef.test.ts, unit/cards.test.ts |  |
| Q128 | HC-01 coeliac | Passed | api/slice-ef.test.ts |  |
| Q129 | Network inspection on all screens | Partial | e2e/core.spec.ts, unit/rules.test.ts | Browser tests visit 22 screens as a Pro user plus the whole sign-up flow: zero third-party requests, no server errors, no page errors (e2e/core.spec.ts). Not visited by that check: experiment detail, morning review, the sign-in code screen and the public share page. |
| Q130 | Helpline and emergency numbers | Passed | api/slice-a-account.test.ts, unit/rules.test.ts |  |
| Q131 | Ingredient left untouched on the checklist | Passed | api/slice-c-meal-ai.test.ts, unit/insights.test.ts |  |
| Q132 | ML-08 None of these, then one item changed to Had | Passed | api/slice-c-meal-ai.test.ts |  |
| Q133 | Restaurant meal: onion Not sure, dairy Didn't have; rest of day fully known | Passed | unit/insights.test.ts |  |
| Q134 | Onion eaten at 20:00 on day D-1, none on day D | Passed | unit/insights.test.ts |  |
| Q135 | DY-03 Mostly | Passed | unit/insights.test.ts |  |
| Q136 | Possible triggers with 5 groups compared | Passed | unit/insights.test.ts |  |
| Q137 | Difference 1.4 overall but opposite direction in the two halves | Passed | unit/insights.test.ts |  |
| Q138 | Group present on 85% of usable days after 21 days | Passed | unit/insights.test.ts |  |
| Q139 | Free user with 14 logged and 9 confirmed days | Passed | api/slice-a-days.test.ts |  |
| Q140 | User upgrades with 12 free meals in last 7 days | Passed | api/slice-bd-pro.test.ts |  |
| Q141 | Keep an eye on it mode with KM-02 No for dairy | Passed | api/slice-bd-pro.test.ts, unit/insights.test.ts |  |
| Q142 | Every allowed card shown within 14 days | Passed | unit/cards.test.ts |  |
| Q143 | Third swap experiment within 180 days | Passed | api/slice-ef.test.ts |  |
| Q144 | API request for wheat or multi-group experiment | Passed | api/slice-ef.test.ts |  |
| Q145 | User pauses Pro for 2 months | Passed | api/slice-ef.test.ts |  |
| Q146 | User logs an unfollowed habit on 10 days | Passed | unit/insights.test.ts |  |
| Q147 | AI accuracy harness run | Blocked | unit/ai-eval.test.ts | Harness built and unit-tested. The real run needs the 300 dishes, 100 photos and an AI key. No accuracy number is claimed. |
| Q148 | Scan UI, cards and help page | Partial | unit/cards.test.ts, unit/rules.test.ts | Help text matches the stored copy and is now labelled 'Adapted from NHS, Bloating' (rule test blocks any 'word for word' claim). Every published card links a source. Automated source check 17-18 Nov (docs/content/): kiwifruit card draft (broken source), seven cards have proposed corrections awaiting review, CDC page blocks automated checks. Not a human review. |
| Q149 | Restaurant paneer curry: AI lists dairy and chilli, misses garlic; user marks both Had | Passed | unit/insights.test.ts |  |
| Q150 | Home-made meal (ML-06 Home): AI lists dairy only; user marks it Had | Passed | unit/insights.test.ts |  |
| Q151 | Strongest episode starts 11:00; onion eaten at 20:00 the same day | Passed | unit/insights.test.ts |  |
| Q152 | DY-03 Mostly; dairy logged at lunch; no fizzy drinks logged | Passed | unit/insights.test.ts |  |
| Q153 | Kiwifruit experiment requested with FX-03 Yes or not answered | Passed | api/slice-ef.test.ts |  |
| Q154 | Registry consistency check | Passed | unit/rules.test.ts |  |
| Q155 | Bloating on exactly 12 of the last 30 days | Passed | api/slice-a-days.test.ts, unit/rules.test.ts |  |
| Q156 | Bloating on 13 of 30 days; user opens Today | Passed | api/slice-a-days.test.ts |  |
| Q157 | 13 of 30 days; ON-14 50-59 and ON-15 Yes | Passed | api/slice-a-days.test.ts, unit/rules.test.ts |  |
| Q158 | 13 of 30 days; ON-14 skipped, or 40-49, or ON-15 No / Prefer not to say | Passed | api/slice-a-days.test.ts, unit/rules.test.ts |  |
| Q159 | AI request, analytics events and cards for a user with ON-14 / ON-15 / FH-01 / ON-10 answers | Passed | api/slice-c-meal-ai.test.ts, api/slice-ef.test.ts, unit/cards.test.ts |  |
| Q160 | Each EP-08a option selected in turn | Passed | api/slice-a-episodes.test.ts |  |
| Q161 | User selects 'Sudden, severe stomach ache with a swollen tummy' in a country without a listed number | Passed | unit/rules.test.ts |  |
| Q162 | Pro user ticks Abdominal pain in EP-08 twice in one day | Passed | api/slice-bd-pro.test.ts |  |
| Q163 | Blood in poo selected | Passed | api/slice-a-episodes.test.ts |  |
| Q164 | CY-01 visible without ON-10 Cycle context | Passed | api/slice-a-days.test.ts, unit/insights.test.ts |  |
| Q165 | Your cycle with 2 complete cycles logged | Passed | unit/insights.test.ts |  |
| Q166 | Your cycle with 3+ cycles and 7+ usable days per window | Passed | unit/insights.test.ts |  |
| Q167 | ON-10 Perimenopause or menopause selected | Passed | unit/insights.test.ts |  |
| Q168 | Medicine with MD-04 'Iron' started; 9 usable days before and 8 after within 14 days | Passed | unit/insights.test.ts |  |
| Q169 | Medicine change with only 4 usable days after | Passed | unit/insights.test.ts |  |
| Q170 | WK-01 answered on Monday | Passed | api/slice-a-days.test.ts |  |
| Q171 | EP-03 Clothes felt tighter | Passed | api/slice-bd-pro.test.ts |  |
| Q172 | Days with a large meal (ML-04 Large) vs without, 7+ each | Passed | unit/insights.test.ts |  |
| Q173 | Your usual with 14+ confirmed days | Passed | unit/insights.test.ts |  |
| Q174 | Possible-trigger result where 6 of 9 'with' days also had poor sleep | Passed | unit/insights.test.ts |  |
| Q175 | Any comparison result | Passed | api/slice-bd-pro.test.ts |  |
| Q176 | Pro user in week 2, after first possible trigger, and in Keep an eye on it mode | Passed | api/slice-bd-pro.test.ts |  |
| Q177 | 90 days since Pro start | Partial | api/slice-bd-pro.test.ts | A quarterly snapshot is created after 90 days (tested once). The quarterly summary screen is labelled 'later' in the plan and is not built. |
| Q178 | AI result for a photo and for a typed dish | Partial | api/slice-c-meal-ai.test.ts | Typed dishes are tested. Photo labels depend on a real AI provider, which is not connected. |
| Q179 | Doctor PDF generated | Passed | api/slice-bd-pro.test.ts |  |
| Q180 | FH-01 answered | Passed | api/slice-bd-pro.test.ts |  |
| Q181 | HC-04 'Anaemia found' recorded | Passed | api/slice-bd-pro.test.ts |  |
| Q182 | AI provider switched in configuration | Partial | unit/rules.test.ts | Both providers share one fixed schema and the mock passes it. Switching to the real provider is untested (no key). |
| Q183 | AI failure rate above threshold, or a background job stuck | Not implemented | – | AI failure counts show in the founder tools and a failed check is shown plainly to the user (tested under Q130). No automatic alert yet: the plan gives no threshold, so the owner must choose one (DECISIONS.md). |
| Q184 | Security suite: expired export link, revoked share link, deleted account, admin access, restored backup | Partial | api/slice-a-account.test.ts, api/slice-ef.test.ts | Expired export link, revoked share, deleted account and founder access are tested. Restored backup: see Q33. |
| Q185 | Product analytics events | Passed | api/slice-ef.test.ts |  |
| Q186 | Feature registry | Passed | unit/rules.test.ts |  |
| Q187 | Any research or secondary-use request | Not implemented | – | No research or secondary use exists anywhere; a refusal path is not built because there is nothing to request. |
| Q188 | AI accuracy harness | Blocked | unit/ai-eval.test.ts | Harness reports the regional Indian set separately (unit-tested). Real run blocked as Q147. |
| Q189 | Learn library | Partial | api/slice-ef.test.ts, unit/cards.test.ts | All 15 articles are listed with sources, as outlines. The full article texts are not written. |
| Q190 | Monthly AI spending limit reached | Passed | api/slice-c-meal-ai.test.ts |  |
| Q191 | AI spend reaches 50%, 80% and 100% of the monthly limit | Partial | api/slice-c-meal-ai.test.ts | Alerts are created once per level in the founder outbox with no user data (tested). Sending them by email needs Resend, which is not connected. |
| Q192 | 11th AI check by one user within an hour | Passed | api/slice-c-meal-ai.test.ts |  |
| Q193 | 41st AI check by one user in a day | Passed | api/slice-c-meal-ai.test.ts |  |
| Q194 | Dish text of 250 characters | Passed | api/slice-c-meal-ai.test.ts |  |
| Q195 | Photo still over 2 MB after shrinking to 1600px | Passed | unit/rules.test.ts |  |
| Q196 | AI provider returns errors | Passed | api/slice-c-meal-ai.test.ts |  |
| Q197 | Same meal submitted twice with the same save key | Passed | api/slice-c-meal-ai.test.ts |  |
| Q198 | Founder turns the AI kill switch on | Passed | api/slice-c-meal-ai.test.ts |  |
| Q199 | Configuration names a model not on the approved list | Passed | unit/rules.test.ts |  |
| Q200 | One request's cost is 3 times the expected cost or more | Passed | api/slice-c-meal-ai.test.ts |  |
| Q201 | Client bundle, logs and error reports scanned | Partial | unit/rules.test.ts | Source scan for keys and client env use passes. Separate test and live keys cannot be checked: no real key exists yet. |
| Q202 | Pro user opens Your journey | Passed | api/slice-bd-pro.test.ts |  |
| Q203 | Free user taps Your journey | Passed | api/slice-bd-pro.test.ts, e2e/core.spec.ts |  |
| Q204 | ON-16 'Getting ready for a doctor visit' chosen | Passed | api/slice-bd-pro.test.ts |  |
| Q205 | 'Make doctor report' tapped in Your journey | Passed | api/slice-bd-pro.test.ts |  |
| Q206 | ON-16 changed in Me | Passed | api/slice-bd-pro.test.ts |  |
| Q207 | Baseline markers with fewer than 14 confirmed days | Passed | api/slice-bd-pro.test.ts, unit/insights.test.ts |  |
| Q208 | User has never used 'Ate out' or 'Constipated' in 30 days (after 14 days of use) | Passed | api/slice-bd-pro.test.ts |  |
| Q209 | Add meal opened by a user with saved dishes and frequent meals | Passed | api/slice-bd-pro.test.ts |  |
| Q210 | New user signs up | Passed | api/slice-a-account.test.ts |  |
| Q211 | User buys the 3-month plan | Passed | api/slice-ef.test.ts |  |
| Q212 | User picked India at sign-up but pays with a US card | Passed | api/slice-ef.test.ts, unit/rules.test.ts |  |
| Q213 | Price shown on web, iPhone and Android in each country | Passed | unit/rules.test.ts |  |
