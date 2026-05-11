/**
 * pages/vendor/dashboard.tsx
 *
 * Vendor dashboard — the main hub for sellers on Racks.
 *
 * Tabs:
 * 1. Overview    → stats, revenue, low stock alerts
 * 2. Products    → list + add/edit/delete products
 * 3. Add Product → form with image upload, description, attributes
 * 4. Orders      → orders containing vendor's products
 */

'use client'
import { useState, useEffect, useRef } from 'react'
import Head  from 'next/head'
import Link  from 'next/link'
import api   from '@/lib/api'

// ── Types ─────────────────────────────────────────────────────────
interface Stats {
  revenue: { total:number; this_month:number }
  orders:  { total:number; today:number }
  products:{ total:number; active:number; out_of_stock:number; low_stock:number }
  low_stock_items: { id:string; name:string; stock_qty:number }[]
  commission_pct: number
  plan: string
}
interface Product {
  id:string; name:string; price:number; stock_qty:number
  is_active:boolean; images:string[]; brand:string; category_name:string
}

const TABS = ['Overview','Products','Add Product','Orders']

export default function VendorDashboard() {
  const [tab,      setTab]      = useState('Overview')
  const [stats,    setStats]    = useState<Stats|null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [orders,   setOrders]   = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)

  // Add product form state
  const [form, setForm] = useState({
    name:'', description:'', brand:'', category:1,
    price:'', stock_qty:'', attributes:'{}', images:[] as string[],
  })
  const [uploading,   setUploading]   = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [formMessage, setFormMessage] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadStats()
    loadProducts()
  }, [])

  const loadStats = async () => {
    try {
      const { data } = await api.get('/api/auth/vendor/stats/')
      setStats(data)
    } catch { /* not a vendor */ }
    finally { setLoading(false) }
  }

  const loadProducts = async () => {
    try {
      const { data } = await api.get('/api/auth/vendor/products/')
      setProducts(data.products || [])
    } catch {}
  }

  const loadOrders = async () => {
    try {
      const { data } = await api.get('/api/auth/vendor/orders/')
      setOrders(data.orders || [])
    } catch {}
  }

  const handleTabChange = (t: string) => {
    setTab(t)
    if (t === 'Orders' && orders.length === 0) loadOrders()
  }

  // Image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const { data } = await api.post('/api/auth/upload-image/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setForm(f => ({ ...f, images: [...f.images, data.url] }))
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removeImage = (url: string) => {
    setForm(f => ({ ...f, images: f.images.filter(i => i !== url) }))
  }

  // Save product
  const handleSaveProduct = async () => {
    if (!form.name || !form.price || !form.stock_qty) {
      setFormMessage('Name, price and stock are required.')
      return
    }
    setSaving(true)
    setFormMessage('')
    try {
      let attrs = {}
      try { attrs = JSON.parse(form.attributes) } catch {}

      await api.post('/api/auth/vendor/products/', {
        ...form,
        price:      parseFloat(form.price),
        stock_qty:  parseInt(form.stock_qty),
        attributes: attrs,
      })
      setFormMessage('✓ Product saved successfully!')
      setForm({ name:'', description:'', brand:'', category:1,
                price:'', stock_qty:'', attributes:'{}', images:[] })
      loadProducts()
    } catch (err: any) {
      setFormMessage(err?.response?.data?.error || 'Failed to save product.')
    } finally { setSaving(false) }
  }

  const toggleActive = async (product: Product) => {
    try {
      await api.put(`/api/auth/vendor/products/${product.id}/`, {
        is_active: !product.is_active
      })
      loadProducts()
    } catch {}
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      height:'100vh', color:'var(--color-ink-3)', fontSize:'14px' }}>
      Loading dashboard…
    </div>
  )

  return (
    <>
      <Head><title>Vendor Dashboard — Racks</title></Head>

      {/* Header */}
      <div style={{ background:'#0D1B2A', padding:'0 24px', height:'52px',
        display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Link href="/" style={{ textDecoration:'none' }}>
          <span style={{ fontFamily:'sans-serif', fontSize:'18px', fontWeight:900, color:'#fff' }}>
            RA<span style={{ color:'#F5B942' }}>CK</span>S
          </span>
        </Link>
        <span style={{ fontSize:'12px', color:'rgba(255,255,255,.5)' }}>
          Vendor Dashboard
          {stats && <span style={{ marginLeft:'8px', background:'rgba(200,146,42,.15)',
            color:'#F5B942', padding:'2px 8px', borderRadius:'8px',
            fontSize:'10px', fontWeight:700, textTransform:'uppercase' }}>
            {stats.plan}
          </span>}
        </span>
        <Link href="/" style={{ fontSize:'12px', color:'rgba(255,255,255,.45)', textDecoration:'none' }}>
          ← Back to Store
        </Link>
      </div>

      {/* Tab bar */}
      <div style={{ background:'var(--color-surface)', borderBottom:'1px solid #E4DDD3',
        padding:'0 24px', display:'flex', gap:'0' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => handleTabChange(t)} style={{
            padding:'14px 18px', border:'none', background:'none',
            fontFamily:'sans-serif', fontSize:'13px', fontWeight: tab===t ? 700 : 400,
            color: tab===t ? '#0D1B2A' : 'var(--color-ink-3)',
            borderBottom: tab===t ? '2px solid #C8922A' : '2px solid transparent',
            cursor:'pointer',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ background:'var(--color-surface-3)', minHeight:'calc(100vh - 100px)', padding:'24px' }}>

        {/* ── OVERVIEW ── */}
        {tab === 'Overview' && stats && (
          <div>
            {/* Stats grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',
              gap:'12px', marginBottom:'24px' }}>
              {[
                { label:'Total Revenue',  value:`UGX ${stats.revenue.total.toLocaleString()}`,     sub:'All time', color:'#1B5E20' },
                { label:'This Month',     value:`UGX ${stats.revenue.this_month.toLocaleString()}`, sub:'Revenue',  color:'#1565C0' },
                { label:'Total Orders',   value:stats.orders.total.toString(),                      sub:'Confirmed', color:'#C8922A' },
                { label:'Today\'s Orders',value:stats.orders.today.toString(),                      sub:'New today', color:'#0D1B2A' },
                { label:'Active Products',value:stats.products.active.toString(),                   sub:`${stats.products.total} total`, color:'#1B5E20' },
                { label:'Low Stock',      value:stats.products.low_stock.toString(),                sub:'Need restocking', color:stats.products.low_stock>0?'#B71C1C':'#1B5E20' },
              ].map(s => (
                <div key={s.label} style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)',
                  borderRadius:'10px', padding:'16px' }}>
                  <div style={{ fontSize:'10px', fontWeight:700, color:'var(--color-ink-3)',
                    textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'6px' }}>
                    {s.label}
                  </div>
                  <div style={{ fontFamily:'sans-serif', fontSize:'22px', fontWeight:900,
                    color:s.color, marginBottom:'2px' }}>{s.value}</div>
                  <div style={{ fontSize:'11px', color:'var(--color-ink-3)' }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Commission info */}
            <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:'10px',
              padding:'16px', marginBottom:'16px' }}>
              <div style={{ fontSize:'13px', fontWeight:700, color:'#0D1B2A', marginBottom:'6px' }}>
                Your Commission Rate
              </div>
              <div style={{ fontSize:'13px', color:'var(--color-ink-2)', lineHeight:1.65 }}>
                You are on the <strong>{stats.plan}</strong> plan.
                Racks takes <strong>{stats.commission_pct}%</strong> of each sale.
                The rest is paid to your MTN or Airtel number within 48 hours of delivery.
                <Link href="/help" style={{ color:'#1565C0', marginLeft:'8px', fontSize:'12px' }}>
                  Upgrade plan →
                </Link>
              </div>
            </div>

            {/* Low stock alerts */}
            {stats.low_stock_items.length > 0 && (
              <div style={{ background:'#FFEBEE', border:'1px solid #B71C1C',
                borderRadius:'10px', padding:'16px' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#B71C1C', marginBottom:'10px' }}>
                  ⚠️ Low Stock Alert
                </div>
                {stats.low_stock_items.map(item => (
                  <div key={item.id} style={{ display:'flex', justifyContent:'space-between',
                    fontSize:'12px', padding:'5px 0', borderBottom:'1px solid rgba(183,28,28,.15)' }}>
                    <span style={{ color:'var(--color-ink)' }}>{item.name}</span>
                    <span style={{ color:'#B71C1C', fontWeight:700 }}>
                      {item.stock_qty} left
                    </span>
                  </div>
                ))}
                <button onClick={() => setTab('Products')} style={{
                  marginTop:'10px', background:'#B71C1C', color:'#fff',
                  border:'none', borderRadius:'6px', padding:'7px 14px',
                  fontSize:'12px', fontWeight:700, cursor:'pointer'
                }}>
                  Update Stock Levels
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {tab === 'Products' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', marginBottom:'16px' }}>
              <div style={{ fontFamily:'sans-serif', fontSize:'18px', fontWeight:800, color:'#0D1B2A' }}>
                Your Products ({products.length})
              </div>
              <button onClick={() => setTab('Add Product')} style={{
                background:'#0D1B2A', color:'#F5B942', border:'none',
                borderRadius:'8px', padding:'9px 18px', fontWeight:700,
                fontSize:'13px', cursor:'pointer'
              }}>
                + Add New Product
              </button>
            </div>

            {products.length === 0 ? (
              <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:'10px',
                padding:'40px', textAlign:'center' }}>
                <div style={{ fontSize:'32px', marginBottom:'12px' }}>📦</div>
                <div style={{ fontSize:'15px', fontWeight:700, color:'#0D1B2A', marginBottom:'6px' }}>
                  No products yet
                </div>
                <div style={{ fontSize:'13px', color:'var(--color-ink-3)', marginBottom:'16px' }}>
                  Add your first product to start selling on Racks.
                </div>
                <button onClick={() => setTab('Add Product')} style={{
                  background:'#C8922A', color:'#0D1B2A', border:'none',
                  borderRadius:'7px', padding:'10px 20px', fontWeight:700, cursor:'pointer'
                }}>
                  Add Your First Product
                </button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {products.map(p => (
                  <div key={p.id} style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)',
                    borderRadius:'10px', padding:'14px 16px',
                    display:'flex', alignItems:'center', gap:'14px' }}>
                    {/* Image */}
                    <div style={{ width:'52px', height:'52px', background:'var(--color-surface-3)',
                      borderRadius:'8px', display:'flex', alignItems:'center',
                      justifyContent:'center', fontSize:'24px', flexShrink:0,
                      overflow:'hidden' }}>
                      {p.images?.[0]
                        ? <img src={p.images[0]} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                        : '📦'
                      }
                    </div>
                    {/* Info */}
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'13px', fontWeight:600, color:'var(--color-ink)', marginBottom:'2px' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize:'11px', color:'var(--color-ink-3)' }}>
                        {p.brand} · {p.category_name} · UGX {p.price.toLocaleString()}
                      </div>
                    </div>
                    {/* Stock */}
                    <div style={{ textAlign:'center', minWidth:'70px' }}>
                      <div style={{ fontSize:'16px', fontWeight:800,
                        color: p.stock_qty === 0 ? '#B71C1C' : p.stock_qty <= 3 ? '#E65100' : '#1B5E20' }}>
                        {p.stock_qty}
                      </div>
                      <div style={{ fontSize:'9px', color:'var(--color-ink-3)' }}>in stock</div>
                    </div>
                    {/* Status toggle */}
                    <button onClick={() => toggleActive(p)} style={{
                      background: p.is_active ? '#E8F5E9' : '#FFEBEE',
                      color:       p.is_active ? '#1B5E20' : '#B71C1C',
                      border:      `1px solid ${p.is_active ? '#1B5E20' : '#B71C1C'}`,
                      borderRadius:'6px', padding:'5px 10px',
                      fontSize:'11px', fontWeight:700, cursor:'pointer', minWidth:'72px'
                    }}>
                      {p.is_active ? 'Live' : 'Hidden'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ADD PRODUCT ── */}
        {tab === 'Add Product' && (
          <div style={{ maxWidth:'680px' }}>
            <div style={{ fontFamily:'sans-serif', fontSize:'18px', fontWeight:800,
              color:'#0D1B2A', marginBottom:'20px' }}>
              Add New Product
            </div>

            {/* Images */}
            <section style={sectionStyle}>
              <div style={sectionHeadStyle}>Product Images</div>
              <div style={{ padding:'16px' }}>
                <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', marginBottom:'12px' }}>
                  {form.images.map((url, i) => (
                    <div key={i} style={{ position:'relative', width:'80px', height:'80px' }}>
                      <img src={url} alt="" style={{ width:'80px', height:'80px',
                        objectFit:'cover', borderRadius:'8px', border:'1px solid var(--color-border)' }}/>
                      <button onClick={() => removeImage(url)} style={{
                        position:'absolute', top:'-6px', right:'-6px',
                        background:'#B71C1C', color:'#fff', border:'none',
                        borderRadius:'50%', width:'20px', height:'20px',
                        fontSize:'11px', cursor:'pointer', display:'flex',
                        alignItems:'center', justifyContent:'center'
                      }}>✕</button>
                    </div>
                  ))}
                  {/* Upload button */}
                  <label style={{
                    width:'80px', height:'80px', border:'2px dashed #E4DDD3',
                    borderRadius:'8px', display:'flex', flexDirection:'column',
                    alignItems:'center', justifyContent:'center', cursor:'pointer',
                    background:'var(--color-bg)', fontSize:'22px', color:'#ABABAB'
                  }}>
                    {uploading ? '⏳' : '+'}
                    <span style={{ fontSize:'9px', color:'#ABABAB', marginTop:'3px' }}>
                      {uploading ? 'Uploading…' : 'Add Photo'}
                    </span>
                    <input ref={fileRef} type="file" accept="image/*"
                      style={{ display:'none' }} onChange={handleImageUpload}
                      disabled={uploading}/>
                  </label>
                </div>
                <p style={{ fontSize:'11px', color:'var(--color-ink-3)' }}>
                  Upload up to 6 images · JPEG or PNG · Max 5MB each · First image is the main photo
                </p>
              </div>
            </section>

            {/* Basic info */}
            <section style={{ ...sectionStyle, marginTop:'10px' }}>
              <div style={sectionHeadStyle}>Product Details</div>
              <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>
                <div>
                  <label style={labelStyle}>Product Name *</label>
                  <input style={inputStyle} value={form.name}
                    onChange={e => setForm(f => ({...f, name:e.target.value}))}
                    placeholder="e.g. Samsung 43 QLED 4K Smart TV"/>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                  <div>
                    <label style={labelStyle}>Brand</label>
                    <input style={inputStyle} value={form.brand}
                      onChange={e => setForm(f => ({...f, brand:e.target.value}))}
                      placeholder="e.g. Samsung"/>
                  </div>
                  <div>
                    <label style={labelStyle}>Category</label>
                    <select style={inputStyle} value={form.category}
                      onChange={e => setForm(f => ({...f, category:parseInt(e.target.value)}))}>
                      <option value={1}>Electronics</option>
                      <option value={2}>TVs & Audio</option>
                      <option value={3}>Kitchen</option>
                      <option value={4}>Appliances</option>
                      <option value={5}>Fashion</option>
                      <option value={6}>Computing</option>
                      <option value={7}>Phones</option>
                      <option value={8}>Home & Living</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Description *</label>
                  <textarea style={{ ...inputStyle, height:'100px', resize:'vertical' }}
                    value={form.description}
                    onChange={e => setForm(f => ({...f, description:e.target.value}))}
                    placeholder="Describe your product — features, what's in the box, warranty..."/>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                  <div>
                    <label style={labelStyle}>Price (UGX) *</label>
                    <input style={inputStyle} type="number" value={form.price}
                      onChange={e => setForm(f => ({...f, price:e.target.value}))}
                      placeholder="e.g. 1450000"/>
                  </div>
                  <div>
                    <label style={labelStyle}>Stock Quantity *</label>
                    <input style={inputStyle} type="number" value={form.stock_qty}
                      onChange={e => setForm(f => ({...f, stock_qty:e.target.value}))}
                      placeholder="e.g. 10"/>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>
                    Specifications (JSON)
                    <span style={{ fontSize:'9px', color:'var(--color-ink-3)', fontWeight:400, marginLeft:'6px' }}>
                      Optional — e.g. screen size, RAM, capacity
                    </span>
                  </label>
                  <textarea style={{ ...inputStyle, height:'80px', fontFamily:'monospace', fontSize:'11px' }}
                    value={form.attributes}
                    onChange={e => setForm(f => ({...f, attributes:e.target.value}))}
                    placeholder={'{"screen": "43 inches", "resolution": "4K"}'}/>
                </div>
              </div>
            </section>

            {formMessage && (
              <div style={{
                marginTop:'10px', padding:'11px 14px', borderRadius:'8px',
                background: formMessage.startsWith('✓') ? '#E8F5E9' : '#FFEBEE',
                border: `1px solid ${formMessage.startsWith('✓') ? '#1B5E20' : '#B71C1C'}`,
                fontSize:'13px', fontWeight:600,
                color: formMessage.startsWith('✓') ? '#1B5E20' : '#B71C1C',
              }}>
                {formMessage}
              </div>
            )}

            <button onClick={handleSaveProduct} disabled={saving} style={{
              width:'100%', marginTop:'12px',
              background: saving ? '#D4D4D4' : '#0D1B2A',
              color: saving ? '#7A7A7A' : '#fff',
              border:'none', borderRadius:'9px', padding:'14px',
              fontFamily:'sans-serif', fontSize:'14px', fontWeight:800,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}>
              {saving ? 'Saving Product…' : 'Publish Product'}
            </button>
          </div>
        )}

        {/* ── ORDERS ── */}
        {tab === 'Orders' && (
          <div>
            <div style={{ fontFamily:'sans-serif', fontSize:'18px', fontWeight:800,
              color:'#0D1B2A', marginBottom:'16px' }}>
              Your Orders ({orders.length})
            </div>
            {orders.length === 0 ? (
              <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:'10px',
                padding:'32px', textAlign:'center' }}>
                <div style={{ fontSize:'28px', marginBottom:'8px' }}>📋</div>
                <div style={{ fontSize:'14px', fontWeight:600, color:'#0D1B2A' }}>No orders yet</div>
                <div style={{ fontSize:'12px', color:'var(--color-ink-3)', marginTop:'4px' }}>
                  Orders will appear here once customers purchase your products.
                </div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {orders.map((order: any) => (
                  <div key={order.order_id} style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)',
                    borderRadius:'10px', padding:'14px 16px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between',
                      alignItems:'center', marginBottom:'8px' }}>
                      <div>
                        <span style={{ fontFamily:'monospace', fontSize:'11px', color:'var(--color-ink-3)' }}>
                          #{order.order_id.slice(0,8).toUpperCase()}
                        </span>
                        <span style={{ marginLeft:'10px', fontSize:'12px', color:'var(--color-ink-2)' }}>
                          {order.district}
                        </span>
                      </div>
                      <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                        <span style={{
                          fontSize:'10px', fontWeight:700, padding:'3px 8px', borderRadius:'8px',
                          background: order.status==='delivered' ? '#E8F5E9'
                            : order.status==='dispatched' ? '#FDF3E0' : '#F3F4F6',
                          color: order.status==='delivered' ? '#1B5E20'
                            : order.status==='dispatched' ? '#C8922A' : 'var(--color-ink-3)',
                        }}>
                          {order.status}
                        </span>
                        <span style={{ fontSize:'13px', fontWeight:800, color:'#0D1B2A' }}>
                          UGX {order.payout.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {order.my_items.map((item: any, i: number) => (
                      <div key={i} style={{ fontSize:'12px', color:'var(--color-ink-2)',
                        padding:'4px 0', borderTop:'1px solid #F2EDE5' }}>
                        {item.name} × {item.qty} — UGX {(item.price * item.qty).toLocaleString()}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </>
  )
}

const sectionStyle: React.CSSProperties = {
  background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:'10px', overflow:'hidden',
}
const sectionHeadStyle: React.CSSProperties = {
  padding:'8px 16px', background:'#F2EDE5', borderBottom:'1px solid #E4DDD3',
  fontSize:'10px', fontWeight:700, color:'var(--color-ink)',
  textTransform:'uppercase', letterSpacing:'.07em',
}
const labelStyle: React.CSSProperties = {
  display:'block', fontSize:'10px', fontWeight:700, color:'var(--color-ink-2)',
  textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'4px',
}
const inputStyle: React.CSSProperties = {
  width:'100%', background:'var(--color-bg)', border:'1px solid var(--color-border)',
  borderRadius:'7px', padding:'9px 11px', fontSize:'12px', color:'var(--color-ink)',
  outline:'none', boxSizing:'border-box',
}
