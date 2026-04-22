import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { medicineId, quantity, totalAmount, paymentMethod, patientId } = await req.json()

    // Validate required fields
    if (!medicineId || !quantity || !totalAmount || !paymentMethod || !patientId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if medicine exists and has sufficient stock
    const medicine = await prisma.medicine.findUnique({
      where: { id: medicineId }
    })

    if (!medicine) {
      return NextResponse.json(
        { error: 'Medicine not found' },
        { status: 404 }
      )
    }

    if (medicine.stock < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      )
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        patientId,
        medicineId,
        quantity,
        totalAmount,
        paymentMethod,
        paymentStatus: paymentMethod === 'UPI' ? 'PENDING' : 'PENDING',
        status: 'PLACED'
      },
      include: {
        medicine: true,
        patient: true
      }
    })

    // Update medicine stock
    await prisma.medicine.update({
      where: { id: medicineId },
      data: { stock: medicine.stock - quantity }
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patientId')
    const forPharmacist = searchParams.get('all') // pass ?all=true for pharmacist

    const where = patientId ? { patientId: parseInt(patientId) } : {}

    const orders = await prisma.order.findMany({
      where,
      include: {
        medicine: true,
        patient: { select: { id: true, name: true, email: true, phone: true, address: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}