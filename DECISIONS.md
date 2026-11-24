# Decisions

Choices made while building, with the reason. Everything still waiting for the owner is in one place: **"Open decisions"** (the table near the end). Settled questions are listed under "Settled", so they are not asked again.

## The owner's instruction for this build (16 Nov 2026)

- Empty the repo and build the whole product autonomously from the two PDFs. Done: everything was removed in commit `a85c11a`; the earlier planning pack is still in git history at `8d2d4d7`.
- Kept or brought back, and why: the two PDFs (they are the source, and no other copy was attached); the three JSON files (extracted again from the PDF with `pdfdetach`, identical by hash); `docs/design/` (tokens, design rules and the 20 approved Slice A screens, because the mission says to use existing design assets). (Settled: `docs/design/` stays; the owner later added the Silver package there.)
- Carried over from the earlier decisions file, because they were your answers: no streak display; Lucide outline icons with a word; the two fixed closing lines; "cause" only inside the fixed sentences; brand name stays "Bloat"; the progress counter needs 14 confirmed days (2 × 7).

## The owner's decisions since

- **24 Nov 2026.** `main` holds the app (fast-forwarded to the build branch), and the project's main Vercel addresses (`bloat-olive.vercel.app` and two others) show the same frozen test build as `bloat-preview.vercel.app`. This is not a launch: same test database, still hidden from search engines, sign-ups still off. The duplicate Vercel project `bloat-zlrr` goes. Details: `DEPLOYMENT.md`.

## Engineering choices

1. **All writes go through one server-only database function (`srv_tx`).** Browsers hold a sign-in token, so anyone could call the database directly. To stop that from skipping Pro checks, safety checks or validation, signed-in users can only read their own rows; every write needs a server secret. This also makes each save one transaction. No Supabase service key is used or needed.
2. **Day status, scores and comparisons are worked out when asked for**, from the current records, with a rule version. Nothing derived is stored except report snapshots. This replaces the plan's `comparisons` table and recompute queue (B02) and makes "an old job overwrites a new result" impossible. Acceptance test Q56 is therefore marked not built as written.
3. **Cards and Learn content live in the repo** (`content/`), checked by a schema that refuses to publish anything without a source link. The founder publishing screen is not built.
4. **TypeScript 6** instead of 7: the linter does not support 7 yet.
5. **`@anthropic-ai/sdk`** added for the real ingredient check (the plan names Claude Haiku 5.5). `server-only` added to keep server files out of the browser bundle. `lucide-react` for icons.
6. **Test-only switches**, all off unless `BLOAT_TEST_LOGIN=1` (exactly): password sign-in for `@example.com` accounts, a labelled mock purchase, and a fixed clock header for time tests. **Off on the public preview since 18 Nov 2026** (`BLOAT_TEST_LOGIN=0`), checked on the hosted build before protection was removed. `/me` and `/upgrade` decide at request time, so a build cannot carry the test buttons into a running site.
7. **The comparison period starts on the first day anything was recorded** (within the last 92 days), so "both halves" describes time the diary was in use.
8. **Founder tools (`/admin`) need a staff account and a second sign-in step.** The account's email must be in `BLOAT_STAFF_EMAILS`, and the session must have passed an authenticator app code (TOTP). The old shared token is removed. Every founder read and change is written to the audit log as metadata only. Synthetic test addresses only count as staff when `BLOAT_TEST_LOGIN=1`. Founder tools stay off on the preview until the owner names a staff address. Not built: staff roles, forced re-check after a time limit, recovery if the phone is lost (for now: remove the factor in the Supabase dashboard).

9. **Pausing a country** (plan: "capability off with explanation; rights workflows kept"). A founder can set `recording` or `payments` to suspended or retired for one country. Then new entries, ingredient checks, new experiments and purchases answer "paused" with a plain explanation. Reading, finishing an open episode, corrections, export and account deletion keep working. The check runs on every request. The seed status `not_reviewed` does **not** block anything on the preview. Open: decision D2 (whether `not_reviewed` blocks a country on the live site, and the two explanation sentences in `src/server/http.ts`).
10. **AI failure alert (test Q183).** The plan asks for an alert when the AI failure rate is "above threshold" but gives no number. Nothing was invented: until decision D3, failures are only counted in the founder tools.

11. **Help page attribution: decided by the owner (18 Nov 2026).** The text is adapted from the NHS page for the US, Canada and India, so every label now says "Adapted from NHS, Bloating", with the source link kept and the emergency and urgent-care routes for the country. Comments, CLAUDE.md, the design notes and tests no longer claim it is word for word; a rule test blocks the old claim. The help page version stays `nhs-bloating-2026-11-07` because the advice itself did not change (settled).
12. **Kiwifruit card draft and experiment paused** (owner, 18 Nov 2026). The card stays unpublished; the experiment is refused on the server for everyone, while its safety rules stay tested underneath. The BDA 2025 constipation guideline (PMC12623288) says 2–3 kiwifruit a day for at least 4 weeks, peeled, for chronic constipation; Bloat's is 2 a day for 7 days and measures bloating. Eligibility when it was offered: constipation logged, FX-03 No, and no coeliac disease, allergy, Crohn's or colitis in the health background. The proposed correction is in `docs/content/proposed-corrections-2026-11-18.md`. Open: decision D5.
13. **Card wording corrections.** Seven cards have proposed, source-backed wording in `docs/content/proposed-corrections-2026-11-18.md` (water "at least 8 cups", move "at least 150 minutes" with NHS added, massage without the "light circular strokes", fibre with water for linseeds, sugar-free "other products", regular meals, alcohol "a day"). Nothing applied. The CDC page refuses automated checks and still needs a person to open it. Open: decision D4.

14. **Medicine "sensitivity view" (test Q21).** Test Q21 asks for a "prespecified sensitivity view [that] records exclusions" when a medicine starts during a comparison window. The plan does not say which days to leave out or how to show it. Built: changes are shaded on charts and the 14-days-before and after view (tested). Not built, to avoid inventing analysis rules. Open: decision D15.


15. **Doctor report privacy** (18 Nov 2026). One filter (`src/lib/domain/report-privacy.ts`) removes everything from a switched-off section, page 1 summary included, on every output: the API answer, stored-report reads, the PDF and the shared page. The in-app preview uses the same view as the shared page, so it shows everything that will be shared. Stored snapshots were scrubbed by migration `20261117174442` (4 synthetic reports on `bloat-test`; none held switched-off details). Which section owns what: Symptoms owns the symptom figures, warning signs and doctor line; Health owns pregnancy, breastfeeding, menopause, periods and age range, and the ovarian sentence; Meals owns food patterns; Habits owns habit patterns. Your questions are always shown because you typed them for the report.
16. **Email code messages** (18 Nov 2026). The sign-in screen now says when a code could not be sent (server time-out, no connection, too many requests) instead of always moving on. An address with no account still gets exactly the "code is on its way" answer. Trade-off, stated plainly: while the mail server is broken, an existing account sees "couldn't send" and an unknown address sees the normal answer, so a careful attacker could tell them apart during an outage. Supabase's own response timing already differs in the same way. Showing nothing would leave real people waiting for emails that never come.
17. **Designated Pro test accounts** (`BLOAT_PRO_TEST_EMAILS`, 18 Nov 2026). Server-side list; only confirmed addresses count; no billing rows are written. Preview list: `pro-tester@bloat.test` (synthetic, hosted test runs) and your test mailbox. Empty on a live site.
18. **Server functions and signed-in users** (18 Nov 2026). Supabase's advisor flags the 14 secret-gated server functions as callable by signed-out and signed-in roles. Signed-in users never need them, so they lost access (migration `20261117182606`). Signed-out access stays because the app's server calls them with the publishable key and the server secret (no service key is used anywhere). Every one checks the secret first; a test calls all 14 with no, wrong and right secret. The advisor will keep showing the 14 "anon" warnings; that is by design. It also suggests "leaked password protection": real users sign in by email code, not password, so it matters little; you can switch it on in Supabase, Authentication, then Password security, if your plan offers it.
19. **Exports never return part of the data** (18 Nov 2026). A failed read stops the export with a clear "try again" answer; rows are read in key order, each exactly once; JSON shows row counts per table and CSV headers show them too.
20. **Google sign-in button** is shown only when Google is switched on in Supabase (it is off on `bloat-test`), so nobody lands on a raw error page.
21. **Bloat / Silver visual system (owner's design package, 19 Nov 2026).** The package in `docs/design/silver/` replaces the look only; no rule, threshold, price or safety wording changed. Choices made while applying it:
    - **Light theme only.** The package asks to replace automatic dark mode with its light theme. **Confirmed by the owner on 22 Nov 2026: keep the approved light-only design; no dark mode now.** (This supersedes the earlier design system's dark-mode requirement.)
    - **System fonts** instead of Bricolage Grotesque and DM Sans; **12px controls, 20px cards**, pill shape kept only for badges and score marks.
    - **Tab labels "Patterns" and "You"** (routes unchanged: `/insights`, `/me`). The "You" screen title matches its tab. Screen ownership is one rule (`src/lib/nav-owner.ts`): day detail under History; reports, doctor, experiments and journey under Patterns; health, Learn and upgrade under You; a review opened from History stays under History.
    - **Strength scale and score marks in silver greys**, light to dark, always with the number. **The NHS warning signs keep the existing red** (with an icon and text), as the package allows for safety; nothing else is red except destructive actions.
    - **Homepage:** the approved tagline and copy are kept. While sign-ups are closed for testing, the main button is "Sign in", not "Get started" (the package: Get started only when sign-up is open). The picture is a real screenshot of Today with sample entries, captioned as such.
    - **About page (new):** only facts already true of the product (intended use, how it works, privacy promises). Nothing was invented, and Contact still has no form. Open: decision D11 (company name and a monitored support address).
    - **Defect found while restyling (also on the live site):** a global link colour rule outranked the button text colour, so filled link buttons ("Get started", "See what Pro adds", "Download PDF", "Go to Today") showed their text in the same colour as their background. Fixed by moving element defaults into the base layer; a browser test now checks every filled button and link for readable text.

22. **Publishing the testing preview only after checks (22 Nov 2026).** The owner asked that a successful build alone is never treated as a tested release. `vercel.json` switches off Vercel's automatic Git builds; `.github/workflows/preview.yml` publishes only after the local suites (typecheck, lint, rule, API and browser tests) and six account-free hosted checks on the new, not-yet-public deployment pass, then confirms which deployment the address serves. The signed-in hosted suite stays manual, because it needs owner-approved accounts. The only secret is `VERCEL_TOKEN`, held by GitHub (added by the owner on 22 Nov); without it nothing is published (fail closed).
23. **"Check and finish" after a lost account-deletion reply (22 Nov 2026).** If the session is no longer accepted, the app treats the deletion as done, because only a completed deletion (or a separate sign-out) ends the session at that moment. The person is then signed out and sent to the start page, as after a normal deletion. Rare exception: if the session ended for another reason at that same moment (for example, signing out everywhere from another device), the account may still exist, and signing in again would show it.
24. **Deleting an account removes kept photos first, and only then the account (23 Nov 2026).** The server holds no storage key (choice 1), so once an account is gone nothing may remove its files. The route therefore removes the photo folder with the person's own sign-in, retries on its own (4 attempts, about 2.5 seconds) and checks the folder is empty before deleting the account. If storage keeps failing, the account and diary are not deleted, but photos already removed before the failure stay removed; the person sees "That didn't work. Nothing was deleted. Try again." (not exact in that case: decision D20) and the founder gets a `photo_cleanup_failed` alert (counts only). The plan's background "deletion job" would need a server storage key, a new secret: decision D18.


## Open decisions

Only questions still waiting for the owner, grouped by **who can use the affected feature on the preview today** (not by price). Anything in the first three groups is already in front of testers, and anyone who opens the preview addresses can see the public pages; decide those before more people use them. The last group is switched off, paused or not built; decide those before switching the feature on. Until a decision is made, the app keeps the "built now" behaviour.

**On now for every signed-in tester**

| # | Decision | Built now | Recommended default, and why |
|---|---|---|---|
| D1 | "Is it still happening?" after an answer of Yes or Not sure | Asked again on every app open while the record has been open 8 hours or more | Ask again only after another 8 hours: fewer repeat prompts; the open record and its safety wording are unchanged |
| D2 | Countries not yet reviewed (`not_reviewed`), and the two "paused" sentences | Not blocked; the sentences are new wording | Block them on a live site until marked ready (fail closed); keep the preview open. Approve the sentences or edit them |
| D18 | Account deletion during a storage outage | Photos first, then the account; on failure the account and diary stay and the person tries again | Keep for now. For `bloat-live`, add a background deletion job with a server storage key (a new secret), as the plan describes |

**On now for everyone, signed out too (public pages)**

| # | Decision | Built now | Recommended default, and why |
|---|---|---|---|
| D8 | "English only" note on the help page (test Q70) | Not shown | Approve one plain sentence saying the page is in English only: honest for Canada and India |
| D11 | Company name and a monitored support address (About, Contact) | Left out | No default possible: needed for Contact to be real |
| D12 | Legal text: template service for Terms and Privacy (Gate 1) | Honest stub pages saying this is a preview | Choose a template service and replace the stubs before people outside use the app |

**On now for Pro testers** (the designated Pro test accounts; no purchase is possible on the preview)

| # | Decision | Built now | Recommended default, and why |
|---|---|---|---|
| D4 | Seven card wording corrections | Old wording; proposals in `docs/content/proposed-corrections-2026-11-18.md` | Approve the proposals: each is closer to its source; a person opens the CDC page first |
| D7 | Who checks every card source link | Checked automatically only | You or a clinician open each link once: automated checks cannot judge the content |
| D9 | Kept photos of a deleted meal, and after switching "Keep my meal photos" off | They stay until the account is deleted | Remove a meal's kept photo with the meal, and remove kept photos when the switch goes off: keep only what the person chose to keep |
| D13 | "Worth watching" when bloating is lower with an item | Both directions count; text states the two averages, never "protective" | Keep as built: neutral, and it follows the data either way |
| D14 | One conflicting day pauses all comparisons | Strict, as the plan's first comparison state | Keep the plan's rule for now; revisit with tester feedback |
| D15 | Medicine "sensitivity view" (test Q21) | Shading and the 14 days before and after, no second comparison | Add one line repeating the comparison without the 14 days after any medicine change, with the number of days left out |
| D16 | Learn articles | Outlines only, as in the plan | Keep outlines until you supply sources and approve the wording: no new health text without them |
| D20 | The message after a failed account deletion, when some kept photos were already removed | "That didn't work. Nothing was deleted. Try again." The account and diary are intact, but photos removed before the failure stay removed | Say instead that the account and diary were not deleted and some kept photos may already be gone (new wording, needs your yes) |

**Not on for anyone** (off, paused, hidden or not built)

| # | Decision | Built now | Recommended default, and why |
|---|---|---|---|
| D3 | AI failure alert threshold (test Q183) | Failures counted, no alert; the preview uses the labelled mock, real AI is off | Alert when 20% or more of at least 10 checks fail within an hour: catches an outage, ignores a single failure. Decide before real AI is switched on |
| D5 | Kiwifruit experiment and card | Paused, card unpublished | Keep paused unless you approve the BDA 2025 correction (2 to 3 peeled kiwifruit a day, 28 days) |
| D6 | Two cards with no linkable source ("Gentle stretch", "Wind down for sleep") | Unpublished drafts | Leave unpublished until you supply a source |
| D10 | A founder change and its audit record are two database steps | Founder tools are off on the preview (no staff address); double taps fixed | Make them one transaction (one small new migration) before founder tools are switched on |
| D17 | Custom habits (plan A13: logged, not compared) | Not built | Leave out; add if testers ask |
| D19 | Business entity and payment provider (Gate 2) | Payments off; mock billing on the preview | No default: needed before any real payment |

## Settled (kept for the record, not reopened)

- **Light-only design** (owner, 22 Nov 2026): the approved light theme, no dark mode. Closed.
- Pregnancy and the gentle stretch card: FX-01 only (test Q159, the later rule).
- Doctor line: only "I've spoken to a doctor about this", for 90 days (v4.4 replaces the older 30-day "Not now").
- The swap safety check must be newer than the last swap experiment ("asked before each swap").
- Optional profile cards PF-01 to PF-06, ON-03 and the Day 1/3/7/14 screens: not built (owner's earlier decision).
- Quarterly summary: later, as the plan labels it (a snapshot is stored every 90 days of Pro; no screen).
- Help page version stays `nhs-bloating-2026-11-07` (the advice did not change).
- `docs/design/` stays (the owner added the Silver package there).
- Region for `bloat-live`: `us-east-1` (owner's earlier answer).
