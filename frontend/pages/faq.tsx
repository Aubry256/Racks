/**
 * pages/faq.tsx
 *
 * Frequently Asked Questions page.
 * Accessible at: http://localhost:3000/faq
 *
 * Covers the most common questions for Ugandan first-time
 * e-commerce buyers — especially around MoMo payment,
 * delivery, returns, and order tracking.
 *
 * HCI Principle 6 — Learnability:
 * This page exists to fill the gap that Dombelo had.
 * Dombelo had zero guidance anywhere on the platform.
 * These FAQs answer every question a first-time buyer
 * might have before, during, and after purchase.
 */

'use client'
import { useState } from 'react'
import Head          from 'next/head'
import Link          from 'next/link'

const FAQS = [
  {
    category: 'Payment',
    icon: '💳',
    items: [
      {
        q: 'How does MTN MoMo payment work?',
        a: `It is simple. At checkout, enter your MTN Uganda number (e.g. 0771234567). After clicking Pay, a payment prompt appears on your phone screen — it says "Pay UGX [amount] to Racks Uganda". Enter your MoMo PIN and tap OK. Payment is confirmed in seconds. You do not need to go to a MoMo agent or send money anywhere — it all happens on your phone.`
      },
      {
        q: 'What if I don\'t receive the MoMo prompt?',
        a: `Wait 30 seconds. If it has not appeared, tap "Resend Payment Prompt" on the payment page. If you still don't receive it, dial *165# on your phone to check pending payments. If the issue continues, WhatsApp us at +256 700 000 000 — your order is saved and we will help you complete payment.`
      },
      {
        q: 'Is Visa and Mastercard accepted?',
        a: `Yes. Select "Visa / Mastercard" at checkout. You will be redirected to a secure Flutterwave payment page where you enter your card details. Your card information is handled entirely by Flutterwave — Racks never sees or stores your card number.`
      },
      {
        q: 'What happens if my payment fails?',
        a: `Nothing is lost. Your order is saved to our system before payment is attempted. If payment fails for any reason — wrong PIN, insufficient balance, network issue — your order stays in your account. Go to My Account → Orders → find your order → tap Retry Payment. You do not need to re-enter your delivery details or find your items again.`
      },
      {
        q: 'Can I pay cash on delivery?',
        a: `Yes, for covered districts. Select "Cash on Delivery" at checkout. Your items will be delivered and you pay the rider in cash. Note: cash on delivery is available for orders up to UGX 1,000,000. For larger orders, mobile money or card payment is required.`
      },
      {
        q: 'Is it safe to pay on Racks?',
        a: `Yes. All payments go through Flutterwave, which is regulated by the Bank of Uganda and the Central Bank of Kenya. Your MoMo payment is authorised by you personally using your PIN — we never ask for your PIN and we never have access to it. Card payments use 3D Secure encryption.`
      },
    ]
  },
  {
    category: 'Delivery',
    icon: '🚚',
    items: [
      {
        q: 'Which districts do you deliver to?',
        a: `We currently deliver to Kampala, Wakiso, Mukono, Entebbe, Jinja, Mbarara, Gulu, Mbale, Masaka, and Buikwe. We are expanding to more districts regularly. Check the product page or checkout form — it shows live delivery availability for your district. If your district is not covered yet, we will show it as "Coming soon".`
      },
      {
        q: 'How much does delivery cost?',
        a: `Delivery to Kampala is always free. For other districts, fees range from UGX 5,000 to UGX 25,000 depending on distance. Orders above UGX 200,000 qualify for free delivery to most districts. The exact fee for your district is shown on the product page and at checkout before you pay.`
      },
      {
        q: 'How long does delivery take?',
        a: `Kampala and Wakiso: next day (sometimes same day). Mukono, Entebbe, Jinja: 1–2 working days. Mbarara, Gulu, Mbale: 2–3 working days. You will receive a WhatsApp message with your tracking link when your order is dispatched. Your rider will call before arriving.`
      },
      {
        q: 'Can I track my order?',
        a: `Yes. After placing an order, go to My Account → Orders → tap your order. The tracking page shows live status: Order Placed → Payment Confirmed → Out for Delivery → Delivered. Status updates push to your screen automatically — no need to refresh.`
      },
      {
        q: 'What if I am not home when the rider arrives?',
        a: `Your rider will call before arriving. If you miss the call, they will attempt delivery once more. If delivery fails twice, your order is held at our nearest pickup point for 48 hours. Contact us on WhatsApp to reschedule at no extra cost.`
      },
    ]
  },
  {
    category: 'Orders & Returns',
    icon: '📦',
    items: [
      {
        q: 'Can I cancel an order?',
        a: `Yes, if the order has not been dispatched yet. Go to My Account → Orders → tap your order → tap Cancel Order. Once dispatched, cancellation is not possible but you can initiate a return after delivery.`
      },
      {
        q: 'What is the return policy?',
        a: `We accept returns within 7 days of delivery for items that are: defective or damaged on arrival, not as described, or the wrong item was delivered. Items must be in original packaging. To start a return, WhatsApp us with your order number and photos of the issue. Refunds are processed within 3–5 working days back to your MoMo or card.`
      },
      {
        q: 'What if my item arrives damaged?',
        a: `Take a photo immediately and WhatsApp us within 24 hours of delivery. Include your order number. We will arrange a replacement or full refund. Do not return the item until you hear from us — we will send a rider to collect it.`
      },
      {
        q: 'I ordered the wrong item. Can I exchange it?',
        a: `Yes. Contact us within 48 hours of delivery. If the item is unused and in original packaging, we can exchange it. Delivery fees for the exchange may apply. WhatsApp us at +256 700 000 000 to arrange.`
      },
      {
        q: 'How do I get my receipt?',
        a: `After your order is confirmed, go to My Account → Orders → tap your order → tap "View Receipt". The receipt shows your full order details, payment reference, and total. You can print it directly from your browser.`
      },
    ]
  },
  {
    category: 'Account',
    icon: '👤',
    items: [
      {
        q: 'Do I need an account to shop?',
        a: `You can browse and add items to cart without an account. However, you need an account to place an order, track delivery, and save your address for faster checkout. Creating an account takes under 1 minute — just an email address and password.`
      },
      {
        q: 'I forgot my password. What do I do?',
        a: `On the login page, tap "Lost your password?" and enter your email address. We will send a password reset link to your email within 2 minutes. Check your spam folder if you do not see it.`
      },
      {
        q: 'Can I change my delivery address after ordering?',
        a: `Yes, if the order has not been dispatched. WhatsApp us immediately with your order number and new address. Once the order is dispatched, the address cannot be changed.`
      },
    ]
  },
]

export default function FAQPage() {
  const [openItem, setOpenItem] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('Payment')

  const toggle = (key: string) => {
    setOpenItem(openItem === key ? null : key)
  }

  const currentFaqs = FAQS.find(f => f.category === activeCategory)

  return (
    <>
      <Head>
        <title>FAQs — Racks</title>
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
        <span style={{ fontSize:'12px', color:'rgba(255,255,255,.5)' }}>FAQs</span>
        <Link href="/help" style={{ fontSize:'12px', color:'rgba(255,255,255,.5)', textDecoration:'none' }}>
          Need help? →
        </Link>
      </div>

      <div style={{ background:'var(--color-surface-3)', minHeight:'100vh', padding:'32px 16px' }}>
        <div style={{ maxWidth:'640px', margin:'0 auto' }}>

          {/* Hero */}
          <div style={{ textAlign:'center', marginBottom:'28px' }}>
            <h1 style={{
              fontFamily:'sans-serif', fontSize:'26px',
              fontWeight:900, color:'#0D1B2A', marginBottom:'8px'
            }}>
              Frequently Asked Questions
            </h1>
            <p style={{ fontSize:'13px', color:'var(--color-ink-3)' }}>
              Everything you need to know about shopping on Racks.
            </p>
          </div>

          {/* Category tabs */}
          <div style={{
            display:'flex', gap:'6px', marginBottom:'20px',
            flexWrap:'wrap'
          }}>
            {FAQS.map(section => (
              <button
                key={section.category}
                onClick={() => setActiveCategory(section.category)}
                style={{
                  padding:'7px 16px', borderRadius:'20px',
                  border: activeCategory===section.category
                    ? '1.5px solid #0D1B2A'
                    : '1px solid #E4DDD3',
                  background: activeCategory===section.category ? '#0D1B2A' : '#fff',
                  color: activeCategory===section.category ? '#F5B942' : 'var(--color-ink-3)',
                  fontFamily:'sans-serif', fontSize:'12px', fontWeight:600,
                  cursor:'pointer',
                }}
              >
                {section.icon} {section.category}
              </button>
            ))}
          </div>

          {/* FAQ items */}
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            {currentFaqs?.items.map((item, i) => {
              const key = `${activeCategory}-${i}`
              const isOpen = openItem === key

              return (
                <div
                  key={key}
                  style={{
                    background:'var(--color-surface)',
                    border: isOpen ? '1.5px solid #C8922A' : '1px solid #E4DDD3',
                    borderRadius:'10px', overflow:'hidden',
                  }}
                >
                  {/* Question */}
                  <button
                    onClick={() => toggle(key)}
                    style={{
                      width:'100%', padding:'16px 18px',
                      background:'none', border:'none',
                      display:'flex', alignItems:'center',
                      justifyContent:'space-between', gap:'12px',
                      cursor:'pointer', textAlign:'left',
                    }}
                  >
                    <span style={{
                      fontSize:'13px', fontWeight:600,
                      color:'var(--color-ink)', lineHeight:1.4, flex:1,
                    }}>
                      {item.q}
                    </span>
                    <span style={{
                      fontSize:'18px', color:'#C8922A',
                      flexShrink:0, transform: isOpen ? 'rotate(45deg)' : 'none',
                      transition:'transform .2s',
                    }}>
                      +
                    </span>
                  </button>

                  {/* Answer */}
                  {isOpen && (
                    <div style={{
                      padding:'0 18px 16px',
                      fontSize:'13px', color:'var(--color-ink-2)',
                      lineHeight:1.7, borderTop:'1px solid #F2EDE5',
                    }}>
                      <div style={{ paddingTop:'12px' }}>{item.a}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Still need help */}
          <div style={{
            background:'#0D1B2A', borderRadius:'12px',
            padding:'24px', textAlign:'center', marginTop:'28px'
          }}>
            <div style={{ fontSize:'22px', marginBottom:'8px' }}>💬</div>
            <div style={{
              fontSize:'15px', fontWeight:700,
              color:'#fff', marginBottom:'6px'
            }}>
              Still have a question?
            </div>
            <div style={{ fontSize:'12px', color:'rgba(255,255,255,.5)', marginBottom:'16px' }}>
              Our team replies in under 5 minutes on WhatsApp
            </div>
            <a
              href="https://wa.me/256700000000"
              target="_blank" rel="noreferrer"
              style={{
                display:'inline-block',
                background:'#25D366', color:'#fff',
                borderRadius:'8px', padding:'10px 22px',
                fontWeight:700, fontSize:'13px',
                textDecoration:'none',
              }}
            >
              WhatsApp Us
            </a>
          </div>

        </div>
      </div>
    </>
  )
}
