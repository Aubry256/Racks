/**
 * components/tracking/OrderTracker.tsx
 * Live order status pipeline — WebSocket powered.
 */

import { useEffect, useState } from 'react'
import { useOrderSocket }       from '@/lib/useOrderSocket'

const STAGES = [
  { key:'pending',    label:'Order Placed',     icon:'📋', desc:'We received your order' },
  { key:'processing', label:'Payment Confirmed', icon:'✅', desc:'Being prepared for dispatch' },
  { key:'dispatched', label:'Out for Delivery',  icon:'🚚', desc:'Your rider is on the way' },
  { key:'delivered',  label:'Delivered',          icon:'🎉', desc:'Enjoy your purchase!' },
]
const IDX: Record<string,number> = { pending:0, processing:1, dispatched:2, delivered:3 }

export default function OrderTracker({ orderId, initialStatus }: { orderId:string; initialStatus:string }) {
  const [status,  setStatus]  = useState(initialStatus)
  const [liveMsg, setLiveMsg] = useState('')
  const { update, connected } = useOrderSocket(orderId)

  useEffect(() => { if (update) { setStatus(update.status); setLiveMsg(update.message) } }, [update])

  const ci = IDX[status] ?? 0

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:16, fontSize:11, color: connected ? 'var(--color-success)' : 'var(--color-ink-3)' }}>
        <span style={{ width:7, height:7, borderRadius:'50%', background: connected ? 'var(--color-success)' : 'var(--color-ink-3)', flexShrink:0 }}/>
        {connected ? 'Live tracking active' : 'Connecting...'}
      </div>

      {liveMsg && (
        <div style={{ background:'var(--color-success-bg)', border:'1px solid var(--color-success)', borderRadius:8, padding:'12px 16px', marginBottom:20, fontSize:13, fontWeight:500, color:'var(--color-success)' }}>
          {liveMsg}
        </div>
      )}

      <div>
        {STAGES.map((stage, i) => {
          const isPast = i < ci, isCurrent = i === ci, isFuture = i > ci
          return (
            <div key={stage.key} style={{ display:'flex', gap:16 }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:40, flexShrink:0 }}>
                <div style={{
                  width:40, height:40, borderRadius:'50%',
                  background: isPast ? 'var(--color-navy)' : isCurrent ? 'var(--color-gold)' : 'var(--color-surface-2)',
                  border: isCurrent ? '2px solid var(--color-gold)' : '2px solid transparent',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:16,
                  color: isPast ? 'var(--color-gold-bright)' : 'var(--color-ink)',
                  transition:'all .3s',
                }}>
                  {isPast ? '✓' : stage.icon}
                </div>
                {i < STAGES.length - 1 && (
                  <div style={{ width:2, flex:1, minHeight:32, background: isPast ? 'var(--color-navy)' : 'var(--color-border)', margin:'4px 0', transition:'background .3s' }}/>
                )}
              </div>
              <div style={{ paddingBottom: i < STAGES.length - 1 ? 28 : 0, paddingTop:8 }}>
                <p style={{ fontSize:14, fontWeight: isCurrent ? 700 : 500, color: isFuture ? 'var(--color-ink-4)' : 'var(--color-ink)', margin:'0 0 2px' }}>{stage.label}</p>
                <p style={{ fontSize:12, color: isFuture ? 'var(--color-border-2)' : 'var(--color-ink-3)', margin:0 }}>{stage.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
