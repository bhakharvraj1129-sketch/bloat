# Deployment

Nothing is public. A private preview exists. This file says how it is set up and what is still needed.

## State on 17 Nov 2026

| Part | State |
|---|---|
| GitHub | Branch `claude/bloat-software-build-uxzoru` on `bhakharvraj1129-sketch/bloat`. No pull request. |
| Supabase `bloat-test` (`qntazirusbuwfmnmihzu`) | Four migrations applied through the Supabase connector: `20261117051631 foundation`, `20261117051734 server_functions`, `20261117051738 synthetic_test_users`, `20261117061403 country_capability_set`. The file names in `supabase/migrations/` carry the same versions. Nine schema fingerprints (columns, constraints, indexes, policies, RLS flags, functions, grants) were compared between a local database built from the files and the hosted one: identical. |
| The one data change outside migrations | One row in `private.server_secrets` named `preview-2026-11-17`, holding only the SHA-256 hash of the preview secret. This is step 2 below. The secret itself is not in the database or the repo. |
| Vercel | Team `typeshi2`, project `bloat`. Builds every push to the branch as a Preview. Vercel Authentication is on for all preview URLs. Framework Next.js, Node 22. Stable URL: `https://bloat-git-claude-bloat-software-build-uxzoru-typeshi2.vercel.app`. |
| Vercel variables (Preview only) | Set: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `BLOAT_AI_PROVIDER=mock`, `BLOAT_BILLING_PROVIDER=mock`, `BLOAT_TEST_LOGIN=1`, and `BLOAT_SERVER_SECRET` (added by the owner, Sensitive). |
| Duplicate project | `bloat-zlrr` is a second Vercel project on the same repo. Untouched and unused. Safe for the owner to delete. |
| AI key, Resend, Sentry, Google sign-in, payments | Not connected. Production has no variables and is not used. |

## Open it on your phone (owner)

1. On the phone, open a browser and sign in at vercel.com with the same account you use on the computer.
2. Open `https://bloat-git-claude-bloat-software-build-uxzoru-typeshi2.vercel.app`.
3. Tap Get started, choose a country, read the help page, then use an address ending in `@example.com` with any test password of 8 or more characters. No email is sent.
4. To install it: in Chrome tap the menu then "Add to Home screen"; in Safari tap Share then "Add to Home Screen".

For someone without a Vercel account, ask Claude for a temporary share link. It lasts 23 hours and anyone holding it can open the preview, so treat it like a password. Use made-up data only.

## Environment variables

Names are in `.env.example`. Never commit values.

| Name | Where | What |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser and server | The `bloat-test` project URL and its publishable key. Safe in the browser. |
| `BLOAT_SERVER_SECRET` | server only | A long random value. Its SHA-256 hash must be in `private.server_secrets`. Without it nothing can be saved. |
| `BLOAT_AI_PROVIDER`, `BLOAT_AI_MODEL`, `ANTHROPIC_API_KEY` | server only | `mock` by default. `anthropic` plus a key for the real check. Only approved models run. |
| `BLOAT_BILLING_PROVIDER`, `BLOAT_BILLING_WEBHOOK_SECRET` | server only | `mock` only. |
| `BLOAT_STAFF_EMAILS` | server only | Comma-separated email addresses allowed into `/admin` (founder tools). Each also needs an authenticator app code. Leave empty to switch founder tools off. Not set on the preview. |
| `BLOAT_TEST_LOGIN` | server only | `1` on previews with synthetic accounts. Never on a live site: it also enables the mock purchase and the test clock. |

## Set up a preview from scratch

1. Apply every file in `supabase/migrations/` to `bloat-test`, in order.
2. Make a server secret and store only its hash in the database:

```sql
insert into private.server_secrets (name, sha256_hex)
values ('preview', encode(sha256(convert_to('<the secret>', 'utf8')), 'hex'));
```

3. In Supabase Auth settings: add the preview URL to the redirect list; put `{{ .Token }}` in the Magic Link and Confirm sign-up email templates (see `supabase/templates/code.html`) so the email shows a 6-digit code; switch on Google if wanted.
4. Create a Vercel project from this repo, framework Next.js, and add the variables above for Preview. Turn on Vercel's deployment protection so the preview is private.
5. Open the preview, sign up with the test sign-in, and run through Today, History and Me.
6. Run the hosted browser tests: `HOSTED_URL=<preview URL> HOSTED_SHARE_URL=<Vercel share link> pnpm test:hosted`. The share link is temporary and is never committed.

Synthetic accounts on a preview are made by `srv_test_user`, which only accepts `@example.com` and `@bloat.test` addresses and needs the server secret. No email is sent.

## Replace a key

Make the new key, set it in Vercel, redeploy, check one request works, then delete the old key at the provider. For `BLOAT_SERVER_SECRET`: insert the new hash first, deploy the new value, then delete the old row from `private.server_secrets`.

## Never without the owner's yes

Production promotion, `bloat-live`, real users, real payments (`checkout_enabled` stays false until Gate 2; the founder tools refuse to switch it on).
