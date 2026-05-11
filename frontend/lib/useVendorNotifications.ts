/**
 * lib/useVendorNotifications.ts
 *
 * HCI Principle 2 — Feedback:
 * Vendors receive real-time notifications when a new order
 * arrives containing their products.
 *
 * Uses Django Channels WebSocket — same infrastructure as
 * the customer order tracking WebSocket.
 *
 * The vendor dashboard connects to:
 * ws://localhost:8000/ws/vendor/{vendor_id}/
 *
 * Django sends a message when:
 * - A new order is placed containing the vendor's products
 * - One of their orders changes status
 * - A product runs low on stock (< 3 units)
 */

import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'

export interface VendorNotification {
  type:    'new_order' | 'order_update' | 'low_stock'
  message: string
  data?:   any
}

const WS_KEY = 'racks_vendor_ws'

export function useVendorNotifications(vendorId: string | null) {
  const [notifications, setNotifications] = useState<VendorNotification[]>([])
  const [unread,        setUnread]         = useState(0)
  const [connected,     setConnected]      = useState(false)

  useEffect(() => {
    if (!vendorId) return

    const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
    const ws      = new WebSocket(`${WS_BASE}/ws/vendor/${vendorId}/`)

    ws.onopen  = () => setConnected(true)
    ws.onclose = () => setConnected(false)

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as VendorNotification

        // HCI Principle 2 — Feedback: show toast immediately
        if (data.type === 'new_order') {
          toast.success(`New order received! ${data.message}`, { duration: 5000 })
          setUnread(n => n + 1)
        } else if (data.type === 'low_stock') {
          toast(`⚠️ Low stock: ${data.message}`, { duration: 6000,
            style: { background:'#FFF3E0', color:'#E65100' }
          })
        } else if (data.type === 'order_update') {
          toast(data.message, { duration: 4000 })
        }

        setNotifications(prev => [data, ...prev].slice(0, 50))
      } catch {
        // Ignore malformed messages
      }
    }

    return () => ws.close()
  }, [vendorId])

  const clearUnread = useCallback(() => setUnread(0), [])

  return { notifications, unread, connected, clearUnread }
}
