/**
 * pages/terms.tsx
 *
 * Terms & Conditions page.
 * Accessible at: http://localhost:3000/terms
 *
 * Covers:
 * - Payment terms
 * - Delivery policy
 * - Return and refund policy
 * - Privacy policy summary
 * - Vendor terms
 * - Governing law (Uganda)
 *
 * Note: For a real production platform these would be reviewed
 * by a lawyer. This version is appropriate for a school project
 * demonstration of a complete e-commerce platform.
 */

import Head from 'next/head'
import Link from 'next/link'

const LAST_UPDATED = 'April 2026'

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>Terms & Conditions — Racks</title>
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
        <span style={{ fontSize:'12px', color:'rgba(255,255,255,.5)' }}>Terms & Conditions</span>
        <div style={{ width:'80px' }}/>
      </div>

      <div style={{ background:'var(--color-surface-3)', minHeight:'100vh', padding:'32px 16px' }}>
        <div style={{ maxWidth:'680px', margin:'0 auto' }}>

          {/* Title */}
          <div style={{ marginBottom:'28px' }}>
            <h1 style={{
              fontFamily:'sans-serif', fontSize:'26px',
              fontWeight:900, color:'#0D1B2A', marginBottom:'6px'
            }}>
              Terms & Conditions
            </h1>
            <p style={{ fontSize:'12px', color:'var(--color-ink-3)' }}>
              Last updated: {LAST_UPDATED} · Governing law: Uganda
            </p>
          </div>

          {/* Intro */}
          <div style={{
            background:'#E3F2FD', border:'1px solid #1565C0',
            borderRadius:'10px', padding:'14px 16px', marginBottom:'24px',
            fontSize:'13px', color:'var(--color-ink)', lineHeight:1.65
          }}>
            By placing an order on Racks, you agree to these terms. Please read them.
            If you have questions, <Link href="/help" style={{ color:'#1565C0', fontWeight:600 }}>contact us</Link> before purchasing.
          </div>

          {[
            {
              title: '1. About Racks',
              content: `Racks is an e-commerce platform operating in Uganda. We connect buyers with vendors selling electronics, home appliances, kitchen equipment, fashion, and related products. Racks facilitates the sale but individual products may be sold by third-party vendors listed on the platform.

Racks Uganda is registered in Uganda. Our principal office is in Kampala. For all inquiries, contact support@racks.ug or WhatsApp +256 700 000 000.`
            },
            {
              title: '2. Payment Terms',
              content: `All prices are listed in Uganda Shillings (UGX). Prices include applicable taxes unless stated otherwise.

Accepted payment methods: MTN Mobile Money, Airtel Money, Visa, Mastercard, and Cash on Delivery (for eligible orders).

Payment is processed through Flutterwave, which is regulated by the Bank of Uganda. Racks does not store your card details or MoMo PIN. By initiating payment you authorise the stated amount to be charged.

Cash on Delivery is available for orders up to UGX 1,000,000 in covered districts. Payment must be made at the time of delivery in exact change or via mobile money to the rider.

If your payment fails, your order is preserved and you may retry payment from your Orders page. Racks is not liable for failed payments caused by insufficient balance, network issues, or incorrect payment details entered by the buyer.`
            },
            {
              title: '3. Delivery Policy',
              content: `Racks delivers to covered Uganda districts only. The list of covered districts is shown on every product page and at checkout. We are continuously expanding coverage.

Delivery times are estimates and not guaranteed. Delays may occur due to public holidays, weather, or logistics issues. Racks will communicate any significant delays via WhatsApp or email.

Delivery fees are calculated per district and shown at checkout before payment. Orders above UGX 200,000 qualify for free delivery to most districts.

A rider will contact you before arriving. If you are unavailable for two consecutive delivery attempts, your order will be held at our nearest collection point for 48 hours before being returned. A re-delivery fee may apply.

Risk of loss passes to the buyer upon successful delivery and confirmation.`
            },
            {
              title: '4. Returns & Refunds',
              content: `You may return items within 7 days of delivery if:
• The item is defective or damaged on arrival
• The item does not match its description on the Racks listing
• The wrong item was delivered

Items must be in their original condition and packaging to qualify for return.

To initiate a return, contact us via WhatsApp at +256 700 000 000 within the 7-day window. We will arrange collection.

Refunds are processed within 3–5 working days back to the original payment method. Cash on Delivery orders are refunded via MTN MoMo or Airtel Money.

The following are not eligible for return: items damaged after delivery due to buyer misuse, items without original packaging, perishable goods, and items purchased during final clearance sales (marked "No Returns").`
            },
            {
              title: '5. Privacy Policy',
              content: `We collect: your name, email, phone number, and delivery address when you create an account or place an order. We also collect transaction data including order history and payment references.

We use this data to: process your orders, send order notifications, improve our platform, and contact you about your purchases.

We do not sell your personal data to third parties. We share data only with our delivery partners (to fulfil your order) and Flutterwave (to process payments).

Your data is stored securely on servers within Uganda or the East African region. You may request deletion of your account and associated data by emailing support@racks.ug.

By creating an account you consent to receiving transactional messages (order confirmations, delivery updates) via WhatsApp, SMS, or email. You may opt out of marketing messages at any time.`
            },
            {
              title: '6. Vendor Terms',
              content: `Vendors listing products on Racks must:
• List only products they have legitimate authority to sell
• Ensure product descriptions are accurate and not misleading
• Maintain sufficient stock for listed products
• Honour orders placed through the platform

Vendors receive payouts via MTN MoMo or Airtel Money after deduction of the agreed commission rate (Starter plan: 8%, Pro plan: 5%).

Racks reserves the right to remove listings, suspend, or permanently ban vendors who violate these terms, receive repeated customer complaints, or engage in fraudulent activity.

Vendor applications are reviewed within 24 hours. Approval is at Racks' sole discretion.`
            },
            {
              title: '7. Intellectual Property',
              content: `The Racks name, logo, and platform design are the property of Racks Uganda. You may not reproduce, copy, or use them without written permission.

Product images and descriptions uploaded by vendors remain the property of the respective vendors. By listing on Racks, vendors grant Racks a licence to display this content on the platform.`
            },
            {
              title: '8. Limitation of Liability',
              content: `Racks is a platform connecting buyers and vendors. While we vet vendors and monitor product quality, we are not the manufacturer of the products sold.

To the maximum extent permitted by Uganda law, Racks is not liable for: indirect or consequential damages arising from the use of the platform, delays in delivery caused by third-party logistics, or product defects caused during manufacturing.

Our maximum liability to any buyer shall not exceed the total amount paid for the disputed order.`
            },
            {
              title: '9. Changes to These Terms',
              content: `We may update these terms from time to time. Significant changes will be communicated via email or a notice on the platform. Continued use of Racks after changes constitutes acceptance of the updated terms.`
            },
            {
              title: '10. Governing Law',
              content: `These terms are governed by the laws of Uganda. Any disputes arising from the use of the Racks platform shall be subject to the jurisdiction of the courts of Uganda.

For any dispute, we encourage you to first contact our support team at support@racks.ug. Most issues are resolved within 48 hours.`
            },
          ].map((section) => (
            <div
              key={section.title}
              style={{
                background:'var(--color-surface)', border:'1px solid var(--color-border)',
                borderRadius:'10px', padding:'20px 22px',
                marginBottom:'10px'
              }}
            >
              <h2 style={{
                fontFamily:'sans-serif', fontSize:'15px',
                fontWeight:800, color:'#0D1B2A', marginBottom:'10px'
              }}>
                {section.title}
              </h2>
              {section.content.split('\n').map((line, i) => (
                line.trim() === ''
                  ? <div key={i} style={{ height:'8px' }}/>
                  : <p key={i} style={{
                      fontSize:'13px', color:'var(--color-ink-2)',
                      lineHeight:1.7, marginBottom:'4px'
                    }}>
                      {line}
                    </p>
              ))}
            </div>
          ))}

          {/* Contact footer */}
          <div style={{
            background:'#0D1B2A', borderRadius:'12px',
            padding:'20px 24px', textAlign:'center', marginTop:'8px'
          }}>
            <div style={{
              fontSize:'14px', fontWeight:700,
              color:'#fff', marginBottom:'6px'
            }}>
              Questions about these terms?
            </div>
            <div style={{ fontSize:'12px', color:'rgba(255,255,255,.5)', marginBottom:'12px' }}>
              Email us at support@racks.ug or WhatsApp +256 700 000 000
            </div>
            <Link href="/help" style={{
              display:'inline-block',
              background:'#C8922A', color:'#0D1B2A',
              borderRadius:'7px', padding:'8px 18px',
              fontWeight:700, fontSize:'12px',
              textDecoration:'none',
            }}>
              Contact Support
            </Link>
          </div>

        </div>
      </div>
    </>
  )
}
