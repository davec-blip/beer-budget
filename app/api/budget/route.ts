import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, drink_logs, budget_resets } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { calculateBudget } from '@/lib/budget'
import { currentLogDate } from '@/lib/date'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const [latestReset] = await db
    .select()
    .from(budget_resets)
    .where(eq(budget_resets.user_id, user.id))
    .orderBy(desc(budget_resets.reset_at))
    .limit(1)

  const resetAt = latestReset?.reset_at ?? user.created_at
  const now = new Date()
  const logDate = currentLogDate(now, user.timezone)

  const logs = await db
    .select({ log_date: drink_logs.log_date, drink_count: drink_logs.drink_count })
    .from(drink_logs)
    .where(eq(drink_logs.user_id, user.id))

  const accrualRate = parseFloat(user.accrual_rate)
  const budget = calculateBudget(resetAt, accrualRate, logs, user.timezone, now)

  const todayLog = logs.find((l) => l.log_date === logDate)

  return NextResponse.json({
    budget,
    logDate,
    todayCount: todayLog?.drink_count ?? 0,
    accrualRate,
    timezone: user.timezone,
    resetAt: resetAt.toISOString(),
  })
}
