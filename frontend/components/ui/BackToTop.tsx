/**
 * components/ui/BackToTop.tsx
 *
 * HCI Principle 7 — Simplicity:
 * When browsing many products, users need a quick way
 * to return to the top without endless scrolling.
 *
 * Appears only after scrolling down 400px.
 * Smooth scrolls to top on click.
 */

'use client'
import { useState, useEffect } from 'react'

export default function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      title="Back to top"
      style={{
        position:   'fixed',
        bottom:     '80px',   // above the WhatsApp button
        right:      '24px',
        width:      '40px',
        height:     '40px',
        borderRadius: '50%',
        background: '#0D1B2A',
        color:      '#F5B942',
        border:     '1px solid #1E3348',
        fontSize:   '16px',
        cursor:     'pointer',
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow:  '0 2px 12px rgba(0,0,0,.2)',
        zIndex:     998,
        transition: 'opacity .2s',
      }}
    >
      ↑
    </button>
  )
}
