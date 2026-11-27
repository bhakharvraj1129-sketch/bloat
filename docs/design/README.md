> **27 Nov 2026: design v2, "Bloat Buddy"** supersedes Silver. The owner renamed the app, chose a calm teal ("Sea glass"), logo A ("Calm wave") and both light and dark themes, from a design canvas made that day. The values live in `src/app/globals.css`; the choices are DECISIONS.md choice 31. Silver (below) is kept for the record.

> **19 Nov 2026: the visual system is now Bloat / Silver** (`docs/design/silver/`, values in `tokens.json` version 2).
> White, silver grey and black; system fonts; 12px controls and 20px cards; a sidebar from tablet width and four
> bottom tabs on phones (Today, History, Patterns, You); light theme only for now. The colour, type and shape rules
> below are kept for history and are superseded where they differ. The voice, wording, safety and honesty rules are
> unchanged. The 20 approved Slice A screens in `screens/` show the old look; their content and order still apply.

Bloat is a calm personal diary for bloating: log in two taps, see your own patterns, bring real records to your doctor. Everything here should feel like a steady, kind notebook, never a hospital and never a diet app.

"Bloat" is the working name; the logo is not designed yet, so set the name in `headline` type in `brand`.

## Voice and wording

- Write plainly, in the second person ("you", "your records"). Short sentences. No emoji, no exclamation marks.
- Say what the records show, never what they mean: "Fizzy drinks: 5.6 on 9 days with, 4.1 on 12 days without." Never "trigger found", "bad food", "safe food", "cause", "diagnosis", "abnormal".
- Every comparison ends with the fixed caption: "This is a difference in your records, not a medical measure."
- For medical advice use only the fixed copy adapted from the NHS bloating page, with "Adapted from NHS, Bloating" in `caption` (changed 18 Nov 2026 at the owner's request: the copy is adapted for the US, Canada and India, not word for word). Never write medical advice in Bloat's own words.
- Honest states: say "Saving…" until the server confirms, then "Saved". Unknown stays "Not sure", never filled in.
- No streaks, guilt or pressure. "Mostly" is a fine answer.

## Colour

- Screens sit on `ground`; cards, sheets and the tab bar use `surface` with a 1px `line` border. Use shadows nowhere.
- Text is `ink`; secondary text `ink-muted`. Both pass 4.5:1 on `ground` and `surface` in both themes.
- `brand` is the one identity colour: the main "I feel bloated" button, the selected tab, links and the focus ring. Text on it is `on-brand`. Use `brand-tint` for quiet fills (selected chips, the progress counter, the doctor line).
- The Bloat Score scale is `score-mild` (1-3), `score-moderate` (4-6), `score-strong` (7-8), `score-severe` (9-10). It colours data only: chart marks, calendar days, the strength scale. A score of 0 shows `surface` with a `line` border. Always print the number too; never rely on colour alone.
- `alert` and `alert-tint` belong to the nine NHS warning-sign chips and their advice, nothing else. Never colour a food, a score or a result with them.
- Food groups never get colours. No green "safe" or red "avoid".

## Type

- Headlines, card titles and the big score use the display family (Bricolage Grotesque, Google Fonts): `headline` once per screen, `title` for cards, `score-number` for the big number with tabular figures.
- Everything else uses the body family (DM Sans, Google Fonts): `body` for text, `body-strong` for buttons, `label` for small uppercase section labels, `caption` for sources, counts and the fixed wording.
- Respect the phone's text-size setting; nothing below 13px.

## Shape, spacing and layout

- Round is the motif: a belly, a balloon that gets smaller as bloating eases. Buttons, chips and the strength scale use `radius-pill`; cards and sheets `radius-lg`; inputs `radius-sm`.
- Side gutter `space-4`; cards `space-4` padding and `space-6` apart; `space-8` above the headline.
- Bottom tabs: Today · History · Insights (Pro) · Me. The main action ("I feel bloated") is the largest element on Today and sits in thumb reach.
- Logging opens as a bottom sheet over Today; the user never loses their place.
- Touch targets are at least 44px tall.

## States and focus

- Focus ring: 2px solid `brand` with 2px offset, on every interactive element, in both themes.
- Disabled controls use `ink-muted` text on `surface` with a `line` border and say why they are disabled.
- Pro-locked items show a small "Pro" label in `brand`; their text stays truthful, never a teaser.

## Motion

- Short and quiet: 150-200ms ease-out for sheets and chips. The score badge may shrink gently when a lower strength is logged. Nothing moves when "reduce motion" is on.

## Iconography

- No icon set is chosen yet. Use a simple outline set at 1.75px stroke in `ink` or `brand` (for example Lucide), and always pair an icon with a word. Flagged: replace once the brand's own icons exist.
