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
        type: 'MEDICINE' // Only medical bills
      },
      include: {
        order: {
          include: {
            medicine: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(bills)
  } catch (error) {
    console.error('Error fetching medical bills:', error)
    return NextResponse.json(
      { error: 'Failed to fetch medical bills' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const { orderId, patientId, amount, description } = await req.json()

    if (!patientId || !amount || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const bill = await prisma.bill.create({
      data: {
        orderId: parseInt(orderId),
        patientId: parseInt(patientId),
        amount: parseFloat(amount),
        type: 'MEDICINE',
        description: description || 'Medicine purchase bill',
        status: 'UNPAID'
      },
      include: {
        order: {
          include: {
            medicine: true
          }
        }
      }
    })

    return NextResponse.json(bill, { status: 201 })
  } catch (error) {
    console.error('Error creating medical bill:', error)
    return NextResponse.json(
      { error: 'Failed to create medical bill' },
      { status: 500 }
    )
  }
} 