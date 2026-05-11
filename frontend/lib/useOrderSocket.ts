/**
 * lib/useOrderSocket.ts
 *
 * WebSocket hook for real-time order status updates.
 *
 * HCI Principle 2 — Feedback:
 * This hook connects the browser to the Django Channels WebSocket server.
 * When an order status changes on the server, the update instantly appears
 * on the user's tracking page without any refresh.
 *
 * Compare with Dombelo:
 * - Dombelo: order tracking page shows status, user has to refresh manually
 * - Racks:   status updates appear automatically, with a human-readable message
 *
 * HOW IT WORKS:
 * 1. Component mounts → hook opens WebSocket to ws://localhost:8000/ws/orders/ID/
 * 2. Connection is maintained while the component is visible
 * 3. When Django calls push_order_update() (in payments/views.py),
 *    a message arrives at this hook
 * 4. Hook updates state → React re-renders the tracking page
 * 5. User sees "Payment confirmed! Your order is being prepared." instantly
 * 6. Component unmounts → WebSocket is closed (cleanup)
 */

import { useEffect, useState } from 'react'

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'dispatched'
  | 'delivered'
  | 'cancelled'

export interface OrderUpdate {
  type:    string
  status:  OrderStatus
  message: string  // Human-readable: "Your rider is on the way!"
}

export function useOrderSocket(orderId: string) {
  const [update,    setUpdate]    = useState<OrderUpdate | null>(null)
  const [connected, setConnected] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  useEffect(() => {
    // Don't connect if no order ID provided
    if (!orderId) return

    const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
    const wsUrl   = `${WS_BASE}/ws/orders/${orderId}/`

    // Open the WebSocket connection
    const socket = new WebSocket(wsUrl)

    socket.onopen = () => {
      setConnected(true)
      setError(null)
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as OrderUpdate
        // Only process order_update messages (not the 'connected' message)
        if (data.type === 'order_update') {
          setUpdate(data)
        }
      } catch {
        // Ignore malformed messages
      }
    }

    socket.onclose = () => {
      setConnected(false)
    }

    socket.onerror = () => {
      setConnected(false)
      // HCI Principle 2 — Feedback:
      // If WebSocket fails, tell the user they can still refresh manually
      setError('Live updates unavailable. Refresh the page to check status.')
    }

    // Cleanup: close WebSocket when user navigates away
    return () => {
      socket.close()
    }
  }, [orderId])

  return { update, connected, error }
}
