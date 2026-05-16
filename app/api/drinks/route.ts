import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, drink_logs, budget_resets } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { calculateBudget } from '@/lib/budget'
import { getRateSchedule } from '@/lib/rates'

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

  const logs = await db
    .select({ log_date: drink_logs.log_date, drink_count: drink_logs.drink_count })
    .from(drink_logs)
    .where(eq(drink_logs.user_id, user.id))
    .orderBy(desc(drink_logs.log_date))

  const resets = await db
    .select({ resetAt: budget_resets.reset_at })
    .from(budget_resets)
    .where(eq(budget_resets.user_id, user.id))
    .orderBy(desc(budget_resets.reset_at))

  const allLogs = logs.map((l) => ({
    date: String(l.log_date).slice(0, 10),
    count: l.drink_count,
  }))

  return NextResponse.json({
    logs: allLogs,
    resets: resets.map((r) => ({ resetAt: r.resetAt.toISOString() })),
  })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { date, count } = body as { date: string; count: number }

    if (!date || typeof count !== 'number' || count < 0) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    await db
      .insert(drink_logs)
      .values({
        user_id: user.id,
        log_date: date,
        drink_count: count,
      })
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
    const now = new Date()

    const allLogs = await db
      .select({ log_date: drink_logs.log_date, drink_count: drink_logs.drink_count })
      .from(drink_logs)
      .where(eq(drink_logs.user_id, user.id))

    const normalizedLogs = allLogs.map((l) => ({
      log_date: String(l.log_date).slice(0, 10),
      drink_count: l.drink_count,
    }))

    const rateSchedule = await getRateSchedule(user.id, user.accrual_rate)
    const newBudget = calculateBudget(resetAt, rateSchedule, normalizedLogs, user.timezone, now)

    return NextResponse.json({ ok: true, newBudget })
  } catch (err) {
    console.error('POST /api/drinks error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
