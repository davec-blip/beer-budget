import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { currentPassword, newPassword } = (await request.json()) as {
    currentPassword: string
    newPassword: string
  }

  if (!currentPassword || !newPassword || newPassword.length < 4) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const valid = await bcrypt.compare(currentPassword, user.password_hash)
  if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 })

  const password_hash = await bcrypt.hash(newPassword, 10)
  await db.update(users).set({ password_hash }).where(eq(users.id, session.user.id))

  return NextResponse.json({ ok: true })
}
