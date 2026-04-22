/**
 * src/app/api/razorpay/verify/route.ts
 * ──────────────────────────────────────
 * Verifies the Razorpay payment signature after the client-side checkout.
 * On success: marks the Bill as PAID, creates a Payment record, sends notification.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { notify } from '@/lib/notify'
import { templates, sendEmail } from '@/lib/email'
import crypto from 'crypto'

function verifySignature(orderId: string, paymentId: string, signature: string): boolean {
  const body = `${orderId}|${paymentId}`
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex')
  return expectedSignature === signature
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      billId,
    } = await req.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !billId) {
      return NextResponse.json({ error: 'Missing payment verification fields' }, { status: 400 })
    }

    // 1. Verify HMAC signature
    const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    const userId = parseInt((session.user as any).id)
    const bill = await prisma.bill.findUnique({
      where: { id: Number(billId) },
      include: { patient: true },
    })

    if (!bill) return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    if (bill.patientId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // 2. Update Bill status
    const [updatedBill, payment] = await prisma.$transaction([
      prisma.bill.update({
        where: { id: bill.id },
        data: { status: 'PAID', paidAt: new Date() },
      }),
      prisma.payment.create({
        data: {
          billId: bill.id,
          amount: bill.amount,
          paymentMethod: 'RAZORPAY',
          gateway: 'razorpay',
          status: 'SUCCESS',
          transactionId: razorpay_payment_id,
          gatewayResponse: { orderId: razorpay_order_id, paymentId: razorpay_payment_id, signature: razorpay_signature },
          paidAt: new Date(),
        },
      }),
    ])

    // 3. If it's a hospital bill — update appointment payment status
    if (bill.appointmentId) {
      await prisma.appointment.update({
        where: { id: bill.appointmentId },
        data: { paymentStatus: 'PAID' },
      })
    }

    // 4. If it's an order bill — update order payment status
    if (bill.orderId) {
      await prisma.order.update({
        where: { id: bill.orderId },
        data: { paymentStatus: 'PAID' },
      })
    }

    // 5. In-app notification
    await notify({
      userId,
      type: 'PAYMENT',
      title: 'Payment Successful ✅',
      message: `Your payment of ₹${bill.amount.toFixed(2)} for ${bill.description} was successful. Txn: ${razorpay_payment_id}`,
      metadata: { paymentId: razorpay_payment_id, billId: bill.id, amount: bill.amount },
      email: bill.patient.email,
    })

    // 6. Email receipt
    await sendEmail({
      to: bill.patient.email,
      subject: 'Wellnest — Payment Receipt',
      html: templates.paymentSuccess(bill.patient.name, bill.amount, razorpay_payment_id, bill.description),
    })

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: payment.id,
      transactionId: razorpay_payment_id,
    })

  } catch (error: any) {
    console.error('[razorpay/verify]', error)
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 })
  }
}
