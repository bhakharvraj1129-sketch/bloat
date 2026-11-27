# Real-phone checklist

For a person holding a real phone: you, or a tester who agrees to. **None of this has been done yet.** The automated checks ran in a desktop browser pretending to be a phone (browser emulation). That is useful, but it is not a real phone and it is not a screen reader.

Use an account with **made-up entries only**. Mark each line **Pass**, **Fail** (write what happened) or **Not tried**. Only mark Pass if you saw the result written after the arrow.

| | |
|---|---|
| Phone and system version | (for example: iPhone 13, iOS 18) |
| Browser | (Safari, Chrome, or opened from the home screen) |
| Who and when | |

Do the whole list once on an **iPhone with Safari** and once on an **Android phone with Chrome**.

## 1. Sign in

| # | Do this | Expect | Result |
|---|---|---|---|
| 1.1 | Open `https://bloat-preview.vercel.app` | The start page with **Sign in** (no "Get started", no Vercel login page) | |
| 1.2 | Sign in with the email and temporary password | You land on Today | |
| 1.3 | Pull down to refresh | Still signed in, still on Today | |
| 1.4 | Add to home screen, close the browser, open Bloat from the home screen | It opens on Today, still signed in | |

## 2. Logging

| # | Do this | Expect | Result |
|---|---|---|---|
| 2.1 | I feel bloated, pick a strength, Save | "Bloating saved." under the button; Today shows it as ongoing | |
| 2.2 | Update the strength | "Saved", and the new reading is listed | |
| 2.3 | End it | "Bloating ended" with how long it lasted | |
| 2.4 | Add meal: type a dish, Save | "Meal saved."; it appears in "Today so far". There is no photo or ingredient step | |
| 2.5 | Add activity: tick a habit, Save | "Activity saved." | |
| 2.6 | Log bowel movement; then Add activity, "Log a walk or exercise in detail" | "Bowel movement saved." and "Exercise saved." | |
| 2.7 | Turn on airplane mode, add a meal, Save | A clear message; your text is still there | |
| 2.8 | Airplane mode off, Save again | Saved once (one entry in History, not two) | |
| 2.9 | Next morning: do the review | The day gets a Bloat Score in History | |

## 3. Editing

| # | Do this | Expect | Result |
|---|---|---|---|
| 3.1 | History, open today: change the meal's time, Save | The new time shows | |
| 3.2 | Delete the meal | Gone; still gone after a refresh | |
| 3.3 | Delete a habit answer | It says it becomes unknown, not No; still gone after a refresh | |
| 3.4 | Change a bloating record's start time | The new time shows | |

## 4. Reports and sharing

| # | Do this | Expect | Result |
|---|---|---|---|
| 4.1 | Patterns: open Possible triggers, Your journey, Weekly report | Each opens; no link to experiments anywhere | |
| 4.2 | Doctor report: switch off Medicines, Preview | The preview leaves Medicines out | |
| 4.3 | Download the PDF | It opens on the phone | |
| 4.4 | Create a share link and open it in a private tab | It opens | |
| 4.5 | Stop sharing, reload the private tab | "This link no longer works" | |
| 4.6 | Make a new link, then delete a record from a day the report covers, reload | "This link no longer works" | |

## 5. Export

| # | Do this | Expect | Result |
|---|---|---|---|
| 5.1 | You, Download my data, JSON | A file downloads and can be opened or saved | |
| 5.2 | The same with CSV | A file downloads | |

## 6. Password change and sign-out

| # | Do this | Expect | Result |
|---|---|---|---|
| 6.1 | You, Change password: try a short one | "Use at least 10 characters." | |
| 6.2 | Choose a proper one | "Password changed. Use the new one next time you sign in." | |
| 6.3 | Sign out, then press Back | You see Sign in, not your entries | |
| 6.4 | Sign in with the old password | "Email or password is incorrect." | |
| 6.5 | Sign in with the new password | Today | |

## 7. Phone behaviour

| # | Do this | Expect | Result |
|---|---|---|---|
| 7.1 | With a sheet open, use the phone's Back gesture or button | The sheet closes first | |
| 7.2 | On a screen, Back | You go back one screen | |
| 7.3 | Rotate the phone | Nothing cut off or overlapping | |
| 7.4 | Make the text larger in the phone's settings, reopen Bloat | Nothing cut off or overlapping | |

## 8. Screen reader (separate from the list above)

Only with **VoiceOver** (iPhone) or **TalkBack** (Android) switched on. Not done yet.

| # | Do this | Expect | Result |
|---|---|---|---|
| 8.1 | Move through Today | Every button is read with a clear name; the score is read as "N out of 10" or "Nothing logged yet" | |
| 8.2 | Save a meal | "Meal saved." is read out | |
| 8.3 | Log bloating | The strength and warning signs can be chosen and are read as selected | |
| 8.4 | Open and close a sheet | Focus moves into the sheet, and back where it was when it closes | |
| 8.5 | You, Delete account (stop at the confirmation) | The confirmation can be reached and read | |

Write down anything that went wrong, with the phone, system version and browser.
