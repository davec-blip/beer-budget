import { db } from '../lib/db'
import { users } from '../lib/schema'
import bcrypt from 'bcryptjs'

const seedUsers = [
  {
    username: 'Dave',
    password: 'test123',
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
    console.log(`Seeded user: ${u.username}`)
  }
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
