/**
 * pages/cart.tsx — Shopping Cart (dark mode ready)
 */
import Head       from 'next/head'
import Link       from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import { useCart } from '@/lib/useCart'

export default function CartPage() {
  const { items, removeItem, updateQty, total, count } = useCart()

  return (
    <>
      <Head><title>Cart — Racks</title></Head>
      <SiteHeader />
      <main style={{ maxWidth:'680px', margin:'0 auto', padding:'24px 16px' }}>
        <h1 style={{ fontFamily:'sans-serif', fontSize:'22px', fontWeight:800, color:'var(--color-ink)', marginBottom:'20px' }}>
          Your Cart {count > 0 && <span style={{ fontSize:'14px', color:'var(--color-ink-3)', fontWeight:400 }}>({count} items)</span>}
        </h1>
        {items.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0' }}>
            <p style={{ fontSize:'56px', marginBottom:'16px' }}>🛒</p>
            <p style={{ fontSize:'16px', color:'var(--color-ink-3)', marginBottom:'20px' }}>Your cart is empty</p>
            <Link href="/" style={{ display:'inline-block', background:'var(--color-gold)', color:'#fff', padding:'12px 24px', borderRadius:'8px', fontWeight:700 }}>Shop Now</Link>
          </div>
        ) : (
          <>
            <div style={{ marginBottom:'24px' }}>
              {items.map(item => (
                <div key={item.product_id} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px 0', borderBottom:'1px solid var(--color-border)' }}>
                  <div style={{ width:'64px', height:'64px', background:'var(--color-surface-2)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', flexShrink:0 }}>
                    {item.image ? <img src={item.image} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'8px' }} /> : '📦'}
                  </div>
                  <div style={{ flex:1 }}>
                    {item.brand && <p style={{ fontSize:'10px', color:'var(--color-ink-3)', fontWeight:700, textTransform:'uppercase', margin:'0 0 2px' }}>{item.brand}</p>}
                    <p style={{ fontSize:'13px', fontWeight:500, color:'var(--color-ink)', margin:'0 0 6px' }}>{item.name}</p>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <button onClick={() => updateQty(item.product_id, item.qty-1)} style={{ background:'var(--color-surface-2)', border:'none', borderRadius:'4px', width:'24px', height:'24px', cursor:'pointer', fontWeight:700, color:'var(--color-ink)' }}>−</button>
                      <span style={{ fontSize:'13px', fontWeight:700, minWidth:'20px', textAlign:'center', color:'var(--color-ink)' }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.product_id, item.qty+1)} style={{ background:'var(--color-surface-2)', border:'none', borderRadius:'4px', width:'24px', height:'24px', cursor:'pointer', fontWeight:700, color:'var(--color-ink)' }}>+</button>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontSize:'14px', fontWeight:800, color:'var(--color-ink)', marginBottom:'6px' }}>UGX {(item.price * item.qty).toLocaleString()}</p>
                    <button onClick={() => removeItem(item.product_id)} style={{ background:'none', border:'none', fontSize:'11px', color:'var(--color-danger)', cursor:'pointer' }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:'12px', padding:'20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
                <span style={{ fontSize:'14px', color:'var(--color-ink-3)' }}>Subtotal</span>
                <span style={{ fontSize:'14px', fontWeight:700, color:'var(--color-ink)' }}>UGX {total.toLocaleString()}</span>
              </div>
              <p style={{ fontSize:'11px', color:'var(--color-ink-3)', marginBottom:'16px' }}>Delivery fee calculated at checkout based on your district.</p>
              <Link href="/checkout" style={{ display:'block', background:'var(--color-gold)', color:'#fff', borderRadius:'8px', padding:'14px', textAlign:'center', fontWeight:800, fontSize:'15px' }}>
                Proceed to Checkout →
              </Link>
            </div>
          </>
        )}
      </main>
    </>
  )
}
