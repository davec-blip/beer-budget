import { db } from './db'
import { rate_changes, users } from './schema'
import { eq } from 'drizzle-orm'
import type { RateSchedule } from './budget'

/**
 * Fetches the rate schedule for a user.
 * Falls back to a single entry using users.accrual_rate at epoch
 * so existing users without rate_changes rows still work correctly.
 */
export async function getRateSchedule(userId: string, fallbackRate: string): Promise<RateSchedule> {
  const rows = await db
    .select({ rate: rate_changes.rate, effective_from: rate_changes.effective_from })
    .from(rate_changes)
    .where(eq(rate_changes.user_id, userId))

  if (rows.length === 0) {
    return [{ rate: parseFloat(fallbackRate), effective_from: new Date(0) }]
  }

  return rows.map((r) => ({ rate: parseFloat(r.rate), effective_from: r.effective_from }))
}
