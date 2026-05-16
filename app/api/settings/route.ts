import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, rate_changes } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as { accrualRate?: number; timezone?: string }
  const updates: Partial<{ accrual_rate: string; timezone: string }> = {}

  if (body.accrualRate !== undefined) {
    if (body.accrualRate < 0) return NextResponse.json({ error: 'Invalid rate' }, { status: 400 })
    updates.accrual_rate = body.accrualRate.toFixed(2)
  }

  if (body.timezone !== undefined) {
    updates.timezone = body.timezone
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  await db.update(users).set(updates).where(eq(users.id, session.user.id))

  // When the accrual rate changes, insert a rate_changes row so future budget
  // calculations use the new rate without retroactively affecting history.
  if (body.accrualRate !== undefined) {
    await db.insert(rate_changes).values({
      user_id: session.user.id,
      rate: body.accrualRate.toFixed(2),
      effective_from: new Date(),
    })
  }

  return NextResponse.json({ ok: true })
}
