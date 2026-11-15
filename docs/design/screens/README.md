# Approved screens

The approved screen designs are in the owner's claude.ai artifact **Bloat App Screens** (artifact id `6d3f7844-1b26-4c7f-aac2-bad5f3d64dff`). They are 43 design files (`*.dc.html`) plus `canvas.json`, which lays them out. They only display inside that artifact. Copies are kept here, slice by slice, as text to check the code against.

Screens: AddActivity, AddMeal, Bowel, Charts, Consent, Country, CycleMedicine, DailyCard, Day14, Day3, Day7, DayDetail, DoctorReport, EndEpisode, Exercise, ExperimentResult, Experiments, FirstRead, HealthBackground, Help, History, Journey, KeepEye, Landing, Learn, LogBloating, Main, Me, MealCheck, MorningReview, OnbContext, OnbGoal, OnbHabits, OnbSymptoms, Ongoing, ReviewFood, SafetyCheck, SignUp, StillHappening, Triggers, Upgrade, WeeklyReport, YourUsual.

## Copied so far

- **15 Nov 2026, for Slice A** (20 files, unchanged, from artifact version `1794549674-e2cf`): Landing, Country, Help, SignUp, Consent, OnbGoal, OnbSymptoms, OnbContext, OnbHabits, Main, LogBloating, Ongoing, EndEpisode, StillHappening, AddMeal, MorningReview, ReviewFood, History, DayDetail, Me.
- Not copied: FirstRead, Day3, Day7 and Day14 (the "first two weeks" screens). They are not in the plan's 39 screens; see `../../slices/slice-a.md`, section 9.4.

The files are for reading, not for running: open them as text to check colours, spacing and wording. They show a Pro user in most places, and they disagree with the plan in several places. The list of differences, and which side wins, is in `../../slices/slice-a.md`, section 9. The design files number the screens differently from the plan; the brief maps one to the other.

## Plan screens and design screens

The plan's own list (A05) has 39 screens. The two lists may differ in names or count. Before each slice, the first session compares the slice's plan screens with these files and tells the owner about any mismatch.

## How to use them

At the start of each slice, copy only that slice's screens into this folder (one file per screen, same names), so the code can be checked against them. Copy them from the artifact with the artifact tools, or the owner downloads them. Do not guess a screen's look from memory. If a screen is missing here and the artifact cannot be reached, stop and ask.

The design tokens and rules are in `../tokens.json` and `../README.md`. The same tokens also sit inside the screens artifact at `project/ds/bloat/tokens.json`.

The older artifact "Bloat Web App — UI/UX" (3 Nov) is out of date. Do not use it.
