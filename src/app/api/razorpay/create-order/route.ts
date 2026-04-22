/**
 * src/app/api/razorpay/create-order/route.ts
 * ─────────────────────────────────────────────
 * Creates a Razorpay order.
 * Setup: npm install razorpay
 *        Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import Razorpay from 'razorpay'



export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })

  try {
    const { billId, amount, description, type } = await req.json()
    // type: 'HOSPITAL' | 'PHARMACY'

    if (!billId || !amount) {
      return NextResponse.json({ error: 'billId and amount are required' }, { status: 400 })
    }

    const amountInPaise = Math.round(parseFloat(amount) * 100) // Razorpay uses smallest currency unit

    // Validate bill exists and belongs to this user
    const userId = parseInt((session.user as any).id)
    const bill = await prisma.bill.findUnique({ where: { id: Number(billId) } })

    if (!bill) return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    if (bill.patientId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (bill.status === 'PAID') return NextResponse.json({ error: 'Bill already paid' }, { status: 400 })

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `bill_${billId}_${Date.now()}`,
      notes: {
        billId: String(billId),
        userId: String(userId),
        type: type ?? 'HOSPITAL',
        description: description ?? bill.description,
      },
    })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      billId,
      description: description ?? bill.description,
    })

  } catch (error: any) {
    console.error('[razorpay/create-order]', error)
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 })
  }
}
