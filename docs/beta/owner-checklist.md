# Owner checklist: first invited acceptance round

For you, the owner. Plain steps to create testers' accounts, deliver their passwords safely, help a tester who is locked out, and remove a tester. Nothing here invites anyone by itself, and Claude does not create testers' accounts or send invitations until you give the details and say so.

The round, as you decided on 27 Nov 2026: 3 to 5 trusted testers, Pro switched on for testing without payment, experiments off, made-up data only. AI, photos, Learn, daily cards, payments and public sign-ups stay off.

## 0. Before the first invitation

- [ ] You have approved sending invitations.
- [ ] You have filled in the roster (`tester-roster-template.md`): each tester's name, email address, device and browser, feedback channel and credential-delivery channel. Keep it private, not in the repository, and never with passwords.
- [ ] **Reporting channel: awaiting your selection.** For each tester, choose an existing way you already use with them (for example a messaging app you both use). Testers send the feedback form (`feedback-template.md`) there.
- [ ] A second, separate way to send each temporary password (for example a text message or a phone call, if the first way is email).
- [ ] You have read the tester guide (`tester-guide.md`) and are happy to send it.

## 1. Create one account per tester

*First round: done by Claude on 27 Nov with your approval (5 accounts, Pro list updated, run 19). These steps are for any later tester.*


1. Supabase dashboard, project **bloat-test**: Authentication, Users, **Add user**, **Create new user**.
2. Email: the tester's address. Password: a new temporary one made by your password manager (at least 12 characters). Tick **Auto Confirm User**. Create.
3. Copy the tester's **User UID** into your private list (you need it to reset a password).
4. Don't reuse a password between testers.

## 2. Switch Pro on for testing

1. Vercel, project **bloat**, Settings, Environment Variables, `BLOAT_PRO_TEST_EMAILS` (Preview): add each tester's address, separated by commas. Keep the addresses already there. Save.
2. GitHub, Actions, **Preview**, **Run workflow** on `claude/bloat-software-build-uxzoru`. It runs every check and publishes the same app again with the new list (about 15 minutes). Until then, the tester has the Free plan.
3. After their first sign-in, ask the tester to look at You, Plan: it should say **Bloat Buddy Pro** and "Switched on for testing. There is no subscription, so nothing renews and nothing is charged."

You can also ask Claude to do step 2 for you, giving the addresses in the chat.

## 3. Send the invitation safely

1. **First message** (the reporting channel): the tester guide (a copy from `docs/beta/share/`: the PDF, or the plain text pasted in), which includes the first-session checklist and the feedback form, and the address `https://bloat-preview.vercel.app`. No password.
2. **Second message, a different way** (text message or phone call): the temporary password only.
3. Ask the tester to change it straight away (You, Change password).
4. Once they confirm, delete the temporary password from wherever you noted it. Never keep testers' passwords.

Never put a password in the same message as the email address, in a shared document, in the repository or in a chat with Claude.

## 4. A tester forgot their password, or is locked out

Bloat Buddy sends no email in this round, so you set a new temporary password:

1. Follow `DEPLOYMENT.md`, "Change the test account's password", using the **tester's** User UID. It changes only the password; the account and its records stay.
2. Send the new temporary password the second way (section 3), never in the reporting channel.
3. The tester signs in and changes it again in You.

If a tester thinks someone else knows their password, do the same. Whether this also signs out other phones where they are signed in has not been checked; to be sure, remove the tester (section 5) and make a new account.

## 5. Remove a tester

1. **Best:** ask the tester to use **You, Delete account**. It removes every record and the sign-in, and keeps only a hash of the account ID, so a restored backup cannot bring the account back.
2. **If they can't:** with their agreement, reset their password (section 4), sign in as them once, and use Delete account. Don't delete the user in the Supabase dashboard: that removes the records too, but skips the hash.
3. Remove their address from `BLOAT_PRO_TEST_EMAILS` and run the workflow (section 2).
4. Remove them from your private list. Check in Supabase, Authentication, Users that the account is gone.

At the end of the round, decide whether to remove every tester this way.

## 6. Weekly check (about 10 minutes)

1. **Is the database awake?** Supabase dashboard, project bloat-test: the project shows as active. On the free plan Supabase emails you about a week before it pauses a quiet project; opening the dashboard counts as activity. If it was paused: Resume project (Supabase keeps a paused project's data for 90 days).
2. **Server errors:** Vercel, project **bloat**, Logs, filter Errors, last 7 days. Logs never contain health data.
3. **App alerts:** in the Supabase SQL editor (read-only):
   ```sql
   select kind, count(*), max(created_at) from private.founder_alerts
   where created_at > now() - interval '7 days' group by kind order by 2 desc;
   ```
   Alerts hold counts only, never health data.
4. **Sign-ups still off:** Supabase, Authentication, Sign In / Providers: "Allow new users to sign up" is off.

If something is wrong with the app itself: stop inviting, write down what happened, and roll the preview back to the previous good deployment (`DEPLOYMENT.md`, "Roll back").

## 7. Backups (Supabase's free plan)

Supabase does not back up free-plan projects automatically. With made-up data only, losing the records would cost the testers' time, not anyone's health details. If you want a copy, once a week on your own computer, with the database password from Supabase (Project Settings, Database):

```bash
npx supabase db dump --db-url "$BLOAT_TEST_DB_URL" -f bloat-test-$(date +%F).sql
```

Type the connection string into the `BLOAT_TEST_DB_URL` variable yourself (never into a chat or a file you share). Keep the dump files private. A restore has not been tested on bloat-test yet; after any restore, run `select public.srv_reapply_tombstones('<server secret>')` so deleted accounts stay deleted (`DEPLOYMENT.md`). Before any real health data is entered, decide D27 (`DECISIONS.md`).

## 8. Real phones and screen readers

`real-phone-checklist.md`. Not done yet.
