/**
 * src/lib/email.ts
 * ─────────────────
 * Email fallback using Resend
 */

import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

export interface EmailPayload {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailPayload) {
  // ✅ Guard FIRST (prevents crash)
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping email.')
    return
  }

  // ✅ Lazy initialization (FIXED ISSUE)
  const resend = new Resend(process.env.RESEND_API_KEY)

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
  })

  if (error) console.error('[email] Resend error:', error)
}

// ── Email Templates ──────────────────────────────────────────

export const templates = {
  appointmentBooked: (patientName: string, doctorName: string, date: string, time: string) => `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#2563eb">Appointment Booked ✅</h2>
      <p>Hi <strong>${patientName}</strong>,</p>
      <p>Your appointment with <strong>Dr. ${doctorName}</strong> has been booked.</p>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;font-weight:bold">Date</td><td style="padding:8px">${date}</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Time</td><td style="padding:8px">${time}</td></tr>
      </table>
      <p>We'll notify you once it's confirmed.</p>
      <p>— Wellnest Team</p>
    </div>`,

  approvalResult: (name: string, role: string, approved: boolean, reason?: string) => `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:${approved ? '#16a34a' : '#dc2626'}">
        ${approved ? 'Registration Approved ✅' : 'Registration Rejected ❌'}
      </h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your registration as <strong>${role}</strong> has been 
      <strong>${approved ? 'approved' : 'rejected'}</strong>.</p>
      ${!approved && reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      ${approved 
        ? '<p>You can now log in with full access.</p>' 
        : '<p>Please contact support if you believe this is a mistake.</p>'}
      <p>— Wellnest Admin</p>
    </div>`,

  paymentSuccess: (name: string, amount: number, txnId: string, description: string) => `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#16a34a">Payment Successful 💳</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your payment of <strong>₹${amount.toFixed(2)}</strong> was successful.</p>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;font-weight:bold">Transaction ID</td><td style="padding:8px">${txnId}</td></tr>
        <tr><td style="padding:8px;font-weight:bold">Description</td><td style="padding:8px">${description}</td></tr>
      </table>
      <p>— Wellnest Team</p>
    </div>`,

  orderUpdate: (name: string, medicineName: string, status: string) => `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#2563eb">Order Update 📦</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your order for <strong>${medicineName}</strong> is now <strong>${status}</strong>.</p>
      <p>— Wellnest Team</p>
    </div>`,
}