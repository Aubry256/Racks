/**
 * components/ui/WishlistHeart.tsx
 *
 * HCI Principle 9 — Affordance:
 * The wishlist heart button changes appearance when tapped.
 * Before: outline heart ♡ (not saved)
 * After:  filled red heart ❤️ (saved)
 *
 * Dombelo's failure: no wishlist feature at all despite implying one.
 * Racks: real wishlist + visual state feedback.
 *
 * HCI Principle 2 — Feedback:
 * Toast confirms "Added to wishlist" or "Removed from wishlist".
 * State persists in localStorage so it survives page refresh.
 */

'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { addToWishlist, removeFromWishlist } from '@/lib/api'

const WISHLIST_KEY = 'racks_wishlist'

interface Props {
  productId:   string
  productName: string
  size?:       number   // button size in px, default 36
  style?:      React.CSSProperties
}

export default function WishlistHeart({ productId, productName, size = 36, style = {} }: Props) {
  const [saved,   setSaved]   = useState(false)
  const [loading, setLoading] = useState(false)

  // Read wishlist from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_KEY)
      const list   = stored ? JSON.parse(stored) : []
      setSaved(list.includes(productId))
    } catch { /* ignore */ }
  }, [productId])

  const toggle = async (e: React.MouseEvent) => {
    // Stop click from triggering parent card link
    e.preventDefault()
    e.stopPropagation()

    setLoading(true)
    const willSave = !saved

    // Optimistic update — show result immediately
    setSaved(willSave)

    // Update localStorage
    try {
      const stored = localStorage.getItem(WISHLIST_KEY)
      const list: string[] = stored ? JSON.parse(stored) : []
      const updated = willSave
        ? [...new Set([...list, productId])]
        : list.filter(id => id !== productId)
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated))
    } catch { /* ignore */ }

    // Sync with API (non-blocking)
    try {
      if (willSave) {
        await addToWishlist(productId)
        // HCI Principle 2 — Feedback: specific confirmation
        toast.success(`${productName} added to wishlist`, {
          icon: '❤️',
          duration: 2000,
        })
      } else {
        await removeFromWishlist(productId)
        toast(`Removed from wishlist`, {
          icon: '🤍',
          duration: 2000,
          style: { background:'#F9F6F1', color:'#1A1A1A' }
        })
      }
    } catch {
      // API call failed — revert optimistic update
      setSaved(!willSave)
      try {
        const stored = localStorage.getItem(WISHLIST_KEY)
        const list: string[] = stored ? JSON.parse(stored) : []
        const reverted = !willSave
          ? [...new Set([...list, productId])]
          : list.filter(id => id !== productId)
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(reverted))
      } catch { /* ignore */ }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={saved ? 'Remove from wishlist' : 'Add to wishlist'}
      style={{
        width:          size,
        height:         size,
        borderRadius:   '50%',
        background:     saved ? '#FFEBEE' : 'rgba(255,255,255,0.9)',
        border:         `1px solid ${saved ? '#E57373' : '#E4DDD3'}`,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        cursor:         loading ? 'wait' : 'pointer',
        fontSize:       size * 0.45,
        // Smooth transition when state changes
        transition:     'all 0.2s ease',
        transform:      loading ? 'scale(0.9)' : 'scale(1)',
        // Scale up briefly when saved
        animation:      saved && !loading ? 'heartPop 0.3s ease' : 'none',
        ...style,
      }}
    >
      {/* Filled heart when saved, outline when not */}
      {saved ? '❤️' : '🤍'}

      <style>{`
        @keyframes heartPop {
          0%   { transform: scale(1) }
          50%  { transform: scale(1.3) }
          100% { transform: scale(1) }
        }
      `}</style>
    </button>
  )
}
