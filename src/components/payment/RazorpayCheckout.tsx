'use client'

/**
 * src/components/payment/RazorpayCheckout.tsx
 * ─────────────────────────────────────────────
 * Drop-in Razorpay payment button. Works for both hospital bills and pharmacy orders.
 *
 * Usage:
 *   <RazorpayCheckout
 *     billId={12}
 *     amount={500}
 *     description="Consultation fee – Dr. Sharma"
 *     type="HOSPITAL"
 *     onSuccess={(txnId) => router.refresh()}
 *   />
 */

import { useState } from 'react'
import { useSession } from 'next-auth/react'

interface Props {
  billId: number
  amount: number
  description: string
  type?: 'HOSPITAL' | 'PHARMACY'
  onSuccess?: (transactionId: string) => void
  onFailure?: (error: string) => void
  disabled?: boolean
  className?: string
}

declare global {
  interface Window {
    Razorpay: any
  }
}

// Loads the Razorpay JS SDK once
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function RazorpayCheckout({
  billId, amount, description, type = 'HOSPITAL',
  onSuccess, onFailure, disabled, className = '',
}: Props) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'failure'>('idle')

  const handlePayment = async () => {
    setLoading(true)
    setStatus('idle')

    try {
      // 1. Load Razorpay SDK
      const loaded = await loadRazorpayScript()
      if (!loaded) throw new Error('Failed to load Razorpay SDK. Check your internet connection.')

      // 2. Create order on backend
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId, amount, description, type }),
      })
      if (!orderRes.ok) {
        const err = await orderRes.json()
        throw new Error(err.error ?? 'Failed to create payment order')
      }
      const { orderId, keyId } = await orderRes.json()

      // 3. Open Razorpay checkout modal
      const options = {
        key: keyId,
        amount: amount * 100, // paise
        currency: 'INR',
        name: 'Wellnest Healthcare',
        description,
        image: '/logo.png', // your logo — update path as needed
        order_id: orderId,
        prefill: {
          name: session?.user?.name ?? '',
          email: session?.user?.email ?? '',
        },
        notes: { billId: String(billId), type },
        theme: { color: '#2563eb' },

        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          // 4. Verify payment on backend
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              billId,
            }),
          })

          if (verifyRes.ok) {
            setStatus('success')
            onSuccess?.(response.razorpay_payment_id)
          } else {
            const err = await verifyRes.json()
            setStatus('failure')
            onFailure?.(err.error ?? 'Payment verification failed')
          }
          setLoading(false)
        },

        modal: {
          ondismiss: () => {
            setLoading(false)
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response: any) => {
        setStatus('failure')
        setLoading(false)
        onFailure?.(response.error?.description ?? 'Payment failed')
      })
      rzp.open()

    } catch (err: any) {
      setStatus('failure')
      setLoading(false)
      onFailure?.(err.message)
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Payment Successful!
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handlePayment}
        disabled={disabled || loading}
        className={`flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Processing…</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span>Pay ₹{amount.toFixed(2)}</span>
          </>
        )}
      </button>

      {status === 'failure' && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <span>⚠</span> Payment failed. Please try again.
        </p>
      )}

      <p className="text-xs text-gray-400 flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Secured by Razorpay · 256-bit SSL
      </p>
    </div>
  )
}
