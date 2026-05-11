/**
 * pages/track.tsx — public order tracking by order ID
 */
import Head       from 'next/head'
import { useState } from 'react'
import { useRouter } from 'next/router'
import SiteHeader from '@/components/layout/SiteHeader'

export default function TrackPage() {
  const [orderId, setOrderId] = useState('')
  const router = useRouter()
  return (
    <>
      <Head><title>Track Order — Racks</title></Head>
      <SiteHeader />
      <main style={{ maxWidth:'480px', margin:'80px auto', padding:'0 16px', textAlign:'center' }}>
        <p style={{ fontSize:'48px', marginBottom:'16px' }}>📦</p>
        <h1 style={{ fontFamily:'sans-serif', fontSize:'22px', fontWeight:800, color:'var(--color-ink)', marginBottom:'8px' }}>Track Your Order</h1>
        <p style={{ fontSize:'14px', color:'var(--color-ink-3)', marginBottom:'24px' }}>Enter your order ID to see live status updates.</p>
        <input
          value={orderId}
          onChange={e => setOrderId(e.target.value.toUpperCase())}
          placeholder="e.g. RK-ABCDEF12"
          style={{ width:'100%', background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:'8px', padding:'12px 14px', fontSize:'14px', color:'var(--color-ink)', outline:'none', boxSizing:'border-box', marginBottom:'12px', textAlign:'center', fontFamily:'monospace' }}
          onKeyDown={e => e.key === 'Enter' && orderId.length > 6 && router.push(`/order/${orderId.toLowerCase()}`)}
        />
        <button
          onClick={() => orderId.length > 6 && router.push(`/order/${orderId.toLowerCase()}`)}
          disabled={orderId.length < 7}
          style={{ width:'100%', background: orderId.length >= 7 ? 'var(--color-navy)' : 'var(--color-border)', color: orderId.length >= 7 ? '#fff' : 'var(--color-ink-muted)', border:'none', borderRadius:'8px', padding:'13px', fontWeight:700, fontSize:'14px', cursor: orderId.length >= 7 ? 'pointer' : 'not-allowed' }}
        >
          Track Order →
        </button>
        <p style={{ fontSize:'11px', color:'var(--color-ink-3)', marginTop:'16px' }}>
          Order ID is in your email confirmation or on the receipt page.
        </p>
      </main>
    </>
  )
}
