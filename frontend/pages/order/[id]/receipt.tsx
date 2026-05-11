/**
 * pages/order/[id]/receipt.tsx
 *
 * Printable order receipt page.
 * Accessible at: http://localhost:3000/order/{id}/receipt
 *
 * Features:
 * - Full itemised receipt
 * - Payment reference number
 * - Print button (uses browser print)
 * - Clean print styles (removes navigation, buttons)
 *
 * The receipt is also sent by email automatically when
 * Flutterwave's webhook confirms payment (see payments/views.py)
 */

import { GetServerSideProps } from 'next'
import Head                   from 'next/head'
import { getOrder }           from '@/lib/api'

interface Props { order: any; error?: string }

export default function ReceiptPage({ order, error }: Props) {
  if (error || !order) {
    return (
      <div style={{ padding:'40px', textAlign:'center' }}>
        <h2>Receipt not found</h2>
        <p style={{ color:'#78909C', marginTop:'8px' }}>{error}</p>
      </div>
    )
  }

  const orderId     = order.id.slice(0,8).toUpperCase()
  const orderDate   = new Date(order.created_at).toLocaleDateString('en-UG', {
    weekday:'long', day:'numeric', month:'long', year:'numeric',
    hour:'2-digit', minute:'2-digit'
  })
  const subtotal    = order.items?.reduce((s:number, i:any) => s + i.price * i.qty, 0) || 0
  const deliveryFee = Number(order.delivery_fee) || 0
  const total       = Number(order.total_amount)

  return (
    <>
      <Head>
        <title>Receipt #{orderId} — Racks</title>
        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; }
            .receipt-wrap { box-shadow: none !important; border: none !important; }
          }
        `}</style>
      </Head>

      {/* Print / Back controls */}
      <div className="no-print" style={{
        background:'#0D1B2A', padding:'12px 24px',
        display:'flex', alignItems:'center', justifyContent:'space-between'
      }}>
        <a href={`/order/${order.id}`} style={{
          color:'rgba(255,255,255,.6)', fontSize:'13px',
          textDecoration:'none', display:'flex', alignItems:'center', gap:'6px'
        }}>
          ← Back to Order
        </a>
        <button
          onClick={() => window.print()}
          style={{
            background:'#C8922A', color:'#0D1B2A',
            border:'none', borderRadius:'7px', padding:'8px 18px',
            fontWeight:700, fontSize:'13px', cursor:'pointer'
          }}
        >
          🖨 Print Receipt
        </button>
      </div>

      {/* Receipt */}
      <div style={{ background:'#F4EFE8', minHeight:'100vh', padding:'32px 16px' }}>
        <div className="receipt-wrap" style={{
          background:'#fff', maxWidth:'560px', margin:'0 auto',
          borderRadius:'12px', overflow:'hidden',
          boxShadow:'0 4px 24px rgba(0,0,0,.1)'
        }}>

          {/* Header */}
          <div style={{
            background:'#0D1B2A', padding:'28px 32px', textAlign:'center'
          }}>
            <div style={{
              fontFamily:'sans-serif', fontSize:'28px',
              fontWeight:900, color:'#fff', letterSpacing:'-.02em',
              marginBottom:'4px'
            }}>
              RA<span style={{ color:'#F5B942' }}>CK</span>S
            </div>
            <div style={{ fontSize:'12px', color:'rgba(255,255,255,.5)' }}>
              Official Order Receipt
            </div>
          </div>

          {/* Status banner */}
          <div style={{
            background: order.payment_status==='paid' ? '#E8F5E9' : '#FFF3E0',
            padding:'12px 32px', textAlign:'center',
            borderBottom:'1px solid #E4DDD3'
          }}>
            <span style={{
              fontSize:'13px', fontWeight:700,
              color: order.payment_status==='paid' ? '#1B5E20' : '#E65100'
            }}>
              {order.payment_status==='paid'
                ? '✓ Payment Confirmed'
                : order.payment_method==='cod'
                ? '🤝 Cash on Delivery'
                : '⏳ Payment Pending'
              }
            </span>
          </div>

          <div style={{ padding:'28px 32px' }}>

            {/* Order meta */}
            <div style={{
              display:'grid', gridTemplateColumns:'1fr 1fr',
              gap:'16px', marginBottom:'24px',
              paddingBottom:'20px', borderBottom:'1px solid #E4DDD3'
            }}>
              {[
                ['Order Number',   `#${orderId}`],
                ['Date',           orderDate],
                ['Payment Method', order.payment_method?.toUpperCase() || '—'],
                ['Payment Ref',    order.payment_ref || '—'],
                ['Status',         order.status?.charAt(0).toUpperCase() + order.status?.slice(1)],
                ['District',       order.district || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{
                    fontSize:'9px', fontWeight:700, color:'#78909C',
                    textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'3px'
                  }}>
                    {label}
                  </div>
                  <div style={{ fontSize:'13px', fontWeight:600, color:'#1A1A1A' }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery address */}
            <div style={{ marginBottom:'24px', paddingBottom:'20px', borderBottom:'1px solid #E4DDD3' }}>
              <div style={{
                fontSize:'9px', fontWeight:700, color:'#78909C',
                textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'8px'
              }}>
                Delivery Address
              </div>
              <div style={{ fontSize:'13px', color:'#1A1A1A', lineHeight:1.6 }}>
                {order.delivery_address?.line1 || '—'}<br/>
                {order.district}
              </div>
            </div>

            {/* Items */}
            <div style={{ marginBottom:'20px' }}>
              <div style={{
                fontSize:'9px', fontWeight:700, color:'#78909C',
                textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'12px'
              }}>
                Items Ordered
              </div>

              {/* Table header */}
              <div style={{
                display:'grid', gridTemplateColumns:'1fr 60px 80px 90px',
                gap:'8px', padding:'6px 0',
                borderBottom:'2px solid #1A1A1A',
                fontSize:'10px', fontWeight:700, color:'#1A1A1A',
                textTransform:'uppercase', letterSpacing:'.06em'
              }}>
                <span>Item</span>
                <span style={{ textAlign:'center' }}>Qty</span>
                <span style={{ textAlign:'right' }}>Unit Price</span>
                <span style={{ textAlign:'right' }}>Total</span>
              </div>

              {/* Items */}
              {order.items?.map((item: any, i: number) => (
                <div key={i} style={{
                  display:'grid', gridTemplateColumns:'1fr 60px 80px 90px',
                  gap:'8px', padding:'10px 0',
                  borderBottom:'1px solid #E4DDD3',
                  fontSize:'12px', color:'#1A1A1A'
                }}>
                  <div>
                    <div style={{ fontWeight:500 }}>{item.name}</div>
                    {item.brand && (
                      <div style={{ fontSize:'10px', color:'#78909C' }}>{item.brand}</div>
                    )}
                  </div>
                  <div style={{ textAlign:'center', color:'#78909C' }}>{item.qty}</div>
                  <div style={{ textAlign:'right' }}>
                    {Number(item.price).toLocaleString()}
                  </div>
                  <div style={{ textAlign:'right', fontWeight:600 }}>
                    {(item.price * item.qty).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{
              background:'#F9F6F1', borderRadius:'8px',
              padding:'16px', marginBottom:'24px'
            }}>
              {[
                ['Subtotal', `UGX ${subtotal.toLocaleString()}`, false],
                ['Delivery Fee', deliveryFee === 0 ? 'FREE' : `UGX ${deliveryFee.toLocaleString()}`, false],
              ].map(([label, value, bold]) => (
                <div key={label as string} style={{
                  display:'flex', justifyContent:'space-between',
                  fontSize:'12px', color:'#78909C',
                  marginBottom:'6px'
                }}>
                  <span>{label}</span>
                  <span style={{ color: value==='FREE' ? '#1B5E20' : '#78909C', fontWeight:600 }}>
                    {value}
                  </span>
                </div>
              ))}
              <div style={{
                display:'flex', justifyContent:'space-between',
                fontSize:'16px', fontWeight:800, color:'#1A1A1A',
                borderTop:'1px solid #E4DDD3', paddingTop:'10px', marginTop:'4px'
              }}>
                <span>Total Paid</span>
                <span>UGX {total.toLocaleString()}</span>
              </div>
            </div>

            {/* Thank you note */}
            <div style={{
              textAlign:'center', padding:'16px',
              background:'rgba(200,146,42,.06)',
              borderRadius:'8px', marginBottom:'20px'
            }}>
              <div style={{ fontSize:'20px', marginBottom:'6px' }}>🙏</div>
              <div style={{
                fontSize:'14px', fontWeight:700,
                color:'#1A1A1A', marginBottom:'4px'
              }}>
                Thank you for shopping on Racks!
              </div>
              <div style={{ fontSize:'11px', color:'#78909C', lineHeight:1.6 }}>
                Questions about your order? WhatsApp us at +256 700 000 000<br/>
                or email support@racks.ug
              </div>
            </div>

            {/* Footer */}
            <div style={{
              textAlign:'center', fontSize:'10px',
              color:'#ABABAB', lineHeight:1.7
            }}>
              Racks Uganda · Kampala, Uganda<br/>
              support@racks.ug · +256 700 000 000<br/>
              This is your official receipt. Keep it for your records.
            </div>
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
