import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, drink_logs, budget_resets } from '@/lib/schema'
import { eq, desc, and } from 'drizzle-orm'
import { calculateBudget } from '@/lib/budget'
import { getRateSchedule } from '@/lib/rates'

export async function PUT(request: NextRequest, { params }: { params: { date: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { count } = (await request.json()) as { count: number }

  if (typeof count !== 'number' || count < 0) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  await db
    .insert(drink_logs)
    .values({ user_id: user.id, log_date: params.date, drink_count: count })
    .onConflictDoUpdate({
      target: [drink_logs.user_id, drink_logs.log_date],
      set: { drink_count: count, updated_at: new Date() },
    })

  const [latestReset] = await db
    .select()
    .from(budget_resets)
    .where(eq(budget_resets.user_id, user.id))
    .orderBy(desc(budget_resets.reset_at))
    .limit(1)

  const resetAt = latestReset?.reset_at ?? user.created_at

  const allLogs = await db
    .select({ log_date: drink_logs.log_date, drink_count: drink_logs.drink_count })
    .from(drink_logs)
    .where(eq(drink_logs.user_id, user.id))

  const normalizedLogs = allLogs.map((l) => ({
    log_date: String(l.log_date).slice(0, 10),
    drink_count: l.drink_count,
  }))

  const rateSchedule = await getRateSchedule(user.id, user.accrual_rate)
  const newBudget = calculateBudget(resetAt, rateSchedule, normalizedLogs, user.timezone, new Date())

  return NextResponse.json({ ok: true, newBudget })
}
