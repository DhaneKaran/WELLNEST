import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 })
    }

    const bills = await prisma.bill.findMany({
      where: {
        patientId: parseInt(patientId)
      },
      include: {
        appointment: {
          include: {
            hospital: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(bills)
  } catch (error) {
    console.error('Error fetching bills:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bills' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const { appointmentId, patientId, amount, type, description } = await req.json()

    if (!patientId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const bill = await prisma.bill.create({
      data: {
        appointmentId: appointmentId ? parseInt(appointmentId) : null,
        patientId: parseInt(patientId),
        amount: parseFloat(amount),
        type: type || 'APPOINTMENT',
        description: description || 'Medical bill',
        status: 'UNPAID'
      },
      include: {
        appointment: {
          include: {
            hospital: true
          }
        }
      }
    })

    return NextResponse.json(bill, { status: 201 })
  } catch (error) {
    console.error('Error creating bill:', error)
    return NextResponse.json(
      { error: 'Failed to create bill' },
      { status: 500 }
    )
  }
} 