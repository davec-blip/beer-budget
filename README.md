# Beer Budget

A drink-tracking app with a daily accrual budget. Built with Next.js 14, Neon PostgreSQL, Drizzle ORM, and NextAuth.js.

## User accounts

| Username | Password  |
|----------|-----------|
| Dave     | test123   |
| test     | test      |
| john     | beerboy   |
| annika   | beers     |
| sidney   | beers2    |

## Admin scripts

All scripts require a local `.env.local` file with `DATABASE_URL` set to the Neon connection string.

### Add or update users

```bash
node --env-file=.env.local ./node_modules/.bin/tsx scripts/seed-users.ts
```

Inserts users if they don't exist, skips existing ones. Also backfills `budget_resets` and `rate_changes` rows for new users.

### Reset a user's password

```bash
node --env-file=.env.local ./node_modules/.bin/tsx scripts/reset-password.ts <username> <new-password>
```

Example:

```bash
node --env-file=.env.local ./node_modules/.bin/tsx scripts/reset-password.ts annika newpassword
```

### Push schema changes to Neon

```bash
npm run db:push
```

## Environment variables

| Variable        | Description                              |
|-----------------|------------------------------------------|
| `DATABASE_URL`  | Neon PostgreSQL connection string        |
| `NEXTAUTH_URL`  | Canonical app URL (e.g. `https://beer-budget.vercel.app`) |
| `NEXTAUTH_SECRET` | Random secret for NextAuth JWT signing |

## Development

```bash
npm install
npm run dev
```

App runs at `http://localhost:3000`. The 8am boundary means a new log day starts at 8am in each user's configured timezone.
