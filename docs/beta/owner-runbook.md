# Invited beta: owner runbook

Plain steps for running a small invited test. Read `docs/beta/README.md` first and make the decisions in its section 5. Nothing here invites anyone by itself.

## 1. Invite one tester

1. Supabase dashboard, project **bloat-test**: Authentication, Users, **Add user**, **Create new user**. Enter the tester's email address and a temporary password (let your password manager make one, at least 12 characters). Tick **Auto Confirm User**. Create.
2. Only if you chose the Pro test list (README, decision 1): Vercel, project **bloat**, Settings, Environment Variables, `BLOAT_PRO_TEST_EMAILS` (Preview): add the address, separated by a comma. Save. Then on GitHub, Actions, **Preview**, **Run workflow** on `claude/bloat-software-build-uxzoru`. The change applies once that run has published (about 15 minutes).
3. Send the tester `docs/beta/tester-guide.md` (with the blanks filled in) and the address `https://bloat-preview.vercel.app`. Send the temporary password separately, for example by text message, not in the same email.
4. Ask them to change the password in You straight away.

Keep a private list of who you invited and when. Don't keep their passwords.

## 2. A tester forgot their password

Bloat sends no email in this beta, so you set a new temporary password:

1. Follow `DEPLOYMENT.md`, "Change the test account's password", using the tester's User UID instead of the test account's. It changes only the password; the account and every record stay.
2. Send the new temporary password privately. They change it again in You.

## 3. A tester leaves

- **Best:** ask them to use **You, Delete account**. It removes every record and the sign-in, and leaves only a hash of the account ID, so a restored backup cannot bring the account back.
- **If they can't:** with their agreement, reset their password (section 2), sign in as them once, and use Delete account. Don't delete the user in the Supabase dashboard: it removes the records too, but skips that hash.
- Remove their address from `BLOAT_PRO_TEST_EMAILS` if you added it, then run the workflow.

## 4. Weekly check (about 10 minutes)

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

## 5. Backups (if you stay on Supabase's free plan)

Supabase does not back up free-plan projects automatically. Once a week, on your own computer, with the database password from Supabase (Project Settings, Database):

```bash
npx supabase db dump --db-url "$BLOAT_TEST_DB_URL" -f bloat-test-$(date +%F).sql
```

Type the connection string into the `BLOAT_TEST_DB_URL` variable yourself (never into a chat or a file you share). Keep the dump files somewhere private and encrypted: they contain testers' health records. If you upgrade to Supabase Pro, daily backups are kept for 7 days and this step is no longer needed. A restore has not been tested on bloat-test yet; after any restore, run `select public.srv_reapply_tombstones('<server secret>')` so deleted accounts stay deleted (`DEPLOYMENT.md`).

## 6. Real-phone and screen-reader check (needs a person and real devices)

Nothing here has been done yet. The automated checks ran in a desktop browser pretending to be a phone, which is not the same thing. Use a synthetic account (made-up entries only) and tick each line only if you saw the result.

**iPhone, Safari** and **Android phone, Chrome**, each:
1. Sign in; add to home screen; open from the home screen. You land on Today.
2. Log bloating, add a meal, add a habit. Each shows its "saved" line under the button.
3. Turn on airplane mode and try to save a meal: a clear message and your text kept. Airplane mode off, Save again: saved once.
4. History: edit a meal's time, delete it; delete a habit. Refresh: the changes stay.
5. Change password in You; sign out; sign in with the new one.
6. Rotate the phone and increase the text size in the phone's settings: nothing is cut off or overlapping.
7. Phone Back button: an open sheet closes first; otherwise you go back one screen.

**VoiceOver (iPhone)** and **TalkBack (Android)**:
1. On Today, every button is read with a clear name; the score is read as "N out of 10" or "Nothing logged yet".
2. After saving a meal, the "Meal saved." line is read out.
3. In Log bloating, the strength scale and warning signs can be chosen and are read as selected.
4. Sheets: focus moves into the sheet when it opens and back when it closes.
5. Delete account: the confirmation can be reached and read.

Write down the phone, the system version and anything that went wrong.
