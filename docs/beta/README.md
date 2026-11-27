# Invited beta candidate (no AI)

Prepared 26 Nov 2026; published on 27 Nov by the Preview workflow (run 17) as commit `da4bb77`, Vercel deployment `dpl_DMcN8fjTd9f99QHXjxA5Rc7uerhR`, and checked signed in on that deployment. **Status: frozen for your acceptance. Nobody has been invited.** Public sign-ups stay off. Real payments stay off. No real AI provider is connected.

Address: `https://bloat-preview.vercel.app` (the canonical review address). The three older addresses (`bloat-olive`, `bloat-typeshi2`, `bloat-git-main-typeshi2`) were left as they were.

Related: `docs/beta/tester-guide.md` (what to send testers), `docs/beta/owner-runbook.md` (invite, reset, remove, check), `PROGRESS.md` and `DECISIONS.md`.

## 1. How the candidate is set up

| Setting | Value on the preview | What it does |
|---|---|---|
| `BLOAT_AI_PROVIDER` | `off` (was `mock`) | No AI anywhere. The ingredient check, meal photos and the "add ingredients to recent meals" offer are not offered: their buttons are hidden and their server routes answer "not available". Meals are typed and saved as plain meals |
| `BLOAT_OFF_FEATURES` | `learn_library,daily_cards` | The Learn library and the daily cards (health content not yet reviewed, section 3) are not offered to anyone |
| `BLOAT_SIGN_IN_METHOD` | `password` (unchanged) | Email and password for accounts you create. No sign-up, no email is sent |
| `BLOAT_TEST_LOGIN` | `0` (unchanged) | No test-only login, no mock purchase, no test clock |
| `BLOAT_BILLING_PROVIDER` | `mock` (unchanged); checkout off | Nothing can be bought or charged |
| `BLOAT_PRO_TEST_EMAILS` | unchanged | Accounts on this list get the Pro screens without a purchase. Whether testers go on it is your decision (section 5) |
| Supabase "Allow new users to sign up" | Off (unchanged) | Only accounts you create can sign in |

Both new settings are empty by default in the code, so removing them returns the app to how it was. Changing them needs the Preview workflow to be started by hand (`DEPLOYMENT.md`).

Known small issue, not fixed in this candidate: an account with Pro given for testing that types the Pro page's address (`/upgrade`) reads "Manage, pause or cancel in Me.", although You (rightly) offers neither. Nothing in the app links a Pro account to that page. A one-line fix for the next publish (`PROGRESS.md`).

## 2. What testers can and cannot use

**Every invited tester (Free plan, the default):** log bloating (start, strength, end, warning signs with the NHS advice), "No bloating so far today", typed meals, habits, the morning review and Bloat Score, History, the day screen with editing and deletion (including deleting a habit answer), medicines, the help page "When to get medical help", the progress counter, export (JSON and CSV), change password, sign out, and delete account.

**If you put a tester on the Pro test list (your choice, section 5), also:** Patterns (possible triggers with day counts), chart and 7-day average, weekly report, Your journey, the doctor report with share links you can revoke, experiments, bowel and exercise logs, Keep an eye on it mode, saved dishes, health background. All of these are worked out by fixed rules from the person's own records; none uses AI.

**Not available to anyone in this beta:** AI ingredient checks and meal photos, the "add ingredients to recent meals" offer, the Learn library, daily cards, payments and checkout, email-code sign-in and any email from Bloat, Google sign-in, founder tools.

**Seen by Free testers:** the Pro page still lists Pro features with prices, and an "Upgrade" button that charges nothing and answers "Payments are not switched on yet. Nothing was charged, and your free diary keeps working." (the plan's interest count). The AI line and the Learn line are no longer listed there. If testers are on the Pro list, they never see this page's prices.

## 3. Health content that must stay unavailable

| Content | State | Why it is unavailable |
|---|---|---|
| Learn library (all articles) | Off in the beta (`learn_library`) | Outlines only, not finished articles (D16) |
| Daily cards (all) | Off in the beta (`daily_cards`) | 7 cards have source-backed corrections waiting for your approval (D4); no person has checked every card's source (D7) |
| "Gentle stretch" and "Wind down for sleep" cards | Unpublished drafts | No linkable source (D6) |
| Kiwifruit card and kiwifruit experiment | Card unpublished; experiment refused on the server for everyone | Dose and duration differ from the BDA 2025 guideline (D5) |
| Experiments (habit and swap) | **On** for Pro testers | Their text comes from your Master Plan, with a source on each. No clinician review is recorded. Your decision: keep on, or add `experiments_habit,experiments_swap` to `BLOAT_OFF_FEATURES` |

Available and fixed: the help page and the warning-sign and doctor-line sentences, adapted from the NHS bloating page and labelled "Adapted from NHS, Bloating" (approved by you on 18 Nov). They are safety information and stay on.

## 4. Privacy, deletion and sharing (checked)

- Every record is private to its owner (row-level security; `tests/api/privacy.test.ts`).
- Deleting or correcting a record flags every stored report that covers it and revokes its share links (R1, R2). A signed-out visitor then sees "This link no longer works". Reports that do not cover the record keep working. Checked locally and on the deployed candidate (section 7).
- The export holds every record the person can see, including their share links, product events and export jobs (X1). Hashes of link tokens stay out of the file.
- Delete account removes everything and leaves only a hash of the account ID, so a restored backup cannot bring it back.
- No health data in logs, analytics events or alerts (unchanged rule).

## 5. Your decisions before inviting anyone

The smallest concrete choices. Nothing below has been done for you.

1. **Plan for testers.** (a) Free plan: nothing to do. (b) Pro test list: add each tester's address to `BLOAT_PRO_TEST_EMAILS` and run the workflow; they get Patterns, reports, experiments and logs, without AI. *Recommended: (b), so testers can use the pattern features the beta is meant to test.*
2. **Experiments for Pro testers:** keep on (plan text with sources) or switch off (one setting). Only matters if you choose 1(b).
3. **Where real testers' health data lives.** The preview uses `bloat-test`, a project on Supabase's **free plan**. Supabase's own documentation says free-plan projects are **not backed up automatically** and are **paused after about a week of low activity** (restoring is a manual step in the dashboard). Choose one: (a) upgrade the Supabase organization to Pro (US$25 a month: daily backups kept 7 days, no pausing); or (b) stay on the free plan and accept the risk: you take a backup yourself each week (`owner-runbook.md`, section 5) and watch for Supabase's pause warning email. *Recommended: (a) before anyone outside enters real records.*
4. **A contact for testers** (an email address you read) and the name testers should see as running the test (D11). The tester guide has a blank for it.
5. **What testers agree to.** The Terms and Privacy pages are honest stubs that say this is a preview (D12). Before real people enter health data, decide on at least a short tester notice: what is collected, where it is stored (Supabase, US region; Vercel), who can see it (you), how to delete it, and that Bloat gives no medical advice. This is legal wording: yours to approve or to have reviewed.
6. **Error alerts.** Today server errors appear only in Vercel's logs, and app alerts are stored in a database table; nothing is emailed. Choose: (a) check both once a week (free; `owner-runbook.md`, section 4), or (b) connect an alert service later (needs an account and a key). *Recommended: (a) for a few testers.*
7. **Leaked-password protection** in Supabase (Authentication, Password security) is off. Supabase lists it as a security warning; it may need a paid plan. Switch it on if your plan offers it.

## 6. Outside-beta blockers (not needed for a few invited testers, needed before a public launch)

Email-code sign-in with a working email sender; a real AI provider with its accuracy test and spending approval; legal text from a proper source (Gate 1); business entity, payment provider and real payments (Gate 2); the live project `bloat-live`; founder tools on a hosted site (staff address and authenticator); country availability decisions (D2); reviewed Learn articles and cards (D4, D5, D6, D7, D16); backups with point-in-time recovery and a tested restore; alert delivery and error monitoring; real-phone and screen-reader testing; the open decisions D1 to D24 in `DECISIONS.md`.

## 7. Checks: what was and was not tested

Kept apart by where they ran. Counts and builds are in `TEST_RESULTS.md`.

| Kind | Where | What |
|---|---|---|
| Local, synthetic accounts | Local Supabase in Docker, local build | Rule, API and browser tests (phone screen, keyboard, 200% zoom); a second local server started with the beta settings |
| Hosted, synthetic accounts | The deployed candidate `dpl_DMcN8fjTd9f99QHXjxA5Rc7uerhR` on `bloat-preview.vercel.app`, 27 Nov; 8 accounts created for the run and deleted through the app, checked gone | The full signed-in hosted suite (16 of 16 passed) and the beta checks `tests/hosted/beta-candidate.spec.ts` (3 of 3 passed, one after a fix in the test itself) |
| Mock provider | Local only | The AI checks in the local tests use the labelled mock; the candidate has AI off |
| Browser emulation | Desktop Chromium driving a Pixel 7 profile | Phone layout, keyboard-only use, 200% zoom |
| **Not performed** | | Real phones (iOS Safari, Android Chrome), any screen reader (VoiceOver, TalkBack, NVDA), a real AI provider, a backup restore on `bloat-test`. The checklist for real phones and screen readers is in `owner-runbook.md`, section 6 |

Passing tests do not make the candidate bug-free or launch-ready; they show that the checked behaviour works on the checked builds.
