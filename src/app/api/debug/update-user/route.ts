import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        dob: true,
        address: true,
        role: true,
        createdAt: true
      }
    })

    console.log('Updated user:', updatedUser)
    return NextResponse.json(updatedUser)
  } catch (error: any) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
} 