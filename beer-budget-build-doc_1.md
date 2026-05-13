# Beer Budget — Build Document

## Prerequisites Checklist

Complete these steps before starting Claude Code. Everything else in this doc is handled by Claude Code.

### 1. Create the Vercel project
- Push an empty Next.js repo to GitHub (`npx create-next-app@latest beer-budget`)
- Import it at vercel.com → "Add New Project"

### 2. Add Neon via Vercel Storage
- In your Vercel project dashboard → **Storage** tab → **Create Database** → **Neon**
- This creates the Neon project and automatically injects `DATABASE_URL` (pooled) into your Vercel environment variables

### 3. Set remaining environment variables in Vercel
In Vercel project → **Settings** → **Environment Variables**, add:
```
NEXTAUTH_SECRET=     # run: openssl rand -base64 32
NEXTAUTH_URL=        # https://your-app.vercel.app
```

### 4. Create a local `.env.local`
Copy the same three variables into `.env.local` at the project root so the seed script can run locally against the Neon DB:
```
DATABASE_URL=        # copy from Vercel Storage dashboard
NEXTAUTH_SECRET=     # same value as above
NEXTAUTH_URL=        # http://localhost:3000
```

### 5. That's it
Hand the rest to Claude Code.

---

## Overview

A personal drink-tracking web app where users manage a running "beer budget" that accrues daily and decrements when drinks are logged. Multi-user, auth-gated, hosted on Vercel with a Neon PostgreSQL backend.

---

## The 8am Day Boundary

A core concept throughout this app: **a "day" runs from 8am to 7:59am the next morning**, not midnight to midnight. This handles the common case of logging drinks after midnight — a drink at 1am Sunday belongs to Saturday's log, not Sunday's.

This boundary applies everywhere:
- What date the home screen shows and logs against
- The default date on the Add Entry form
- Budget accrual ticks (one tick per 8am crossing)
- All date labels in the log

A single shared helper drives all of this:

```ts
// lib/date.ts
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { format, subDays } from 'date-fns'

/**
 * Returns the current "log date" for a user — the 8am-bounded day they are in.
 * Before 8am local time, returns yesterday's date.
 */
export function currentLogDate(now: Date, timezone: string): string {
  const zoned = toZonedTime(now, timezone)
  if (zoned.getHours() < 8) {
    return format(subDays(zoned, 1), 'yyyy-MM-dd')
  }
  return format(zoned, 'yyyy-MM-dd')
}

/**
 * Returns the UTC timestamp of 8am on a given log date in the user's timezone.
 * Used to determine if that day's accrual has ticked yet.
 */
export function eightAmUtcForDate(dateStr: string, timezone: string): Date {
  return fromZonedTime(new Date(`${dateStr}T08:00:00`), timezone)
}
```

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Hosting**: Vercel
- **Database**: Neon (PostgreSQL)
- **ORM**: Drizzle ORM
- **Auth**: NextAuth.js (credentials provider — username + password)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Date handling**: `date-fns` + `date-fns-tz`

---

## Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `username` | text (unique) | |
| `password_hash` | text | bcrypt |
| `timezone` | text | IANA tz string, e.g. `"America/New_York"` |
| `accrual_rate` | numeric(5,2) | default `1.00` |
| `created_at` | timestamptz | |

### `drink_logs`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK → users) | |
| `log_date` | date | 8am-bounded date — one row per user per day |
| `drink_count` | integer | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Unique constraint: `(user_id, log_date)`

`log_date` always uses the value returned by `currentLogDate()` — never a raw calendar date. A drink logged at 1am on May 13 has `log_date = '2025-05-12'`.

### `budget_resets`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK → users) | |
| `reset_at` | timestamptz | exact moment of reset |

---

## Seeding Users (Admin)

No self-signup. Users are seeded directly via a seed script at `scripts/seed-users.ts`:

```ts
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import bcrypt from 'bcryptjs'

await db.insert(users).values([
  {
    username: 'alex',
    password_hash: await bcrypt.hash('yourpassword', 10),
    timezone: 'America/New_York',
    accrual_rate: '1.00',
  },
])
```

Run with: `npx tsx scripts/seed-users.ts`

---

## Auth

Use **NextAuth.js** credentials provider. Sessions are JWT-based.

- `app/api/auth/[...nextauth]/route.ts` — standard NextAuth setup
- On login: look up user by username, compare bcrypt hash, return user object with `id` and `username`
- Protect all pages/routes via `getServerSession` or middleware
- Session includes `user.id` for all DB queries

No registration UI — login page only.

---

## Budget Calculation Logic

The budget is always calculated server-side on request, never stored as a running total.

```ts
// lib/budget.ts
import { addDays, format, parseISO } from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'
import { currentLogDate, eightAmUtcForDate } from './date'

export function calculateBudget(
  resetAt: Date,
  accrualRate: number,
  drinkLogs: { log_date: string; drink_count: number }[],
  timezone: string,
  now: Date = new Date()
): number {
  const resetLogDate = currentLogDate(resetAt, timezone)
  const todayLogDate = currentLogDate(now, timezone)

  // Count 8am boundaries that have passed since the reset day (exclusive of reset day)
  let accruedDays = 0
  let cursor = addDays(parseISO(resetLogDate), 1)

  while (format(cursor, 'yyyy-MM-dd') <= todayLogDate) {
    const dateStr = format(cursor, 'yyyy-MM-dd')
    if (now >= eightAmUtcForDate(dateStr, timezone)) accruedDays++
    cursor = addDays(cursor, 1)
  }

  // Sum all drinks since reset
  const totalDrinks = drinkLogs
    .filter(l => l.log_date >= resetLogDate)
    .reduce((sum, l) => sum + l.drink_count, 0)

  // No clamping — budget can go negative
  return accruedDays * accrualRate - totalDrinks
}

/**
 * Builds a day-by-day budget snapshot since the most recent reset.
 * windowDays is undefined for all-time.
 */
export function buildBudgetLog(
  resetAt: Date,
  accrualRate: number,
  drinkLogs: { log_date: string; drink_count: number }[],
  timezone: string,
  now: Date = new Date(),
  windowDays?: number
): { date: string; budget: number; delta: number }[] {
  const resetLogDate = currentLogDate(resetAt, timezone)
  const todayLogDate = currentLogDate(now, timezone)

  const drinkMap = Object.fromEntries(
    drinkLogs.map(l => [l.log_date, l.drink_count])
  )

  const rows: { date: string; budget: number; delta: number }[] = []
  let runningBudget = 0
  let cursor = addDays(parseISO(resetLogDate), 1)

  while (format(cursor, 'yyyy-MM-dd') <= todayLogDate) {
    const dateStr = format(cursor, 'yyyy-MM-dd')
    const accrual = now >= eightAmUtcForDate(dateStr, timezone) ? accrualRate : 0
    const drinks = drinkMap[dateStr] ?? 0
    const delta = accrual - drinks
    runningBudget += delta
    rows.push({ date: dateStr, budget: runningBudget, delta })
    cursor = addDays(cursor, 1)
  }

  return windowDays ? rows.slice(-windowDays) : rows
}
```

---

## API Routes

All routes are Next.js Route Handlers under `app/api/`. All require a valid session — return 401 otherwise.

### `GET /api/budget`
Returns current budget, current log date, today's logged count, and user settings.

`logDate` is derived from `currentLogDate(new Date(), user.timezone)` — before 8am this is yesterday's date.

Response:
```json
{
  "budget": 4.0,
  "logDate": "2025-05-12",
  "todayCount": 2,
  "accrualRate": 1.0,
  "timezone": "America/New_York",
  "resetAt": "2025-04-01T00:00:00Z"
}
```

### `POST /api/drinks`
Upsert a drink count for a given log date.

Body: `{ "date": "2025-05-12", "count": 2 }`

The client always sends the `logDate` value from `GET /api/budget` for home-screen submissions — never a raw `new Date()` string.

Response: `{ "ok": true, "newBudget": 2.0 }`

### `GET /api/drinks`
Returns all drink log entries since the most recent reset (descending), plus all reset events for rendering inline markers.

Response:
```json
{
  "logs": [
    { "date": "2025-05-12", "count": 2 },
    { "date": "2025-05-09", "count": 3 }
  ],
  "resets": [
    { "resetAt": "2025-04-01T00:00:00Z" }
  ]
}
```

### `PUT /api/drinks/:date`
Edit a specific log entry. Overwrite confirmation handled client-side before calling.

Body: `{ "count": 4 }`

### `GET /api/budget-log`
Returns day-by-day budget snapshot via `buildBudgetLog()`.

Query: `?window=7|30|90|all`

Response:
```json
[
  { "date": "2025-05-12", "budget": 4.0, "delta": -1.0 },
  { "date": "2025-05-11", "budget": 5.0, "delta": 1.0 }
]
```

### `POST /api/reset`
Inserts a new `budget_resets` row at current UTC time.

Response: `{ "ok": true, "resetAt": "2025-05-12T14:00:00Z" }`

### `PATCH /api/settings`
Update user settings.

Body: `{ "accrualRate": 1.25, "timezone": "America/Chicago" }`

Response: `{ "ok": true }`

---

## Pages & Components

### `/login`
- Username + password form
- Calls `signIn('credentials', ...)` from NextAuth
- Redirects to `/` on success
- No registration link

### `/` (Home)
State from `GET /api/budget` on load.

- Date label at top, large and centered. Uses `logDate` from API — shows yesterday before 8am. Format: "Tuesday, May 12"
- Budget number (large, centered):
  - Green (`#1D9E75`) when positive
  - Amber (`#BA7517`) when exactly 0
  - Red (`#E24B4A`) when negative
- Label: "beers in budget"
- Divider
- Today's drinks section (centered):
  - Counter pre-loaded with `todayCount`
  - `−` / `+` buttons
  - Label: "Today's drinks" at 0; "X drinks so far today" when > 0
  - Submit button — disabled until counter differs from loaded `todayCount`
  - On submit: `POST /api/drinks` with `{ date: logDate, count }`, optimistic budget update
- Bottom nav: Home, Log, Settings

### `/log`

**Drinks tab:**
- "Add entry" → `/log/new`
- Merged + sorted list of drink entries and reset markers
- Reset rows: `↺  Budget reset — Apr 1, 2025` (muted gray, non-interactive)
- Grouped "Past 7 days" / "Older" using 8am-bounded current date
- Each drink row tappable → `/log/[date]`

**Budget tab:**
- Window toggle: `7d | 30d | 90d | All` pills at top — refetches `GET /api/budget-log?window=N`
- "Show / hide chart" toggle
- Chart (Recharts `LineChart`): date on X, budget value on Y, green line + soft area fill
- Day-by-day list below:
  - Date | delta pill (green / red / gray) | budget value (green / amber / red)

### `/log/new`
- Back → `/log`
- Date picker defaulting to `currentLogDate()` in user's timezone
- Drink count input (integer, min 0)
- If date already in log: inline overwrite confirmation before saving
- On save: `POST /api/drinks` → redirect `/log`

### `/log/[date]`
- Same as Add, pre-filled with existing values
- Always shows overwrite confirmation

### `/settings`
- **Budget:**
  - Accrual rate stepper: `−` / `+`, step 0.25, min 0.25. Auto-saves on change
  - "Budget started": shows reset date, tappable → date picker. Selecting a date inserts a `budget_resets` row with `reset_at` = 8am of that date in user's timezone
- **Account:**
  - Timezone: searchable dropdown via `Intl.supportedValuesOf('timeZone')`. Auto-saves
  - "Signed in as [username]"
  - Sign out
- **Danger zone:**
  - "Reset budget to 0" red button, confirmation modal → `POST /api/reset`

---

## Key Behaviours

### 8am boundary — rule of thumb
Every reference to "today" or a current date in the app calls `currentLogDate(now, user.timezone)`. Raw `new Date()` is never formatted directly into a date string for log purposes.

### Counter state on home load
Initialises to `todayCount`. Submit disabled until value changes. Submit always upserts — no separate edit path from home screen.

### Reset markers in log
`GET /api/drinks` returns both arrays. Client merges and sorts by date descending, rendering resets as visual separators.

### Overwrite confirmation
Client-side only. Check loaded log list before calling `PUT /api/drinks/:date`. If date exists, show confirmation. If not, save directly.

### Rate / timezone change behaviour
- Timezone change: recalculated from scratch on next request using new timezone
- Rate change: new rate applies to entire period since last reset

---

## Project Structure

```
/app
  /api
    /auth/[...nextauth]/route.ts
    /budget/route.ts
    /budget-log/route.ts
    /drinks/route.ts
    /drinks/[date]/route.ts
    /reset/route.ts
    /settings/route.ts
  /(auth)
    /login/page.tsx
  /(app)
    /page.tsx
    /log/page.tsx
    /log/new/page.tsx
    /log/[date]/page.tsx
    /settings/page.tsx
  layout.tsx
/lib
  db.ts
  schema.ts
  auth.ts
  budget.ts
  date.ts
/scripts
  seed-users.ts
/components
  BudgetDisplay.tsx
  DrinkCounter.tsx
  BudgetLogChart.tsx
  ResetMarker.tsx
  WindowToggle.tsx
  TimezoneSelect.tsx
```

---

## Environment Variables

```
DATABASE_URL=        # Neon pooled connection string (auto-injected by Vercel integration)
NEXTAUTH_SECRET=     # openssl rand -base64 32
NEXTAUTH_URL=        # https://your-app.vercel.app
```

---

## Deployment Notes

- `DATABASE_URL` is injected automatically when Neon is added via Vercel's Storage tab
- Run `npx drizzle-kit push` to apply schema to Neon before first deploy
- Run seed script locally with `DATABASE_URL` in `.env.local`
- Write unit tests for `currentLogDate()` and `calculateBudget()` covering the pre-8am edge case before deploying
