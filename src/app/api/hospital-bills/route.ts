import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 })
    }

    const bills = await prisma.bill.findMany({
      where: {
        patientId: parseInt(patientId),
        type: 'HOSPITAL' // Only hospital bills
      },
      include: {
        appointment: {
          include: {
            hospital: true,
            doctor: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(bills)
  } catch (error) {
    console.error('Error fetching hospital bills:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hospital bills' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const { appointmentId, patientId, amount, description } = await req.json()

    if (!patientId || !amount || !appointmentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const bill = await prisma.bill.create({
      data: {
        appointmentId: parseInt(appointmentId),
        patientId: parseInt(patientId),
        amount: parseFloat(amount),
        type: 'HOSPITAL',
        description: description || 'Hospital appointment bill',
        status: 'UNPAID'
      },
      include: {
        appointment: {
          include: {
            hospital: true,
            doctor: true
          }
        }
      }
    })

    return NextResponse.json(bill, { status: 201 })
  } catch (error) {
    console.error('Error creating hospital bill:', error)
    return NextResponse.json(
      { error: 'Failed to create hospital bill' },
      { status: 500 }
    )
  }
} 