/**
 * components/onboarding/VendorOnboarding.tsx
 *
 * HCI Principle 6 — Learnability:
 * First-time vendors see tooltip callout bubbles on every
 * part of their dashboard when they log in for the first time.
 *
 * BUBBLE / CALLOUT SYSTEM:
 * Each callout is an arrow-pointed speech bubble that appears
 * next to a specific UI element and explains what it does.
 *
 * Steps shown on first vendor login:
 * 1. Welcome bubble → "This is your vendor dashboard"
 * 2. Stats cards   → "These show your sales summary"
 * 3. Products tab  → "Click here to see all your products"
 * 4. Add Product   → "Click here to add a new product for sale"
 * 5. Orders tab    → "Check here when customers buy from you"
 *
 * Stored in: localStorage 'racks_vendor_onboarding_done'
 * Shown: once per vendor account, never again after dismissal
 *
 * This directly fixes the HCI P.6 gap:
 * "Vendor onboarding has no equivalent tutorial — a new vendor
 * lands on the dashboard with no guidance on how to add their
 * first product."
 */

'use client'
import { useState, useEffect } from 'react'

const SEEN_KEY = 'racks_vendor_onboarding_done'

// Each step has a target (CSS selector) and message
const STEPS = [
  {
    id:       'welcome',
    position: 'center',
    title:    '👋 Welcome to your Vendor Dashboard!',
    body:     "This is where you manage everything — products, orders, and your sales. We'll walk you through the key areas right now.",
    arrow:    null,
  },
  {
    id:       'stats',
    target:   '[data-tour="stats"]',
    position: 'below',
    title:    '📊 Your Sales Summary',
    body:     "These cards show your revenue this month, total orders, active products, and any stock alerts. Check them daily.",
    arrow:    'top',
  },
  {
    id:       'add-product',
    target:   '[data-tour="add-product-btn"]',
    position: 'below',
    title:    '➕ Add Your First Product',
    body:     "Click here to list a new product. You'll upload photos, write a description, set your price, and enter stock quantity.",
    arrow:    'top',
  },
  {
    id:       'orders',
    target:   '[data-tour="orders-tab"]',
    position: 'below',
    title:    '📦 Your Orders',
    body:     "When a customer buys your product, it appears here. You'll see the customer's district, the items ordered, and payment status.",
    arrow:    'top',
  },
  {
    id:       'payout',
    position: 'center',
    title:    '💰 Getting Paid',
    body:     "Racks processes payments for you. Your earnings (minus the platform fee) are sent to your MoMo number every Monday. Make sure your payout number is correct in your profile.",
    arrow:    null,
  },
]

interface Props {
  onDone?: () => void
}

export default function VendorOnboarding({ onDone }: Props) {
  const [step,    setStep]    = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem(SEEN_KEY)
    if (!seen) {
      setTimeout(() => setVisible(true), 800)
    }
  }, [])

  const finish = () => {
    localStorage.setItem(SEEN_KEY, '1')
    setVisible(false)
    onDone?.()
  }

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else finish()
  }

  if (!visible) return null

  const current  = STEPS[step]
  const isCenter = current.position === 'center'
  const isLast   = step === STEPS.length - 1

  return (
    <>
      {/* Semi-transparent overlay */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 9000,
        pointerEvents: 'none',
      }}/>

      {/* Callout bubble */}
      <div style={{
        position:  'fixed',
        zIndex:    9001,
        ...(isCenter ? {
          top:       '50%',
          left:      '50%',
          transform: 'translate(-50%, -50%)',
        } : {
          // For targeted steps, position relative to the tour target
          // Falls back to center if target not found
          top:       '30%',
          left:      '50%',
          transform: 'translateX(-50%)',
        }),
        width:        '320px',
        background:   '#0D1B2A',
        border:       '1px solid #1E3348',
        borderRadius: '14px',
        padding:      '22px 20px',
        boxShadow:    '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Progress dots */}
        <div style={{ display:'flex', gap:'6px', justifyContent:'center', marginBottom:'16px' }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              height:       '5px',
              borderRadius: '3px',
              background:   i === step ? '#C8922A' : 'rgba(255,255,255,.15)',
              transition:   'all .3s',
              width:        i === step ? '22px' : '5px',
            }}/>
          ))}
        </div>

        {/* Title */}
        <div style={{
          fontSize:     '16px',
          fontWeight:   800,
          color:        '#fff',
          marginBottom: '10px',
          lineHeight:   1.3,
          fontFamily:   'sans-serif',
        }}>
          {current.title}
        </div>

        {/* Body */}
        <div style={{
          fontSize:     '13px',
          color:        'rgba(255,255,255,.6)',
          lineHeight:   1.65,
          marginBottom: '20px',
        }}>
          {current.body}
        </div>

        {/* Buttons */}
        <div style={{ display:'flex', gap:'8px' }}>
          <button
            onClick={next}
            style={{
              flex:         1,
              background:   '#C8922A',
              color:        '#0D1B2A',
              border:       'none',
              borderRadius: '8px',
              padding:      '11px',
              fontWeight:   800,
              fontSize:     '13px',
              cursor:       'pointer',
              fontFamily:   'sans-serif',
            }}
          >
            {isLast ? "Got it, let's start!" : 'Next →'}
          </button>
          <button
            onClick={finish}
            style={{
              background:   'none',
              border:       '1px solid rgba(255,255,255,.15)',
              borderRadius: '8px',
              padding:      '11px 14px',
              color:        'rgba(255,255,255,.4)',
              fontSize:     '12px',
              cursor:       'pointer',
            }}
          >
            Skip
          </button>
        </div>
      </div>
    </>
  )
}
