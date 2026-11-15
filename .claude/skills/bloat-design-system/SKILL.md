---
name: bloat-design-system
description: Bloat's design tokens and UI rules (colours, type, spacing, shape, motion, accessibility). Use whenever building or changing any screen, component, chart or style in the Bloat app, or reviewing a screen against the approved designs.
---

# Bloat design system

Read before building any UI: docs/design/tokens.json (all values), docs/design/README.md (the rules) and the approved screens in docs/design/screens/. Never invent a colour, font size, spacing or radius. If a needed value is not a token, stop and ask the user.

## Using tokens in code
- Put the tokens into the Tailwind config and CSS variables once, with a light and a dark theme. Components use token names only. No hard-coded hex values, pixel sizes or radii in components.
- Light and dark mode are both required at launch. Check every screen in both.

## Colour
- Screens sit on `ground`. Cards, sheets and the tab bar use `surface` with a 1px `line` border. No shadows anywhere.
- Text is `ink`. Secondary text is `ink-muted`.
- `brand` is the one identity colour: the main "I feel bloated" button, the selected tab, links and the focus ring. Text on it is `on-brand`. Use `brand-tint` for quiet fills (selected chips, the progress counter, the doctor line).
- The Bloat Score colours are `score-mild` (1 to 3), `score-moderate` (4 to 6), `score-strong` (7 to 8) and `score-severe` (9 to 10, with `on-score-severe` labels). They colour data only: chart marks, calendar days and the strength scale. A score of 0 is `surface` with a `line` border. Always print the number; never rely on colour alone.
- `alert` and `alert-tint` belong only to the nine NHS warning-sign chips and their advice. Never use them for a food, a score or a result.
- Food groups never get colours. No green "safe" and no red "avoid".

## Type
- Display family (Bricolage Grotesque): `headline` once per screen, `title` for cards and sheets, `score-number` for the big number with tabular figures.
- Body family (DM Sans): `body`, `body-strong` for buttons, `label` for small uppercase section labels, `caption` for sources, counts and fixed wording.
- Fonts come from Google Fonts. Respect the phone's text-size setting. Nothing below 13px. Test with large text.

## Shape, spacing and layout
- Round is the motif. Buttons, chips, the strength scale and the score badge use `radius-pill`. Cards and sheets use `radius-lg`. Inputs use `radius-sm`.
- Spacing tokens only: `space-1`, `space-2`, `space-4` (side gutter and card padding), `space-6` (between cards and sections), `space-8` (above the headline and around the main button).
- Bottom tabs: Today, History, Insights (Pro), Me. The main action is the largest element on Today and sits in thumb reach.
- Logging opens as a bottom sheet over Today so the user never loses their place. An unsaved sheet asks before closing. A failed save keeps the text and offers "Try again".
- Touch targets are at least 44px tall. One clear main action per screen.

## States, focus and motion
- Focus ring on every interactive element: 2px solid `brand` with a 2px offset, in both themes.
- Disabled controls use `ink-muted` text on `surface` with a `line` border, and say why they are disabled.
- Pro-locked items show a small "Pro" label in `brand`. Their text stays truthful, never a teaser.
- Motion is short and quiet: 150 to 200ms ease-out for sheets and chips. Nothing moves when reduce-motion is on. A light vibration on a confirmed save.
- Loading shows skeleton placeholders. Screens open in under a second on a mid-range Android phone.
- Empty screens say what to do ("Log 7 more days to see your chart"), never a blank space.

## Components
- Build once and reuse: button, card, bottom sheet, chip, strength scale, score badge, tab bar.
- Sheets, dialogs and menus use Radix primitives styled only with tokens.
- Charts are hand-built SVG components with no chart library, matching the approved designs.
- Icons: a simple outline set at 1.75px stroke, always paired with a word. The design system marks its icon choice as temporary, so ask the user before picking a set.
- There is no logo yet. Set the name "Bloat" in `headline` type.

## Accessibility checks for every screen
- The tokens already meet 4.5:1 contrast in both themes. Do not put text on a colour the tokens do not pair it with.
- Screen-reader labels, 44px targets, reduce-motion, large text, and never colour alone.
- Before Gate 1, run an accessibility review on every screen.

## When designs and plan disagree
If a plan screen spec and an approved design disagree, stop and ask the user, then record the answer in DECISIONS.md.
