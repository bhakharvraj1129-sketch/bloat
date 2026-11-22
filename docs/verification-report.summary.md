## Results at a glance

**Application commit: `2f22cc4`** (22 Nov 2026). Two builds are involved, and they are kept apart:

- **Local results** below ran on this workspace's files. Their app code is exactly `2f22cc4`: it included the coverage endpoint that `.gitignore` had hidden from every commit until `2f22cc4` (section 4, defect 8).
- **The public preview serves `af950f5`** (deployment `dpl_FDVnqFxAx4MHaGhq9g9HLiim7Tzj`), which lacks that one endpoint. No screen calls it. `2f22cc4` is not published: the new publishing gate needs the owner's `VERCEL_TOKEN` first (section 9).

Words used: **Passed** (the outcome was checked and was right), **Failed**, **Skipped** (left out on purpose, with the reason), **Blocked** (could not run; the reason is given), **Not done**.

### Local evidence (this workspace: local Supabase in Docker, synthetic accounts, test mode on)

| Check | Result |
|---|---|
| Rule tests `pnpm test` | **Passed**, 96 of 96 |
| API tests `pnpm test:api` (real HTTP against the local app), incl. a deleted account's earlier tokens (section 6) | **Passed**, 135 of 135 |
| Browser tests `tests/e2e`, phone screen (Chromium, Pixel 7 size) | **Passed**, 190 of 190, 0 flaky |
| &nbsp;&nbsp;of which save and edit outcomes, 51 actions x 3 plus 6 single checks (section 3) | **Passed**, 159 of 159 |
| Navigation by real clicks, destination and Back, signed-out, Free and Pro, 412px and 1440px (section 2) | **Passed**, 238 clicks: 238 right destination, 238 Back returned |
| Control crawl (section 1) | 1,292 rows: **834 passed** (74 screen loads, 244 clicked and responded, 516 link targets loaded without clicking), 0 failed, 49 skipped on purpose (20 destructive, each covered by a named test; 29 outside links), 409 excluded (332 hidden at phone width, 32 disabled, 45 fields), 0 blocked |
| Five widths, 320 to 1440px | **Passed**, 0 of 185 with sideways scrolling |
| Type check and lint | **Passed**, 0 errors (5 old warnings) |

### CI evidence (GitHub Actions, clean checkout of the commit)

| Check | Result |
|---|---|
| Run 3 on `2f22cc4`: typecheck, lint, rule tests, local Supabase, build, API tests | **Passed** (135 API tests) |
| Run 3 on `2f22cc4`: browser tests | Running when this was written (section 9) |
| Earlier runs 1 and 2 | **Failed**: a workflow setup mistake, then the missing PDF tool and a real defect (section 9); all fixed |

### Hosted evidence (the public preview and the `bloat-test` database)

| Check | Result |
|---|---|
| Account-free checks (6) on `af950f5`, deployment `dpl_FDVnqFxAx4MHaGhq9g9HLiim7Tzj`, 14:36 UTC | **Passed**, 6 of 6 |
| Sign-ups off at the provider (part of the six) | **Passed**: `disable_signup: true`, sign-up refused with 422 |
| Signed-in hosted checks (9), on the served build | **Blocked**: the 7 approved accounts need the old `pro-tester@bloat.test` deleted first, with the 19 (section 7) |
| A deleted account's earlier tokens, on the hosted project | **Blocked**, same reason |
| Deleting the 19 temporary accounts from 19 Nov | **Not done**: list verified again at 18:18 UTC; the delete was sent and its approval prompt timed out (section 8) |
| Publishing steps of the gate (Vercel build, hosted checks on it, moving the addresses) | **Not run**: they need the owner's `VERCEL_TOKEN` (section 9) |

### Manual device evidence

| Check | Result |
|---|---|
| The owner's own sign-in, setup, refresh and sign-out on the preview (22 Nov, before this round's fixes) | Passed, reported by the owner and confirmed from server records (section 7) |
| The main journeys on a real phone with this commit | **Not done.** Checklist for the owner in `PROGRESS.md` |
| iOS Safari, Android Chrome, screen reader, 200% zoom | **Not done** |

### Not claimed

This report does not say that every button or feature works. It says which outcomes were checked, where, and on which build. The actions still checked only partly are listed in section 5. The milestone is **not complete** while the hosted signed-in suite, the account cleanup and the real-phone checks are open.
