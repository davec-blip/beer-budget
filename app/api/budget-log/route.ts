import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, drink_logs, budget_resets } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { buildBudgetLog } from '@/lib/budget'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const windowParam = searchParams.get('window')

  const windowMap: Record<string, number | undefined> = {
    '7': 7,
    '30': 30,
    '90': 90,
    all: undefined,
  }
  const windowDays = windowMap[windowParam ?? 'all']

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const [latestReset] = await db
    .select()
    .from(budget_resets)
    .where(eq(budget_resets.user_id, user.id))
    .orderBy(desc(budget_resets.reset_at))
    .limit(1)

  const resetAt = latestReset?.reset_at ?? user.created_at

  const rawLogs = await db
    .select({ log_date: drink_logs.log_date, drink_count: drink_logs.drink_count })
    .from(drink_logs)
    .where(eq(drink_logs.user_id, user.id))

  const logs = rawLogs.map((l) => ({
    log_date: String(l.log_date).slice(0, 10),
    drink_count: l.drink_count,
  }))

  const result = buildBudgetLog(
    resetAt,
    parseFloat(user.accrual_rate),
    logs,
    user.timezone,
    new Date(),
    windowDays
  )

  return NextResponse.json(result)
}
