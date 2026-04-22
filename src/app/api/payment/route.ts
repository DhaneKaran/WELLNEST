import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Payment Gateway Configuration (Dummy for demo)
const PAYMENT_GATEWAY_CONFIG = {
  razorpay: {
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
    currency: 'INR'
  },
  stripe: {
    publishable_key: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy',
    secret_key: process.env.STRIPE_SECRET_KEY || 'sk_test_dummy',
    currency: 'inr'
  }
}

export async function POST(req: Request) {
  try {
    const { 
      billId, 
      amount, 
      paymentMethod, 
      gateway = 'razorpay',
      customerDetails 
    } = await req.json()

    if (!billId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate bill exists
    const bill = await prisma.bill.findUnique({
      where: { id: parseInt(billId) },
      include: {
        appointment: {
          include: {
            hospital: true,
            doctor: true
          }
        },
        order: {
          include: {
            medicine: true
          }
        }
      }
    })

    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      )
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        billId: parseInt(billId),
        amount: parseFloat(amount),
        paymentMethod,
        gateway,
        status: 'PENDING',
        customerDetails: customerDetails || {},
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    })

    // Generate payment gateway specific response
    let paymentResponse
    switch (gateway) {
      case 'razorpay':
        paymentResponse = {
          orderId: payment.transactionId,
          amount: amount * 100, // Razorpay expects amount in paise
          currency: PAYMENT_GATEWAY_CONFIG.razorpay.currency,
          key: PAYMENT_GATEWAY_CONFIG.razorpay.key_id,
          description: `Payment for ${bill.type} bill #${billId}`,
          prefill: {
            name: customerDetails?.name || 'Customer',
            email: customerDetails?.email || '',
            contact: customerDetails?.phone || ''
          }
        }
        break

      case 'stripe':
        paymentResponse = {
          amount: amount * 100, // Stripe expects amount in cents
          currency: PAYMENT_GATEWAY_CONFIG.stripe.currency,
          description: `Payment for ${bill.type} bill #${billId}`,
          paymentIntent: {
            id: payment.transactionId,
            client_secret: `pi_${payment.transactionId}_secret_${Math.random().toString(36).substr(2, 9)}`
          }
        }
        break

      default:
        return NextResponse.json(
          { error: 'Unsupported payment gateway' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      transactionId: payment.transactionId,
      gateway,
      paymentData: paymentResponse
    })

  } catch (error) {
    console.error('Payment error:', error)
    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const { paymentId, status, transactionId, gatewayResponse } = await req.json()

    if (!paymentId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Update payment status
    const payment = await prisma.payment.update({
      where: { id: parseInt(paymentId) },
      data: {
        status,
        gatewayResponse: gatewayResponse || {},
        paidAt: status === 'SUCCESS' ? new Date() : null
      },
      include: {
        bill: true
      }
    })

    // If payment successful, update bill status
    if (status === 'SUCCESS' && payment.bill) {
      await prisma.bill.update({
        where: { id: payment.bill.id },
        data: {
          status: 'PAID',
          paidAt: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      payment: payment
    })

  } catch (error) {
    console.error('Payment update error:', error)
    return NextResponse.json(
      { error: 'Failed to update payment status' },
      { status: 500 }
    )
  }
} 