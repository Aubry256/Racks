/**
 * pages/product/[slug].tsx — Product Detail Page (dark mode ready)
 */
import { GetServerSideProps } from 'next'
import Head      from 'next/head'
import { useState } from 'react'
import toast     from 'react-hot-toast'
import SiteHeader from '@/components/layout/SiteHeader'
import { getProduct, getProductDelivery, getCoveredZones, Product } from '@/lib/api'
import { useCart } from '@/lib/useCart'

interface Props { product: Product; zones: any[]; error?: string }

export default function ProductPage({ product, zones, error }: Props) {
  const { addItem } = useCart()
  const [district, setDistrict] = useState('Kampala')
  const [delivery, setDelivery] = useState<any>(null)
  const [loading,  setLoading]  = useState(false)
  const [qty,      setQty]      = useState(1)

  if (error || !product) return (
    <div style={{ padding:'40px', textAlign:'center', color:'var(--color-ink)' }}>
      <h1>Product not found</h1>
      <a href="/" style={{ color:'var(--color-gold)' }}>← Back to Home</a>
    </div>
  )

  const checkDelivery = async () => {
    setLoading(true)
    try {
      const res = await getProductDelivery(product.id, district)
      setDelivery(res.data)
    } catch { setDelivery({ covered: false, message: 'Could not check delivery.' }) }
    setLoading(false)
  }

  const handleAddToCart = () => {
    const result = addItem({ product_id:product.id, name:product.name, price:product.current_price, qty, brand:product.brand, image:product.images?.[0], max_qty:product.stock_qty })
    if (result.success) toast.success(`${qty}× ${product.name} added!`)
    else toast.error(result.message)
  }

  const inp: React.CSSProperties = { width:'100%', background:'var(--color-surface-2)', border:'1px solid var(--color-border)', borderRadius:'6px', padding:'8px 10px', fontSize:'13px', color:'var(--color-ink)', outline:'none', boxSizing:'border-box' }

  return (
    <>
      <Head><title>{product.name} — Racks</title></Head>
      <SiteHeader />
      <main style={{ maxWidth:'900px', margin:'0 auto', padding:'24px 16px' }}>
        <a href="/" style={{ fontSize:'13px', color:'var(--color-ink-3)', display:'block', marginBottom:'20px' }}>← Back to Home</a>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'32px' }}>
          <div style={{ background:'var(--color-surface-2)', borderRadius:'12px', height:'300px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'80px', position:'relative' }}>
            {product.images?.[0] ? <img src={product.images[0]} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'contain', borderRadius:'12px' }} /> : '📦'}
            {product.discount_pct > 0 && <span style={{ position:'absolute', top:12, left:12, background:'var(--color-danger)', color:'#fff', fontSize:'12px', fontWeight:700, padding:'4px 10px', borderRadius:'6px' }}>-{product.discount_pct}% OFF</span>}
          </div>
          <div>
            <p style={{ fontSize:'11px', fontWeight:700, color:'var(--color-ink-3)', textTransform:'uppercase', letterSpacing:'.08em', margin:'0 0 6px' }}>{product.brand}</p>
            <h1 style={{ fontFamily:'sans-serif', fontSize:'22px', fontWeight:800, color:'var(--color-ink)', lineHeight:1.25, marginBottom:'16px' }}>{product.name}</h1>
            <div style={{ display:'flex', alignItems:'baseline', gap:'10px', marginBottom:'6px' }}>
              <span style={{ fontSize:'28px', fontWeight:800, color:'var(--color-ink)' }}>UGX {product.current_price.toLocaleString()}</span>
              {product.saving_ugx > 0 && <span style={{ fontSize:'14px', color:'var(--color-ink-muted)', textDecoration:'line-through' }}>{product.price.toLocaleString()}</span>}
            </div>
            {product.saving_ugx > 0 && <p style={{ fontSize:'12px', color:'var(--color-danger)', fontWeight:700, marginBottom:'12px' }}>You save UGX {product.saving_ugx.toLocaleString()}</p>}
            <p style={{ fontSize:'12px', fontWeight:600, marginBottom:'20px', color: product.stock_qty > 5 ? 'var(--color-success)' : product.stock_qty > 0 ? 'var(--color-warning)' : 'var(--color-ink-muted)' }}>
              {product.stock_qty > 5 ? `✓ ${product.stock_qty} in stock` : product.stock_qty > 0 ? `⚡ Only ${product.stock_qty} left!` : '✗ Out of stock'}
            </p>
            <div style={{ display:'flex', gap:'10px', marginBottom:'20px' }}>
              <div style={{ display:'flex', alignItems:'center', border:'1px solid var(--color-border)', borderRadius:'8px', overflow:'hidden' }}>
                <button onClick={() => setQty(q => Math.max(1, q-1))} style={{ background:'none', border:'none', padding:'8px 12px', fontSize:'16px', color:'var(--color-ink)', cursor:'pointer' }}>−</button>
                <span style={{ padding:'8px 12px', fontSize:'14px', fontWeight:700, color:'var(--color-ink)' }}>{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock_qty, q+1))} style={{ background:'none', border:'none', padding:'8px 12px', fontSize:'16px', color:'var(--color-ink)', cursor:'pointer' }}>+</button>
              </div>
              <button onClick={handleAddToCart} disabled={!product.in_stock} style={{ flex:1, background: product.in_stock ? 'var(--color-gold)' : 'var(--color-border)', color: product.in_stock ? '#fff' : 'var(--color-ink-muted)', border:'none', borderRadius:'8px', padding:'12px', fontWeight:800, fontSize:'14px', cursor: product.in_stock ? 'pointer' : 'not-allowed' }}>
                {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
            <div style={{ background:'var(--color-surface-3)', borderRadius:'10px', padding:'14px' }}>
              <p style={{ fontSize:'12px', fontWeight:700, color:'var(--color-ink-2)', marginBottom:'8px' }}>📦 Check Delivery</p>
              <div style={{ display:'flex', gap:'8px' }}>
                <select value={district} onChange={e => { setDistrict(e.target.value); setDelivery(null) }} style={inp}>
                  {zones.map(z => <option key={z.district}>{z.district}</option>)}
                </select>
                <button onClick={checkDelivery} disabled={loading} style={{ padding:'8px 14px', background:'var(--color-navy)', color:'#fff', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:700, cursor:'pointer' }}>
                  {loading ? '...' : 'Check'}
                </button>
              </div>
              {delivery && <p style={{ marginTop:'8px', fontSize:'12px', fontWeight:500, color: delivery.covered ? 'var(--color-success)' : 'var(--color-danger)' }}>{delivery.covered ? '✓' : '✗'} {delivery.message}</p>}
            </div>
          </div>
        </div>
        {product.description && (
          <div style={{ marginTop:'32px' }}>
            <h2 style={{ fontSize:'16px', fontWeight:700, color:'var(--color-ink)', marginBottom:'10px' }}>About this product</h2>
            <p style={{ fontSize:'14px', color:'var(--color-ink-2)', lineHeight:1.7 }}>{product.description}</p>
          </div>
        )}
        {Object.keys(product.attributes || {}).length > 0 && (
          <div style={{ marginTop:'24px' }}>
            <h2 style={{ fontSize:'16px', fontWeight:700, color:'var(--color-ink)', marginBottom:'12px' }}>Specifications</h2>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <tbody>
                {Object.entries(product.attributes).map(([k, v]) => (
                  <tr key={k} style={{ borderBottom:'1px solid var(--color-border)' }}>
                    <td style={{ padding:'9px 12px', fontSize:'13px', color:'var(--color-ink-3)', fontWeight:600, width:'40%', background:'var(--color-surface-3)' }}>{k}</td>
                    <td style={{ padding:'9px 12px', fontSize:'13px', color:'var(--color-ink)', background:'var(--color-surface)' }}>{v as string}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  try {
    const [productRes, zonesRes] = await Promise.all([getProduct(params?.slug as string), getCoveredZones()])
    return { props: { product: productRes.data, zones: zonesRes.data.results || zonesRes.data || [] } }
  } catch { return { props: { product: null, zones: [], error: 'Product not found' } } }
}
