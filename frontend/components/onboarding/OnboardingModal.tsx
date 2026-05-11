/**
 * components/onboarding/OnboardingModal.tsx
 *
 * HCI Principle 6 — Learnability:
 * This is the direct fix for the #1 Dombelo failure.
 *
 * WHAT DOMBELO DOES:
 * Nothing. First-time users land on the platform with no guidance.
 * No explanation of how MoMo payment works. No tour. No tooltips.
 * Uganda has millions of people entering e-commerce for the first time —
 * they leave Dombelo because nothing explains itself.
 *
 * WHAT RACKS DOES:
 * A 3-step modal appears the FIRST TIME a new user visits.
 * Step 1: Browse — here's how products are organised
 * Step 2: Add to Cart — here's how the cart works
 * Step 3: Pay with MoMo — here's what happens when you tap Pay
 *
 * It's shown ONCE. localStorage remembers they've seen it.
 * They'll never see it again (HCI P.7 — Simplicity: don't repeat).
 *
 * HCI Principle 1 — Consistency:
 * The same onboarding runs on web and mobile (React Native version
 * uses the same step content, adapted for touch gestures).
 */

'use client'
import { useState, useEffect } from 'react'

// The three onboarding steps
const STEPS = [
  {
    icon:  '🛍️',
    title: 'Browse what you need',
    body:  'Search by category or brand. Every product shows you the current stock level and delivery time for your district — no surprises.',
  },
  {
    icon:  '🛒',
    title: 'Add to cart, keep shopping',
    body:  "Unlike other platforms, adding to cart keeps you on the page. Your cart is saved — even if you close the browser and come back tomorrow.",
  },
  {
    icon:  '📱',
    title: 'Pay with MoMo in seconds',
    body:  'Enter your MTN or Airtel number at checkout. We send a payment prompt to your phone — just enter your PIN. If it fails, your order is saved and you can try again.',
  },
]

// localStorage key — we store '1' here once the user has seen onboarding
const SEEN_KEY = 'racks_onboarding_done'

interface Props {
  onDone?: () => void
}

export default function OnboardingModal({ onDone }: Props) {
  const [step,    setStep]    = useState(0)
  const [visible, setVisible] = useState(false)

  // Check if this is a first-time visitor
  useEffect(() => {
    const seen = localStorage.getItem(SEEN_KEY)
    if (!seen) {
      // Small delay so the page loads first, then modal appears
      setTimeout(() => setVisible(true), 500)
    }
  }, [])

  const finish = () => {
    // Remember they've seen it — never show again
    localStorage.setItem(SEEN_KEY, '1')
    setVisible(false)
    onDone?.()
  }

  if (!visible) return null

  const current = STEPS[step]
  const isLast  = step === STEPS.length - 1

  return (
    // Dark backdrop covers the page
    <div style={{
      position:        'fixed',
      inset:           0,
      background:      'rgba(0,0,0,0.65)',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      zIndex:          9999,
      padding:         '20px',
    }}>
      {/* Modal card */}
      <div style={{
        background:   '#0D1B2A',
        borderRadius: '16px',
        width:        '100%',
        maxWidth:     '380px',
        padding:      '36px 28px',
        textAlign:    'center',
      }}>
        {/* Logo */}
        <div style={{ fontFamily: 'sans-serif', fontSize: '22px', fontWeight: 800, color: '#fff', marginBottom: '28px' }}>
          RA<span style={{ color: '#F5B942' }}>CK</span>S
        </div>

        {/* Step progress dots */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '28px' }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              height:       '6px',
              width:        i === step ? '24px' : '6px',
              borderRadius: '3px',
              background:   i === step ? '#F5B942' : 'rgba(255,255,255,0.2)',
              transition:   'all 0.3s',
            }} />
          ))}
        </div>

        {/* Step icon */}
        <div style={{
          width:          '80px',
          height:         '80px',
          background:     'rgba(200,146,42,0.15)',
          borderRadius:   '20px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       '36px',
          margin:         '0 auto 24px',
        }}>
          {current.icon}
        </div>

        {/* Step title */}
        <h2 style={{
          fontFamily: 'sans-serif',
          fontSize:   '22px',
          fontWeight: 800,
          color:      '#fff',
          lineHeight: 1.25,
          margin:     '0 0 14px',
        }}>
          {current.title}
        </h2>

        {/* Step body */}
        <p style={{
          fontSize:   '14px',
          color:      '#8899AA',
          lineHeight: 1.65,
          margin:     '0 0 32px',
        }}>
          {current.body}
        </p>

        {/* Next / Start Shopping button */}
        <button
          onClick={() => isLast ? finish() : setStep(s => s + 1)}
          style={{
            width:        '100%',
            background:   '#C8922A',
            color:        '#0D1B2A',
            border:       'none',
            borderRadius: '10px',
            padding:      '15px',
            fontFamily:   'sans-serif',
            fontSize:     '15px',
            fontWeight:   800,
            cursor:       'pointer',
            marginBottom: '14px',
          }}
        >
          {isLast ? 'Start Shopping' : 'Next →'}
        </button>

        {/* Skip link */}
        <button
          onClick={finish}
          style={{
            background:   'none',
            border:       'none',
            fontSize:     '12px',
            color:        '#546E7A',
            cursor:       'pointer',
            textDecoration: 'underline',
          }}
        >
          Skip intro
        </button>
      </div>
    </div>
  )
}
