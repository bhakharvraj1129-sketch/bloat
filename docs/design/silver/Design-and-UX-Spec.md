# Bloat / Silver
## Design and implementation handoff · 19 November 2026

**Purpose:** redesign Bloat as a quiet, premium wellness diary in white, silver grey and black, and systematically repair navigation and actions. This package is a design proposal and implementation specification. It does not modify or deploy the live app. Prototype records are synthetic. No clinical calculations are implied by the sample chart.

Open `Preview.html` in a browser. It is self-contained, requires no installation and makes no network requests. Its `#home`, `#today`, `#history`, `#insights`, `#me`, `#signin`, `#setup`, `#report`, `#about`, `#how`, `#privacy`, `#terms`, `#contact`, `#help` and `#learn` views demonstrate the direction. Implement against real routes, not hash navigation. Privacy, Terms, Help, Contact and Learn contain clearly marked design guidance, not publication-ready content. Never publish their placeholder wording as a finished policy or safety page.

## 1. Evidence and limitations

Read-only source review of branch `claude/bloat-software-build-uxzoru`, commit `dc88b37`, fetched 19 November. This is newer than the earlier email-link repair attempt. Source was read in an isolated checkout; live database, settings and deployment were not changed in this design task.

- `PROGRESS.md` now reports temporary email/password login, but leaves disabling provider-level signup and provisioning the dedicated tester to the owner. Hosted successful login/refresh/sign-out/isolation were not run in that round. Re-verify; documentation is not live proof.
- `src/components/ui.tsx`, `Screen`: Back is a `Link` to a supplied destination, not browser history. It can intentionally go to a parent, but may feel wrong when an entry point differs. This is an observed implementation, **not a reproduced broken-link defect**.
- `src/components/tabs.tsx`: active tab matches only the literal route prefix. A day page `/day/[date]` is not under `/history`, and `/report`, `/doctor` and `/experiments` are not under `/insights`. Those detail pages need explicit navigation ownership.
- `src/app/(app)/me/me.tsx`: several handlers directly await API calls, including billing, consent withdrawal, logging-mode changes and medicine changes. They lack the shared save-feedback handling used elsewhere. This creates a plausible failure/repeated-tap UX risk; execute failure-path tests before calling it a confirmed runtime bug.
- `src/app/contact/page.tsx`: explicitly says no support address exists. It is a placeholder, not a professional working support channel.
- No `/about/page.tsx` was found in the inspected route inventory.
- Current CSS uses green branding, warm multicolour strength badges and automatic dark-mode switching. This proposal replaces the visual system, not the underlying score thresholds.
- Current `Screen` and tabs are largely phone-width even on desktop. Add a real desktop shell.

The accompanying CSV inventories source sites containing interactive controls. It is a discovery aid, not proof of behavior and not a complete inventory of generated/shared controls. Claude must expand each loop, conditional, role, plan and state into executable cases. User-reported broken buttons remain open reports until reproduced and retested.

## 2. Reference study and design decision

Borrow patterns, not brand assets or exact layouts:

| Reference | Useful pattern | Bloat adaptation |
|---|---|---|
| Apple Health | Readable summary groups, charts with drill-down, deliberate sharing choices | Clear daily record, large labels, a report inclusion preview |
| WHOOP | A daily overview with contextual metrics, journal and trend detail | Separate today's actions from longer-term patterns; avoid performance pressure and recovery-style rings |
| Oura | Distinguishes immediate daily information from deeper metrics and long-term health | Four simple destinations; move advanced tools into context rather than adding many tabs |

**Selected direction:** Apple's legibility plus WHOOP's structured data presentation, with Oura's progressive disclosure. White first, black action hierarchy, silver surfaces. No copied logos, wearable claims or decorative health scores. The circular motif in the prototype is a visual placeholder for a recorded value, not goal progress; production should prefer the number and textual label over a progress ring for symptom severity.

Sources consulted:
- Apple official Health overview with screenshot references: https://www.apple.com/in/newsroom/2021/06/apple-advances-personal-health-by-introducing-secure-sharing-and-new-insights/
- Apple Health data navigation: https://support.apple.com/en-in/guide/iphone/iphe3d379c32/ios (search text available; direct fetch rate-limited)
- WHOOP navigation: https://support.whoop.com/s/article/Navigating-the-WHOOP-Mobile-App?language=en_US (indexed content available; direct page returned a rendering error)
- WHOOP trend views: https://www.whoop.com/us/en/thelocker/track-progress-with-new-trend-views/
- Oura official design rationale: https://ouraring.com/blog/new-oura-app-experience/
- WHOOP visual reference located through image search: https://www.theshortcut.com/p/whoop-5-mg-announced (secondary visual reference only)

This is a synthesis of accessible public reference material, not a hands-on audit of the latest installed Apple/WHOOP/Oura apps.

## 3. Design system

Use `tokens.css` as the proposed source of truth. Update existing token JSON and CSS together; this user-approved new palette supersedes the old visual palette only. Business, medical, privacy and eligibility rules remain unchanged.

| Token | Value | Use |
|---|---|---|
| Ground | #F5F5F6 | Page canvas |
| Surface | #FFFFFF | Cards, menus, inputs |
| Ink / primary | #171719 | Text and main action |
| Muted text | #626269 | Secondary readable copy |
| Line | #DEDEE2 | Decorative separators; not sole input boundary |
| Control outline | #85858E | Inputs and unselected controls |
| Subtle | #EEEEF0 | Selected navigation and neutral banners |

Use system fonts to avoid font-loading shifts. Body 16px/24px; small text 13px/19px; card headings 18–20px; mobile page title 32–34px; desktop 40–44px; hero 56px mobile / 76px desktop; display numbers 56–64px with tabular numerals. Use sentence case; uppercase only for short section labels. Do not use pale silver for important text.

Spacing: 4, 8, 12, 16, 24, 32, 48, 64px. Card radius 20px, controls 12px, badges pill-shaped. Thin borders; no heavy shadows. A faint shadow is acceptable for a floating dialog only. The illustrative homepage device shadow is not an app-card rule.

One black primary action per task region. Secondary actions white with outline; tertiary actions plain text with a generous hit area. Never make all controls identical black pills. Minimum target 44×44px, preferred height 48px. At least 8px between targets.

Selection: fill, label/checkmark and accessible state together. Strength 1–10 uses labelled buttons, selected black with white text; preserve approved anchors. Never describe lower symptoms as a gamified achievement. Keep approved safety alerts visually prominent: black high-contrast alert panel and icon/text in monochrome; if the existing clinical safety design requires red, retain a tightly scoped semantic red rather than suppressing it for aesthetics. Do not change the warning wording.

Motion 120–180ms for state transitions; no counting score animations or autoplay. Honor reduced-motion preference. Focus ring 3px black with offset. Text contrast target at least 4.5:1; non-text controls 3:1. Check actual combinations and disabled/selected/error states.

## 4. Information architecture and responsive behavior

### Public shell
Home, How it works, About, Contact, Sign in. Footer: Privacy, Terms, Medical help, methodology. Add a mobile menu button and accessible menu; the compact prototype only shows the most important header link, so implementation must restore all public destinations on mobile. No login required to read policies or safety information.

### Signed-in shell
Keep four top-level routes to avoid breaking existing links:
- `/today` — Today: logging, ongoing episode, morning review, today's timeline.
- `/history` — History: dates, entries, corrections, review status.
- `/insights` — Patterns (new display label only): charts, possible triggers, experiments, reports and journey.
- `/me` — You (new display label only): settings, health context, privacy, support and sign-out.

Desktop at >=1024px: sidebar 220–240px; content max-width 1120px; 24–32px gutters; two-column dashboard with charts/timeline spanning where needed. Tablet 768–1023px: compact sidebar or top navigation, single-column cards when necessary. Mobile <768px: 20px gutters, four bottom tabs with labels, safe-area padding and enough bottom content padding. The prototype uses a 640px compact breakpoint; production should consolidate these exact breakpoints as specified here. No horizontal page scroll at 320px. At 200% zoom reflow rather than clip.

Forms stay max 480–560px. Documents max 720px. Tables become stacked labelled rows where useful. Sheets are bottom sheets on mobile and centered dialogs on desktop. Do not show a phone frame around the actual desktop app.

## 5. Page specifications

| Screen / existing route | Required content and main interaction | States / return behavior |
|---|---|---|
| `/` Home | Clear purpose, real product screenshot, 3-step explanation, factual feature summary, safety scope, footer | Testing CTA says Sign in or Explore demo only if a real isolated demo exists; public Get started only when signup is enabled |
| `/how-bloat-works` | How logging works and approved score/comparison methodology | No rewritten formulas or thresholds; back to contextual public/app parent |
| `/about` new | Product purpose, verified team/company story and wellness scope | Do not invent team details, testimonials or clinical validation |
| `/contact` | Monitored support destination or real form with category, email, message | Validation, submitting, acknowledged success, failure/retry; no health details requested; no fake successful submission |
| `/privacy`, `/terms` | Reviewed real content, effective date, section index, readable typography | Preserve content until owners review changes; no compliance badges without evidence |
| `/help` | Existing approved safety copy and source attribution | Always reachable; public access; strong hierarchy |
| `/sign-in` | Current configured method only; for current preview, email/password | Error, busy, show/hide password, secure autofill; no dead Google/Apple/phone buttons; no fake recovery link |
| `/start`, `/setup` | Approved country/eligibility, help, consents and setup steps in their required order | Step count based on actual required steps; Back keeps safe draft inputs; no skipped consent or health eligibility gate |
| `/today` | Ongoing episode first; Log bloating; Add meal/activity; morning-review prompt; timeline | Initial empty, loading, no data, ongoing, completed, incomplete day, failed read, offline |
| Episode sheet / existing components | Start, strength, required safety prompts; separate end-episode action | Prevent duplicate active episode; no auto-filled symptom answers; confirm acknowledged save before closing |
| Meal sheet / recall / library | Meal text first; time; optional details and AI action | Meal still saves if AI fails; show mock/unavailable honestly; draft preserved; no fake AI output |
| Activity/bowel/health forms | Registry-driven questions and approved entitlements | Do not move Pro-only features into Free merely to match mockup |
| `/review/[date]` | Clear date, unresolved items and approved morning questions | Restore draft when going Back; submitted date remains same across timezone transitions |
| `/history`, `/day/[date]` | Date selector, entries, completeness/conflict states and correction actions | Retain filters/date/scroll when returning from detail; missing is not zero |
| `/insights` | Range selector, data coverage, chart title/unit, association cards with eligibility | No-data, insufficient data, conflicting data, Free plan, Pro, loading/error; no invented causality |
| `/experiments`, `/experiments/[id]` | Existing eligible choices, progress and stop/review actions | Paused/unreviewed experiments remain unavailable; no rewritten evidence rules |
| `/report`, `/doctor`, `/share/[token]` | Select sections, date range, privacy preview and export/share | Exclusions apply to all outputs, including summary; creation/revocation failure; expired share link |
| `/journey` | Approved historical milestones and summaries | No fake streaks or progress in empty accounts |
| `/cards`, `/learn` | Reviewed content only, readable source links | Drafts stay hidden; source failures visible to staff, not silently substituted |
| `/me`, `/health` | Profile, timezone, habits, medicines, consent, export, deletion, support | Save errors, pending changes, confirmation for destructive actions, no unknown save labelled failed |
| `/upgrade` | Accurate current plan and offer | Billing-disabled preview explains status; no working-looking purchase button with no backend |
| `/admin` | Separate staff layout and current authorization/MFA | Never surfaced to ordinary users; no weakening auth to simplify testing |
| `/offline`, `/unavailable` | Clear reason and a useful recovery path | Back fallback; Retry performs a real request, never a page loop |

## 6. Navigation and button repair contract

Create a centralized route ownership map. Today owns episode/meal actions and recall. History owns day detail and historical review when launched there. Patterns owns insights, experiments, report, doctor and journey. You owns preferences/health. Record the launch context where a route has multiple parents.

**Back policy:** do not blindly replace every Link with `router.back()`. Use browser history only when a known internal navigation entry exists. Otherwise use a safe route-specific parent. Never use history.length alone as evidence of internal history. For returnTo parameters, accept allowlisted internal paths only; reject external/protocol-relative URLs. Account redirects must preserve only safe destinations. Avoid returning to a completed destructive confirmation or sign-in after successful login.

**Modal policy:** Close and Escape close the active modal and restore focus to its opener. Browser Back closes the sheet if it opened a history entry, without leaving the parent. Use exactly one owner for modal/history state; avoid popstate loops. If a dirty draft exists, offer Keep editing / Discard; preserve non-secret drafts where appropriate. Never persist passwords or health drafts indefinitely in browser storage.

**Action state machine:** idle → validating → saving → confirmed saved OR actionable failure OR unknown outcome. Disable repeated submission while in flight. Keep inputs on failure. On lost response, use existing idempotency and status-check machinery before retry; do not generate a new idempotency key for the same uncertain attempt. Announce status accessibly. Don't close the dialog until save is acknowledged. After success refresh the relevant data and keep expected scroll position.

Native semantics: `Link` for navigation; `button type=button` for actions; `type=submit` only for form submission. Every icon-only button has an accessible name. Do not rely on clickable divs. Every disabled control has a visible reason when not obvious; hide unavailable third-party login providers rather than rendering dead buttons.

For every interactive control record: route + role/plan + selector + prerequisites + expected transition/API + loading state + success + failure + duplicate click + Back destination + test evidence. The source inventory CSV starts this work; it is not the completed acceptance ledger.

## 7. Acceptance matrix and release gates

P0: protect private routes/API, preserve RLS and report privacy; retain BLOAT_TEST_LOGIN=0; verify provider-level signup policy; provision only authorized test accounts; never introduce bypass login.
P1: all primary navigation and Back flows, real authentication, log/start/end episode, save/edit meal, review, history and settings. Test deep links with empty browser history, refresh, device Back, keyboard, dialogs and lost responses.
P2: all remaining reports/exports, experiments, learning, plan, support and low-frequency actions. “Later” must be explicit, never silently marked done.

Required widths: 320, 390, 768, 1024, 1440px. Test 200% text zoom, keyboard-only Tab/Shift-Tab/Enter/Escape, reduced motion, screen-reader labels and focus return. No sticky control obscures inputs or error messages. Check Android Chrome and iOS Safari safe areas/keyboard when access exists; label untested platforms.

For each data mutation: valid save, invalid input, 401/session expiry, 403/entitlement, 429, 500, offline before submit, lost response after commit, rapid double click. Use synthetic records; check persistence after refresh and user isolation. Don't create unnecessary destructive test records on the real environment.

Definition of done: current route inventory reconciled; every control classified; no unexplained nonfunctional control; relevant tests pass; hosted evidence distinguishes local/mock from real; open bugs and blocked external services recorded; before/after screenshots at mobile and desktop; screenshot privacy respected; commit and preview URL tied to the tested version. Passing visual checks does not establish functional correctness.

## 8. Implementation order

1. Snapshot latest branch/deployment; resolve drift and capture reproducible bugs. Complete the minimal secure test-account setup so authenticated verification is possible.
2. Add tokens and shared components in an isolated branch/preview; replace global auto-dark styling with the requested light theme. Do not remove a persisted user theme option without an explicit migration decision; map it coherently or document the temporary light-only choice.
3. Implement shells and robust Back/Close behavior, then Home, Sign in, Today and logging. Match the supplied visual direction before expanding.
4. Migrate remaining pages using the route table, preserving registry questions, calculation rules, APIs and entitlement checks.
5. Fix and test all action paths. Recheck report privacy, exports and authentication. Review content with owners before publication.
6. Deliver the tested preview and concise defect/verification ledger. No production launch, paid integrations or real medical data implied.

## 9. Non-negotiable boundaries

Do not rebuild the backend simply to redesign screens. Do not wipe existing code. Do not change pricing, health wording, algorithms or thresholds to fit the design. Do not claim all buttons were fixed without testing all identified states. Do not invent company identity/support details. No third-party account signup or paid calls without explicit authorization. The current task authorizes a design handoff; production implementation is for Claude using the included prompt.
