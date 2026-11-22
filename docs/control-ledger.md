# Control ledger

Every control on every screen, for each kind of visitor, as found by the crawler in
`tests/ledger/ledger.spec.ts` on the local stack (synthetic accounts only). Rebuild with
`python3 scripts/ledger-report.py`.

- Crawled: 2026-11-22T13:15:53.100Z (fixed build). Earlier build for comparison: 2026-11-19T10:29:42.661Z.
- **pass**: the control did what it should (opened its screen, a sheet, sent its request, or changed what is shown).
- **fail**: it did nothing visible, threw an error, could not be clicked, or sat under another element.
- **check**: deliberately not clicked by the crawler (destructive, or an outside link); each is covered by a named test below.
- **listed**: a text field, a disabled button, or a control inside a closed sheet; the targeted tests fill and use these.

Totals (fixed build): pass 834, fail 0, check 49, listed 409.
Totals (earlier build, same crawler): pass 598, fail 19, check 49, listed 71.

## Changed since the earlier build

| Visitor | Screen | Control | Before | After |
|---|---|---|---|---|
| signed-out | `/` | Contact | pass: link: /contact → HTTP 200 | listed: not visible on this screen state |
| signed-out | `/` | Sign in | pass: link: /sign-in → HTTP 200 | listed: not visible on this screen state |
| signed-out | `/sign-in` | Send code | fail: NO EFFECT: no navigation, dialog, request or DOM change in 1.3 s | pass: changed: 1 DOM changes |
| signed-out | `/sign-in?new=1` | Send code | fail: NO EFFECT: no navigation, dialog, request or DOM change in 1.3 s | pass: changed: 1 DOM changes |
| signed-out | `/unavailable` | Join waitlist | fail: NO EFFECT: no navigation, dialog, request or DOM change in 1.3 s | pass: changed: 1 DOM changes |
| signed-out | `/terms` | Contact | pass: link: /contact → HTTP 200 | listed: not visible on this screen state |
| signed-out | `/privacy` | Contact | pass: link: /contact → HTTP 200 | listed: not visible on this screen state |
| signed-out | `/contact` | Contact | pass: link: /contact → HTTP 200 | listed: not visible on this screen state |
| signed-out | `/how-bloat-works` | Contact | pass: link: /contact → HTTP 200 | listed: not visible on this screen state |
| signed-out | `/today` | Send code | fail: NO EFFECT: no navigation, dialog, request or DOM change in 1.3 s | pass: changed: 1 DOM changes |
| signed-out | `/history` | Send code | fail: NO EFFECT: no navigation, dialog, request or DOM change in 1.3 s | pass: changed: 1 DOM changes |
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
| free | `/today` | Today | pass: link: /today → HTTP 200 | listed: not visible on this screen state |
| free | `/today` | History | pass: link: /history → HTTP 200 | listed: not visible on this screen state |
| free | `/history` | Today | pass: link: /today → HTTP 200 | listed: not visible on this screen state |
| free | `/history` | History | pass: link: /history → HTTP 200 | listed: not visible on this screen state |
| free | `/insights` | Today | pass: link: /today → HTTP 200 | listed: not visible on this screen state |
| free | `/insights` | History | pass: link: /history → HTTP 200 | listed: not visible on this screen state |
| free | `/journey` | Today | pass: link: /today → HTTP 200 | listed: not visible on this screen state |
| free | `/journey` | History | pass: link: /history → HTTP 200 | listed: not visible on this screen state |
| free | `/report` | Today | pass: link: /today → HTTP 200 | listed: not visible on this screen state |
| free | `/report` | History | pass: link: /history → HTTP 200 | listed: not visible on this screen state |
| free | `/experiments` | Today | pass: link: /today → HTTP 200 | listed: not visible on this screen state |
| free | `/experiments` | History | pass: link: /history → HTTP 200 | listed: not visible on this screen state |
| free | `/cards` | Today | pass: link: /today → HTTP 200 | listed: not visible on this screen state |
| free | `/cards` | History | pass: link: /history → HTTP 200 | listed: not visible on this screen state |
| free | `/learn` | Today | pass: link: /today → HTTP 200 | listed: not visible on this screen state |
| free | `/learn` | History | pass: link: /history → HTTP 200 | listed: not visible on this screen state |
| free | `/health` | Today | pass: link: /today → HTTP 200 | listed: not visible on this screen state |
| free | `/health` | History | pass: link: /history → HTTP 200 | listed: not visible on this screen state |
| free | `/doctor` | Today | pass: link: /today → HTTP 200 | listed: not visible on this screen state |
| free | `/doctor` | History | pass: link: /history → HTTP 200 | listed: not visible on this screen state |
| free | `/me` | Today | pass: link: /today → HTTP 200 | listed: not visible on this screen state |
| free | `/me` | History | pass: link: /history → HTTP 200 | listed: not visible on this screen state |
| free | `/me` | When to get medical help | pass: link: /help → HTTP 200 | listed: not visible on this screen state |
| free | `/meal/recall` | Today | pass: link: /today → HTTP 200 | listed: not visible on this screen state |
| free | `/meal/recall` | History | pass: link: /history → HTTP 200 | listed: not visible on this screen state |
| free | `/upgrade` | Today | pass: link: /today → HTTP 200 | listed: not visible on this screen state |
| free | `/upgrade` | History | pass: link: /history → HTTP 200 | listed: not visible on this screen state |
| free | `/setup` | Today | pass: link: /today → HTTP 200 | listed: not visible on this screen state |
| free | `/setup` | History | pass: link: /history → HTTP 200 | listed: not visible on this screen state |
| free | `/how-bloat-works` | Contact | pass: link: /contact → HTTP 200 | listed: not visible on this screen state |
| free | `/terms` | Contact | pass: link: /contact → HTTP 200 | listed: not visible on this screen state |
| free | `/privacy` | Contact | pass: link: /contact → HTTP 200 | listed: not visible on this screen state |
| free | `/contact` | Contact | pass: link: /contact → HTTP 200 | listed: not visible on this screen state |
| pro | `/today` | Today | pass: link: /today → HTTP 200 | listed: not visible on this screen state |
| pro | `/today` | History | pass: link: /history → HTTP 200 | listed: not visible on this screen state |
| pro | `/history` | Today | pass: link: /today → HTTP 200 | listed: not visible on this screen state |
| pro | `/history` | History | pass: link: /history → HTTP 200 | listed: not visible on this screen state |
| pro | `/insights` | Today | pass: link: /today → HTTP 200 | listed: not visible on this screen state |
| pro | `/insights` | History | pass: link: /history → HTTP 200 | listed: not visible on this screen state |
| pro | `/journey` | Today | pass: link: /today → HTTP 200 | listed: not visible on this screen state |
| pro | `/journey` | History | pass: link: /history → HTTP 200 | listed: not visible on this screen state |
| pro | `/report` | Today | pass: link: /today → HTTP 200 | listed: not visible on this screen state |
| pro | `/report` | History | pass: link: /history → HTTP 200 | listed: not visible on this screen state |
| pro | `/experiments` | Today | pass: link: /today → HTTP 200 | listed: not visible on this screen state |
| pro | `/experiments` | History | pass: link: /history → HTTP 200 | listed: not visible on this screen state |
| pro | `/experiments` | When to get medical help | pass: link: /help → HTTP 200 | listed: not visible on this screen state |
| pro | `/experiments` | Choose | pass: dialog: Slow breathing | listed: disabled until its form is ready |
| pro | `/experiments` | Choose | pass: dialog: Slow breathing | listed: disabled until its form is ready |
| pro | `/experiments` | Choose | pass: dialog: Slow breathing | listed: disabled until its form is ready |
| pro | `/experiments` | Choose | pass: dialog: Slow breathing | listed: disabled until its form is ready |
| pro | `/experiments` | Choose | pass: dialog: Slow breathing | listed: disabled until its form is ready |
| pro | `/experiments` | Choose | pass: dialog: Slow breathing | listed: disabled until its form is ready |
| pro | `/cards` | Today | pass: link: /today → HTTP 200 | listed: not visible on this screen state |
| pro | `/cards` | History | pass: link: /history → HTTP 200 | listed: not visible on this screen state |
| pro | `/learn` | Today | pass: link: /today → HTTP 200 | listed: not visible on this screen state |
| pro | `/learn` | History | pass: link: /history → HTTP 200 | listed: not visible on this screen state |
| pro | `/learn` | When to get medical help | pass: link: /help → HTTP 200 | listed: not visible on this screen state |
| pro | `/health` | Today | pass: link: /today → HTTP 200 | listed: not visible on this screen state |
| pro | `/health` | History | pass: link: /history → HTTP 200 | listed: not visible on this screen state |
| pro | `/doctor` | Today | pass: link: /today → HTTP 200 | listed: not visible on this screen state |
| pro | `/doctor` | History | pass: link: /history → HTTP 200 | listed: not visible on this screen state |
| pro | `/me` | Today | pass: link: /today → HTTP 200 | listed: not visible on this screen state |
| pro | `/me` | History | pass: link: /history → HTTP 200 | listed: not visible on this screen state |
| pro | `/me` | When to get medical help | pass: link: /help → HTTP 200 | listed: not visible on this screen state |
| pro | `/meal/recall` | Today | pass: link: /today → HTTP 200 | listed: not visible on this screen state |
| pro | `/meal/recall` | History | pass: link: /history → HTTP 200 | listed: not visible on this screen state |
| pro | `/upgrade` | Today | pass: link: /today → HTTP 200 | listed: not visible on this screen state |
| pro | `/upgrade` | History | pass: link: /history → HTTP 200 | listed: not visible on this screen state |
| pro | `/setup` | Today | pass: link: /today → HTTP 200 | listed: not visible on this screen state |
| pro | `/setup` | History | pass: link: /history → HTTP 200 | listed: not visible on this screen state |
| pro | `/how-bloat-works` | Contact | pass: link: /contact → HTTP 200 | listed: not visible on this screen state |
| pro | `/terms` | Contact | pass: link: /contact → HTTP 200 | listed: not visible on this screen state |
| pro | `/privacy` | Contact | pass: link: /contact → HTTP 200 | listed: not visible on this screen state |
| pro | `/contact` | Contact | pass: link: /contact → HTTP 200 | listed: not visible on this screen state |

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
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Get started | link | pass | link: /start → HTTP 200 |
| 8 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 9 | How scores and comparisons are calculated | link | pass | link: /how-bloat-works → HTTP 200 |
| 10 | Get started | link | pass | link: /start → HTTP 200 |
| 11 | About | link | pass | link: /about → HTTP 200 |
| 12 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 13 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 14 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 15 | Terms | link | pass | link: /terms → HTTP 200 |
| 16 | Contact | link | pass | link: /contact → HTTP 200 |

### signed-out · `/start`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /start | page | pass | HTTP 200 → /start |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | United States | radio | pass | changed: 4 DOM changes |
| 9 | Canada | radio | pass | changed: 4 DOM changes |
| 10 | India | radio | pass | changed: 4 DOM changes |
| 11 | Other | radio | pass | changed: 4 DOM changes |
| 12 | Continue | button | listed | disabled until its form is ready |
| 13 | About | link | pass | link: /about → HTTP 200 |
| 14 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 15 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 16 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 17 | Terms | link | pass | link: /terms → HTTP 200 |
| 18 | Contact | link | pass | link: /contact → HTTP 200 |

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
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | Email | email | listed | text field (filled by the targeted tests) |
| 9 | Send code | button | pass | changed: 1 DOM changes |
| 10 | I'm new here | link | pass | link: /start → HTTP 200 |
| 11 | Test password | password | listed | text field (filled by the targeted tests) |
| 12 | Sign in with test password | button | listed | disabled until its form is ready |
| 13 | About | link | pass | link: /about → HTTP 200 |
| 14 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 15 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 16 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 17 | Terms | link | pass | link: /terms → HTTP 200 |
| 18 | Contact | link | pass | link: /contact → HTTP 200 |

### signed-out · `/sign-in?new=1`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: /help?signup=1 → HTTP 200 |
| 8 | Email | email | listed | text field (filled by the targeted tests) |
| 9 | I am 18 or older | checkbox | pass | changed: ticked: true |
| 10 | Send code | button | pass | changed: 1 DOM changes |
| 11 | I already have an account | link | pass | link: /sign-in → HTTP 200 |
| 12 | Test password | password | listed | text field (filled by the targeted tests) |
| 13 | Sign in with test password | button | listed | disabled until its form is ready |
| 14 | About | link | pass | link: /about → HTTP 200 |
| 15 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 16 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 17 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 18 | Terms | link | pass | link: /terms → HTTP 200 |
| 19 | Contact | link | pass | link: /contact → HTTP 200 |

### signed-out · `/sign-in/code`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in/code | page | pass | HTTP 200 → /sign-in/code |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 6 DOM changes |
| 7 | Back | link | pass | link: /sign-in → HTTP 200 |
| 8 | 6-digit code | text | listed | text field (filled by the targeted tests) |
| 9 | Continue | button | listed | disabled until its form is ready |
| 10 | Send a new code in 60 s | button | listed | disabled until its form is ready |
| 11 | About | link | pass | link: /about → HTTP 200 |
| 12 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 13 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 14 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 15 | Terms | link | pass | link: /terms → HTTP 200 |
| 16 | Contact | link | pass | link: /contact → HTTP 200 |

### signed-out · `/unavailable`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /unavailable | page | pass | HTTP 200 → /unavailable |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: /start → HTTP 200 |
| 8 | Your country | text | listed | text field (filled by the targeted tests) |
| 9 | EmailOnly used to tell you when Bloat is available. Nothing else is st | email | listed | text field (filled by the targeted tests) |
| 10 | Join waitlist | button | pass | changed: 1 DOM changes |
| 11 | About | link | pass | link: /about → HTTP 200 |
| 12 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 13 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 14 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 15 | Terms | link | pass | link: /terms → HTTP 200 |
| 16 | Contact | link | pass | link: /contact → HTTP 200 |

### signed-out · `/about`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /about | page | pass | HTTP 200 → /about |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | How scores and comparisons are calculated | link | pass | link: /how-bloat-works → HTTP 200 |
| 9 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 10 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 11 | About | link | pass | link: /about → HTTP 200 |
| 12 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 13 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 14 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 15 | Terms | link | pass | link: /terms → HTTP 200 |
| 16 | Contact | link | pass | link: /contact → HTTP 200 |

### signed-out · `/terms`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /terms | page | pass | HTTP 200 → /terms |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | About | link | pass | link: /about → HTTP 200 |
| 9 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 10 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 11 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 12 | Terms | link | pass | link: /terms → HTTP 200 |
| 13 | Contact | link | pass | link: /contact → HTTP 200 |

### signed-out · `/privacy`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /privacy | page | pass | HTTP 200 → /privacy |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | About | link | pass | link: /about → HTTP 200 |
| 9 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 10 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 11 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 12 | Terms | link | pass | link: /terms → HTTP 200 |
| 13 | Contact | link | pass | link: /contact → HTTP 200 |

### signed-out · `/contact`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /contact | page | pass | HTTP 200 → /contact |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 9 | About | link | pass | link: /about → HTTP 200 |
| 10 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 11 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 12 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 13 | Terms | link | pass | link: /terms → HTTP 200 |
| 14 | Contact | link | pass | link: /contact → HTTP 200 |

### signed-out · `/how-bloat-works`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /how-bloat-works | page | pass | HTTP 200 → /how-bloat-works |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | About | link | pass | link: /about → HTTP 200 |
| 9 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 10 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 11 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 12 | Terms | link | pass | link: /terms → HTTP 200 |
| 13 | Contact | link | pass | link: /contact → HTTP 200 |

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
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | Email | email | listed | text field (filled by the targeted tests) |
| 9 | Send code | button | pass | changed: 1 DOM changes |
| 10 | I'm new here | link | pass | link: /start → HTTP 200 |
| 11 | Test password | password | listed | text field (filled by the targeted tests) |
| 12 | Sign in with test password | button | listed | disabled until its form is ready |
| 13 | About | link | pass | link: /about → HTTP 200 |
| 14 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 15 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 16 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 17 | Terms | link | pass | link: /terms → HTTP 200 |
| 18 | Contact | link | pass | link: /contact → HTTP 200 |

### signed-out · `/history`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | Email | email | listed | text field (filled by the targeted tests) |
| 9 | Send code | button | pass | changed: 1 DOM changes |
| 10 | I'm new here | link | pass | link: /start → HTTP 200 |
| 11 | Test password | password | listed | text field (filled by the targeted tests) |
| 12 | Sign in with test password | button | listed | disabled until its form is ready |
| 13 | About | link | pass | link: /about → HTTP 200 |
| 14 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 15 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 16 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 17 | Terms | link | pass | link: /terms → HTTP 200 |
| 18 | Contact | link | pass | link: /contact → HTTP 200 |

### signed-out · `/day/2026-11-22`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | Email | email | listed | text field (filled by the targeted tests) |
| 9 | Send code | button | pass | changed: 1 DOM changes |
| 10 | I'm new here | link | pass | link: /start → HTTP 200 |
| 11 | Test password | password | listed | text field (filled by the targeted tests) |
| 12 | Sign in with test password | button | listed | disabled until its form is ready |
| 13 | About | link | pass | link: /about → HTTP 200 |
| 14 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 15 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 16 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 17 | Terms | link | pass | link: /terms → HTTP 200 |
| 18 | Contact | link | pass | link: /contact → HTTP 200 |

### signed-out · `/review/2026-11-21`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | Email | email | listed | text field (filled by the targeted tests) |
| 9 | Send code | button | pass | changed: 1 DOM changes |
| 10 | I'm new here | link | pass | link: /start → HTTP 200 |
| 11 | Test password | password | listed | text field (filled by the targeted tests) |
| 12 | Sign in with test password | button | listed | disabled until its form is ready |
| 13 | About | link | pass | link: /about → HTTP 200 |
| 14 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 15 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 16 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 17 | Terms | link | pass | link: /terms → HTTP 200 |
| 18 | Contact | link | pass | link: /contact → HTTP 200 |

### signed-out · `/insights`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | Email | email | listed | text field (filled by the targeted tests) |
| 9 | Send code | button | pass | changed: 1 DOM changes |
| 10 | I'm new here | link | pass | link: /start → HTTP 200 |
| 11 | Test password | password | listed | text field (filled by the targeted tests) |
| 12 | Sign in with test password | button | listed | disabled until its form is ready |
| 13 | About | link | pass | link: /about → HTTP 200 |
| 14 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 15 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 16 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 17 | Terms | link | pass | link: /terms → HTTP 200 |
| 18 | Contact | link | pass | link: /contact → HTTP 200 |

### signed-out · `/journey`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | Email | email | listed | text field (filled by the targeted tests) |
| 9 | Send code | button | pass | changed: 1 DOM changes |
| 10 | I'm new here | link | pass | link: /start → HTTP 200 |
| 11 | Test password | password | listed | text field (filled by the targeted tests) |
| 12 | Sign in with test password | button | listed | disabled until its form is ready |
| 13 | About | link | pass | link: /about → HTTP 200 |
| 14 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 15 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 16 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 17 | Terms | link | pass | link: /terms → HTTP 200 |
| 18 | Contact | link | pass | link: /contact → HTTP 200 |

### signed-out · `/report`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | Email | email | listed | text field (filled by the targeted tests) |
| 9 | Send code | button | pass | changed: 1 DOM changes |
| 10 | I'm new here | link | pass | link: /start → HTTP 200 |
| 11 | Test password | password | listed | text field (filled by the targeted tests) |
| 12 | Sign in with test password | button | listed | disabled until its form is ready |
| 13 | About | link | pass | link: /about → HTTP 200 |
| 14 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 15 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 16 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 17 | Terms | link | pass | link: /terms → HTTP 200 |
| 18 | Contact | link | pass | link: /contact → HTTP 200 |

### signed-out · `/experiments`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | Email | email | listed | text field (filled by the targeted tests) |
| 9 | Send code | button | pass | changed: 1 DOM changes |
| 10 | I'm new here | link | pass | link: /start → HTTP 200 |
| 11 | Test password | password | listed | text field (filled by the targeted tests) |
| 12 | Sign in with test password | button | listed | disabled until its form is ready |
| 13 | About | link | pass | link: /about → HTTP 200 |
| 14 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 15 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 16 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 17 | Terms | link | pass | link: /terms → HTTP 200 |
| 18 | Contact | link | pass | link: /contact → HTTP 200 |

### signed-out · `/cards`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | Email | email | listed | text field (filled by the targeted tests) |
| 9 | Send code | button | pass | changed: 1 DOM changes |
| 10 | I'm new here | link | pass | link: /start → HTTP 200 |
| 11 | Test password | password | listed | text field (filled by the targeted tests) |
| 12 | Sign in with test password | button | listed | disabled until its form is ready |
| 13 | About | link | pass | link: /about → HTTP 200 |
| 14 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 15 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 16 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 17 | Terms | link | pass | link: /terms → HTTP 200 |
| 18 | Contact | link | pass | link: /contact → HTTP 200 |

### signed-out · `/learn`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | Email | email | listed | text field (filled by the targeted tests) |
| 9 | Send code | button | pass | changed: 1 DOM changes |
| 10 | I'm new here | link | pass | link: /start → HTTP 200 |
| 11 | Test password | password | listed | text field (filled by the targeted tests) |
| 12 | Sign in with test password | button | listed | disabled until its form is ready |
| 13 | About | link | pass | link: /about → HTTP 200 |
| 14 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 15 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 16 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 17 | Terms | link | pass | link: /terms → HTTP 200 |
| 18 | Contact | link | pass | link: /contact → HTTP 200 |

### signed-out · `/health`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | Email | email | listed | text field (filled by the targeted tests) |
| 9 | Send code | button | pass | changed: 1 DOM changes |
| 10 | I'm new here | link | pass | link: /start → HTTP 200 |
| 11 | Test password | password | listed | text field (filled by the targeted tests) |
| 12 | Sign in with test password | button | listed | disabled until its form is ready |
| 13 | About | link | pass | link: /about → HTTP 200 |
| 14 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 15 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 16 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 17 | Terms | link | pass | link: /terms → HTTP 200 |
| 18 | Contact | link | pass | link: /contact → HTTP 200 |

### signed-out · `/doctor`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | Email | email | listed | text field (filled by the targeted tests) |
| 9 | Send code | button | pass | changed: 1 DOM changes |
| 10 | I'm new here | link | pass | link: /start → HTTP 200 |
| 11 | Test password | password | listed | text field (filled by the targeted tests) |
| 12 | Sign in with test password | button | listed | disabled until its form is ready |
| 13 | About | link | pass | link: /about → HTTP 200 |
| 14 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 15 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 16 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 17 | Terms | link | pass | link: /terms → HTTP 200 |
| 18 | Contact | link | pass | link: /contact → HTTP 200 |

### signed-out · `/me`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | Email | email | listed | text field (filled by the targeted tests) |
| 9 | Send code | button | pass | changed: 1 DOM changes |
| 10 | I'm new here | link | pass | link: /start → HTTP 200 |
| 11 | Test password | password | listed | text field (filled by the targeted tests) |
| 12 | Sign in with test password | button | listed | disabled until its form is ready |
| 13 | About | link | pass | link: /about → HTTP 200 |
| 14 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 15 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 16 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 17 | Terms | link | pass | link: /terms → HTTP 200 |
| 18 | Contact | link | pass | link: /contact → HTTP 200 |

### signed-out · `/meal/recall`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | Email | email | listed | text field (filled by the targeted tests) |
| 9 | Send code | button | pass | changed: 1 DOM changes |
| 10 | I'm new here | link | pass | link: /start → HTTP 200 |
| 11 | Test password | password | listed | text field (filled by the targeted tests) |
| 12 | Sign in with test password | button | listed | disabled until its form is ready |
| 13 | About | link | pass | link: /about → HTTP 200 |
| 14 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 15 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 16 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 17 | Terms | link | pass | link: /terms → HTTP 200 |
| 18 | Contact | link | pass | link: /contact → HTTP 200 |

### signed-out · `/upgrade`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | Email | email | listed | text field (filled by the targeted tests) |
| 9 | Send code | button | pass | changed: 1 DOM changes |
| 10 | I'm new here | link | pass | link: /start → HTTP 200 |
| 11 | Test password | password | listed | text field (filled by the targeted tests) |
| 12 | Sign in with test password | button | listed | disabled until its form is ready |
| 13 | About | link | pass | link: /about → HTTP 200 |
| 14 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 15 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 16 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 17 | Terms | link | pass | link: /terms → HTTP 200 |
| 18 | Contact | link | pass | link: /contact → HTTP 200 |

### signed-out · `/setup`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /sign-in | page | pass | HTTP 200 → /sign-in |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | Email | email | listed | text field (filled by the targeted tests) |
| 9 | Send code | button | pass | changed: 1 DOM changes |
| 10 | I'm new here | link | pass | link: /start → HTTP 200 |
| 11 | Test password | password | listed | text field (filled by the targeted tests) |
| 12 | Sign in with test password | button | listed | disabled until its form is ready |
| 13 | About | link | pass | link: /about → HTTP 200 |
| 14 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 15 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 16 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 17 | Terms | link | pass | link: /terms → HTTP 200 |
| 18 | Contact | link | pass | link: /contact → HTTP 200 |

### free · `/today`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /today | page | pass | HTTP 200 → /today |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Bloating ongoing Since 8:08 am · strength 4 | button | pass | dialog: Bloating now |
| 8 | Add meal | button | pass | dialog: Add meal |
| 9 | Add activity | button | pass | dialog: Add activity |
| 10 | What Pro adds | link | pass | link: /upgrade → HTTP 200 |
| 11 | Edit today's entries | link | pass | link: /day/2026-11-22 → HTTP 200 |
| 12 | Today | link | pass | link: /today → HTTP 200 |
| 13 | History | link | pass | link: /history → HTTP 200 |
| 14 | Patterns | link | pass | link: /insights → HTTP 200 |
| 15 | You | link | pass | link: /me → HTTP 200 |

### free · `/history`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /history | page | pass | HTTP 200 → /history |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | ? Sun Nov 22 · today Highest logged 4 · review to confirm 1 episode 1  | link | pass | link: /day/2026-11-22 → HTTP 200 |
| 8 | Chart and 7-day averagePro Your daily scores as a chart. | link | pass | link: /upgrade → HTTP 200 |
| 9 | Possible triggersPro Foods and habits compared with your scores, with  | link | pass | link: /upgrade → HTTP 200 |
| 10 | Weekly report and Your journeyPro Your records summed up, and a report | link | pass | link: /upgrade → HTTP 200 |
| 11 | Today | link | pass | link: /today → HTTP 200 |
| 12 | History | link | pass | link: /history → HTTP 200 |
| 13 | Patterns | link | pass | link: /insights → HTTP 200 |
| 14 | You | link | pass | link: /me → HTTP 200 |

### free · `/day/2026-11-22`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /day/2026-11-22 | page | pass | HTTP 200 → /day/2026-11-22 |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Back | link | pass | link: /history → HTTP 200 |
| 8 | Edit times | button | listed | disabled until its form is ready |
| 9 | Delete | button | check | destructive: not clicked by the crawler |
| 10 | Edit | button | pass | dialog: Edit meal |
| 11 | Delete | button | check | destructive: not clicked by the crawler |
| 12 | Today | link | pass | link: /today → HTTP 200 |
| 13 | History | link | pass | link: /history → HTTP 200 |
| 14 | Patterns | link | pass | link: /insights → HTTP 200 |
| 15 | You | link | pass | link: /me → HTTP 200 |

### free · `/review/2026-11-21`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /review/2026-11-21 | page | pass | HTTP 200 → /review/2026-11-21 |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Back | link | pass | link: /today → HTTP 200 |
| 8 | 0 · No bloating | radio | pass | changed: 3 DOM changes |
| 9 | 1 | radio | pass | changed: 2 DOM changes |
| 10 | 2 | radio | pass | changed: 2 DOM changes |
| 11 | 3 | radio | pass | changed: 2 DOM changes |
| 12 | 4 | radio | pass | changed: 2 DOM changes |
| 13 | 5 | radio | pass | changed: 2 DOM changes |
| 14 | 6 | radio | pass | changed: 2 DOM changes |
| 15 | 7 | radio | pass | changed: 2 DOM changes |
| 16 | 8 | radio | pass | changed: 2 DOM changes |
| 17 | 9 | radio | pass | changed: 2 DOM changes |
| 18 | 10 | radio | pass | changed: 2 DOM changes |
| 19 | I can't remember | radio | pass | changed: 3 DOM changes |
| 20 | Yes | radio | pass | changed: 3 DOM changes |
| 21 | Only part of the day | radio | pass | changed: 3 DOM changes |
| 22 | Not sure | radio | pass | changed: 3 DOM changes |
| 23 | Continue | button | listed | disabled until its form is ready |
| 24 | Today | link | pass | link: /today → HTTP 200 |
| 25 | History | link | pass | link: /history → HTTP 200 |
| 26 | Patterns | link | pass | link: /insights → HTTP 200 |
| 27 | You | link | pass | link: /me → HTTP 200 |

### free · `/insights`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /upgrade | page | pass | HTTP 200 → /upgrade |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Back | link | pass | link: /me → HTTP 200 |
| 8 | ✓ US$39.99 a year · US$3.33 a month | radio | pass | already selected: choosing the option that is already chosen changes nothing, as expected |
| 9 | US$14.99 every 3 months · US$5.00 a month | radio | pass | changed: 6 DOM changes |
| 10 | US$5.99 a month | radio | pass | changed: 6 DOM changes |
| 11 | Upgrade | button | pass | request: POST /v1/billing/checkout |
| 12 | Mock purchase | button | check | destructive: not clicked by the crawler |
| 13 | Today | link | pass | link: /today → HTTP 200 |
| 14 | History | link | pass | link: /history → HTTP 200 |
| 15 | Patterns | link | pass | link: /insights → HTTP 200 |
| 16 | You | link | pass | link: /me → HTTP 200 |

### free · `/journey`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /upgrade | page | pass | HTTP 200 → /upgrade |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Back | link | pass | link: /me → HTTP 200 |
| 8 | ✓ US$39.99 a year · US$3.33 a month | radio | pass | already selected: choosing the option that is already chosen changes nothing, as expected |
| 9 | US$14.99 every 3 months · US$5.00 a month | radio | pass | changed: 6 DOM changes |
| 10 | US$5.99 a month | radio | pass | changed: 6 DOM changes |
| 11 | Upgrade | button | pass | request: POST /v1/billing/checkout |
| 12 | Mock purchase | button | check | destructive: not clicked by the crawler |
| 13 | Today | link | pass | link: /today → HTTP 200 |
| 14 | History | link | pass | link: /history → HTTP 200 |
| 15 | Patterns | link | pass | link: /insights → HTTP 200 |
| 16 | You | link | pass | link: /me → HTTP 200 |

### free · `/report`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /upgrade | page | pass | HTTP 200 → /upgrade |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Back | link | pass | link: /me → HTTP 200 |
| 8 | ✓ US$39.99 a year · US$3.33 a month | radio | pass | already selected: choosing the option that is already chosen changes nothing, as expected |
| 9 | US$14.99 every 3 months · US$5.00 a month | radio | pass | changed: 6 DOM changes |
| 10 | US$5.99 a month | radio | pass | changed: 6 DOM changes |
| 11 | Upgrade | button | pass | request: POST /v1/billing/checkout |
| 12 | Mock purchase | button | check | destructive: not clicked by the crawler |
| 13 | Today | link | pass | link: /today → HTTP 200 |
| 14 | History | link | pass | link: /history → HTTP 200 |
| 15 | Patterns | link | pass | link: /insights → HTTP 200 |
| 16 | You | link | pass | link: /me → HTTP 200 |

### free · `/experiments`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /upgrade | page | pass | HTTP 200 → /upgrade |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Back | link | pass | link: /me → HTTP 200 |
| 8 | ✓ US$39.99 a year · US$3.33 a month | radio | pass | already selected: choosing the option that is already chosen changes nothing, as expected |
| 9 | US$14.99 every 3 months · US$5.00 a month | radio | pass | changed: 6 DOM changes |
| 10 | US$5.99 a month | radio | pass | changed: 6 DOM changes |
| 11 | Upgrade | button | pass | request: POST /v1/billing/checkout |
| 12 | Mock purchase | button | check | destructive: not clicked by the crawler |
| 13 | Today | link | pass | link: /today → HTTP 200 |
| 14 | History | link | pass | link: /history → HTTP 200 |
| 15 | Patterns | link | pass | link: /insights → HTTP 200 |
| 16 | You | link | pass | link: /me → HTTP 200 |

### free · `/cards`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /upgrade | page | pass | HTTP 200 → /upgrade |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Back | link | pass | link: /me → HTTP 200 |
| 8 | ✓ US$39.99 a year · US$3.33 a month | radio | pass | already selected: choosing the option that is already chosen changes nothing, as expected |
| 9 | US$14.99 every 3 months · US$5.00 a month | radio | pass | changed: 6 DOM changes |
| 10 | US$5.99 a month | radio | pass | changed: 6 DOM changes |
| 11 | Upgrade | button | pass | request: POST /v1/billing/checkout |
| 12 | Mock purchase | button | check | destructive: not clicked by the crawler |
| 13 | Today | link | pass | link: /today → HTTP 200 |
| 14 | History | link | pass | link: /history → HTTP 200 |
| 15 | Patterns | link | pass | link: /insights → HTTP 200 |
| 16 | You | link | pass | link: /me → HTTP 200 |

### free · `/learn`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /upgrade | page | pass | HTTP 200 → /upgrade |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Back | link | pass | link: /me → HTTP 200 |
| 8 | ✓ US$39.99 a year · US$3.33 a month | radio | pass | already selected: choosing the option that is already chosen changes nothing, as expected |
| 9 | US$14.99 every 3 months · US$5.00 a month | radio | pass | changed: 6 DOM changes |
| 10 | US$5.99 a month | radio | pass | changed: 6 DOM changes |
| 11 | Upgrade | button | pass | request: POST /v1/billing/checkout |
| 12 | Mock purchase | button | check | destructive: not clicked by the crawler |
| 13 | Today | link | pass | link: /today → HTTP 200 |
| 14 | History | link | pass | link: /history → HTTP 200 |
| 15 | Patterns | link | pass | link: /insights → HTTP 200 |
| 16 | You | link | pass | link: /me → HTTP 200 |

### free · `/health`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /upgrade | page | pass | HTTP 200 → /upgrade |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Back | link | pass | link: /me → HTTP 200 |
| 8 | ✓ US$39.99 a year · US$3.33 a month | radio | pass | already selected: choosing the option that is already chosen changes nothing, as expected |
| 9 | US$14.99 every 3 months · US$5.00 a month | radio | pass | changed: 6 DOM changes |
| 10 | US$5.99 a month | radio | pass | changed: 6 DOM changes |
| 11 | Upgrade | button | pass | request: POST /v1/billing/checkout |
| 12 | Mock purchase | button | check | destructive: not clicked by the crawler |
| 13 | Today | link | pass | link: /today → HTTP 200 |
| 14 | History | link | pass | link: /history → HTTP 200 |
| 15 | Patterns | link | pass | link: /insights → HTTP 200 |
| 16 | You | link | pass | link: /me → HTTP 200 |

### free · `/doctor`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /doctor | page | pass | HTTP 200 → /doctor |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Back | link | pass | link: /insights → HTTP 200 |
| 8 | From | date | listed | text field (filled by the targeted tests) |
| 9 | To | date | listed | text field (filled by the targeted tests) |
| 10 | Questions you want to ask your doctor0/600 · printed in its own box on | textarea | listed | text field (filled by the targeted tests) |
| 11 | ✓ Symptoms | checkbox | pass | changed: 3 DOM changes |
| 12 | ✓ Meals and food groups | checkbox | pass | changed: 3 DOM changes |
| 13 | ✓ Bowel record | checkbox | pass | changed: 3 DOM changes |
| 14 | ✓ Habits and exercise | checkbox | pass | changed: 3 DOM changes |
| 15 | ✓ Medicines | checkbox | pass | changed: 3 DOM changes |
| 16 | ✓ Health background | checkbox | pass | changed: 3 DOM changes |
| 17 | ✓ Family history | checkbox | pass | changed: 3 DOM changes |
| 18 | ✓ Tests | checkbox | pass | changed: 3 DOM changes |
| 19 | ✓ Experiments | checkbox | pass | changed: 3 DOM changes |
| 20 | ✓ What is missing | checkbox | pass | changed: 3 DOM changes |
| 21 | Preview report | button | pass | request: POST /v1/reports |
| 22 | Today | link | pass | link: /today → HTTP 200 |
| 23 | History | link | pass | link: /history → HTTP 200 |
| 24 | Patterns | link | pass | link: /insights → HTTP 200 |
| 25 | You | link | pass | link: /me → HTTP 200 |

### free · `/me`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /me | page | pass | HTTP 200 → /me |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | See what Pro adds | link | pass | link: /upgrade → HTTP 200 |
| 8 | Change | button | pass | dialog: Change time zone |
| 9 | ✓ US | radio | pass | request: PATCH /v1/me/profile |
| 10 | Metric | radio | pass | request: PATCH /v1/me/profile |
| 11 | Change | button | pass | dialog: Your goal |
| 12 | Cycle, age and other optional context | button | pass | dialog: Optional context |
| 13 | Change habits | button | pass | dialog: Habits to follow |
| 14 | Add or change | button | pass | dialog: Medicines and supplements |
| 15 | Health backgroundPro Conditions and tests for your record | link | pass | link: /upgrade → HTTP 200 |
| 16 | Learn libraryPro Cards and articles, each with its source | link | pass | link: /upgrade → HTTP 200 |
| 17 | Doctor PDFPro A report to bring to an appointment | link | pass | link: /upgrade → HTTP 200 |
| 18 | Your journeyPro Your whole story on one screen | link | pass | link: /upgrade → HTTP 200 |
| 19 | Hide charts | checkbox | pass | request: PATCH /v1/me/profile |
| 20 | JSON | button | pass | request: POST /v1/export |
| 21 | CSV | button | pass | request: POST /v1/export |
| 22 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 23 | How Bloat works How scores and comparisons are calculated | link | pass | link: /how-bloat-works → HTTP 200 |
| 24 | Sign out | button | check | destructive: not clicked by the crawler |
| 25 | Delete account | button | check | destructive: not clicked by the crawler |
| 26 | Mock purchase: Pro for 3 months | button | check | destructive: not clicked by the crawler |
| 27 | Today | link | pass | link: /today → HTTP 200 |
| 28 | History | link | pass | link: /history → HTTP 200 |
| 29 | Patterns | link | pass | link: /insights → HTTP 200 |
| 30 | You | link | pass | link: /me → HTTP 200 |

### free · `/meal/recall`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /upgrade | page | pass | HTTP 200 → /upgrade |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Back | link | pass | link: /me → HTTP 200 |
| 8 | ✓ US$39.99 a year · US$3.33 a month | radio | pass | already selected: choosing the option that is already chosen changes nothing, as expected |
| 9 | US$14.99 every 3 months · US$5.00 a month | radio | pass | changed: 6 DOM changes |
| 10 | US$5.99 a month | radio | pass | changed: 6 DOM changes |
| 11 | Upgrade | button | pass | request: POST /v1/billing/checkout |
| 12 | Mock purchase | button | check | destructive: not clicked by the crawler |
| 13 | Today | link | pass | link: /today → HTTP 200 |
| 14 | History | link | pass | link: /history → HTTP 200 |
| 15 | Patterns | link | pass | link: /insights → HTTP 200 |
| 16 | You | link | pass | link: /me → HTTP 200 |

### free · `/upgrade`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /upgrade | page | pass | HTTP 200 → /upgrade |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Back | link | pass | link: /me → HTTP 200 |
| 8 | ✓ US$39.99 a year · US$3.33 a month | radio | pass | already selected: choosing the option that is already chosen changes nothing, as expected |
| 9 | US$14.99 every 3 months · US$5.00 a month | radio | pass | changed: 6 DOM changes |
| 10 | US$5.99 a month | radio | pass | changed: 6 DOM changes |
| 11 | Upgrade | button | pass | request: POST /v1/billing/checkout |
| 12 | Mock purchase | button | check | destructive: not clicked by the crawler |
| 13 | Today | link | pass | link: /today → HTTP 200 |
| 14 | History | link | pass | link: /history → HTTP 200 |
| 15 | Patterns | link | pass | link: /insights → HTTP 200 |
| 16 | You | link | pass | link: /me → HTTP 200 |

### free · `/setup`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /today | page | pass | HTTP 200 → /today |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Bloating ongoing Since 8:08 · strength 4 | button | pass | dialog: Bloating now |
| 8 | Add meal | button | pass | dialog: Add meal |
| 9 | Add activity | button | pass | dialog: Add activity |
| 10 | What Pro adds | link | pass | link: /upgrade → HTTP 200 |
| 11 | Edit today's entries | link | pass | link: /day/2026-11-22 → HTTP 200 |
| 12 | Today | link | pass | link: /today → HTTP 200 |
| 13 | History | link | pass | link: /history → HTTP 200 |
| 14 | Patterns | link | pass | link: /insights → HTTP 200 |
| 15 | You | link | pass | link: /me → HTTP 200 |

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
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | About | link | pass | link: /about → HTTP 200 |
| 9 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 10 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 11 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 12 | Terms | link | pass | link: /terms → HTTP 200 |
| 13 | Contact | link | pass | link: /contact → HTTP 200 |

### free · `/terms`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /terms | page | pass | HTTP 200 → /terms |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | About | link | pass | link: /about → HTTP 200 |
| 9 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 10 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 11 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 12 | Terms | link | pass | link: /terms → HTTP 200 |
| 13 | Contact | link | pass | link: /contact → HTTP 200 |

### free · `/privacy`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /privacy | page | pass | HTTP 200 → /privacy |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | About | link | pass | link: /about → HTTP 200 |
| 9 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 10 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 11 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 12 | Terms | link | pass | link: /terms → HTTP 200 |
| 13 | Contact | link | pass | link: /contact → HTTP 200 |

### free · `/contact`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /contact | page | pass | HTTP 200 → /contact |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 9 | About | link | pass | link: /about → HTTP 200 |
| 10 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 11 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 12 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 13 | Terms | link | pass | link: /terms → HTTP 200 |
| 14 | Contact | link | pass | link: /contact → HTTP 200 |

### pro · `/today`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /today | page | pass | HTTP 200 → /today |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Bloating ongoing Since 8:11 am · strength 4 | button | pass | dialog: Bloating now |
| 8 | Add meal | button | pass | dialog: Add meal |
| 9 | Add activity | button | pass | dialog: Add activity |
| 10 | Log bowel movement | button | pass | dialog: Log bowel movement |
| 11 | Possible triggers | link | pass | link: /insights → HTTP 200 |
| 12 | Your journey | link | pass | link: /journey → HTTP 200 |
| 13 | Weekly report | link | pass | link: /report → HTTP 200 |
| 14 | Experiments | link | pass | link: /experiments → HTTP 200 |
| 15 | Doctor report | link | pass | link: /doctor → HTTP 200 |
| 16 | TODAY'S CARD · TIP Eat more slowly | link | pass | link: /cards → HTTP 200 |
| 17 | Edit today's entries | link | pass | link: /day/2026-11-22 → HTTP 200 |
| 18 | Today | link | pass | link: /today → HTTP 200 |
| 19 | History | link | pass | link: /history → HTTP 200 |
| 20 | Patterns | link | pass | link: /insights → HTTP 200 |
| 21 | You | link | pass | link: /me → HTTP 200 |

### pro · `/history`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /history | page | pass | HTTP 200 → /history |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Week | radio | pass | changed: 6 DOM changes |
| 8 | ✓ Month | radio | pass | already selected: choosing the option that is already chosen changes nothing, as expected |
| 9 | All | radio | pass | changed: 6 DOM changes |
| 10 | Possible triggers | link | pass | link: /insights → HTTP 200 |
| 11 | Your journey | link | pass | link: /journey → HTTP 200 |
| 12 | Weekly report | link | pass | link: /report → HTTP 200 |
| 13 | Experiments | link | pass | link: /experiments → HTTP 200 |
| 14 | ? Sun Nov 22 · today Highest logged 4 · review to confirm 1 episode 1  | link | pass | link: /day/2026-11-22 → HTTP 200 |
| 15 | Today | link | pass | link: /today → HTTP 200 |
| 16 | History | link | pass | link: /history → HTTP 200 |
| 17 | Patterns | link | pass | link: /insights → HTTP 200 |
| 18 | You | link | pass | link: /me → HTTP 200 |

### pro · `/day/2026-11-22`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /day/2026-11-22 | page | pass | HTTP 200 → /day/2026-11-22 |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Back | link | pass | link: /history → HTTP 200 |
| 8 | Edit times | button | listed | disabled until its form is ready |
| 9 | Delete | button | check | destructive: not clicked by the crawler |
| 10 | Edit | button | pass | dialog: Edit meal |
| 11 | Delete | button | check | destructive: not clicked by the crawler |
| 12 | Today | link | pass | link: /today → HTTP 200 |
| 13 | History | link | pass | link: /history → HTTP 200 |
| 14 | Patterns | link | pass | link: /insights → HTTP 200 |
| 15 | You | link | pass | link: /me → HTTP 200 |

### pro · `/review/2026-11-21`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /review/2026-11-21 | page | pass | HTTP 200 → /review/2026-11-21 |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Back | link | pass | link: /today → HTTP 200 |
| 8 | 0 · No bloating | radio | pass | changed: 3 DOM changes |
| 9 | 1 | radio | pass | changed: 2 DOM changes |
| 10 | 2 | radio | pass | changed: 2 DOM changes |
| 11 | 3 | radio | pass | changed: 2 DOM changes |
| 12 | 4 | radio | pass | changed: 2 DOM changes |
| 13 | 5 | radio | pass | changed: 2 DOM changes |
| 14 | 6 | radio | pass | changed: 2 DOM changes |
| 15 | 7 | radio | pass | changed: 2 DOM changes |
| 16 | 8 | radio | pass | changed: 2 DOM changes |
| 17 | 9 | radio | pass | changed: 2 DOM changes |
| 18 | 10 | radio | pass | changed: 2 DOM changes |
| 19 | I can't remember | radio | pass | changed: 3 DOM changes |
| 20 | Yes | radio | pass | changed: 3 DOM changes |
| 21 | Only part of the day | radio | pass | changed: 3 DOM changes |
| 22 | Not sure | radio | pass | changed: 3 DOM changes |
| 23 | Continue | button | listed | disabled until its form is ready |
| 24 | Today | link | pass | link: /today → HTTP 200 |
| 25 | History | link | pass | link: /history → HTTP 200 |
| 26 | Patterns | link | pass | link: /insights → HTTP 200 |
| 27 | You | link | pass | link: /me → HTTP 200 |

### pro · `/insights`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /insights | page | pass | HTTP 200 → /insights |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Change habits in Me | link | pass | link: /me → HTTP 200 |
| 8 | Experiments | link | pass | link: /experiments → HTTP 200 |
| 9 | Your journey | link | pass | link: /journey → HTTP 200 |
| 10 | Today | link | pass | link: /today → HTTP 200 |
| 11 | History | link | pass | link: /history → HTTP 200 |
| 12 | Patterns | link | pass | link: /insights → HTTP 200 |
| 13 | You | link | pass | link: /me → HTTP 200 |

### pro · `/journey`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /journey | page | pass | HTTP 200 → /journey |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Back | link | pass | link: /insights → HTTP 200 |
| 8 | Open possible triggers | link | pass | link: /insights → HTTP 200 |
| 9 | See experiments | link | pass | link: /experiments → HTTP 200 |
| 10 | Make doctor report | link | pass | link: /doctor?from=2026-11-22&to=2026-11-21 → HTTP 200 |
| 11 | Today | link | pass | link: /today → HTTP 200 |
| 12 | History | link | pass | link: /history → HTTP 200 |
| 13 | Patterns | link | pass | link: /insights → HTTP 200 |
| 14 | You | link | pass | link: /me → HTTP 200 |

### pro · `/report`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /report | page | pass | HTTP 200 → /report |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Back | link | pass | link: /insights → HTTP 200 |
| 8 | Today | link | pass | link: /today → HTTP 200 |
| 9 | History | link | pass | link: /history → HTTP 200 |
| 10 | Patterns | link | pass | link: /insights → HTTP 200 |
| 11 | You | link | pass | link: /me → HTTP 200 |

### pro · `/experiments`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /experiments | page | pass | HTTP 200 → /experiments |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Back | link | pass | link: /insights → HTTP 200 |
| 8 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 9 | Choose | button | listed | disabled until its form is ready |
| 10 | Choose | button | listed | disabled until its form is ready |
| 11 | Choose | button | listed | disabled until its form is ready |
| 12 | Choose | button | listed | disabled until its form is ready |
| 13 | Choose | button | listed | disabled until its form is ready |
| 14 | Choose | button | listed | disabled until its form is ready |
| 15 | Answer the safety questions | button | pass | dialog: Before a food swap |
| 16 | Today | link | pass | link: /today → HTTP 200 |
| 17 | History | link | pass | link: /history → HTTP 200 |
| 18 | Patterns | link | pass | link: /insights → HTTP 200 |
| 19 | You | link | pass | link: /me → HTTP 200 |

### pro · `/cards`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /cards | page | pass | HTTP 200 → /cards |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Back | link | pass | link: /today → HTTP 200 |
| 8 | NIDDK | link | check | external: https://www.niddk.nih.gov/health-information/digestive-diseases/gas-digestive-tract/eating-diet-nutrition |
| 9 | Tried | radio | pass | changed: 4 DOM changes |
| 10 | Not today | radio | pass | changed: 3 DOM changes |
| 11 | Save feedback | button | listed | disabled until its form is ready |
| 12 | Not relevant | button | pass | request: POST /v1/cards/eat-slowly/feedback |
| 13 | Hide this card | button | pass | request: POST /v1/cards/eat-slowly/feedback |
| 14 | All cards and articles | link | pass | link: /learn → HTTP 200 |
| 15 | Today | link | pass | link: /today → HTTP 200 |
| 16 | History | link | pass | link: /history → HTTP 200 |
| 17 | Patterns | link | pass | link: /insights → HTTP 200 |
| 18 | You | link | pass | link: /me → HTTP 200 |

### pro · `/learn`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /learn | page | pass | HTTP 200 → /learn |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Back | link | pass | link: /me → HTTP 200 |
| 8 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 9 | NHS | link | check | external: https://www.nhs.uk/symptoms/bloating/ |
| 10 | NIDDK | link | check | external: https://www.niddk.nih.gov/health-information/digestive-diseases/gas-digestive-tract/eating-diet-nutrition |
| 11 | NIDDK | link | check | external: https://www.niddk.nih.gov/health-information/digestive-diseases/gas-digestive-tract/eating-diet-nutrition |
| 12 | NIDDK | link | check | external: https://www.niddk.nih.gov/health-information/digestive-diseases/gas-digestive-tract/eating-diet-nutrition |
| 13 | NHS | link | check | external: https://www.nhs.uk/symptoms/bloating/ |
| 14 | NIDDK | link | check | external: https://www.niddk.nih.gov/health-information/digestive-diseases/gas-digestive-tract/eating-diet-nutrition |
| 15 | NIDDK | link | check | external: https://www.niddk.nih.gov/health-information/digestive-diseases/gas-digestive-tract/eating-diet-nutrition |
| 16 | NHS | link | check | external: https://www.nhs.uk/symptoms/bloating/ |
| 17 | NHS | link | check | external: https://www.nhs.uk/symptoms/bloating/ |
| 18 | BDA | link | check | external: https://www.bda.uk.com/resource/irritable-bowel-syndrome-diet.html |
| 19 | BDA | link | check | external: https://www.bda.uk.com/resource/irritable-bowel-syndrome-diet.html |
| 20 | NHS | link | check | external: https://www.nhs.uk/symptoms/bloating/ |
| 21 | BDA | link | check | external: https://www.bda.uk.com/resource/irritable-bowel-syndrome-diet.html |
| 22 | BDA | link | check | external: https://www.bda.uk.com/resource/irritable-bowel-syndrome-diet.html |
| 23 | BDA | link | check | external: https://www.bda.uk.com/resource/irritable-bowel-syndrome-diet.html |
| 24 | NIDDK | link | check | external: https://www.niddk.nih.gov/health-information/digestive-diseases/gas-digestive-tract/eating-diet-nutrition |
| 25 | NHS | link | check | external: https://www.nhs.uk/symptoms/bloating/ |
| 26 | 2021 RCT | link | check | external: https://pmc.ncbi.nlm.nih.gov/articles/PMC8035544/ |
| 27 | NHS | link | check | external: https://www.nhs.uk/symptoms/bloating/ |
| 28 | CDC | link | check | external: https://www.cdc.gov/physical-activity-basics/guidelines/adults.html |
| 29 | NHS | link | check | external: https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/ |
| 30 | 2025 RCT | link | check | external: https://pmc.ncbi.nlm.nih.gov/articles/PMC12658723/ |
| 31 | NHS | link | check | external: https://www.nhs.uk/symptoms/bloating/ |
| 32 | NIDDK | link | check | external: https://www.niddk.nih.gov/health-information/digestive-diseases/gas-digestive-tract/eating-diet-nutrition |
| 33 | Un-hide | button | pass | request: POST /v1/cards/eat-slowly/feedback |
| 34 | Today | link | pass | link: /today → HTTP 200 |
| 35 | History | link | pass | link: /history → HTTP 200 |
| 36 | Patterns | link | pass | link: /insights → HTTP 200 |
| 37 | You | link | pass | link: /me → HTTP 200 |

### pro · `/health`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /health | page | pass | HTTP 200 → /health |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Back | link | pass | link: /me → HTTP 200 |
| 8 | Lactose intolerance | checkbox | pass | changed: 5 DOM changes |
| 9 | Fructose malabsorption | checkbox | pass | changed: 4 DOM changes |
| 10 | IBS | checkbox | pass | changed: 4 DOM changes |
| 11 | Functional dyspepsia | checkbox | pass | changed: 4 DOM changes |
| 12 | Functional bloating (diagnosed) | checkbox | pass | changed: 4 DOM changes |
| 13 | Coeliac disease | checkbox | pass | changed: 4 DOM changes |
| 14 | Non-coeliac gluten or wheat sensitivity | checkbox | pass | changed: 4 DOM changes |
| 15 | Food allergy | checkbox | pass | changed: 4 DOM changes |
| 16 | SIBO | checkbox | pass | changed: 4 DOM changes |
| 17 | Long-term constipation | checkbox | pass | changed: 4 DOM changes |
| 18 | Crohn's or ulcerative colitis | checkbox | pass | changed: 4 DOM changes |
| 19 | Diverticular disease | checkbox | pass | changed: 4 DOM changes |
| 20 | Reflux | checkbox | pass | changed: 4 DOM changes |
| 21 | Gastroparesis | checkbox | pass | changed: 4 DOM changes |
| 22 | Pancreatic insufficiency | checkbox | pass | changed: 4 DOM changes |
| 23 | Thyroid condition | checkbox | pass | changed: 4 DOM changes |
| 24 | Diabetes | checkbox | pass | changed: 4 DOM changes |
| 25 | Endometriosis | checkbox | pass | changed: 4 DOM changes |
| 26 | Pelvic-floor problems | checkbox | pass | changed: 4 DOM changes |
| 27 | Previous tummy surgery (incl. weight-loss or reflux surgery) | checkbox | pass | changed: 4 DOM changes |
| 28 | Liver, heart or kidney condition | checkbox | pass | changed: 4 DOM changes |
| 29 | Cancer, current or past | checkbox | pass | changed: 4 DOM changes |
| 30 | Anxiety or low mood | checkbox | pass | changed: 4 DOM changes |
| 31 | Other | checkbox | pass | changed: 4 DOM changes |
| 32 | Bowel cancer | checkbox | pass | changed: 3 DOM changes |
| 33 | Stomach cancer | checkbox | pass | changed: 3 DOM changes |
| 34 | Ovarian cancer | checkbox | pass | changed: 3 DOM changes |
| 35 | Coeliac disease | checkbox | pass | changed: 3 DOM changes |
| 36 | Crohn's or ulcerative colitis | checkbox | pass | changed: 3 DOM changes |
| 37 | None | checkbox | pass | changed: 3 DOM changes |
| 38 | Not sure | checkbox | pass | changed: 3 DOM changes |
| 39 | Prefer not to say | checkbox | pass | changed: 3 DOM changes |
| 40 | Save | button | pass | request: PUT /v1/health/conditions, PUT /v1/health/family |
| 41 | Lactose breath test | radio | pass | changed: 6 DOM changes |
| 42 | Fructose breath test | radio | pass | changed: 6 DOM changes |
| 43 | SIBO breath test | radio | pass | changed: 6 DOM changes |
| 44 | Coeliac blood test | radio | pass | changed: 6 DOM changes |
| 45 | Full blood count | radio | pass | changed: 6 DOM changes |
| 46 | Anaemia found | radio | pass | changed: 6 DOM changes |
| 47 | CA125 blood test | radio | pass | changed: 6 DOM changes |
| 48 | Ultrasound | radio | pass | changed: 6 DOM changes |
| 49 | Endoscopy | radio | pass | changed: 6 DOM changes |
| 50 | Colonoscopy | radio | pass | changed: 6 DOM changes |
| 51 | Transit study | radio | pass | changed: 6 DOM changes |
| 52 | Anorectal manometry | radio | pass | changed: 6 DOM changes |
| 53 | Other | radio | pass | changed: 6 DOM changes |
| 54 | Today | link | pass | link: /today → HTTP 200 |
| 55 | History | link | pass | link: /history → HTTP 200 |
| 56 | Patterns | link | pass | link: /insights → HTTP 200 |
| 57 | You | link | pass | link: /me → HTTP 200 |

### pro · `/doctor`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /doctor | page | pass | HTTP 200 → /doctor |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Back | link | pass | link: /insights → HTTP 200 |
| 8 | From | date | listed | text field (filled by the targeted tests) |
| 9 | To | date | listed | text field (filled by the targeted tests) |
| 10 | Questions you want to ask your doctor0/600 · printed in its own box on | textarea | listed | text field (filled by the targeted tests) |
| 11 | ✓ Symptoms | checkbox | pass | changed: 3 DOM changes |
| 12 | ✓ Meals and food groups | checkbox | pass | changed: 3 DOM changes |
| 13 | ✓ Bowel record | checkbox | pass | changed: 3 DOM changes |
| 14 | ✓ Habits and exercise | checkbox | pass | changed: 3 DOM changes |
| 15 | ✓ Medicines | checkbox | pass | changed: 3 DOM changes |
| 16 | ✓ Health background | checkbox | pass | changed: 3 DOM changes |
| 17 | ✓ Family history | checkbox | pass | changed: 3 DOM changes |
| 18 | ✓ Tests | checkbox | pass | changed: 3 DOM changes |
| 19 | ✓ Experiments | checkbox | pass | changed: 3 DOM changes |
| 20 | ✓ What is missing | checkbox | pass | changed: 3 DOM changes |
| 21 | Preview report | button | pass | request: POST /v1/reports |
| 22 | Today | link | pass | link: /today → HTTP 200 |
| 23 | History | link | pass | link: /history → HTTP 200 |
| 24 | Patterns | link | pass | link: /insights → HTTP 200 |
| 25 | You | link | pass | link: /me → HTTP 200 |

### pro · `/me`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /me | page | pass | HTTP 200 → /me |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Pause Pro | button | check | destructive: not clicked by the crawler |
| 8 | Cancel | button | pass | dialog: Cancel Pro |
| 9 | Change | button | pass | dialog: Change time zone |
| 10 | ✓ US | radio | pass | request: PATCH /v1/me/profile |
| 11 | Metric | radio | pass | request: PATCH /v1/me/profile |
| 12 | Change | button | pass | dialog: Your goal |
| 13 | Cycle, age and other optional context | button | pass | dialog: Optional context |
| 14 | Change habits | button | pass | dialog: Habits to follow |
| 15 | Add or change | button | pass | dialog: Medicines and supplements |
| 16 | Health background Conditions and tests for your record | link | pass | link: /health → HTTP 200 |
| 17 | Learn library Cards and articles, each with its source | link | pass | link: /learn → HTTP 200 |
| 18 | Doctor PDF A report to bring to an appointment | link | pass | link: /doctor → HTTP 200 |
| 19 | Your journey Your whole story on one screen | link | pass | link: /journey → HTTP 200 |
| 20 | Switch on | button | pass | dialog: Keep an eye on it |
| 21 | Keep my meal photos (off: a photo is deleted right after its check) | checkbox | check | destructive: not clicked by the crawler |
| 22 | Hide charts | checkbox | pass | request: PATCH /v1/me/profile |
| 23 | JSON | button | pass | request: POST /v1/export |
| 24 | CSV | button | pass | request: POST /v1/export |
| 25 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 26 | How Bloat works How scores and comparisons are calculated | link | pass | link: /how-bloat-works → HTTP 200 |
| 27 | Sign out | button | check | destructive: not clicked by the crawler |
| 28 | Delete account | button | check | destructive: not clicked by the crawler |
| 29 | Today | link | pass | link: /today → HTTP 200 |
| 30 | History | link | pass | link: /history → HTTP 200 |
| 31 | Patterns | link | pass | link: /insights → HTTP 200 |
| 32 | You | link | pass | link: /me → HTTP 200 |

### pro · `/meal/recall`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /meal/recall | page | pass | HTTP 200 → /meal/recall |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Back | link | pass | link: /today → HTTP 200 |
| 8 | Back to Today | link | pass | link: /today → HTTP 200 |
| 9 | Today | link | pass | link: /today → HTTP 200 |
| 10 | History | link | pass | link: /history → HTTP 200 |
| 11 | Patterns | link | pass | link: /insights → HTTP 200 |
| 12 | You | link | pass | link: /me → HTTP 200 |

### pro · `/upgrade`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /upgrade | page | pass | HTTP 200 → /upgrade |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Back | link | pass | link: /me → HTTP 200 |
| 8 | Add your health background (optional) | link | pass | link: /health → HTTP 200 |
| 9 | Go to Today | link | pass | link: /today → HTTP 200 |
| 10 | Today | link | pass | link: /today → HTTP 200 |
| 11 | History | link | pass | link: /history → HTTP 200 |
| 12 | Patterns | link | pass | link: /insights → HTTP 200 |
| 13 | You | link | pass | link: /me → HTTP 200 |

### pro · `/setup`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /today | page | pass | HTTP 200 → /today |
| 1 | bloat. | link | listed | not visible on this screen state |
| 2 | Today | link | listed | not visible on this screen state |
| 3 | History | link | listed | not visible on this screen state |
| 4 | Patterns | link | listed | not visible on this screen state |
| 5 | You | link | listed | not visible on this screen state |
| 6 | When to get medical help | link | listed | not visible on this screen state |
| 7 | Bloating ongoing Since 8:11 · strength 4 | button | pass | dialog: Bloating now |
| 8 | Add meal | button | pass | dialog: Add meal |
| 9 | Add activity | button | pass | dialog: Add activity |
| 10 | Log bowel movement | button | pass | dialog: Log bowel movement |
| 11 | Possible triggers | link | pass | link: /insights → HTTP 200 |
| 12 | Your journey | link | pass | link: /journey → HTTP 200 |
| 13 | Weekly report | link | pass | link: /report → HTTP 200 |
| 14 | Experiments | link | pass | link: /experiments → HTTP 200 |
| 15 | Doctor report | link | pass | link: /doctor → HTTP 200 |
| 16 | TODAY'S CARD · TIP Eat more slowly | link | pass | link: /cards → HTTP 200 |
| 17 | Edit today's entries | link | pass | link: /day/2026-11-22 → HTTP 200 |
| 18 | Today | link | pass | link: /today → HTTP 200 |
| 19 | History | link | pass | link: /history → HTTP 200 |
| 20 | Patterns | link | pass | link: /insights → HTTP 200 |
| 21 | You | link | pass | link: /me → HTTP 200 |

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
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | About | link | pass | link: /about → HTTP 200 |
| 9 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 10 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 11 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 12 | Terms | link | pass | link: /terms → HTTP 200 |
| 13 | Contact | link | pass | link: /contact → HTTP 200 |

### pro · `/terms`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /terms | page | pass | HTTP 200 → /terms |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | About | link | pass | link: /about → HTTP 200 |
| 9 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 10 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 11 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 12 | Terms | link | pass | link: /terms → HTTP 200 |
| 13 | Contact | link | pass | link: /contact → HTTP 200 |

### pro · `/privacy`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /privacy | page | pass | HTTP 200 → /privacy |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | About | link | pass | link: /about → HTTP 200 |
| 9 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 10 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 11 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 12 | Terms | link | pass | link: /terms → HTTP 200 |
| 13 | Contact | link | pass | link: /contact → HTTP 200 |

### pro · `/contact`

| # | Control | Kind | Result | What happened |
|---|---|---|---|---|
| 0 | HTTP 200 → /contact | page | pass | HTTP 200 → /contact |
| 1 | Bloat, home | link | pass | link: / → HTTP 200 |
| 2 | How it works | link | listed | not visible on this screen state |
| 3 | About | link | listed | not visible on this screen state |
| 4 | Contact | link | listed | not visible on this screen state |
| 5 | Sign in | link | listed | not visible on this screen state |
| 6 | Menu | button | pass | changed: 4 DOM changes |
| 7 | Back | link | pass | link: / → HTTP 200 |
| 8 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 9 | About | link | pass | link: /about → HTTP 200 |
| 10 | How Bloat works | link | pass | link: /how-bloat-works → HTTP 200 |
| 11 | When to get medical help | link | pass | link: /help → HTTP 200 |
| 12 | Privacy | link | pass | link: /privacy → HTTP 200 |
| 13 | Terms | link | pass | link: /terms → HTTP 200 |
| 14 | Contact | link | pass | link: /contact → HTTP 200 |

