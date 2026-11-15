---
name: bloat-wording-and-safety
description: Bloat's wording rules, banned words and safety limits (a wellness tracker, never medical). Use whenever writing or changing any user-facing text, result, card, report, help page, warning sign, experiment, upgrade screen or marketing copy, and whenever a feature touches health information, AI output or food advice.
---

# Bloat wording and safety

Bloat is a general wellness tracker, not a medical device. It shows records and patterns. It never decides who needs help, never diagnoses, and never gives health advice in its own words. Authority: plan A17 (Safety), A15 (Experiments), A11 (Meals and AI), A04 (Plans and honest selling), B04 (Privacy). If anything here conflicts with the plan, the plan wins: stop and ask the user.

## Banned words (UI text, marketing, anything that becomes UI)
safe food, bad food, trigger found, trigger confirmed, cause of your bloating, cure, heal, diagnose, diagnosis, abnormal, high risk, all clear, you may have [condition], doctor approved, clinically proven. Also never rank a "top trigger" and never say "you're fine". The word "cause" appears only inside the one possible-triggers footer quoted below, and nowhere else.

## How to word results
- Say what the records show, never what they mean. Example shape: "Fizzy drinks: 5.6 on 9 days with, 4.1 on 12 days without."
- Possible triggers go in three groups only: Worth watching, No clear difference, Not enough data yet.
- Under every comparison result, put exactly: "This is a difference in your records, not a medical measure." Acceptance test Q175 checks it, plan A14 and section 0.3 specify it, and the design README uses it.
- The footer under the whole possible-triggers list is exactly: "These are patterns in your own records, not proof of a cause." (plan A14). Use it nowhere else.
- A few explanatory examples in plan Parts I and II end a result with a third wording ("This is a pattern in your own records, not proof of a cause."). Where an example differs from A14, Q175 or another test, the specification and tests win. Never invent a new closing line. If a screen needs a closing line and it is unclear which one, ask the user. Check DECISIONS.md for a recorded answer.
- Unknown stays unknown. An untapped habit is unknown, not "no". An untouched ingredient is "Not sure", never "didn't have".
- Too few days: say so instead of showing numbers.
- Show "Saving..." until the server confirms, then "Saved".
- No reminders, guilt, streak pressure or "days to insight". "Mostly" is a fine answer. The plan (A18) mentions a streak count; ask the user before building any streak UI.
- Honest selling: no fake teasers ("we found 2 triggers"), the full yearly price shown, cancelling takes two taps, Pause Pro sits beside Cancel, Free never expires, Pro labels stay truthful.

## Medical text
- NHS text is quoted word for word from the stored copy in the evidence file, with its source line. Never paraphrase it and never write medical advice in Bloat's own words. Only the emergency number changes by country (911 for USA and Canada, 112 for India).
- The help page, the nine warning-sign chips and the doctor line use only the stored text. A test (Q148) checks the match. If the stored copy is missing, stop and ask.
- Warning-sign chips: show the exact NHS sentence at the right level, free for everyone, never block or pause logging.
- Doctor line: bloating on more than 12 of the last 30 days. Shown quietly in History, reports, Your usual and the doctor PDF. Never on Today, never a pop-up.
- Helpline numbers: copy them from the plan, never from memory. The plan says to re-check them before launch.

## Experiments and food swaps
- Habit experiments run 7 days. Food swaps are Pro only, like-for-like, one food group, maximum 2 weeks, with a mandatory 1-week add-back and at most 2 in 180 days. Never offer wheat or FODMAP programmes. Never cut a food out.
- Before each swap ask the four safety questions (FX-01 to FX-04). Any yes means no swap and a kind explanation.
- Ask the weekly wellbeing questions (WB-01, WB-02) during a swap. A yes pauses the experiment and shows the helpline.
- Every experiment screen says to stop if you feel worse and links to When to get medical help.
- For anyone with an eating-disorder history or food worry: no good-or-bad food language anywhere, no swaps, helpline shown.

## Meal AI rules
- The AI only lists bloating-related ingredients from the 12 food groups for the user to tick. No advice, no results, no calories.
- Every list says "AI suggestion, may be wrong". Meals always save, even when the AI is off, limited or failing.
- The AI never receives symptoms, health information or who the user is. Photos have location data removed and are deleted after the check unless the user chooses to keep them.
- Keep the spending limit, rate limits, size limits, one retry and kill switch from plan section 0.4. Keys stay on the server, with separate test and live keys.

## Never build
Triage or urgency questionnaires, alerts, an "all clear", condition names, supplement, medicine or probiotic recommendations, restrictive diets, calorie or weight tracking, in-app therapy, genetic or ethnicity data, ad or social trackers, accounts for under-18s.

## Privacy in code
No health data in logs, analytics, error reports or AI prompts. Row Level Security on every table. Pro checks happen on the server, never only hidden in the UI.
