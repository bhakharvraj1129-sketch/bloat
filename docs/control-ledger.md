# Control ledger

Every control on every screen, for each kind of visitor, as found by the crawler in
`tests/ledger/ledger.spec.ts` on the local stack (synthetic accounts only). Rebuild with
`python3 scripts/ledger-report.py`.

- Crawled: 2026-11-19T10:20:19.601Z (fixed build). Earlier build for comparison: 2026-11-19T10:29:42.661Z.
- **pass**: the control did what it should (opened its screen, a sheet, sent its request, or changed what is shown).
- **fail**: it did nothing visible, threw an error, could not be clicked, or sat under another element.
- **check**: deliberately not clicked by the crawler (destructive, or an outside link); each is covered by a named test below.
- **listed**: a text field, a disabled button, or a control inside a closed sheet; the targeted tests fill and use these.

Totals (fixed build): pass 620, fail 0, check 49, listed 71.
Totals (earlier build, same crawler): pass 598, fail 19, check 49, listed 71.

## Changed since the earlier build

| Visitor | Screen | Control | Before | After |
|---|---|---|---|---|
| signed-out | `/sign-in` | Send code | fail: NO EFFECT: no navigation, dialog, request or DOM change in 1.3 s | pass: changed: 1 DOM changes |
| signed-out | `/sign-in?new=1` | Send code | fail: NO EFFECT: no navigation, dialog, request or DOM change in 1.3 s | pass: changed: 1 DOM changes |
| signed-out | `/unavailable` | Join waitlist | fail: NO EFFECT: no navigation, dialog, request or DOM change in 1.3 s | pass: changed: 1 DOM changes |
| signed-out | `/today` | Send code | fail: NO EFFECT: no navigation, dialog, request or DOM change in 1.3 s | pass: changed: 1 DOM changes |
| signed-out | `/history` | Send code | fail: NO EFFECT: no navigation, dialog, request or DOM change in 1.3 s | pass: changed: 1 DOM changes |
| signed-out | `/day/2026-11-19` | Send code | fail: NO EFFECT: no navigation, dialog, request or DOM change in 1.3 s | pass: changed: 1 DOM changes |
| signed-out | `/review/2026-11-18` | Send code | fail: NO EFFECT: no navigation, dialog, request or DOM change in 1.3 s | pass: changed: 1 DOM changes |
| signed-out | `/insights` | Send code | fail: NO EFFECT: no navigation, dialog, request or DOM change in 1.3 s | pass: changed: 1 DOM changes |
| signed-out | `/journey` | Send code | fail: NO EFFECT: no navigation, dialog, request or DOM change in 1.3 s | pass: changed: 1 DOM changes |
| signed-out | `/report` | Send code | fail: NO EFFECT: no navigation, dialog, request or DOM change in 1.3 s | pass: changed: 1 DOM changes |
| signed-out | `/experiments` | Send code | fail: NO EFFECT: no navigation, dialog, request or DOM change in 1.3 s | pass: changed: 1 DOM changes |
| signed-out | `/cards` | Send code | fail: NO EFFECT: no navigation, dialog, request or DOM change in 1.3 s | pass: changed: 1 DOM changes |
| signed-out | `/learn` | Send code | fail: NO EFFECT: no navigation, dialog, request or DOM change in 1.3 s | pass: changed: 1 DOM changes |
| signed-out | `/health` | Send code | fail: NO EFFECT: no navigation, dialog, request or DOM change in 1.3 s | pass: changed: 1 DOM changes |
| signed-out | `/doctor` | Send code | fail: NO EFFECT: no navigation, dialog, request or DOM change in 1.3 s | pass: changed: 1 DOM changes |
| signed-out | `/me` | Send code | fail: NO EFFECT: no navigation, dialog, request or DOM change in 1.3 s | pass: changed: 1 DOM changes |
| signed-out | `/meal/recall` | Send code | fail: NO EFFECT: no navigation, dialog, request or DOM change in 1.3 s | pass: changed: 1 DOM changes |
| signed-out | `/upgrade` | Send code | fail: NO EFFECT: no navigation, dialog, request or DOM change in 1.3 s | pass: changed: 1 DOM changes |
| signed-out | `/setup` | Send code | fail: NO EFFECT: no navigation, dialog, request or DOM change in 1.3 s | pass: changed: 1 DOM changes |

## Defects reproduced and repaired (targeted tests)

The crawler only sees whether something visible happened. These tests check the result itself.
Each was run against the earlier build (commit `dc88b37`, local copy on port 3200) and the fixed
build (local, port 3100) on 19 Nov 2026: all 14 failed before, at the line shown, and pass after.
Tests: `tests/e2e/navigation.spec.ts`.

| # | Defect (earlier build) | What the earlier build did | Fixed behaviour |
|---|---|---|---|
| 1 | Back went to a fixed screen, not where you came from | Today, then a day, then Back: History | Back returns to Today; a direct link falls back to the parent |
| 2 | The phone's Back button left the screen when a sheet was open | Me, Today, open a sheet, Back: Me | Back closes the sheet and stays on Today; focus returns to the button that opened it (it went to the page body before, on every sheet) |
| 3 | Closing a filled-in sheet lost what was typed | Escape closed "Add meal" at once | Asks "Close without saving?"; Keep editing keeps the text |
| 4 | The phone's Back button in setup left setup and lost every answer | Back from step 3 left setup | Back goes to the previous step, answers kept |
| 5 | "Check save status" closed the sheet even when the check failed | Sheet closed as if saved | Sheet stays open and says the connection was lost; the next check saves once |
| 6 | Health background hid a failed part of its save | No message, "Saved" shown | The failure is shown; nothing says Saved until every part is saved |
| 7 | The recall screen turned on the AI check without asking | Consent recorded on "Check ingredients" | Shows the CN-04 agreement first; nothing recorded until "I agree" |
| 8 | Withdraw consent and Remove medicine acted at once, with no progress or error | Request sent on the first tap | Asks first, shows progress, reports failures |
| 9 | A double tap on Download started two exports | 2 export requests | 1 request; buttons locked while preparing |
| 10 | An expired session lost the screen you were on | Sent to `/sign-in`, then Today | `/sign-in?next=...` returns to the same screen (only Bloat screens accepted) |
| 11 | Empty waitlist and email-code forms gave no message in the app | Browser bubble only, or nothing | Inline message in the app's own wording; waitlist email no longer wrongly labelled optional |
| 12 | The help page's Back did nothing useful on a direct link | Went to a blank page | Returns to the start page (signed out) or Today (signed in) |
| 13 | Profile switches (Keep my meal photos, Hide charts, Units) snapped back while saving | The tick did not stay | Shows the choice at once, locks while saving, goes back with a message if it fails |
| 14 | Leaving a screen with unsaved changes gave no warning | Tab bar left Health background, edits lost | Asks "Leave without saving?"; Back still goes to the previous screen |

Also repaired in the same round (checked by the full browser and API suites): Pause, Resume, Cancel Pro and
Mock purchase now show progress and errors; the delete-account sheet no longer says "Nothing was deleted" when
the connection drops (it offers "Check and finish"); starting an experiment shows a lost-reply state; the
AI-check agreement in the meal sheet cannot be sent twice; a time zone typo and a lost connection get different
messages; the Contact page's help link no longer reloads the whole app.

Note: the crawler ran with local test mode on and email-code sign-in (the local default). The preview uses
password sign-in; its signed-out screens are checked by `tests/hosted/navigation.spec.ts`.

## Still failing in the fixed build

- None.

## Controls the crawler does not click, and the test that covers each

| Control | Covered by |
|---|---|
| Delete (an entry on a day) | `tests/e2e/core.spec.ts` "log bloating ... see it in History and day detail" |
| Sign out | `tests/e2e/core.spec.ts` "Q91 ... Q39 sign-out" and `tests/hosted/preview.spec.ts` (session revoked) |
| Delete account | `tests/e2e/navigation.spec.ts` "Pro plan actions, the photo setting and account deletion" |
| Pause Pro, Resume Pro, Cancel Pro | `tests/e2e/navigation.spec.ts` "Pro plan actions ..." |
| Keep my meal photos | `tests/e2e/navigation.spec.ts` "Pro plan actions ..." and `core.spec.ts` Q102 |
| Withdraw (a consent), Remove (a medicine) | `tests/e2e/navigation.spec.ts` "withdrawing a consent and removing a medicine ask first" |
| Mock purchase (local test mode only; hidden on the preview) | `tests/e2e/core.spec.ts` Pro tests |
| Outside source links (NHS, NIDDK, BDA, CDC, PMC) | Each returned HTTP 200 on 19 Nov 2026 and opens in a new tab |
| Controls inside sheets (Save, Close, choices) | `tests/e2e/core.spec.ts` and `tests/e2e/navigation.spec.ts` |

## Every control, by screen

### signed-out · `/`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → / | page | pass | HTTP 200 → / |
| 1 | Sign in | link | pass | link: /sign-in → HTTP 200 |
| 2 | Get started | link | pass | link: /start → HTTP 200 |
| 3 | How scores and comparisons are calculated | link | pass | link: /how-bloat-works → HTTP 200 |
| 4 | Get started | link | pass | link: /start → HTTP 200 |
| 5 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 6 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 7 | Terms | link | pass | link: /terms → HTTP 200 |
| 8 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 9 | Contact | link | pass | link: /contact → HTTP 200 |

### signed-out · `/start`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /start | page | pass | HTTP 200 → /start |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | United States | radio | pass | changed: 4 DOM changes |
| 3 | Canada | radio | pass | changed: 4 DOM changes |
| 4 | India | radio | pass | changed: 4 DOM changes |
| 5 | Other | radio | pass | changed: 4 DOM changes |
| 6 | Continue | button | listed | disabled until its form is ready |

### signed-out · `/help`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /help | page | pass | HTTP 200 → /help |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | nhs.uk/symptoms/bloating | link | check | external: https://www.nhs.uk/symptoms/bloating/ |
| 3 | Back | button | pass | navigated: / |

### signed-out · `/help?signup=1`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /help | page | pass | HTTP 200 → /help |
| 1 | Back | link | pass | link: /start → HTTP 200 |
| 2 | nhs.uk/symptoms/bloating | link | check | external: https://www.nhs.uk/symptoms/bloating/ |
| 3 | I've read this | button | pass | navigated: /sign-in?new=1 |

### signed-out · `/sign-in`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | Email | email | listed | text field (filled by the targeted tests) |
| 3 | Send code | button | pass | changed: 1 DOM changes |
| 4 | I'm new here | link | pass | link: /start → HTTP 200 |
| 5 | Test password | password | listed | text field (filled by the targeted tests) |
| 6 | Sign in with test password | button | listed | disabled until its form is ready |

### signed-out · `/sign-in?new=1`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Back | link | pass | link: /help?signup=1 → HTTP 200 |
| 2 | Email | email | listed | text field (filled by the targeted tests) |
| 3 | I am 18 or older | checkbox | pass | changed: ticked: true |
| 4 | Send code | button | pass | changed: 1 DOM changes |
| 5 | I already have an account | link | pass | link: /sign-in → HTTP 200 |
| 6 | Test password | password | listed | text field (filled by the targeted tests) |
| 7 | Sign in with test password | button | listed | disabled until its form is ready |

### signed-out · `/sign-in/code`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in/code | page | pass | HTTP 200 → /sign-in/code |
| 1 | Back | link | pass | link: /sign-in → HTTP 200 |
| 2 | 6-digit code | text | listed | text field (filled by the targeted tests) |
| 3 | Continue | button | listed | disabled until its form is ready |
| 4 | Send a new code in 60 s | button | listed | disabled until its form is ready |

### signed-out · `/unavailable`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /unavailable | page | pass | HTTP 200 → /unavailable |
| 1 | Back | link | pass | link: /start → HTTP 200 |
| 2 | Your country | text | listed | text field (filled by the targeted tests) |
| 3 | EmailOnly used to tell you when Bloat is available. Nothing else is st | email | listed | text field (filled by the targeted tests) |
| 4 | Join waitlist | button | pass | changed: 1 DOM changes |

### signed-out · `/terms`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /terms | page | pass | HTTP 200 → /terms |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 3 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 4 | Terms | link | pass | link: /terms → HTTP 200 |
| 5 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 6 | Contact | link | pass | link: /contact → HTTP 200 |

### signed-out · `/privacy`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /privacy | page | pass | HTTP 200 → /privacy |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 3 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 4 | Terms | link | pass | link: /terms → HTTP 200 |
| 5 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 6 | Contact | link | pass | link: /contact → HTTP 200 |

### signed-out · `/contact`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /contact | page | pass | HTTP 200 → /contact |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 3 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 4 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 5 | Terms | link | pass | link: /terms → HTTP 200 |
| 6 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 7 | Contact | link | pass | link: /contact → HTTP 200 |

### signed-out · `/how-bloat-works`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /how-bloat-works | page | pass | HTTP 200 → /how-bloat-works |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 3 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 4 | Terms | link | pass | link: /terms → HTTP 200 |
| 5 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 6 | Contact | link | pass | link: /contact → HTTP 200 |

### signed-out · `/offline`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /offline | page | pass | HTTP 200 → /offline |
| 1 | Try again | link | pass | link: /today → HTTP 200 |

### signed-out · `/share/not-a-real-token`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /share/not-a-real-token | page | pass | HTTP 200 → /share/not-a-real-token |

### signed-out · `/admin`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /admin | page | pass | HTTP 200 → /admin |
| 1 | Sign in | link | pass | link: /sign-in → HTTP 200 |

### signed-out · `/today`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | Email | email | listed | text field (filled by the targeted tests) |
| 3 | Send code | button | pass | changed: 1 DOM changes |
| 4 | I'm new here | link | pass | link: /start → HTTP 200 |
| 5 | Test password | password | listed | text field (filled by the targeted tests) |
| 6 | Sign in with test password | button | listed | disabled until its form is ready |

### signed-out · `/history`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | Email | email | listed | text field (filled by the targeted tests) |
| 3 | Send code | button | pass | changed: 1 DOM changes |
| 4 | I'm new here | link | pass | link: /start → HTTP 200 |
| 5 | Test password | password | listed | text field (filled by the targeted tests) |
| 6 | Sign in with test password | button | listed | disabled until its form is ready |

### signed-out · `/day/2026-11-19`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | Email | email | listed | text field (filled by the targeted tests) |
| 3 | Send code | button | pass | changed: 1 DOM changes |
| 4 | I'm new here | link | pass | link: /start → HTTP 200 |
| 5 | Test password | password | listed | text field (filled by the targeted tests) |
| 6 | Sign in with test password | button | listed | disabled until its form is ready |

### signed-out · `/review/2026-11-18`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | Email | email | listed | text field (filled by the targeted tests) |
| 3 | Send code | button | pass | changed: 1 DOM changes |
| 4 | I'm new here | link | pass | link: /start → HTTP 200 |
| 5 | Test password | password | listed | text field (filled by the targeted tests) |
| 6 | Sign in with test password | button | listed | disabled until its form is ready |

### signed-out · `/insights`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | Email | email | listed | text field (filled by the targeted tests) |
| 3 | Send code | button | pass | changed: 1 DOM changes |
| 4 | I'm new here | link | pass | link: /start → HTTP 200 |
| 5 | Test password | password | listed | text field (filled by the targeted tests) |
| 6 | Sign in with test password | button | listed | disabled until its form is ready |

### signed-out · `/journey`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | Email | email | listed | text field (filled by the targeted tests) |
| 3 | Send code | button | pass | changed: 1 DOM changes |
| 4 | I'm new here | link | pass | link: /start → HTTP 200 |
| 5 | Test password | password | listed | text field (filled by the targeted tests) |
| 6 | Sign in with test password | button | listed | disabled until its form is ready |

### signed-out · `/report`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | Email | email | listed | text field (filled by the targeted tests) |
| 3 | Send code | button | pass | changed: 1 DOM changes |
| 4 | I'm new here | link | pass | link: /start → HTTP 200 |
| 5 | Test password | password | listed | text field (filled by the targeted tests) |
| 6 | Sign in with test password | button | listed | disabled until its form is ready |

### signed-out · `/experiments`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | Email | email | listed | text field (filled by the targeted tests) |
| 3 | Send code | button | pass | changed: 1 DOM changes |
| 4 | I'm new here | link | pass | link: /start → HTTP 200 |
| 5 | Test password | password | listed | text field (filled by the targeted tests) |
| 6 | Sign in with test password | button | listed | disabled until its form is ready |

### signed-out · `/cards`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | Email | email | listed | text field (filled by the targeted tests) |
| 3 | Send code | button | pass | changed: 1 DOM changes |
| 4 | I'm new here | link | pass | link: /start → HTTP 200 |
| 5 | Test password | password | listed | text field (filled by the targeted tests) |
| 6 | Sign in with test password | button | listed | disabled until its form is ready |

### signed-out · `/learn`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | Email | email | listed | text field (filled by the targeted tests) |
| 3 | Send code | button | pass | changed: 1 DOM changes |
| 4 | I'm new here | link | pass | link: /start → HTTP 200 |
| 5 | Test password | password | listed | text field (filled by the targeted tests) |
| 6 | Sign in with test password | button | listed | disabled until its form is ready |

### signed-out · `/health`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | Email | email | listed | text field (filled by the targeted tests) |
| 3 | Send code | button | pass | changed: 1 DOM changes |
| 4 | I'm new here | link | pass | link: /start → HTTP 200 |
| 5 | Test password | password | listed | text field (filled by the targeted tests) |
| 6 | Sign in with test password | button | listed | disabled until its form is ready |

### signed-out · `/doctor`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | Email | email | listed | text field (filled by the targeted tests) |
| 3 | Send code | button | pass | changed: 1 DOM changes |
| 4 | I'm new here | link | pass | link: /start → HTTP 200 |
| 5 | Test password | password | listed | text field (filled by the targeted tests) |
| 6 | Sign in with test password | button | listed | disabled until its form is ready |

### signed-out · `/me`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | Email | email | listed | text field (filled by the targeted tests) |
| 3 | Send code | button | pass | changed: 1 DOM changes |
| 4 | I'm new here | link | pass | link: /start → HTTP 200 |
| 5 | Test password | password | listed | text field (filled by the targeted tests) |
| 6 | Sign in with test password | button | listed | disabled until its form is ready |

### signed-out · `/meal/recall`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | Email | email | listed | text field (filled by the targeted tests) |
| 3 | Send code | button | pass | changed: 1 DOM changes |
| 4 | I'm new here | link | pass | link: /start → HTTP 200 |
| 5 | Test password | password | listed | text field (filled by the targeted tests) |
| 6 | Sign in with test password | button | listed | disabled until its form is ready |

### signed-out · `/upgrade`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | Email | email | listed | text field (filled by the targeted tests) |
| 3 | Send code | button | pass | changed: 1 DOM changes |
| 4 | I'm new here | link | pass | link: /start → HTTP 200 |
| 5 | Test password | password | listed | text field (filled by the targeted tests) |
| 6 | Sign in with test password | button | listed | disabled until its form is ready |

### signed-out · `/setup`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | Email | email | listed | text field (filled by the targeted tests) |
| 3 | Send code | button | pass | changed: 1 DOM changes |
| 4 | I'm new here | link | pass | link: /start → HTTP 200 |
| 5 | Test password | password | listed | text field (filled by the targeted tests) |
| 6 | Sign in with test password | button | listed | disabled until its form is ready |

### free · `/today`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /today | page | pass | HTTP 200 → /today |
| 1 | Bloating ongoing Since 5:12 am · strength 4 | button | pass | dialog: Bloating now |
| 2 | Add meal | button | pass | dialog: Add meal |
| 3 | Add activity | button | pass | dialog: Add activity |
| 4 | What Pro adds | link | pass | link: /upgrade → HTTP 200 |
| 5 | Edit today's entries | link | pass | link: /day/2026-11-19 → HTTP 200 |
| 6 | Today | link | pass | link: /today → HTTP 200 |
| 7 | History | link | pass | link: /history → HTTP 200 |
| 8 | Insights | link | pass | link: /insights → HTTP 200 |
| 9 | Me | link | pass | link: /me → HTTP 200 |

### free · `/history`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /history | page | pass | HTTP 200 → /history |
| 1 | ? Thu Nov 19 · today Highest logged 4 · review to confirm 1 episode 1  | link | pass | link: /day/2026-11-19 → HTTP 200 |
| 2 | Chart and 7-day averagePro Your daily scores as a chart. | link | pass | link: /upgrade → HTTP 200 |
| 3 | Possible triggersPro Foods and habits compared with your scores, with  | link | pass | link: /upgrade → HTTP 200 |
| 4 | Weekly report and Your journeyPro Your records summed up, and a report | link | pass | link: /upgrade → HTTP 200 |
| 5 | Today | link | pass | link: /today → HTTP 200 |
| 6 | History | link | pass | link: /history → HTTP 200 |
| 7 | Insights | link | pass | link: /insights → HTTP 200 |
| 8 | Me | link | pass | link: /me → HTTP 200 |

### free · `/day/2026-11-19`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /day/2026-11-19 | page | pass | HTTP 200 → /day/2026-11-19 |
| 1 | Back | link | pass | link: /history → HTTP 200 |
| 2 | Edit times | button | listed | disabled until its form is ready |
| 3 | Delete | button | check | destructive: not clicked by the crawler |
| 4 | Edit | button | pass | dialog: Edit meal |
| 5 | Delete | button | check | destructive: not clicked by the crawler |
| 6 | Today | link | pass | link: /today → HTTP 200 |
| 7 | History | link | pass | link: /history → HTTP 200 |
| 8 | Insights | link | pass | link: /insights → HTTP 200 |
| 9 | Me | link | pass | link: /me → HTTP 200 |

### free · `/review/2026-11-18`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /review/2026-11-18 | page | pass | HTTP 200 → /review/2026-11-18 |
| 1 | Back | link | pass | link: /today → HTTP 200 |
| 2 | 0 · No bloating | radio | pass | changed: 3 DOM changes |
| 3 | 1 | radio | pass | changed: 2 DOM changes |
| 4 | 2 | radio | pass | changed: 2 DOM changes |
| 5 | 3 | radio | pass | changed: 2 DOM changes |
| 6 | 4 | radio | pass | changed: 2 DOM changes |
| 7 | 5 | radio | pass | changed: 2 DOM changes |
| 8 | 6 | radio | pass | changed: 2 DOM changes |
| 9 | 7 | radio | pass | changed: 2 DOM changes |
| 10 | 8 | radio | pass | changed: 2 DOM changes |
| 11 | 9 | radio | pass | changed: 2 DOM changes |
| 12 | 10 | radio | pass | changed: 2 DOM changes |
| 13 | I can't remember | radio | pass | changed: 3 DOM changes |
| 14 | Yes | radio | pass | changed: 3 DOM changes |
| 15 | Only part of the day | radio | pass | changed: 3 DOM changes |
| 16 | Not sure | radio | pass | changed: 3 DOM changes |
| 17 | Continue | button | listed | disabled until its form is ready |
| 18 | Today | link | pass | link: /today → HTTP 200 |
| 19 | History | link | pass | link: /history → HTTP 200 |
| 20 | Insights | link | pass | link: /insights → HTTP 200 |
| 21 | Me | link | pass | link: /me → HTTP 200 |

### free · `/insights`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /upgrade | page | pass | HTTP 200 → /upgrade |
| 1 | Back | link | pass | link: /me → HTTP 200 |
| 2 | ✓ US$39.99 a year · US$3.33 a month | radio | pass | already selected: choosing the option that is already chosen changes nothing, as expected |
| 3 | US$14.99 every 3 months · US$5.00 a month | radio | pass | changed: 6 DOM changes |
| 4 | US$5.99 a month | radio | pass | changed: 6 DOM changes |
| 5 | Upgrade | button | pass | request: POST /v1/billing/checkout |
| 6 | Mock purchase | button | check | destructive: not clicked by the crawler |
| 7 | Today | link | pass | link: /today → HTTP 200 |
| 8 | History | link | pass | link: /history → HTTP 200 |
| 9 | Insights | link | pass | link: /insights → HTTP 200 |
| 10 | Me | link | pass | link: /me → HTTP 200 |

### free · `/journey`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /upgrade | page | pass | HTTP 200 → /upgrade |
| 1 | Back | link | pass | link: /me → HTTP 200 |
| 2 | ✓ US$39.99 a year · US$3.33 a month | radio | pass | already selected: choosing the option that is already chosen changes nothing, as expected |
| 3 | US$14.99 every 3 months · US$5.00 a month | radio | pass | changed: 6 DOM changes |
| 4 | US$5.99 a month | radio | pass | changed: 6 DOM changes |
| 5 | Upgrade | button | pass | request: POST /v1/billing/checkout |
| 6 | Mock purchase | button | check | destructive: not clicked by the crawler |
| 7 | Today | link | pass | link: /today → HTTP 200 |
| 8 | History | link | pass | link: /history → HTTP 200 |
| 9 | Insights | link | pass | link: /insights → HTTP 200 |
| 10 | Me | link | pass | link: /me → HTTP 200 |

### free · `/report`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /upgrade | page | pass | HTTP 200 → /upgrade |
| 1 | Back | link | pass | link: /me → HTTP 200 |
| 2 | ✓ US$39.99 a year · US$3.33 a month | radio | pass | already selected: choosing the option that is already chosen changes nothing, as expected |
| 3 | US$14.99 every 3 months · US$5.00 a month | radio | pass | changed: 6 DOM changes |
| 4 | US$5.99 a month | radio | pass | changed: 6 DOM changes |
| 5 | Upgrade | button | pass | request: POST /v1/billing/checkout |
| 6 | Mock purchase | button | check | destructive: not clicked by the crawler |
| 7 | Today | link | pass | link: /today → HTTP 200 |
| 8 | History | link | pass | link: /history → HTTP 200 |
| 9 | Insights | link | pass | link: /insights → HTTP 200 |
| 10 | Me | link | pass | link: /me → HTTP 200 |

### free · `/experiments`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /upgrade | page | pass | HTTP 200 → /upgrade |
| 1 | Back | link | pass | link: /me → HTTP 200 |
| 2 | ✓ US$39.99 a year · US$3.33 a month | radio | pass | already selected: choosing the option that is already chosen changes nothing, as expected |
| 3 | US$14.99 every 3 months · US$5.00 a month | radio | pass | changed: 6 DOM changes |
| 4 | US$5.99 a month | radio | pass | changed: 6 DOM changes |
| 5 | Upgrade | button | pass | request: POST /v1/billing/checkout |
| 6 | Mock purchase | button | check | destructive: not clicked by the crawler |
| 7 | Today | link | pass | link: /today → HTTP 200 |
| 8 | History | link | pass | link: /history → HTTP 200 |
| 9 | Insights | link | pass | link: /insights → HTTP 200 |
| 10 | Me | link | pass | link: /me → HTTP 200 |

### free · `/cards`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /upgrade | page | pass | HTTP 200 → /upgrade |
| 1 | Back | link | pass | link: /me → HTTP 200 |
| 2 | ✓ US$39.99 a year · US$3.33 a month | radio | pass | already selected: choosing the option that is already chosen changes nothing, as expected |
| 3 | US$14.99 every 3 months · US$5.00 a month | radio | pass | changed: 6 DOM changes |
| 4 | US$5.99 a month | radio | pass | changed: 6 DOM changes |
| 5 | Upgrade | button | pass | request: POST /v1/billing/checkout |
| 6 | Mock purchase | button | check | destructive: not clicked by the crawler |
| 7 | Today | link | pass | link: /today → HTTP 200 |
| 8 | History | link | pass | link: /history → HTTP 200 |
| 9 | Insights | link | pass | link: /insights → HTTP 200 |
| 10 | Me | link | pass | link: /me → HTTP 200 |

### free · `/learn`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /upgrade | page | pass | HTTP 200 → /upgrade |
| 1 | Back | link | pass | link: /me → HTTP 200 |
| 2 | ✓ US$39.99 a year · US$3.33 a month | radio | pass | already selected: choosing the option that is already chosen changes nothing, as expected |
| 3 | US$14.99 every 3 months · US$5.00 a month | radio | pass | changed: 6 DOM changes |
| 4 | US$5.99 a month | radio | pass | changed: 6 DOM changes |
| 5 | Upgrade | button | pass | request: POST /v1/billing/checkout |
| 6 | Mock purchase | button | check | destructive: not clicked by the crawler |
| 7 | Today | link | pass | link: /today → HTTP 200 |
| 8 | History | link | pass | link: /history → HTTP 200 |
| 9 | Insights | link | pass | link: /insights → HTTP 200 |
| 10 | Me | link | pass | link: /me → HTTP 200 |

### free · `/health`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /upgrade | page | pass | HTTP 200 → /upgrade |
| 1 | Back | link | pass | link: /me → HTTP 200 |
| 2 | ✓ US$39.99 a year · US$3.33 a month | radio | pass | already selected: choosing the option that is already chosen changes nothing, as expected |
| 3 | US$14.99 every 3 months · US$5.00 a month | radio | pass | changed: 6 DOM changes |
| 4 | US$5.99 a month | radio | pass | changed: 6 DOM changes |
| 5 | Upgrade | button | pass | request: POST /v1/billing/checkout |
| 6 | Mock purchase | button | check | destructive: not clicked by the crawler |
| 7 | Today | link | pass | link: /today → HTTP 200 |
| 8 | History | link | pass | link: /history → HTTP 200 |
| 9 | Insights | link | pass | link: /insights → HTTP 200 |
| 10 | Me | link | pass | link: /me → HTTP 200 |

### free · `/doctor`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /doctor | page | pass | HTTP 200 → /doctor |
| 1 | Back | link | pass | link: /me → HTTP 200 |
| 2 | From | date | listed | text field (filled by the targeted tests) |
| 3 | To | date | listed | text field (filled by the targeted tests) |
| 4 | Questions you want to ask your doctor0/600 · printed in its own box on | textarea | listed | text field (filled by the targeted tests) |
| 5 | ✓ Symptoms | checkbox | pass | changed: 3 DOM changes |
| 6 | ✓ Meals and food groups | checkbox | pass | changed: 3 DOM changes |
| 7 | ✓ Bowel record | checkbox | pass | changed: 3 DOM changes |
| 8 | ✓ Habits and exercise | checkbox | pass | changed: 3 DOM changes |
| 9 | ✓ Medicines | checkbox | pass | changed: 3 DOM changes |
| 10 | ✓ Health background | checkbox | pass | changed: 3 DOM changes |
| 11 | ✓ Family history | checkbox | pass | changed: 3 DOM changes |
| 12 | ✓ Tests | checkbox | pass | changed: 3 DOM changes |
| 13 | ✓ Experiments | checkbox | pass | changed: 3 DOM changes |
| 14 | ✓ What is missing | checkbox | pass | changed: 3 DOM changes |
| 15 | Preview report | button | pass | request: POST /v1/reports |
| 16 | Today | link | pass | link: /today → HTTP 200 |
| 17 | History | link | pass | link: /history → HTTP 200 |
| 18 | Insights | link | pass | link: /insights → HTTP 200 |
| 19 | Me | link | pass | link: /me → HTTP 200 |

### free · `/me`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /me | page | pass | HTTP 200 → /me |
| 1 | See what Pro adds | link | pass | link: /upgrade → HTTP 200 |
| 2 | Change | button | pass | dialog: Change time zone |
| 3 | ✓ US | radio | pass | request: PATCH /v1/me/profile |
| 4 | Metric | radio | pass | request: PATCH /v1/me/profile |
| 5 | Change | button | pass | dialog: Your goal |
| 6 | Cycle, age and other optional context | button | pass | dialog: Optional context |
| 7 | Change habits | button | pass | dialog: Habits to follow |
| 8 | Add or change | button | pass | dialog: Medicines and supplements |
| 9 | Health backgroundPro Conditions and tests for your record | link | pass | link: /upgrade → HTTP 200 |
| 10 | Learn libraryPro Cards and articles, each with its source | link | pass | link: /upgrade → HTTP 200 |
| 11 | Doctor PDFPro A report to bring to an appointment | link | pass | link: /upgrade → HTTP 200 |
| 12 | Your journeyPro Your whole story on one screen | link | pass | link: /upgrade → HTTP 200 |
| 13 | Hide charts | checkbox | pass | request: PATCH /v1/me/profile |
| 14 | JSON | button | pass | request: POST /v1/export |
| 15 | CSV | button | pass | request: POST /v1/export |
| 16 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 17 | How Bloat works How scores and comparisons are calculated | link | pass | link: /how-bloat-works → HTTP 200 |
| 18 | Sign out | button | check | destructive: not clicked by the crawler |
| 19 | Delete account | button | check | destructive: not clicked by the crawler |
| 20 | Mock purchase: Pro for 3 months | button | check | destructive: not clicked by the crawler |
| 21 | Today | link | pass | link: /today → HTTP 200 |
| 22 | History | link | pass | link: /history → HTTP 200 |
| 23 | Insights | link | pass | link: /insights → HTTP 200 |
| 24 | Me | link | pass | link: /me → HTTP 200 |

### free · `/meal/recall`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /upgrade | page | pass | HTTP 200 → /upgrade |
| 1 | Back | link | pass | link: /me → HTTP 200 |
| 2 | ✓ US$39.99 a year · US$3.33 a month | radio | pass | already selected: choosing the option that is already chosen changes nothing, as expected |
| 3 | US$14.99 every 3 months · US$5.00 a month | radio | pass | changed: 6 DOM changes |
| 4 | US$5.99 a month | radio | pass | changed: 6 DOM changes |
| 5 | Upgrade | button | pass | request: POST /v1/billing/checkout |
| 6 | Mock purchase | button | check | destructive: not clicked by the crawler |
| 7 | Today | link | pass | link: /today → HTTP 200 |
| 8 | History | link | pass | link: /history → HTTP 200 |
| 9 | Insights | link | pass | link: /insights → HTTP 200 |
| 10 | Me | link | pass | link: /me → HTTP 200 |

### free · `/upgrade`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /upgrade | page | pass | HTTP 200 → /upgrade |
| 1 | Back | link | pass | link: /me → HTTP 200 |
| 2 | ✓ US$39.99 a year · US$3.33 a month | radio | pass | already selected: choosing the option that is already chosen changes nothing, as expected |
| 3 | US$14.99 every 3 months · US$5.00 a month | radio | pass | changed: 6 DOM changes |
| 4 | US$5.99 a month | radio | pass | changed: 6 DOM changes |
| 5 | Upgrade | button | pass | request: POST /v1/billing/checkout |
| 6 | Mock purchase | button | check | destructive: not clicked by the crawler |
| 7 | Today | link | pass | link: /today → HTTP 200 |
| 8 | History | link | pass | link: /history → HTTP 200 |
| 9 | Insights | link | pass | link: /insights → HTTP 200 |
| 10 | Me | link | pass | link: /me → HTTP 200 |

### free · `/setup`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /today | page | pass | HTTP 200 → /today |
| 1 | Bloating ongoing Since 5:12 · strength 4 | button | pass | dialog: Bloating now |
| 2 | Add meal | button | pass | dialog: Add meal |
| 3 | Add activity | button | pass | dialog: Add activity |
| 4 | What Pro adds | link | pass | link: /upgrade → HTTP 200 |
| 5 | Edit today's entries | link | pass | link: /day/2026-11-19 → HTTP 200 |
| 6 | Today | link | pass | link: /today → HTTP 200 |
| 7 | History | link | pass | link: /history → HTTP 200 |
| 8 | Insights | link | pass | link: /insights → HTTP 200 |
| 9 | Me | link | pass | link: /me → HTTP 200 |

### free · `/help`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /help | page | pass | HTTP 200 → /help |
| 1 | Back | link | pass | link: /today → HTTP 200 |
| 2 | nhs.uk/symptoms/bloating | link | check | external: https://www.nhs.uk/symptoms/bloating/ |
| 3 | Back | button | pass | navigated: /today |

### free · `/how-bloat-works`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /how-bloat-works | page | pass | HTTP 200 → /how-bloat-works |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 3 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 4 | Terms | link | pass | link: /terms → HTTP 200 |
| 5 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 6 | Contact | link | pass | link: /contact → HTTP 200 |

### free · `/terms`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /terms | page | pass | HTTP 200 → /terms |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 3 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 4 | Terms | link | pass | link: /terms → HTTP 200 |
| 5 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 6 | Contact | link | pass | link: /contact → HTTP 200 |

### free · `/privacy`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /privacy | page | pass | HTTP 200 → /privacy |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 3 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 4 | Terms | link | pass | link: /terms → HTTP 200 |
| 5 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 6 | Contact | link | pass | link: /contact → HTTP 200 |

### free · `/contact`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /contact | page | pass | HTTP 200 → /contact |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 3 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 4 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 5 | Terms | link | pass | link: /terms → HTTP 200 |
| 6 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 7 | Contact | link | pass | link: /contact → HTTP 200 |

### pro · `/today`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /today | page | pass | HTTP 200 → /today |
| 1 | Bloating ongoing Since 5:15 am · strength 4 | button | pass | dialog: Bloating now |
| 2 | Add meal | button | pass | dialog: Add meal |
| 3 | Add activity | button | pass | dialog: Add activity |
| 4 | Log bowel movement | button | pass | dialog: Log bowel movement |
| 5 | Possible triggers | link | pass | link: /insights → HTTP 200 |
| 6 | Your journey | link | pass | link: /journey → HTTP 200 |
| 7 | Weekly report | link | pass | link: /report → HTTP 200 |
| 8 | Experiments | link | pass | link: /experiments → HTTP 200 |
| 9 | Doctor report | link | pass | link: /doctor → HTTP 200 |
| 10 | TODAY'S CARD · TIP Eat more slowly | link | pass | link: /cards → HTTP 200 |
| 11 | Edit today's entries | link | pass | link: /day/2026-11-19 → HTTP 200 |
| 12 | Today | link | pass | link: /today → HTTP 200 |
| 13 | History | link | pass | link: /history → HTTP 200 |
| 14 | Insights | link | pass | link: /insights → HTTP 200 |
| 15 | Me | link | pass | link: /me → HTTP 200 |

### pro · `/history`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /history | page | pass | HTTP 200 → /history |
| 1 | Week | radio | pass | changed: 6 DOM changes |
| 2 | ✓ Month | radio | pass | already selected: choosing the option that is already chosen changes nothing, as expected |
| 3 | All | radio | pass | changed: 6 DOM changes |
| 4 | Possible triggers | link | pass | link: /insights → HTTP 200 |
| 5 | Your journey | link | pass | link: /journey → HTTP 200 |
| 6 | Weekly report | link | pass | link: /report → HTTP 200 |
| 7 | Experiments | link | pass | link: /experiments → HTTP 200 |
| 8 | ? Thu Nov 19 · today Highest logged 4 · review to confirm 1 episode 1  | link | pass | link: /day/2026-11-19 → HTTP 200 |
| 9 | Today | link | pass | link: /today → HTTP 200 |
| 10 | History | link | pass | link: /history → HTTP 200 |
| 11 | Insights | link | pass | link: /insights → HTTP 200 |
| 12 | Me | link | pass | link: /me → HTTP 200 |

### pro · `/day/2026-11-19`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /day/2026-11-19 | page | pass | HTTP 200 → /day/2026-11-19 |
| 1 | Back | link | pass | link: /history → HTTP 200 |
| 2 | Edit times | button | listed | disabled until its form is ready |
| 3 | Delete | button | check | destructive: not clicked by the crawler |
| 4 | Edit | button | pass | dialog: Edit meal |
| 5 | Delete | button | check | destructive: not clicked by the crawler |
| 6 | Today | link | pass | link: /today → HTTP 200 |
| 7 | History | link | pass | link: /history → HTTP 200 |
| 8 | Insights | link | pass | link: /insights → HTTP 200 |
| 9 | Me | link | pass | link: /me → HTTP 200 |

### pro · `/review/2026-11-18`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /review/2026-11-18 | page | pass | HTTP 200 → /review/2026-11-18 |
| 1 | Back | link | pass | link: /today → HTTP 200 |
| 2 | 0 · No bloating | radio | pass | changed: 3 DOM changes |
| 3 | 1 | radio | pass | changed: 2 DOM changes |
| 4 | 2 | radio | pass | changed: 2 DOM changes |
| 5 | 3 | radio | pass | changed: 2 DOM changes |
| 6 | 4 | radio | pass | changed: 2 DOM changes |
| 7 | 5 | radio | pass | changed: 2 DOM changes |
| 8 | 6 | radio | pass | changed: 2 DOM changes |
| 9 | 7 | radio | pass | changed: 2 DOM changes |
| 10 | 8 | radio | pass | changed: 2 DOM changes |
| 11 | 9 | radio | pass | changed: 2 DOM changes |
| 12 | 10 | radio | pass | changed: 2 DOM changes |
| 13 | I can't remember | radio | pass | changed: 3 DOM changes |
| 14 | Yes | radio | pass | changed: 3 DOM changes |
| 15 | Only part of the day | radio | pass | changed: 3 DOM changes |
| 16 | Not sure | radio | pass | changed: 3 DOM changes |
| 17 | Continue | button | listed | disabled until its form is ready |
| 18 | Today | link | pass | link: /today → HTTP 200 |
| 19 | History | link | pass | link: /history → HTTP 200 |
| 20 | Insights | link | pass | link: /insights → HTTP 200 |
| 21 | Me | link | pass | link: /me → HTTP 200 |

### pro · `/insights`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /insights | page | pass | HTTP 200 → /insights |
| 1 | Change habits in Me | link | pass | link: /me → HTTP 200 |
| 2 | Experiments | link | pass | link: /experiments → HTTP 200 |
| 3 | Your journey | link | pass | link: /journey → HTTP 200 |
| 4 | Today | link | pass | link: /today → HTTP 200 |
| 5 | History | link | pass | link: /history → HTTP 200 |
| 6 | Insights | link | pass | link: /insights → HTTP 200 |
| 7 | Me | link | pass | link: /me → HTTP 200 |

### pro · `/journey`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /journey | page | pass | HTTP 200 → /journey |
| 1 | Back | link | pass | link: /history → HTTP 200 |
| 2 | Open possible triggers | link | pass | link: /insights → HTTP 200 |
| 3 | See experiments | link | pass | link: /experiments → HTTP 200 |
| 4 | Make doctor report | link | pass | link: /doctor?from=2026-11-19&to=2026-11-18 → HTTP 200 |
| 5 | Today | link | pass | link: /today → HTTP 200 |
| 6 | History | link | pass | link: /history → HTTP 200 |
| 7 | Insights | link | pass | link: /insights → HTTP 200 |
| 8 | Me | link | pass | link: /me → HTTP 200 |

### pro · `/report`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /report | page | pass | HTTP 200 → /report |
| 1 | Back | link | pass | link: /history → HTTP 200 |
| 2 | Today | link | pass | link: /today → HTTP 200 |
| 3 | History | link | pass | link: /history → HTTP 200 |
| 4 | Insights | link | pass | link: /insights → HTTP 200 |
| 5 | Me | link | pass | link: /me → HTTP 200 |

### pro · `/experiments`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /experiments | page | pass | HTTP 200 → /experiments |
| 1 | Back | link | pass | link: /history → HTTP 200 |
| 2 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 3 | Choose | button | pass | dialog: Eat more slowly |
| 4 | Choose | button | pass | dialog: No gum or hard candy |
| 5 | Choose | button | pass | dialog: No straws |
| 6 | Choose | button | pass | dialog: Fewer fizzy drinks |
| 7 | Choose | button | pass | dialog: Walk after meals |
| 8 | Choose | button | pass | dialog: Slow breathing |
| 9 | Answer the safety questions | button | pass | dialog: Before a food swap |
| 10 | Today | link | pass | link: /today → HTTP 200 |
| 11 | History | link | pass | link: /history → HTTP 200 |
| 12 | Insights | link | pass | link: /insights → HTTP 200 |
| 13 | Me | link | pass | link: /me → HTTP 200 |

### pro · `/cards`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /cards | page | pass | HTTP 200 → /cards |
| 1 | Back | link | pass | link: /today → HTTP 200 |
| 2 | NIDDK | link | check | external: https://www.niddk.nih.gov/health-information/digestive-diseases/gas-digestive-tract/eating-diet-nutrition |
| 3 | Tried | radio | pass | changed: 4 DOM changes |
| 4 | Not today | radio | pass | changed: 3 DOM changes |
| 5 | Save feedback | button | listed | disabled until its form is ready |
| 6 | Not relevant | button | pass | request: POST /v1/cards/eat-slowly/feedback |
| 7 | Hide this card | button | pass | request: POST /v1/cards/eat-slowly/feedback |
| 8 | All cards and articles | link | pass | link: /learn → HTTP 200 |
| 9 | Today | link | pass | link: /today → HTTP 200 |
| 10 | History | link | pass | link: /history → HTTP 200 |
| 11 | Insights | link | pass | link: /insights → HTTP 200 |
| 12 | Me | link | pass | link: /me → HTTP 200 |

### pro · `/learn`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /learn | page | pass | HTTP 200 → /learn |
| 1 | Back | link | pass | link: /me → HTTP 200 |
| 2 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 3 | NHS | link | check | external: https://www.nhs.uk/symptoms/bloating/ |
| 4 | NIDDK | link | check | external: https://www.niddk.nih.gov/health-information/digestive-diseases/gas-digestive-tract/eating-diet-nutrition |
| 5 | NIDDK | link | check | external: https://www.niddk.nih.gov/health-information/digestive-diseases/gas-digestive-tract/eating-diet-nutrition |
| 6 | NIDDK | link | check | external: https://www.niddk.nih.gov/health-information/digestive-diseases/gas-digestive-tract/eating-diet-nutrition |
| 7 | NHS | link | check | external: https://www.nhs.uk/symptoms/bloating/ |
| 8 | NIDDK | link | check | external: https://www.niddk.nih.gov/health-information/digestive-diseases/gas-digestive-tract/eating-diet-nutrition |
| 9 | NIDDK | link | check | external: https://www.niddk.nih.gov/health-information/digestive-diseases/gas-digestive-tract/eating-diet-nutrition |
| 10 | NHS | link | check | external: https://www.nhs.uk/symptoms/bloating/ |
| 11 | NHS | link | check | external: https://www.nhs.uk/symptoms/bloating/ |
| 12 | BDA | link | check | external: https://www.bda.uk.com/resource/irritable-bowel-syndrome-diet.html |
| 13 | BDA | link | check | external: https://www.bda.uk.com/resource/irritable-bowel-syndrome-diet.html |
| 14 | NHS | link | check | external: https://www.nhs.uk/symptoms/bloating/ |
| 15 | BDA | link | check | external: https://www.bda.uk.com/resource/irritable-bowel-syndrome-diet.html |
| 16 | BDA | link | check | external: https://www.bda.uk.com/resource/irritable-bowel-syndrome-diet.html |
| 17 | BDA | link | check | external: https://www.bda.uk.com/resource/irritable-bowel-syndrome-diet.html |
| 18 | NIDDK | link | check | external: https://www.niddk.nih.gov/health-information/digestive-diseases/gas-digestive-tract/eating-diet-nutrition |
| 19 | NHS | link | check | external: https://www.nhs.uk/symptoms/bloating/ |
| 20 | 2021 RCT | link | check | external: https://pmc.ncbi.nlm.nih.gov/articles/PMC8035544/ |
| 21 | NHS | link | check | external: https://www.nhs.uk/symptoms/bloating/ |
| 22 | CDC | link | check | external: https://www.cdc.gov/physical-activity-basics/guidelines/adults.html |
| 23 | NHS | link | check | external: https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/ |
| 24 | 2025 RCT | link | check | external: https://pmc.ncbi.nlm.nih.gov/articles/PMC12658723/ |
| 25 | NHS | link | check | external: https://www.nhs.uk/symptoms/bloating/ |
| 26 | NIDDK | link | check | external: https://www.niddk.nih.gov/health-information/digestive-diseases/gas-digestive-tract/eating-diet-nutrition |
| 27 | Un-hide | button | pass | request: POST /v1/cards/eat-slowly/feedback |
| 28 | Today | link | pass | link: /today → HTTP 200 |
| 29 | History | link | pass | link: /history → HTTP 200 |
| 30 | Insights | link | pass | link: /insights → HTTP 200 |
| 31 | Me | link | pass | link: /me → HTTP 200 |

### pro · `/health`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /health | page | pass | HTTP 200 → /health |
| 1 | Back | link | pass | link: /me → HTTP 200 |
| 2 | Lactose intolerance | checkbox | pass | changed: 5 DOM changes |
| 3 | Fructose malabsorption | checkbox | pass | changed: 4 DOM changes |
| 4 | IBS | checkbox | pass | changed: 4 DOM changes |
| 5 | Functional dyspepsia | checkbox | pass | changed: 4 DOM changes |
| 6 | Functional bloating (diagnosed) | checkbox | pass | changed: 4 DOM changes |
| 7 | Coeliac disease | checkbox | pass | changed: 4 DOM changes |
| 8 | Non-coeliac gluten or wheat sensitivity | checkbox | pass | changed: 4 DOM changes |
| 9 | Food allergy | checkbox | pass | changed: 4 DOM changes |
| 10 | SIBO | checkbox | pass | changed: 4 DOM changes |
| 11 | Long-term constipation | checkbox | pass | changed: 4 DOM changes |
| 12 | Crohn's or ulcerative colitis | checkbox | pass | changed: 4 DOM changes |
| 13 | Diverticular disease | checkbox | pass | changed: 4 DOM changes |
| 14 | Reflux | checkbox | pass | changed: 4 DOM changes |
| 15 | Gastroparesis | checkbox | pass | changed: 4 DOM changes |
| 16 | Pancreatic insufficiency | checkbox | pass | changed: 4 DOM changes |
| 17 | Thyroid condition | checkbox | pass | changed: 4 DOM changes |
| 18 | Diabetes | checkbox | pass | changed: 4 DOM changes |
| 19 | Endometriosis | checkbox | pass | changed: 4 DOM changes |
| 20 | Pelvic-floor problems | checkbox | pass | changed: 4 DOM changes |
| 21 | Previous tummy surgery (incl. weight-loss or reflux surgery) | checkbox | pass | changed: 4 DOM changes |
| 22 | Liver, heart or kidney condition | checkbox | pass | changed: 4 DOM changes |
| 23 | Cancer, current or past | checkbox | pass | changed: 4 DOM changes |
| 24 | Anxiety or low mood | checkbox | pass | changed: 4 DOM changes |
| 25 | Other | checkbox | pass | changed: 4 DOM changes |
| 26 | Bowel cancer | checkbox | pass | changed: 3 DOM changes |
| 27 | Stomach cancer | checkbox | pass | changed: 3 DOM changes |
| 28 | Ovarian cancer | checkbox | pass | changed: 3 DOM changes |
| 29 | Coeliac disease | checkbox | pass | changed: 3 DOM changes |
| 30 | Crohn's or ulcerative colitis | checkbox | pass | changed: 3 DOM changes |
| 31 | None | checkbox | pass | changed: 3 DOM changes |
| 32 | Not sure | checkbox | pass | changed: 3 DOM changes |
| 33 | Prefer not to say | checkbox | pass | changed: 3 DOM changes |
| 34 | Save | button | pass | request: PUT /v1/health/conditions, PUT /v1/health/family |
| 35 | Lactose breath test | radio | pass | changed: 6 DOM changes |
| 36 | Fructose breath test | radio | pass | changed: 6 DOM changes |
| 37 | SIBO breath test | radio | pass | changed: 6 DOM changes |
| 38 | Coeliac blood test | radio | pass | changed: 6 DOM changes |
| 39 | Full blood count | radio | pass | changed: 6 DOM changes |
| 40 | Anaemia found | radio | pass | changed: 6 DOM changes |
| 41 | CA125 blood test | radio | pass | changed: 6 DOM changes |
| 42 | Ultrasound | radio | pass | changed: 6 DOM changes |
| 43 | Endoscopy | radio | pass | changed: 6 DOM changes |
| 44 | Colonoscopy | radio | pass | changed: 6 DOM changes |
| 45 | Transit study | radio | pass | changed: 6 DOM changes |
| 46 | Anorectal manometry | radio | pass | changed: 6 DOM changes |
| 47 | Other | radio | pass | changed: 6 DOM changes |
| 48 | Today | link | pass | link: /today → HTTP 200 |
| 49 | History | link | pass | link: /history → HTTP 200 |
| 50 | Insights | link | pass | link: /insights → HTTP 200 |
| 51 | Me | link | pass | link: /me → HTTP 200 |

### pro · `/doctor`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /doctor | page | pass | HTTP 200 → /doctor |
| 1 | Back | link | pass | link: /me → HTTP 200 |
| 2 | From | date | listed | text field (filled by the targeted tests) |
| 3 | To | date | listed | text field (filled by the targeted tests) |
| 4 | Questions you want to ask your doctor0/600 · printed in its own box on | textarea | listed | text field (filled by the targeted tests) |
| 5 | ✓ Symptoms | checkbox | pass | changed: 3 DOM changes |
| 6 | ✓ Meals and food groups | checkbox | pass | changed: 3 DOM changes |
| 7 | ✓ Bowel record | checkbox | pass | changed: 3 DOM changes |
| 8 | ✓ Habits and exercise | checkbox | pass | changed: 3 DOM changes |
| 9 | ✓ Medicines | checkbox | pass | changed: 3 DOM changes |
| 10 | ✓ Health background | checkbox | pass | changed: 3 DOM changes |
| 11 | ✓ Family history | checkbox | pass | changed: 3 DOM changes |
| 12 | ✓ Tests | checkbox | pass | changed: 3 DOM changes |
| 13 | ✓ Experiments | checkbox | pass | changed: 3 DOM changes |
| 14 | ✓ What is missing | checkbox | pass | changed: 3 DOM changes |
| 15 | Preview report | button | pass | request: POST /v1/reports |
| 16 | Today | link | pass | link: /today → HTTP 200 |
| 17 | History | link | pass | link: /history → HTTP 200 |
| 18 | Insights | link | pass | link: /insights → HTTP 200 |
| 19 | Me | link | pass | link: /me → HTTP 200 |

### pro · `/me`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /me | page | pass | HTTP 200 → /me |
| 1 | Pause Pro | button | check | destructive: not clicked by the crawler |
| 2 | Cancel | button | pass | dialog: Cancel Pro |
| 3 | Change | button | pass | dialog: Change time zone |
| 4 | ✓ US | radio | pass | request: PATCH /v1/me/profile |
| 5 | Metric | radio | pass | request: PATCH /v1/me/profile |
| 6 | Change | button | pass | dialog: Your goal |
| 7 | Cycle, age and other optional context | button | pass | dialog: Optional context |
| 8 | Change habits | button | pass | dialog: Habits to follow |
| 9 | Add or change | button | pass | dialog: Medicines and supplements |
| 10 | Health background Conditions and tests for your record | link | pass | link: /health → HTTP 200 |
| 11 | Learn library Cards and articles, each with its source | link | pass | link: /learn → HTTP 200 |
| 12 | Doctor PDF A report to bring to an appointment | link | pass | link: /doctor → HTTP 200 |
| 13 | Your journey Your whole story on one screen | link | pass | link: /journey → HTTP 200 |
| 14 | Switch on | button | pass | dialog: Keep an eye on it |
| 15 | Keep my meal photos (off: a photo is deleted right after its check) | checkbox | check | destructive: not clicked by the crawler |
| 16 | Hide charts | checkbox | pass | request: PATCH /v1/me/profile |
| 17 | JSON | button | pass | request: POST /v1/export |
| 18 | CSV | button | pass | request: POST /v1/export |
| 19 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 20 | How Bloat works How scores and comparisons are calculated | link | pass | link: /how-bloat-works → HTTP 200 |
| 21 | Sign out | button | check | destructive: not clicked by the crawler |
| 22 | Delete account | button | check | destructive: not clicked by the crawler |
| 23 | Today | link | pass | link: /today → HTTP 200 |
| 24 | History | link | pass | link: /history → HTTP 200 |
| 25 | Insights | link | pass | link: /insights → HTTP 200 |
| 26 | Me | link | pass | link: /me → HTTP 200 |

### pro · `/meal/recall`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /meal/recall | page | pass | HTTP 200 → /meal/recall |
| 1 | Back | link | pass | link: /today → HTTP 200 |
| 2 | Back to Today | link | pass | link: /today → HTTP 200 |
| 3 | Today | link | pass | link: /today → HTTP 200 |
| 4 | History | link | pass | link: /history → HTTP 200 |
| 5 | Insights | link | pass | link: /insights → HTTP 200 |
| 6 | Me | link | pass | link: /me → HTTP 200 |

### pro · `/upgrade`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /upgrade | page | pass | HTTP 200 → /upgrade |
| 1 | Back | link | pass | link: /me → HTTP 200 |
| 2 | Add your health background (optional) | link | pass | link: /health → HTTP 200 |
| 3 | Go to Today | link | pass | link: /today → HTTP 200 |
| 4 | Today | link | pass | link: /today → HTTP 200 |
| 5 | History | link | pass | link: /history → HTTP 200 |
| 6 | Insights | link | pass | link: /insights → HTTP 200 |
| 7 | Me | link | pass | link: /me → HTTP 200 |

### pro · `/setup`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /today | page | pass | HTTP 200 → /today |
| 1 | Bloating ongoing Since 5:15 · strength 4 | button | pass | dialog: Bloating now |
| 2 | Add meal | button | pass | dialog: Add meal |
| 3 | Add activity | button | pass | dialog: Add activity |
| 4 | Log bowel movement | button | pass | dialog: Log bowel movement |
| 5 | Possible triggers | link | pass | link: /insights → HTTP 200 |
| 6 | Your journey | link | pass | link: /journey → HTTP 200 |
| 7 | Weekly report | link | pass | link: /report → HTTP 200 |
| 8 | Experiments | link | pass | link: /experiments → HTTP 200 |
| 9 | Doctor report | link | pass | link: /doctor → HTTP 200 |
| 10 | TODAY'S CARD · TIP Eat more slowly | link | pass | link: /cards → HTTP 200 |
| 11 | Edit today's entries | link | pass | link: /day/2026-11-19 → HTTP 200 |
| 12 | Today | link | pass | link: /today → HTTP 200 |
| 13 | History | link | pass | link: /history → HTTP 200 |
| 14 | Insights | link | pass | link: /insights → HTTP 200 |
| 15 | Me | link | pass | link: /me → HTTP 200 |

### pro · `/help`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /help | page | pass | HTTP 200 → /help |
| 1 | Back | link | pass | link: /today → HTTP 200 |
| 2 | nhs.uk/symptoms/bloating | link | check | external: https://www.nhs.uk/symptoms/bloating/ |
| 3 | Back | button | pass | navigated: /today |

### pro · `/how-bloat-works`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /how-bloat-works | page | pass | HTTP 200 → /how-bloat-works |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 3 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 4 | Terms | link | pass | link: /terms → HTTP 200 |
| 5 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 6 | Contact | link | pass | link: /contact → HTTP 200 |

### pro · `/terms`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /terms | page | pass | HTTP 200 → /terms |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 3 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 4 | Terms | link | pass | link: /terms → HTTP 200 |
| 5 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 6 | Contact | link | pass | link: /contact → HTTP 200 |

### pro · `/privacy`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /privacy | page | pass | HTTP 200 → /privacy |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 3 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 4 | Terms | link | pass | link: /terms → HTTP 200 |
| 5 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 6 | Contact | link | pass | link: /contact → HTTP 200 |

### pro · `/contact`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /contact | page | pass | HTTP 200 → /contact |
| 1 | Back | link | pass | link: / → HTTP 200 |
| 2 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 3 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 4 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 5 | Terms | link | pass | link: /terms → HTTP 200 |
| 6 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 7 | Contact | link | pass | link: /contact → HTTP 200 |

