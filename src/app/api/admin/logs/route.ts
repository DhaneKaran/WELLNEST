import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

function ensureAdmin(session: any) {
  const roles = (session?.user as any)?.roles || []
  const primary = (session?.user as any)?.role
  if (![...roles, primary].includes('ADMIN')) {
    throw new Error('FORBIDDEN')
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  try {
    ensureAdmin(session)
    const logs = await prisma.auditLog.findMany({
      include: { actor: true },
      orderBy: { createdAt: 'desc' },
      take: 200
    })
    return NextResponse.json(logs)
  } catch (e: any) {
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}





