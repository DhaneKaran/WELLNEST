/**
 * src/app/api/notifications/sse/route.ts
 * ───────────────────────────────────────
 * Server-Sent Events endpoint — keeps a persistent HTTP connection open.
 * The client receives events pushed from notify() in real-time.
 *
 * Why SSE over Socket.IO?
 *   Socket.IO requires a custom Node server (incompatible with Next.js serverless/edge).
 *   SSE works natively with Next.js 14 App Router via ReadableStream.
 *
 * Client usage:
 *   const es = new EventSource('/api/notifications/sse?userId=5')
 *   es.onmessage = (e) => console.log(JSON.parse(e.data))
 */

import { sseClients } from '@/lib/notify'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const userId = parseInt((session.user as any).id)
  if (isNaN(userId)) return new Response('Invalid session', { status: 400 })

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Register this client
      if (!sseClients.has(userId)) sseClients.set(userId, new Set())
      sseClients.get(userId)!.add(controller)

      // Heartbeat every 25s to keep the connection alive through proxies/load balancers
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch {
          clearInterval(heartbeat)
        }
      }, 25_000)

      // Send connection-established event
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'CONNECTED', userId })}\n\n`))

      // Cleanup on disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        sseClients.get(userId)?.delete(controller)
        if (sseClients.get(userId)?.size === 0) sseClients.delete(userId)
        try { controller.close() } catch {}
      })
    },

    cancel() {
      sseClients.get(userId)?.forEach((ctrl) => {
        try { ctrl.close() } catch {}
      })
      sseClients.delete(userId)
    },
  })

  // Transform string chunks to Uint8Array
  const transformedStream = stream.pipeThrough(
    new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(typeof chunk === 'string' ? encoder.encode(chunk) : chunk)
      },
    })
  )

  return new Response(transformedStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
    },
  })
}
