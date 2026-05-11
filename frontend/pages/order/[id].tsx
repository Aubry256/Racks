/**
 * pages/order/[id].tsx — Order Tracking Page
 *
 * HCI Principle 2 — Feedback:
 * This page shows live order status. When the order progresses
 * (payment confirmed → dispatched → delivered), the status
 * updates automatically without the user refreshing.
 *
 * This directly addresses what we saw on Dombelo:
 * - Dombelo order confirm: "Click here to refresh payment status"
 *   (manual refresh, no automation)
 * - Racks: WebSocket pushes update automatically
 *
 * HCI Principle 3 — Visibility:
 * Every stage of the order journey is visible in the pipeline.
 * User always knows exactly where their order is.
 */

import { GetServerSideProps } from 'next'
import Head                   from 'next/head'
import { useEffect, useState } from 'react'
import { getOrder }           from '@/lib/api'
import { useOrderSocket, OrderStatus } from '@/lib/useOrderSocket'

// The four stages every order goes through
const STAGES: { key: OrderStatus; label: string; desc: string }[] = [
  { key: 'pending',    label: 'Order Placed',      desc: 'We received your order' },
  { key: 'processing', label: 'Payment Confirmed',  desc: 'Being prepared for dispatch' },
  { key: 'dispatched', label: 'Out for Delivery',   desc: 'Your rider is on the way' },
  { key: 'delivered',  label: 'Delivered',           desc: 'Enjoy your purchase!' },
]

const STAGE_INDEX: Record<string, number> = {
  pending: 0, processing: 1, dispatched: 2, delivered: 3, cancelled: -1
}

interface Props { order: any; error?: string }

export default function OrderPage({ order, error }: Props) {
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(
    order?.status || 'pending'
  )
  const [liveMessage, setLiveMessage] = useState('')

  // ── WebSocket connection ─────────────────────────────────────────
  // HCI Principle 2 — Feedback: live updates while on this page
  const { update, connected, error: wsError } = useOrderSocket(order?.id || '')

  // Apply WebSocket updates to the UI
  useEffect(() => {
    if (update) {
      setCurrentStatus(update.status)
      setLiveMessage(update.message)
    }
  }, [update])

  if (error || !order) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>Order not found</h1>
        <p>{error}</p>
      </div>
    )
  }

  const currentIdx = STAGE_INDEX[currentStatus] ?? 0

  return (
    <>
      <Head>
        <title>Order #{order.id.slice(0,8).toUpperCase()} — Racks</title>
      </Head>

      {/* Header band */}
      <div style={{ background: '#0D1B2A', padding: '20px 24px' }}>
        <p style={{ fontSize: '10px', color: '#546E7A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>
          Order #{order.id.slice(0,8).toUpperCase()}
        </p>
        <h1 style={{ fontFamily: 'sans-serif', fontSize: '24px', fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>
          {currentStatus === 'dispatched' ? 'On Its Way to You 🚚'
           : currentStatus === 'delivered' ? 'Delivered ✅'
           : currentStatus === 'processing' ? 'Being Prepared'
           : 'Order Placed'}
        </h1>
        <p style={{ fontSize: '13px', color: '#78909C', margin: 0 }}>
          {new Date(order.created_at).toLocaleDateString('en-UG', {
            weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
          })} ·{' '}
          {order.items?.length} item{order.items?.length !== 1 ? 's' : ''} ·{' '}
          UGX {Number(order.total_amount).toLocaleString()}
        </p>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>

        {/* ── Live connection indicator ─────────────────────────── */}
        {/* HCI Principle 2 — Feedback: user knows tracking is live */}
        {connected && (
          <div style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '8px',
            marginBottom: '14px',
            fontSize:     '12px',
            color:        '#1B5E20',
            fontWeight:   600,
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1B5E20', display: 'inline-block' }} />
            Live tracking active — updates appear automatically
          </div>
        )}
        {wsError && (
          <div style={{ background: '#FFF3E0', border: '1px solid #E65100', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '12px', color: '#E65100' }}>
            {wsError}
          </div>
        )}

        {/* ── Live message ──────────────────────────────────────── */}
        {/* HCI Principle 2 — Feedback: human-readable status update */}
        {liveMessage && (
          <div style={{
            background:   '#FDF3E0',
            border:       '1px solid #C8922A',
            borderRadius: '8px',
            padding:      '12px 16px',
            marginBottom: '16px',
            fontSize:     '13px',
            color:        '#1A1A1A',
            lineHeight:   1.5,
          }}>
            {liveMessage}
          </div>
        )}

        {/* ── Order tracking pipeline ───────────────────────────── */}
        {/* HCI Principle 3 — Visibility: entire journey shown */}
        <div style={{
          background:   '#fff',
          border:       '1px solid #E4DDD3',
          borderRadius: '12px',
          padding:      '20px',
          marginBottom: '16px',
        }}>
          {STAGES.map((stage, i) => {
            const isDone   = i < currentIdx
            const isActive = i === currentIdx
            const isNext   = i > currentIdx

            return (
              <div key={stage.key} style={{
                display:        'flex',
                gap:            '16px',
                paddingBottom:  i < STAGES.length - 1 ? '24px' : 0,
                position:       'relative',
              }}>
                {/* Connector line between stages */}
                {i < STAGES.length - 1 && (
                  <div style={{
                    position:   'absolute',
                    left:       '15px',
                    top:        '32px',
                    width:      '2px',
                    bottom:     0,
                    background: isDone ? '#C8922A' : '#E4DDD3',
                  }} />
                )}

                {/* Stage circle */}
                <div style={{
                  width:          '32px',
                  height:         '32px',
                  borderRadius:   '50%',
                  flexShrink:     0,
                  zIndex:         1,
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontSize:       '13px',
                  fontWeight:     700,
                  background:     isDone   ? '#C8922A'
                                 : isActive ? '#0D1B2A'
                                 : '#fff',
                  border:         isDone   ? '2px solid #C8922A'
                                 : isActive ? '2px solid #F5B942'
                                 : '2px solid #E4DDD3',
                  color:          isDone   ? '#fff'
                                 : isActive ? '#F5B942'
                                 : '#ABABAB',
                  boxShadow:      isActive ? '0 0 0 4px rgba(200,146,42,0.15)' : 'none',
                }}>
                  {isDone ? '✓' : i + 1}
                </div>

                {/* Stage content */}
                <div style={{ paddingTop: '4px' }}>
                  <p style={{
                    fontSize:   '14px',
                    fontWeight: isActive || isDone ? 700 : 400,
                    color:      isNext ? '#ABABAB' : '#1A1A1A',
                    margin:     '0 0 2px',
                  }}>
                    {stage.label}
                  </p>
                  <p style={{ fontSize: '12px', color: '#7A7A7A', margin: 0 }}>
                    {stage.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Order items ───────────────────────────────────────── */}
        <div style={{
          background:   '#fff',
          border:       '1px solid #E4DDD3',
          borderRadius: '12px',
          padding:      '16px',
          marginBottom: '16px',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#7A7A7A', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>
            Your Items
          </p>
          {order.items?.map((item: any, i: number) => (
            <div key={i} style={{
              display:       'flex',
              alignItems:    'center',
              gap:           '12px',
              paddingBottom: i < order.items.length - 1 ? '12px' : 0,
              marginBottom:  i < order.items.length - 1 ? '12px' : 0,
              borderBottom:  i < order.items.length - 1 ? '1px solid #E4DDD3' : 'none',
            }}>
              <div style={{ width: '44px', height: '44px', background: '#F2EDE5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                📦
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#1A1A1A', margin: '0 0 2px' }}>{item.name}</p>
                <p style={{ fontSize: '11px', color: '#7A7A7A', margin: 0 }}>Qty: {item.qty}</p>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A' }}>
                UGX {(item.price * item.qty).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* ── Support ───────────────────────────────────────────── */}
        <div style={{
          background:   '#fff',
          border:       '1px solid #E4DDD3',
          borderRadius: '12px',
          padding:      '16px',
          display:      'flex',
          justifyContent: 'space-between',
          alignItems:   'center',
        }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A', margin: '0 0 2px' }}>Need help?</p>
            <p style={{ fontSize: '12px', color: '#7A7A7A', margin: 0 }}>We respond in under 5 minutes</p>
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            <a href={`/order/${order.id}/receipt`} style={{
              background:'#F9F6F1', color:'#0D1B2A',
              border:'1px solid #E4DDD3',
              borderRadius:'8px', padding:'10px 14px',
              fontSize:'12px', fontWeight:700, textDecoration:'none',
            }}>
              🧾 Receipt
            </a>
            <a href="https://wa.me/256700000000" target="_blank" rel="noreferrer" style={{
              background:'#25D366', color:'#fff',
              border:'none', borderRadius:'8px',
              padding:'10px 16px', fontSize:'12px',
              fontWeight:700, textDecoration:'none',
            }}>
              💬 WhatsApp
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  try {
    const { data } = await getOrder(params?.id as string)
    return { props: { order: data } }
  } catch {
    return { props: { order: null, error: 'Order not found' } }
  }
}
