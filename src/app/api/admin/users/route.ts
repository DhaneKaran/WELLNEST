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
    const users = await prisma.user.findMany({
      include: { roleAssignments: true }
    })
    const sanitized = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      roles: [u.role, ...u.roleAssignments.map(r => r.role)]
    }))
    return NextResponse.json(sanitized)
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
    const { userId, name, role } = body || {}
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
    const updated = await prisma.user.update({ where: { id: Number(userId) }, data: { name: name || undefined, role: role || undefined } })
    return NextResponse.json({ id: updated.id, name: updated.name, email: updated.email, role: updated.role })
  } catch (e: any) {
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)
  try {
    ensureAdmin(session)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await prisma.user.delete({ where: { id: Number(id) } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  // Assign or remove roles
  const session = await getServerSession(authOptions)
  try {
    ensureAdmin(session)
    const body = await request.json()
    const { userId, role, op } = body || {}
    if (!userId || !role || !op) return NextResponse.json({ error: 'userId, role, op required' }, { status: 400 })

    // Prevent modifying the super admin
    const SUPER_ADMIN_EMAIL = 'karandhane0808@gmail.com'
    const target = await prisma.user.findUnique({ where: { id: Number(userId) } })
    if (target?.email === SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Cannot modify main admin' }, { status: 403 })
    }
    if (op === 'assign') {
      await prisma.roleAssignment.upsert({
        where: { userId_role: { userId: Number(userId), role } },
        create: { userId: Number(userId), role },
        update: {}
      })
    } else if (op === 'remove') {
      await prisma.roleAssignment.delete({ where: { userId_role: { userId: Number(userId), role } } })
    } else {
      return NextResponse.json({ error: 'Invalid op' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}





