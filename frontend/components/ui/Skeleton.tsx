/**
 * components/ui/Skeleton.tsx
 *
 * HCI Principle 2 — Feedback:
 * Loading skeletons show users that content is coming.
 * A blank page gives no feedback — users think the site is broken.
 *
 * Dombelo had no loading states — screens went blank while loading.
 * Racks shows animated placeholder shapes matching the expected layout.
 *
 * Usage:
 *   <ProductCardSkeleton />        — product card placeholder
 *   <ProductGridSkeleton />        — 4-column grid of skeletons
 *   <OrderRowSkeleton />           — order history row placeholder
 *   <DashboardStatSkeleton />      — stat card placeholder
 */

import React from 'react'

// Base animated block
function Bone({ w = '100%', h = 16, radius = 6, style = {} }: {
  w?: string | number
  h?: number
  radius?: number
  style?: React.CSSProperties
}) {
  return (
    <div style={{
      width: w,
      height: h,
      borderRadius: radius,
      background: 'linear-gradient(90deg, #E4DDD3 25%, #F2EDE5 50%, #E4DDD3 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
      flexShrink: 0,
      ...style,
    }}/>
  )
}

// Inject shimmer keyframes once
if (typeof document !== 'undefined') {
  const id = 'racks-shimmer'
  if (!document.getElementById(id)) {
    const s = document.createElement('style')
    s.id = id
    s.textContent = `
      @keyframes shimmer {
        0%   { background-position: 200% 0 }
        100% { background-position: -200% 0 }
      }
    `
    document.head.appendChild(s)
  }
}

// ── Product card skeleton ─────────────────────────────────────────
export function ProductCardSkeleton() {
  return (
    <div style={{
      background:'#fff', border:'1px solid #E4DDD3',
      borderRadius:'12px', overflow:'hidden',
    }}>
      <Bone h={100} radius={0}/>
      <div style={{ padding:'10px', display:'flex', flexDirection:'column', gap:'6px' }}>
        <Bone h={10} w="40%"/>
        <Bone h={12} w="80%"/>
        <Bone h={12} w="60%"/>
        <Bone h={10} w="50%" style={{ marginTop:'2px' }}/>
        <Bone h={32} w="100%" style={{ marginTop:'4px', borderRadius:8 }}/>
      </div>
    </div>
  )
}

// ── 4-column product grid skeleton ───────────────────────────────
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div style={{
      display:'grid',
      gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))',
      gap:'16px',
    }}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i}/>
      ))}
    </div>
  )
}

// ── Order row skeleton ────────────────────────────────────────────
export function OrderRowSkeleton() {
  return (
    <div style={{
      background:'#fff', border:'1px solid #E4DDD3',
      borderRadius:'10px', padding:'14px',
      display:'flex', alignItems:'center', gap:'12px',
    }}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'6px' }}>
        <Bone h={10} w="30%"/>
        <Bone h={13} w="70%"/>
        <Bone h={10} w="40%"/>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:'5px', alignItems:'flex-end' }}>
        <Bone h={20} w={80} radius={10}/>
        <Bone h={13} w={90}/>
      </div>
    </div>
  )
}

// ── Dashboard stat card skeleton ──────────────────────────────────
export function DashboardStatSkeleton() {
  return (
    <div style={{
      background:'#fff', border:'1px solid #E4DDD3',
      borderRadius:'10px', padding:'16px',
      display:'flex', flexDirection:'column', gap:'8px',
    }}>
      <Bone h={36} w={36} radius={8}/>
      <Bone h={22} w="60%"/>
      <Bone h={11} w="50%"/>
    </div>
  )
}

// ── Page-level error fallback ─────────────────────────────────────
// HCI Principle 4 — Error Recovery:
// When Django is down, show this instead of a blank or broken page.
export function APIErrorFallback({ message, onRetry }: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <div style={{
      background:'#fff', border:'1px solid #E4DDD3',
      borderRadius:'12px', padding:'40px 24px',
      textAlign:'center', margin:'24px 0',
    }}>
      <div style={{ fontSize:'36px', marginBottom:'12px' }}>😔</div>
      <h3 style={{
        fontFamily:'sans-serif', fontSize:'17px',
        fontWeight:800, color:'#1A1A1A', marginBottom:'8px',
      }}>
        Could not load content
      </h3>
      <p style={{ fontSize:'13px', color:'#78909C', lineHeight:1.6, marginBottom:'20px' }}>
        {message || 'Make sure Django is running on port 8000.\nCheck your terminal for errors.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background:'#0D1B2A', color:'#fff', border:'none',
            borderRadius:'8px', padding:'10px 22px',
            fontWeight:700, fontSize:'13px', cursor:'pointer',
          }}
        >
          Try Again
        </button>
      )}
    </div>
  )
}
