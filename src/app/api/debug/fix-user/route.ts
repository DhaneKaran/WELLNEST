import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    // Update the existing user with the missing data
    const updatedUser = await prisma.user.update({
      where: { email: 'karandhane1@gmail.com' },
      data: {
        phone: '1234567890',
        address: 'abcdefg',
        dob: new Date('2004-11-01'),
        role: 'PATIENT'
      },
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

    console.log('Fixed user data:', updatedUser)
    return NextResponse.json(updatedUser)
  } catch (error: any) {
    console.error('Error fixing user:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
} 