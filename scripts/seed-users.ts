import { db } from '../lib/db'
import { users, budget_resets, rate_changes } from '../lib/schema'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { subDays } from 'date-fns'

const seedUsers = [
  {
    username: 'Dave',
    password: 'test123',
    timezone: 'America/New_York',
    accrual_rate: '1.00',
  },
  {
    username: 'test',
    password: 'test',
    timezone: 'America/New_York',
    accrual_rate: '1.00',
  },
  {
    username: 'john',
    password: 'beerboy',
    timezone: 'America/New_York',
    accrual_rate: '1.00',
  },
  {
    username: 'annika',
    password: 'beers',
    timezone: 'America/New_York',
    accrual_rate: '1.00',
  },
  {
    username: 'sidney',
    password: 'beers2',
    timezone: 'America/New_York',
    accrual_rate: '1.00',
  },
]

async function main() {
  for (const u of seedUsers) {
    const password_hash = await bcrypt.hash(u.password, 10)
    await db
      .insert(users)
      .values({
        username: u.username,
        password_hash,
        timezone: u.timezone,
        accrual_rate: u.accrual_rate,
      })
      .onConflictDoNothing()

    const [user] = await db.select().from(users).where(eq(users.username, u.username)).limit(1)

    const existingResets = await db
      .select()
      .from(budget_resets)
      .where(eq(budget_resets.user_id, user.id))
      .limit(1)

    if (existingResets.length === 0) {
      await db.insert(budget_resets).values({
        user_id: user.id,
        reset_at: subDays(new Date(), 7),
      })
      console.log(`Set budget start to 7 days ago for: ${u.username}`)
    } else {
      console.log(`Budget reset already exists for: ${u.username}, skipping`)
    }

    // Ensure each user has at least one rate_changes row (epoch = "since the beginning")
    const existingRates = await db
      .select()
      .from(rate_changes)
      .where(eq(rate_changes.user_id, user.id))
      .limit(1)

    if (existingRates.length === 0) {
      await db.insert(rate_changes).values({
        user_id: user.id,
        rate: u.accrual_rate,
        effective_from: new Date(0),
      })
      console.log(`Inserted initial rate_changes row for: ${u.username}`)
    } else {
      console.log(`Rate changes already exist for: ${u.username}, skipping`)
    }

    console.log(`Seeded user: ${u.username}`)
  }
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
