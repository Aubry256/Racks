/**
 * pages/checkout.tsx — wraps CheckoutForm
 */
import Head       from 'next/head'
import { useRouter } from 'next/router'
import SiteHeader from '@/components/layout/SiteHeader'
import CheckoutForm from '@/components/checkout/CheckoutForm'

export default function CheckoutPage() {
  const router = useRouter()
  return (
    <>
      <Head><title>Checkout — Racks</title></Head>
      <SiteHeader />
      <main style={{ maxWidth:'680px', margin:'0 auto', padding:'24px 16px' }}>
        <h1 style={{ fontFamily:'sans-serif', fontSize:'22px', fontWeight:800, color:'var(--color-ink)', marginBottom:'24px' }}>Checkout</h1>
        <CheckoutForm onSuccess={(orderId) => router.push(`/order/${orderId}`)} />
      </main>
    </>
  )
}
