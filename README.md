# Bloat

Bloat is an installable mobile web app for adults to record bloating, meals and habits, see patterns in their own records, and bring a clear report to a doctor. It is a general wellness tracker. It does not diagnose, treat or give medical advice.

This repository is a working build from the Bloat Complete Master Plan v4.5 and the Build Guide (both in `docs/source-pdfs/`). It runs with synthetic accounts only. It is not open to the public and cannot take payments.

## What works today

- Sign-up with the help page first, consents, and account setup.
- Log bloating (start, strength readings, end), the nine NHS warning signs, meals, habits, periods and medicines.
- Morning review and the Bloat Score, History, day detail, edit and delete.
- Download my data (JSON and CSV) and delete account.
- Pro (switched on with a labelled mock purchase): ingredient check with a labelled mock AI, saved dishes, bowel and exercise logs, charts and 7-day average, possible triggers, Your journey, weekly report, doctor PDF with share links, experiments, daily cards, Learn library, health background, Keep an eye on it mode, pause and cancel.

See `PROGRESS.md` for what is not finished and `TEST_RESULTS.md` for real test results.

## Run it on your computer

You need Node 22, pnpm and Docker.

```bash
pnpm install
```

```bash
pnpm db:start
```

```bash
cp .env.example .env.local
```

Fill `.env.local` with the local values that `pnpm db:start` prints (API URL and anon key) and set `BLOAT_SERVER_SECRET=local-dev-server-secret-not-for-hosted-use`, `BLOAT_TEST_LOGIN=1`.

```bash
pnpm dev
```

Open http://localhost:3000. Use "Get started", then the "Test sign-in" box with any `@example.com` address and a password of 8 or more characters.

## Words used in this repo

- **Migration**: a file that changes the database, applied in order and never edited afterwards.
- **RLS (Row Level Security)**: a database rule that lets each account see only its own rows.
- **Mock**: a stand-in used for building and testing. It is always labelled as a mock.
- **Idempotency key**: a one-time code sent with each save so a retry never saves twice.
