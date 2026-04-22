/**
 * src/lib/notify.ts
 * ──────────────────
 * Central notification helper used by all API routes.
 * Creates a DB record, pushes via SSE, and sends email as fallback.
 *
 * Usage:
 *   import { notify } from '@/lib/notify'
 *   await notify({ userId: 5, type: 'APPOINTMENT', title: '...', message: '...', email: 'a@b.com' })
 */

import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

// In-memory SSE registry: Map<userId, Set<ReadableStreamController>>
export const sseClients = new Map<number, Set<ReadableStreamDefaultController>>()

export interface NotifyPayload {
  userId: number
  type: 'APPOINTMENT' | 'ORDER' | 'APPROVAL' | 'PAYMENT' | 'REMINDER' | 'REGISTRATION'
  title: string
  message: string
  metadata?: Record<string, unknown>
  /** If provided, also send an email fallback */
  email?: string
}

export async function notify(payload: NotifyPayload) {
  const { userId, type, title, message, metadata, email } = payload

  // 1. Persist to DB
  const notification = await prisma.notification.create({
  data: {
    userId,
    type,
    title,
    message,
    metadata: (metadata ?? {}) as any,
  },
})

  // 2. Push via SSE if the client is connected
  const controllers = sseClients.get(userId)
  if (controllers?.size) {
    const data = JSON.stringify({ id: notification.id, type, title, message, metadata, createdAt: notification.createdAt })
    controllers.forEach((ctrl) => {
      try {
        ctrl.enqueue(`data: ${data}\n\n`)
      } catch {
        // client disconnected — cleaned up in SSE route
      }
    })
  }

  // 3. Email fallback (fire-and-forget)
  if (email) {
    sendEmail({ to: email, subject: title, html: `<p>${message}</p>` }).catch(console.error)
  }

  return notification
}
