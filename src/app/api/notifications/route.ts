/**
 * src/app/api/notifications/route.ts  (REPLACE existing file)
 * ─────────────────────────────────────────────────────────────
 * GET  /api/notifications        — fetch user's notifications
 * PATCH /api/notifications       — mark as read (body: { ids: number[] } or { all: true })
 * DELETE /api/notifications      — delete a notification (body: { id: number })
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function getUserId(session: any): number | null {
  const id = parseInt((session?.user as any)?.id)
  return isNaN(id) ? null : id
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = getUserId(session)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const unreadOnly = searchParams.get('unread') === 'true'

  const notifications = await prisma.notification.findMany({
    where: { userId, ...(unreadOnly ? { read: false } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })

  const unreadCount = await prisma.notification.count({ where: { userId, read: false } })

  return NextResponse.json({ notifications, unreadCount })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = getUserId(session)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  if (body.all) {
    await prisma.notification.updateMany({ where: { userId }, data: { read: true } })
  } else if (Array.isArray(body.ids)) {
    await prisma.notification.updateMany({
      where: { userId, id: { in: body.ids } },
      data: { read: true },
    })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = getUserId(session)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  await prisma.notification.deleteMany({ where: { id: Number(id), userId } })

  return NextResponse.json({ success: true })
}
