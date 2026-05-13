import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { budget_resets } from '@/lib/schema'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const resetAt = new Date()

  await db.insert(budget_resets).values({
    user_id: session.user.id,
    reset_at: resetAt,
  })

  return NextResponse.json({ ok: true, resetAt: resetAt.toISOString() })
}
