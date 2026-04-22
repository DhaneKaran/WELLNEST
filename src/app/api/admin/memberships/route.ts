import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

function ensureAdmin(session: any) {
  const roles = (session?.user as any)?.roles || []
  if (!roles.includes('ADMIN')) {
    throw new Error('FORBIDDEN')
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  try {
    ensureAdmin(session)
    const memberships = await prisma.membership.findMany({ include: { user: true } })
    return NextResponse.json(memberships)
  } catch (e: any) {
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  try {
    ensureAdmin(session)
    const body = await request.json()
    const { userId, tier, status, expiresAt } = body || {}
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
    const upserted = await prisma.membership.upsert({
      where: { userId: Number(userId) },
      create: { userId: Number(userId), tier: tier || 'FREE', status: status || 'ACTIVE', expiresAt: expiresAt ? new Date(expiresAt) : null },
      update: { tier: tier || undefined, status: status || undefined, expiresAt: expiresAt ? new Date(expiresAt) : undefined }
    })
    return NextResponse.json(upserted)
  } catch (e: any) {
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  try {
    ensureAdmin(session)
    const body = await request.json()
    const { id, isActive, name, description, startsAt, endsAt } = body || {}
    // Repurpose PATCH for campaigns as well when fields present
    if (typeof isActive === 'boolean' || name) {
      if (!id) return NextResponse.json({ error: 'campaign id required' }, { status: 400 })
      const updated = await prisma.campaign.update({
        where: { id: Number(id) },
        data: {
          isActive: typeof isActive === 'boolean' ? isActive : undefined,
          name: name || undefined,
          description: description || undefined,
          startsAt: startsAt ? new Date(startsAt) : undefined,
          endsAt: endsAt ? new Date(endsAt) : undefined
        }
      })
      return NextResponse.json(updated)
    }
    return NextResponse.json({ error: 'Unsupported operation' }, { status: 400 })
  } catch (e: any) {
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  // Create campaign
  const session = await getServerSession(authOptions)
  try {
    ensureAdmin(session)
    const body = await request.json()
    const { name, description, startsAt, endsAt, isActive } = body || {}
    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })
    const created = await prisma.campaign.create({
      data: {
        name,
        description: description || null,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        isActive: !!isActive
      }
    })
    return NextResponse.json(created)
  } catch (e: any) {
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}





