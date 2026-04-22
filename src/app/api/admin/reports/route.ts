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
    const [appointments, orders, bills] = await Promise.all([
      prisma.appointment.count(),
      prisma.order.count(),
      prisma.bill.aggregate({ _sum: { amount: true } })
    ])
    return NextResponse.json({
      appointmentsCount: appointments,
      ordersCount: orders,
      totalRevenue: bills._sum.amount || 0
    })
  } catch (e: any) {
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}





