import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const { status, paymentStatus } = await req.json()

    if (!status && !paymentStatus) {
      return NextResponse.json({ error: 'status or paymentStatus is required' }, { status: 400 })
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
      },
      include: {
        medicine: true,
        patient: { select: { id: true, name: true, email: true, phone: true, address: true } }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}