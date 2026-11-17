# Decisions

Choices made while building, with the reason. "Needs the owner" means: please say yes or no.

## The owner's instruction for this build (16 Nov 2026)

- Empty the repo and build the whole product autonomously from the two PDFs. Done: everything was removed in commit `a85c11a`; the earlier planning pack is still in git history at `8d2d4d7`.
- Kept or brought back, and why: the two PDFs (they are the source, and no other copy was attached); the three JSON files (extracted again from the PDF with `pdfdetach`, identical by hash); `docs/design/` (tokens, design rules and the 20 approved Slice A screens, because the mission says to use existing design assets). **Needs the owner:** say if you wanted `docs/design/` gone too.
- Carried over from the earlier decisions file, because they were your answers: no streak display; Lucide outline icons with a word; the two fixed closing lines; "cause" only inside the fixed sentences; brand name stays "Bloat"; the progress counter needs 14 confirmed days (2 × 7).

## Engineering choices

1. **All writes go through one server-only database function (`srv_tx`).** Browsers hold a sign-in token, so anyone could call the database directly. To stop that from skipping Pro checks, safety checks or validation, signed-in users can only read their own rows; every write needs a server secret. This also makes each save one transaction. No Supabase service key is used or needed.
2. **Day status, scores and comparisons are worked out when asked for**, from the current records, with a rule version. Nothing derived is stored except report snapshots. This replaces the plan's `comparisons` table and recompute queue (B02) and makes "an old job overwrites a new result" impossible. Acceptance test Q56 is therefore marked not built as written.
3. **Cards and Learn content live in the repo** (`content/`), checked by a schema that refuses to publish anything without a source link. The founder publishing screen is not built.
4. **TypeScript 6** instead of 7: the linter does not support 7 yet.
5. **`@anthropic-ai/sdk`** added for the real ingredient check (the plan names Claude Haiku 5.5). `server-only` added to keep server files out of the browser bundle. `lucide-react` for icons.
6. **Test-only switches**, all off unless `BLOAT_TEST_LOGIN=1`: password sign-in for `@example.com` accounts, a labelled mock purchase, and a fixed clock header for time tests. Never set on a live site.
7. **The comparison period starts on the first day anything was recorded** (within the last 92 days), so "both halves" describes time the diary was in use.
8. **Founder tools (`/admin`) need a staff account and a second sign-in step.** The account's email must be in `BLOAT_STAFF_EMAILS`, and the session must have passed an authenticator app code (TOTP). The old shared token is removed. Every founder read and change is written to the audit log as metadata only. Synthetic test addresses only count as staff when `BLOAT_TEST_LOGIN=1`. Founder tools stay off on the preview until the owner names a staff address. Not built: staff roles, forced re-check after a time limit, recovery if the phone is lost (for now: remove the factor in the Supabase dashboard).

9. **Pausing a country** (plan: "capability off with explanation; rights workflows kept"). A founder can set `recording` or `payments` to suspended or retired for one country. Then new entries, ingredient checks, new experiments and purchases answer "paused" with a plain explanation. Reading, finishing an open episode, corrections, export and account deletion keep working. The check runs on every request. The seed status `not_reviewed` does **not** block anything on the preview. **Needs the owner:** before launch, should `not_reviewed` block a country until it is marked ready? The two explanation sentences are new wording (`src/server/http.ts`); please approve or change them.
10. **AI failure alert (test Q183): needs the owner.** The plan asks for an alert when the AI failure rate is "above threshold" but gives no number. Nothing was invented. Suggested for your yes or no: alert the founder when 20% or more of at least 10 checks failed in the last hour. Until you choose, failures are only counted in the founder tools.

11. **Help page says "quoted word for word" but is adapted: needs the owner.** The app shows the Master Plan's stored text exactly. That text keeps every NHS warning sign, but the wording is adapted for US, Canada and India (for example "pass gas" for "fart", "contact a doctor today or go to urgent care" for "urgent GP appointment or call 111"). The source line still says "quoted word for word". Nothing was changed. Choose one: (a) keep the adapted text and change the source line to something like "Adapted from NHS, Bloating"; or (b) use the NHS sentences exactly, changing only the emergency and urgent-care routes. Details: `docs/content/source-check-2026-11-17.md`.
12. **Kiwifruit card moved to draft** (17 Nov 2026). Its only source, the BDA constipation page, now answers "not found", and no other BDA page mentions kiwifruit. A card is never shown without a working source, so nobody sees it now. To bring it back: supply a working source and set `status` back to published in `content/cards.ts`. **Needs the owner:** the kiwifruit habit experiment names the same source ("BDA 2025", no link). It is unchanged and still offered (behind its allergy and FX-03 checks). Say whether to keep it, pause it, or give it a new source.
13. **Card wording gaps found by the source check: needs the owner.** Not changed, because card wording comes from the plan: "about 8 cups" where the BDA says "at least eight"; the massage card's "light, circular strokes for a few minutes" is not on the NHS page; the fibre card leaves out the BDA's "with at least 150ml of fluid" for linseeds; "protein bars" is the card's own example. The CDC page (150 minutes of activity) refuses automated requests and needs a person to check it.

## Where the plan was unclear and what was built (needs the owner)

1. **"Worth watching" for a negative difference.** The plan says a difference of 1 point or more in the same direction in both halves. Built: either direction counts, and the text only states the two averages. Never "protective".
2. **A conflicting day blocks comparisons** until corrected (the plan's first comparison state). This is strict: one bad day pauses all results. Say if you would rather just leave that day out.
3. **Pregnancy and the gentle stretch card.** A02 hides it using ON-10 or FX-01; test Q159 says ON-10 must never affect card choice. Built: FX-01 only (the later rule).
4. **Two cards have no linkable source** in the plan ("Gentle stretch": activity guidance; "Wind down for sleep": general wellbeing). They are drafts and are not shown. 18 cards are published. Please supply a source for each, or drop them.
5. **Source links on cards** were written from the source names in the plan (NHS, NIDDK, BDA, the two trials, CDC). **They have not been opened and checked.** Please check each before Gate 1.
6. **Learn articles are outlines only**, exactly as in the plan. Writing the articles is new health wording and needs your yes and your sources.
7. **Doctor line "Not now".** Section 0.1 mentions a 30-day "Not now"; v4.4 (later) only has "I've spoken to a doctor about this" for 90 days. Built: v4.4 only.
8. **Kiwifruit experiment** is offered only when constipation has been logged, FX-03 is No, and no coeliac, allergy or Crohn's/colitis is in the health background.
9. **The swap safety check must be newer than the last swap experiment.** That is how "asked before each swap" is enforced.
10. **Terms, Privacy and Contact pages are honest stubs** that say this is a preview. Real legal text is a Gate 1 item (plan D02).
11. **Optional profile cards PF-01 to PF-06, ON-03, and the Day 1/3/7/14 screens are not built** (as in your earlier decision).
12. **Custom habits** (plan A13: can be logged, not compared) are not built.
13. **Quarterly summary** is labelled "later" in the plan. A snapshot is stored every 90 days of Pro; there is no screen.
14. **"English only" note on the help page (Q70)** is not shown: the words need your yes.

## Still open in the plan itself

Business entity and payment provider (Gate 2); legal template service (Gate 1); region for `bloat-live` (earlier answer: `us-east-1`).
