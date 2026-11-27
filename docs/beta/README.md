# First invited acceptance round (no AI)

**Status: accepted by you on 27 Nov 2026 for the fictional-data round, and frozen: commit `35c947b`, Vercel deployment `dpl_LxVJ6VzoY4iswtpfhy78kN3B76jj` (run 18), checked signed in on that deployment. On 27 Nov, with your approval, 5 participant accounts were created and added to the Pro test list (run 19, deployment `dpl_2QsTiDKAVFB4NaQr99RVjTtAGdvt`, the same app code). Claude has contacted nobody: you distribute the guide and credentials.** Public sign-ups stay off. Real payments stay off. No real AI provider is connected.

Review address: `https://bloat-preview.vercel.app`. The three older addresses (`bloat-olive`, `bloat-typeshi2`, `bloat-git-main-typeshi2`) are left as they are.

Files in this folder:

| File | For | What |
|---|---|---|
| `tester-guide.md` | Testers | The review address, made-up entries only, the food-comparison limit, what they can use, which day the morning review scores, account deletion |
| `share/` | Testers | The guide with the first-session checklist and the feedback form, ready to send: `bloat-tester-guide.pdf`, `bloat-tester-guide.html` (opens in any browser from the file) and `bloat-tester-guide.txt` (to paste into a message). Made from the Markdown files; a private copy is also at https://claude.ai/artifact/BPVEopLxQwbCRMfhNZBdv8 |
| `first-session-checklist.md` | Testers | About 15 minutes: sign in, change password, check Pro, a first entry of each kind, the next day's review |
| `feedback-template.md` | Testers | Screen, steps, expected result, actual result, device and browser |
| `real-phone-checklist.md` | You or a tester with a real phone | Sign-in, logging, editing, reports and sharing, export, password change, sign-out; screen readers separately |
| `owner-checklist.md` | You | Create accounts, switch Pro on, send passwords safely, reset a password, remove a tester, weekly check |
| `tester-roster-template.md`, `.csv` | You | Name, email, device and browser, feedback channel, credential-delivery channel. Keep the filled copy private |

## 1. Your decisions for this round (27 Nov 2026)

3 to 5 trusted testers. Pro test access without payment. Experiments off. Made-up data only. AI, photos, Learn, daily cards, payments and public sign-ups off. No support email yet: testers report to the person who invited them, through an existing channel (**awaiting your selection**). Nobody is invited until you give the testers' details and approve the invitations.

## 2. How it is set up

| Setting (Vercel, Preview) | Value | What it does |
|---|---|---|
| `BLOAT_AI_PROVIDER` | `off` | No AI anywhere: no ingredient check, photos or "add ingredients to recent meals"; their buttons are hidden and their routes answer "not available" |
| `BLOAT_OFF_FEATURES` | `learn_library,daily_cards,experiments_habit,experiments_swap` | Learn, daily cards and both kinds of experiment are not offered: no button, link or card, a direct visit says "Not available", their routes refuse. Experiment records already made are kept (and are in the export) |
| `BLOAT_PRO_TEST_EMAILS` | the test accounts; testers' addresses are added when you invite them | Pro without a purchase. You and the Pro page say "Switched on for testing. There is no subscription, so nothing renews and nothing is charged." and offer no Pause or Cancel |
| `BLOAT_SIGN_IN_METHOD` | `password` | Email and password, for accounts you create. No sign-up, no email sent. Testers change their password in You |
| `BLOAT_TEST_LOGIN` | `0` | No test-only login, mock purchase or test clock |
| `BLOAT_BILLING_PROVIDER` | `mock`; checkout off | Nothing can be bought or charged |
| Supabase "Allow new users to sign up" | Off | Only accounts you create can sign in |

Each switch is empty by default in the code; removing it gives back the app as it was. A change needs the Preview workflow to be run by hand (`DEPLOYMENT.md`).

## 3. What testers can and cannot use

**Available (Pro, switched on for testing):** log bloating (start, strength, end, warning signs with the NHS advice), "No bloating so far today", typed meals, habits, bowel movements, exercise, the morning review and Bloat Score, History with the chart and 7-day average, the day screen with editing and deletion (including a habit answer), Possible triggers with day counts, Your journey, the weekly report, the doctor report with share links that can be revoked, Keep an eye on it mode, medicines, health background, family history, optional context, "When to get medical help", export (JSON and CSV), change password, sign out, delete account. All patterns are worked out by fixed rules from the person's own records; none uses AI.

**Not available:** AI ingredient checks, meal photos, adding ingredients to a meal, saved dishes (a dish is saved from the ingredient step), the "add ingredients to recent meals" offer, experiments, the Learn library, daily cards, payments and checkout, email-code sign-in and any email from Bloat Buddy, Google sign-in, founder tools.

**Limitation testers will notice:** typed meals carry no food groups without the ingredient step, so in normal logging every food group in Possible triggers says "No usable days yet". Habits the person follows are compared as usual. Foods can be compared in **Keep an eye on it** mode (a daily yes or no for up to 5 food groups in the morning review). Checked on a local server with the round's settings on 27 Nov. Adding a manual food step would be a new feature: decision D30.

## 4. Health content that stays unavailable

| Content | State | Why |
|---|---|---|
| Learn library (all articles) | Off (`learn_library`) | Outlines only, not finished articles (D16) |
| Daily cards (all) | Off (`daily_cards`) | 7 cards have source-backed corrections waiting for your approval (D4); no person has checked every card's source (D7) |
| "Gentle stretch" and "Wind down for sleep" cards | Unpublished drafts | No linkable source (D6) |
| Kiwifruit card and kiwifruit experiment | Unpublished; experiment refused for everyone | Dose and duration differ from the BDA 2025 guideline (D5) |
| Experiments (habit and swap) | Off (`experiments_habit`, `experiments_swap`), your decision of 27 Nov | Plan text with sources; no clinician review recorded |

Available and fixed: the help page and the warning-sign and doctor-line sentences, adapted from the NHS bloating page and labelled "Adapted from NHS, Bloating" (approved by you on 18 Nov). They are safety information and stay on.

## 5. Privacy, deletion and sharing

- Every record is private to its owner (row-level security; `tests/api/privacy.test.ts`). Testers cannot see each other's records.
- Deleting or correcting a record flags every stored report that covers it and revokes its share links (R1, R2). A signed-out visitor then sees "This link no longer works"; reports that do not cover the record keep working.
- The export holds every record the person can see (X1).
- Delete account removes everything and keeps only a hash of the account ID, so a restored backup cannot bring it back.
- No health data in logs, analytics events or alerts.

## 6. Still needed before inviting the 3 to 5 testers

1. The filled-in roster (`tester-roster-template.md`): each tester's name, email address, device and browser, feedback channel (an existing one) and a separate channel for the temporary password.
2. Your explicit approval to create their accounts (and, separately, to send the invitations).
3. Then, from `owner-checklist.md`: create the accounts, add the addresses to the Pro test list and run the workflow once, send the guide (`share/`) and the password separately.

Recorded but not needed for a made-up-data round: D27 (backups; matters before real records), D12 (a short tester notice; legal wording, yours to approve), D28 (alerts: weekly check for now), D29 (leaked-password protection, if your Supabase plan offers it), D30 (food groups without AI).

## 7. Outside-this-round blockers (needed before a public launch)

Email-code sign-in with a working email sender; a real AI provider with its accuracy test and spending approval; legal text from a proper source (Gate 1); business entity, payment provider and real payments (Gate 2); the live project `bloat-live`; founder tools on a hosted site; country decisions (D2); reviewed Learn articles, cards and experiments (D4, D5, D6, D7, D16); backups with a tested restore; alert delivery and error monitoring; real-phone and screen-reader testing; the open decisions in `DECISIONS.md`.

## 8. What was and was not tested

Kept apart by where they ran; counts and builds are in `TEST_RESULTS.md`.

| Kind | Where | What |
|---|---|---|
| Local, synthetic accounts | Local database in Docker; one local server as normal and one started with the round's settings | Rule, API and browser tests (phone-sized browser, keyboard, 200% zoom); the round's checks, first on the published code (they fail at each defect), then on the fixed code |
| CI (GitHub workflow) | One normal server on GitHub's machine | Rule, API and browser tests and the 6 signed-out live checks passed. **The round's own checks were skipped there** (10 API, 3 browser) and the signed-in hosted files are not part of CI: they are not CI passes |
| Hosted, synthetic accounts | The deployed candidate `dpl_LxVJ6VzoY4iswtpfhy78kN3B76jj` on `bloat-preview.vercel.app`, 27 Nov; 8 accounts created for the run and deleted through the app, checked gone | The full signed-in hosted suite (16 of 16 passed) and the round's checks `tests/hosted/beta-candidate.spec.ts` (4 of 4 passed) |
| Browser emulation | Desktop Chromium pretending to be a Pixel 7 | Phone layout, keyboard-only use, 200% zoom. Not a real phone |
| **Not performed** | | Real phones (iOS Safari, Android Chrome), any screen reader (VoiceOver, TalkBack), a real AI provider, a backup restore. Checklist: `real-phone-checklist.md` |

Passing tests do not make the candidate bug-free or launch-ready; they show that the checked behaviour works on the checked builds.
