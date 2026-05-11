/**
 * pages/help.tsx
 *
 * Help & Support page.
 * Accessible at: http://localhost:3000/help
 *
 * Contains:
 * - Multiple contact channels (WhatsApp, Email, Call)
 * - Expected response times
 * - Links to FAQs and T&Cs
 * - Order tracking quick link
 */

import Head from 'next/head'
import Link from 'next/link'

export default function HelpPage() {
  return (
    <>
      <Head>
        <title>Help & Support — Racks</title>
      </Head>

      {/* Header */}
      <div style={{
        background:'#0D1B2A', padding:'0 24px', height:'52px',
        display:'flex', alignItems:'center', justifyContent:'space-between'
      }}>
        <Link href="/" style={{ textDecoration:'none' }}>
          <span style={{ fontFamily:'sans-serif', fontSize:'18px', fontWeight:900, color:'#fff' }}>
            RA<span style={{ color:'#F5B942' }}>CK</span>S
          </span>
        </Link>
        <span style={{ fontSize:'12px', color:'rgba(255,255,255,.5)' }}>Help & Support</span>
        <div style={{ width:'60px' }}/>
      </div>

      <div style={{ background:'var(--color-surface-3)', minHeight:'100vh', padding:'32px 16px' }}>
        <div style={{ maxWidth:'640px', margin:'0 auto' }}>

          {/* Hero */}
          <div style={{ textAlign:'center', marginBottom:'32px' }}>
            <div style={{ fontSize:'36px', marginBottom:'12px' }}>👋</div>
            <h1 style={{
              fontFamily:'sans-serif', fontSize:'26px',
              fontWeight:900, color:'#0D1B2A', marginBottom:'8px'
            }}>
              How can we help?
            </h1>
            <p style={{ fontSize:'13px', color:'var(--color-ink-3)', lineHeight:1.6 }}>
              We are a real team based in Kampala. We respond fast.
            </p>
          </div>

          {/* Contact channels */}
          <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'32px' }}>

            {/* WhatsApp — primary */}
            <a
              href="https://wa.me/256700000000?text=Hi Racks, I need help with my order"
              target="_blank" rel="noreferrer"
              style={{ textDecoration:'none' }}
            >
              <div style={{
                background:'var(--color-surface)', border:'2px solid #25D366',
                borderRadius:'12px', padding:'18px 20px',
                display:'flex', alignItems:'center', gap:'16px',
                cursor:'pointer'
              }}>
                <div style={{
                  width:'48px', height:'48px', borderRadius:'12px',
                  background:'#25D366', display:'flex', alignItems:'center',
                  justifyContent:'center', fontSize:'24px', flexShrink:0
                }}>
                  💬
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'15px', fontWeight:700, color:'var(--color-ink)', marginBottom:'2px' }}>
                    WhatsApp
                  </div>
                  <div style={{ fontSize:'12px', color:'#25D366', fontWeight:600, marginBottom:'2px' }}>
                    +256 700 000 000
                  </div>
                  <div style={{ fontSize:'11px', color:'var(--color-ink-3)' }}>
                    Fastest response · Usually within 5 minutes
                  </div>
                </div>
                <div style={{
                  background:'#25D366', color:'#fff',
                  fontSize:'10px', fontWeight:700,
                  padding:'3px 10px', borderRadius:'10px',
                  whiteSpace:'nowrap'
                }}>
                  Open Chat
                </div>
              </div>
            </a>

            {/* Email */}
            <a href="mailto:support@racks.ug" style={{ textDecoration:'none' }}>
              <div style={{
                background:'var(--color-surface)', border:'1px solid var(--color-border)',
                borderRadius:'12px', padding:'18px 20px',
                display:'flex', alignItems:'center', gap:'16px',
                cursor:'pointer'
              }}>
                <div style={{
                  width:'48px', height:'48px', borderRadius:'12px',
                  background:'#E3F2FD', display:'flex', alignItems:'center',
                  justifyContent:'center', fontSize:'24px', flexShrink:0
                }}>
                  ✉️
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'15px', fontWeight:700, color:'var(--color-ink)', marginBottom:'2px' }}>
                    Email
                  </div>
                  <div style={{ fontSize:'12px', color:'#1565C0', fontWeight:600, marginBottom:'2px' }}>
                    support@racks.ug
                  </div>
                  <div style={{ fontSize:'11px', color:'var(--color-ink-3)' }}>
                    Response within 2 hours during business hours
                  </div>
                </div>
              </div>
            </a>

            {/* Call */}
            <a href="tel:+256700000000" style={{ textDecoration:'none' }}>
              <div style={{
                background:'var(--color-surface)', border:'1px solid var(--color-border)',
                borderRadius:'12px', padding:'18px 20px',
                display:'flex', alignItems:'center', gap:'16px',
                cursor:'pointer'
              }}>
                <div style={{
                  width:'48px', height:'48px', borderRadius:'12px',
                  background:'#FFF3E0', display:'flex', alignItems:'center',
                  justifyContent:'center', fontSize:'24px', flexShrink:0
                }}>
                  📞
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'15px', fontWeight:700, color:'var(--color-ink)', marginBottom:'2px' }}>
                    Call Us
                  </div>
                  <div style={{ fontSize:'12px', color:'#E65100', fontWeight:600, marginBottom:'2px' }}>
                    +256 700 000 000
                  </div>
                  <div style={{ fontSize:'11px', color:'var(--color-ink-3)' }}>
                    Mon–Sat · 8:00 AM – 8:00 PM
                  </div>
                </div>
              </div>
            </a>
          </div>

          {/* Quick links */}
          <div style={{ marginBottom:'32px' }}>
            <h2 style={{
              fontFamily:'sans-serif', fontSize:'15px',
              fontWeight:800, color:'#0D1B2A', marginBottom:'12px'
            }}>
              Quick Links
            </h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
              {[
                { href:'/faq',   icon:'❓', label:'FAQs',               sub:'Common questions answered' },
                { href:'/terms', icon:'📋', label:'Terms & Conditions',  sub:'Our policies and rules' },
                { href:'/track', icon:'📦', label:'Track an Order',      sub:'Enter your order ID' },
                { href:'/',      icon:'🛒', label:'Back to Shopping',    sub:'Continue browsing' },
              ].map(item => (
                <Link key={item.href} href={item.href} style={{ textDecoration:'none' }}>
                  <div style={{
                    background:'var(--color-surface)', border:'1px solid var(--color-border)',
                    borderRadius:'10px', padding:'14px',
                    cursor:'pointer', height:'100%'
                  }}>
                    <div style={{ fontSize:'22px', marginBottom:'6px' }}>{item.icon}</div>
                    <div style={{ fontSize:'13px', fontWeight:700, color:'var(--color-ink)', marginBottom:'2px' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize:'11px', color:'var(--color-ink-3)' }}>{item.sub}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Business hours */}
          <div style={{
            background:'var(--color-surface)', border:'1px solid var(--color-border)',
            borderRadius:'12px', padding:'20px'
          }}>
            <h2 style={{
              fontFamily:'sans-serif', fontSize:'15px',
              fontWeight:800, color:'#0D1B2A', marginBottom:'14px'
            }}>
              Business Hours
            </h2>
            {[
              ['Monday – Friday', '8:00 AM – 8:00 PM'],
              ['Saturday',        '9:00 AM – 6:00 PM'],
              ['Sunday',          '10:00 AM – 4:00 PM'],
              ['Public Holidays', 'WhatsApp only'],
            ].map(([day, hours]) => (
              <div key={day} style={{
                display:'flex', justifyContent:'space-between',
                padding:'8px 0', borderBottom:'1px solid #E4DDD3',
                fontSize:'13px'
              }}>
                <span style={{ color:'var(--color-ink-2)' }}>{day}</span>
                <span style={{ fontWeight:600, color:'#0D1B2A' }}>{hours}</span>
              </div>
            ))}
            <p style={{
              fontSize:'11px', color:'var(--color-ink-3)',
              marginTop:'12px', lineHeight:1.6
            }}>
              Outside business hours? WhatsApp us — we check messages regularly
              and will respond as soon as possible.
            </p>
          </div>

        </div>
      </div>
    </>
  )
}
