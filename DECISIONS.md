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
8. **Founder tools (`/admin`) use a single long token**, not staff accounts with MFA. Fine for a private preview. **Must be replaced before any real user** (plan B03).

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
