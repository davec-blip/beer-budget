import { db } from '../lib/db'
import { users } from '../lib/schema'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'

const [username, newPassword] = process.argv.slice(2)

if (!username || !newPassword) {
  console.error('Usage: tsx scripts/reset-password.ts <username> <new-password>')
  process.exit(1)
}

async function main() {
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1)

  if (!user) {
    console.error(`User not found: ${username}`)
    process.exit(1)
  }

  const password_hash = await bcrypt.hash(newPassword, 10)
  await db.update(users).set({ password_hash }).where(eq(users.id, user.id))

  console.log(`Password reset for: ${username}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
