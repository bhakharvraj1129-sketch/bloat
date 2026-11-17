# Deployment

Nothing is live. This file says how a private preview is set up and what is still needed.

## State on 17 Nov 2026

| Part | State |
|---|---|
| GitHub | Branch `claude/bloat-software-build-uxzoru` on `bhakharvraj1129-sketch/bloat`. No pull request. |
| Supabase `bloat-test` | Project exists and is healthy. See PROGRESS.md for whether the migrations have been applied. |
| Vercel | **Blocked.** The Vercel connection needs the owner to approve access to the team `typeshi2`. No project and no preview URL exist. |
| AI key, Resend, Sentry, Google sign-in, payments | Not connected. |

## Environment variables

Names are in `.env.example`. Never commit values.

| Name | Where | What |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser and server | The `bloat-test` project URL and its publishable key. Safe in the browser. |
| `BLOAT_SERVER_SECRET` | server only | A long random value. Its SHA-256 hash must be in `private.server_secrets`. Without it nothing can be saved. |
| `BLOAT_AI_PROVIDER`, `BLOAT_AI_MODEL`, `ANTHROPIC_API_KEY` | server only | `mock` by default. `anthropic` plus a key for the real check. Only approved models run. |
| `BLOAT_BILLING_PROVIDER`, `BLOAT_BILLING_WEBHOOK_SECRET` | server only | `mock` only. |
| `BLOAT_ADMIN_TOKEN` | server only | Turns on `/admin` (founder tools). Leave empty to switch them off. |
| `BLOAT_TEST_LOGIN` | server only | `1` on previews with synthetic accounts. Never on a live site: it also enables the mock purchase and the test clock. |

## Set up a preview (once Vercel access is approved)

1. Apply every file in `supabase/migrations/` to `bloat-test`, in order.
2. Make a server secret and store only its hash in the database:

```sql
insert into private.server_secrets (name, sha256_hex)
values ('preview', encode(sha256(convert_to('<the secret>', 'utf8')), 'hex'));
```

3. In Supabase Auth settings: add the preview URL to the redirect list; put `{{ .Token }}` in the Magic Link and Confirm sign-up email templates (see `supabase/templates/code.html`) so the email shows a 6-digit code; switch on Google if wanted.
4. Create a Vercel project from this repo, framework Next.js, and add the variables above for Preview. Turn on Vercel's deployment protection so the preview is private.
5. Open the preview, sign up with the test sign-in, and run through Today, History and Me.

## Replace a key

Make the new key, set it in Vercel, redeploy, check one request works, then delete the old key at the provider. For `BLOAT_SERVER_SECRET`: insert the new hash first, deploy the new value, then delete the old row from `private.server_secrets`.

## Never without the owner's yes

Production promotion, `bloat-live`, real users, real payments (`checkout_enabled` stays false until Gate 2; the founder tools refuse to switch it on).
