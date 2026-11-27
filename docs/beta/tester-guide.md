# Bloat Buddy test version: guide for invited testers

*For the owner, before sending: this guide is for the first invited acceptance round (3 to 5 trusted testers, Pro switched on for testing, made-up data only). Shareable copies to send as they are: `docs/beta/share/` (PDF, a web page that opens from the file, and plain text to paste into a message). Send it with the first-session checklist (`first-session-checklist.md`). Send each tester's temporary password separately (`owner-checklist.md`). **Reporting channel: awaiting the owner's selection.** Tell each tester which existing way to use; this guide only says "the person who invited you". There is nothing else to fill in.*

---

Thank you for helping test Bloat Buddy.

**What Bloat Buddy is.** A private diary for bloating: when it happens, how strong it is, what you ate, and your habits. Over time it shows patterns in your own records. It is a wellness tracker, not a medical service: it never diagnoses anything and never tells you what caused your bloating.

**This is a test version.** Things may change or break.

## Use made-up entries only

Please type **made-up entries only** during this round: invented times, strengths, meals and habits. Don't enter your real health details, medicines or conditions, even if they are true for you. The test is about whether the app works, not about your health.

## Important: foods in Possible triggers

In this round, meals are saved as the text you type, with no ingredients or food groups. So during **normal logging, every food group in Possible triggers says "No usable days yet"**, however many meals you add. This is expected, not a fault. Habits you follow can still be compared.

To test the food comparisons, switch on **Keep an eye on it** in You and choose up to 5 food groups. The morning review then asks yes or no for each of them, and those answers can be compared. A food group or habit needs about 7 days with it and 7 days without before a comparison appears.

## Signing in

1. Open **https://bloat-preview.vercel.app** on your phone (or a computer).
2. Tap **Sign in** and use the email address and temporary password you were given.
3. Go to **You** and tap **Change password**. Choose a new password of at least 10 characters that you don't use anywhere else.

Forgot your password? Ask the person who invited you for a new temporary one, then change it again in You. Bloat Buddy sends no emails in this test version.

To add Bloat Buddy to your home screen: in Chrome, open the menu and tap "Add to Home screen"; in Safari, tap Share, then "Add to Home Screen".

**Your first session:** follow the short first-session checklist (`first-session-checklist.md`).

## What you can use

Pro is switched on for your account for testing. There is no subscription: nothing to pay, renew, pause or cancel.

- **Today:** "I feel bloated" (or the **+** button in the middle of the bottom bar, from any screen) with a strength from 1 to 10, when it started and any warning signs; update the strength; end it ("It's gone"). "No bloating so far today". Add a meal by typing what you had (when, how much, how fast, where it was made). Add habits (the **Activity** tile). Log a bowel movement or exercise. A week strip shows which days this week have anything logged.
- **Morning review:** see "Which day the morning review scores", below.
- **History:** every day, a chart (week, month, all) and a 7-day average. On a day: change times and a meal's name, and delete any entry, including a habit answer.
- **Patterns:** Possible triggers (with day counts), Your journey, the weekly report, and the doctor report, which you can download or share by link and stop sharing at any time.
- **You:** units, time zone, habits to follow, medicines, health background, family history, optional context, Keep an eye on it mode, hide charts, Appearance (same as the phone, light or dark), download your data (JSON or CSV), change password, sign out, delete account.
- **When to get medical help:** on the Log bloating screen and in You.

## Which day the morning review scores

- A day runs from midnight to midnight in your time zone.
- During the day, Today shows the **highest strength logged so far**. That is not a score yet ("Tomorrow morning, a short review sets today's Bloat Score.").
- The next day, Today offers **Review yesterday** (a morning review). Your answers set the **Bloat Score for yesterday**, the day that has just finished, not for today.
- A review done by the end of that next day is on time. A later review still sets the day's score and shows as late, but Possible triggers uses only days reviewed on time.
- You can review or change an earlier finished day from History (up to 92 days back). Today itself can only be reviewed once it has finished.

## What is not in this round

- No AI: no ingredient check or photos for meals, and no way to add ingredients or save a dish.
- No experiments, no Learn library and no daily cards.
- No payments, no emails from Bloat Buddy, no Google sign-in, and no new sign-ups.

## Good to know

- The doctor report has an "Experiments" section. In this round it says "None".
- A doctor report link opens for anyone who has it. It stops working when it expires, when you stop sharing it, or when you change or delete a record it shows.

## Deleting your account

**Delete account** is in You. You type DELETE to confirm, then tap **Delete my account**. You may want to download your data first (You, Download my data).

**When it works:** your account, your sign-in and every record in it (bloating, meals, habits, reviews, reports and their share links, medicines and the rest) are removed for good, and you are signed out. It cannot be undone.

**What is kept:**
- A **deletion record** that holds only a one-way code made from your account's ID number, and the date. It contains no name, email address or records, and can't be turned back into your account. It exists so that, if the database is ever restored from a backup, your account is deleted again instead of coming back.
- Files you downloaded and PDFs you saved stay wherever you saved them. Links you shared stop working.
- The person who invited you keeps your name and email address on their private list of testers until they remove you.
- The hosting services (Supabase and Vercel) keep their own technical logs, such as sign-ins and page requests, for a limited time. Bloat Buddy writes no health records into logs.

**If it can't finish**, the screen tells you which case it is:
- "That didn't work. Nothing was deleted. Try again." Nothing was removed. Try again.
- "We couldn't finish deleting your account. Your account and diary are still available, but some saved meal photos may already have been deleted. Try again to finish." Your account and records are still there. (Meal photos are off in this round, so there are none to lose.) Try again later.
- "Connection lost. We can't tell yet whether your account was deleted." When you are back online, tap **Check and finish**. If the account was deleted, it signs you out. If not, it finishes the deletion, sending the same request again, so nothing is done twice.

If it keeps failing, tell the person who invited you.

## Your health and your privacy

- If something worries you, open **When to get medical help**. In an emergency, call your local emergency number (911 in the US and Canada, 112 in India).
- Other testers cannot see your records. The person running the test can reach the database to look after it, which is one more reason to use made-up entries only.

## Telling us what you found

Use the feedback form (`feedback-template.md`) and send it to the person who invited you, in the way you agreed with them. One problem per message is easiest. A screenshot helps; check it shows only made-up entries.
