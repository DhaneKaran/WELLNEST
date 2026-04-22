import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const hospitalId = parseInt(params.id)

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      include: {
        doctors: {
          select: {
            id: true,
            name: true,
            specialization: true
          }
        },
        appointments: {
          select: {
            id: true,
            date: true,
            status: true
          }
        }
      }
    })

    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(hospital)
  } catch (error: any) {
    console.error('Error fetching hospital:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hospital' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const hospitalId = parseInt(params.id)

    // Check if hospital exists
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId }
    })

    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital not found' },
        { status: 404 }
      )
    }

    // Delete hospital (cascade delete is handled by Prisma)
    await prisma.hospital.delete({
      where: { id: hospitalId }
    })

    return NextResponse.json(
      { message: 'Hospital deleted successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error deleting hospital:', error)
    return NextResponse.json(
      { error: 'Failed to delete hospital' },
      { status: 500 }
    )
  }
}
