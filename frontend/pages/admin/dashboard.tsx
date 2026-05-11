/**
 * pages/admin/dashboard.tsx
 *
 * Racks Admin Dashboard — platform overview for admins.
 * Accessible at: http://localhost:3000/admin/dashboard
 *
 * Tabs:
 * 1. Overview   → revenue, orders, users, top products
 * 2. Orders     → all orders with status update controls
 * 3. Vendors    → pending applications + active vendors
 * 4. Products   → all products across all vendors
 * 5. Promotions → manage flash sales and promotions
 *
 * Note: This is the frontend admin panel.
 * The Django admin at /admin handles deeper database management.
 * This panel is designed for non-technical staff.
 */

'use client'
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import {
  getAdminStats, getAdminOrders, getAdminProducts,
  getPendingVendors, approveVendor, suspendVendor,
  updateOrderStatus
} from '@/lib/api'

const TABS = ['Overview', 'Orders', 'Vendors', 'Products', 'Promotions']

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:    { bg:'#F3F4F6',  color:'var(--color-ink-3)' },
  processing: { bg:'#E8F5E9',  color:'#1B5E20' },
  dispatched: { bg:'#FDF3E0',  color:'#C8922A' },
  delivered:  { bg:'#E8F5E9',  color:'#1B5E20' },
  cancelled:  { bg:'#FFEBEE',  color:'#B71C1C' },
}

export default function AdminDashboard() {
  const [tab,      setTab]      = useState('Overview')
  const [stats,    setStats]    = useState<any>(null)
  const [orders,   setOrders]   = useState<any[]>([])
  const [vendors,  setVendors]  = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')

  useEffect(() => {
    Promise.all([
      getAdminStats(),
      getAdminOrders(),
      getPendingVendors(),
      getAdminProducts(),
    ]).then(([s, o, v, p]) => {
      setStats(s.data)
      setOrders(o.data.results || o.data || [])
      setVendors(v.data || [])
      setProducts(p.data.results || p.data || [])
      setLoading(false)
    }).catch(() => {
      // Demo fallback data
      setStats({
        revenue:  { today: 4250000, this_month: 38400000, total: 142000000 },
        orders:   { today: 12, this_month: 187, total: 1240, pending: 8 },
        users:    { total: 3420, vendors: 24, new_today: 15 },
        products: { total: 248, out_of_stock: 12 },
        top_products: [
          { name:'Samsung 43" QLED TV',  revenue: 8700000, orders: 6 },
          { name:'LG 220L Fridge',        revenue: 6300000, orders: 3 },
          { name:'HP Laptop i5',          revenue: 5550000, orders: 3 },
          { name:'Tecno Spark 20 Pro',    revenue: 3720000, orders: 6 },
        ]
      })
      setOrders([
        { id:'43440ABC', user_email:'aubry@gmail.com', status:'dispatched', total_amount:1087500, district:'Kampala', created_at:'2026-04-27', items:[{name:'Samsung TV'}], draft:false },
        { id:'43441DEF', user_email:'john@gmail.com',  status:'processing', total_amount:480000,  district:'Mbarara', created_at:'2026-04-27', items:[{name:'Gas Cooker'}],  draft:false },
        { id:'43442GHI', user_email:'sara@gmail.com',  status:'pending',    total_amount:620000,  district:'Wakiso',  created_at:'2026-04-27', items:[{name:'Tecno Phone'}], draft:true  },
      ])
      setVendors([
        { id:1, store_name:'TechEast Uganda', user_email:'tech@east.ug', district:'Kampala', status:'pending', created_at:'2026-04-26', plan:'starter' },
        { id:2, store_name:'Home Basics UG',  user_email:'home@basics.ug', district:'Mbarara', status:'pending', created_at:'2026-04-25', plan:'pro' },
      ])
      setProducts([
        { id:'1', name:'Samsung 43" QLED TV', brand:'Samsung', price:1087500, stock_qty:8,  is_active:true,  vendor_name:'TechEast Uganda' },
        { id:'2', name:'LG 220L Fridge',       brand:'LG',      price:2100000, stock_qty:5,  is_active:true,  vendor_name:'Home Basics UG' },
        { id:'3', name:'Tecno Spark 20 Pro',   brand:'Tecno',   price:620000,  stock_qty:0,  is_active:false, vendor_name:'TechEast Uganda' },
        { id:'4', name:'HP Laptop i5',         brand:'HP',      price:1850000, stock_qty:12, is_active:true,  vendor_name:'TechEast Uganda' },
      ])
      setLoading(false)
    })
  }, [])

  const handleOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateOrderStatus(orderId, status)
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    } catch { alert('Could not update order status') }
  }

  const handleVendorAction = async (id: number, action: 'approve' | 'suspend') => {
    try {
      action === 'approve' ? await approveVendor(id) : await suspendVendor(id)
      setVendors(prev => prev.map(v =>
        v.id === id ? { ...v, status: action === 'approve' ? 'active' : 'suspended' } : v
      ))
    } catch { alert('Could not update vendor') }
  }

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter)

  return (
    <>
      <Head><title>Admin Dashboard — Racks</title></Head>

      {/* Top bar */}
      <div style={{
        background:'#060E18', padding:'0 24px', height:'52px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        borderBottom:'1px solid #1E3348', position:'sticky', top:0, zIndex:100
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <Link href="/" style={{ textDecoration:'none' }}>
            <span style={{ fontFamily:'sans-serif', fontSize:'18px', fontWeight:900, color:'#fff' }}>
              RA<span style={{ color:'#F5B942' }}>CK</span>S
            </span>
          </Link>
          <span style={{
            background:'#B71C1C', color:'#fff',
            fontSize:'9px', fontWeight:700, padding:'2px 8px',
            borderRadius:'4px', textTransform:'uppercase', letterSpacing:'.06em'
          }}>Admin</span>
        </div>
        <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
          <Link href="/admin/dashboard" style={{ fontSize:'12px', color:'rgba(255,255,255,.5)', textDecoration:'none' }}>Dashboard</Link>
          <a href="http://localhost:8000/admin" target="_blank" rel="noreferrer"
            style={{ fontSize:'11px', color:'#F5B942', textDecoration:'none', fontWeight:600 }}>
            Django Admin ↗
          </a>
        </div>
      </div>

      <div style={{ background:'var(--color-surface-3)', minHeight:'100vh' }}>

        {/* Tab nav */}
        <div style={{
          background:'var(--color-surface)', borderBottom:'1px solid #E4DDD3',
          padding:'0 24px', display:'flex', gap:'0'
        }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:'14px 20px', border:'none', background:'none',
              borderBottom: tab===t ? '2px solid #C8922A' : '2px solid transparent',
              color: tab===t ? '#C8922A' : 'var(--color-ink-3)',
              fontWeight: tab===t ? 700 : 400, fontSize:'13px',
              cursor:'pointer', fontFamily:'sans-serif',
            }}>{t}</button>
          ))}
        </div>

        <div style={{ padding:'24px', maxWidth:'1200px', margin:'0 auto' }}>

          {/* ── OVERVIEW ── */}
          {tab === 'Overview' && (
            <div>
              {/* Stat cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'24px' }}>
                {[
                  { label:'Revenue Today',    value:`UGX ${(stats?.revenue?.today || 0).toLocaleString()}`,    icon:'💰', color:'#1B5E20', bg:'#E8F5E9' },
                  { label:'Orders Today',     value:stats?.orders?.today || 0,                                  icon:'📦', color:'#1565C0', bg:'#E3F2FD' },
                  { label:'Pending Orders',   value:stats?.orders?.pending || 0,                                icon:'⏳', color:'#E65100', bg:'#FFF3E0' },
                  { label:'Total Users',      value:(stats?.users?.total || 0).toLocaleString(),                icon:'👥', color:'#6A1B9A', bg:'#F3E5F5' },
                ].map(card => (
                  <div key={card.label} style={{
                    background:'var(--color-surface)', border:'1px solid var(--color-border)',
                    borderRadius:'10px', padding:'16px'
                  }}>
                    <div style={{
                      width:'36px', height:'36px', borderRadius:'8px',
                      background:card.bg, display:'flex', alignItems:'center',
                      justifyContent:'center', fontSize:'18px', marginBottom:'10px'
                    }}>{card.icon}</div>
                    <div style={{ fontSize:'22px', fontWeight:800, color:'var(--color-ink)', marginBottom:'2px' }}>
                      {card.value}
                    </div>
                    <div style={{ fontSize:'11px', color:'var(--color-ink-3)' }}>{card.label}</div>
                  </div>
                ))}
              </div>

              {/* Monthly revenue + top products */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:'10px', padding:'18px' }}>
                  <div style={{ fontSize:'13px', fontWeight:700, color:'#0D1B2A', marginBottom:'14px' }}>
                    Revenue Summary
                  </div>
                  {[
                    ['Today',      `UGX ${(stats?.revenue?.today || 0).toLocaleString()}`],
                    ['This Month', `UGX ${(stats?.revenue?.this_month || 0).toLocaleString()}`],
                    ['All Time',   `UGX ${(stats?.revenue?.total || 0).toLocaleString()}`],
                    ['Active Vendors', stats?.users?.vendors || 0],
                    ['Out of Stock',   stats?.products?.out_of_stock || 0],
                  ].map(([label, value]) => (
                    <div key={label as string} style={{
                      display:'flex', justifyContent:'space-between',
                      padding:'9px 0', borderBottom:'1px solid #E4DDD3',
                      fontSize:'13px'
                    }}>
                      <span style={{ color:'var(--color-ink-3)' }}>{label}</span>
                      <span style={{ fontWeight:700, color:'var(--color-ink)' }}>{value}</span>
                    </div>
                  ))}
                </div>

                <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:'10px', padding:'18px' }}>
                  <div style={{ fontSize:'13px', fontWeight:700, color:'#0D1B2A', marginBottom:'14px' }}>
                    Top Products This Month
                  </div>
                  {(stats?.top_products || []).map((p: any, i: number) => (
                    <div key={i} style={{
                      display:'flex', alignItems:'center', gap:'10px',
                      padding:'9px 0', borderBottom:'1px solid #E4DDD3'
                    }}>
                      <div style={{
                        width:'24px', height:'24px', borderRadius:'50%',
                        background:'var(--color-bg)', display:'flex', alignItems:'center',
                        justifyContent:'center', fontSize:'11px', fontWeight:800,
                        color:'var(--color-ink-3)', flexShrink:0
                      }}>{i+1}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'12px', fontWeight:600, color:'var(--color-ink)' }}>{p.name}</div>
                        <div style={{ fontSize:'10px', color:'var(--color-ink-3)' }}>{p.orders} orders</div>
                      </div>
                      <div style={{ fontSize:'12px', fontWeight:700, color:'#1B5E20' }}>
                        UGX {p.revenue.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ORDERS ── */}
          {tab === 'Orders' && (
            <div>
              {/* Filter */}
              <div style={{ display:'flex', gap:'6px', marginBottom:'16px', flexWrap:'wrap' }}>
                {['all','pending','processing','dispatched','delivered','cancelled'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    padding:'5px 14px', borderRadius:'16px', border:'none',
                    background: filter===f ? '#0D1B2A' : '#fff',
                    color: filter===f ? '#F5B942' : 'var(--color-ink-3)',
                    fontWeight: filter===f ? 700 : 400,
                    fontSize:'11px', cursor:'pointer',
                    border: filter===f ? 'none' : '1px solid #E4DDD3',
                  } as any}>
                    {f.charAt(0).toUpperCase()+f.slice(1)}
                    {f==='pending' && orders.filter(o=>o.status==='pending').length > 0 &&
                      <span style={{ marginLeft:'5px', background:'#E65100', color:'#fff', fontSize:'8px', padding:'1px 5px', borderRadius:'8px' }}>
                        {orders.filter(o=>o.status==='pending').length}
                      </span>
                    }
                  </button>
                ))}
              </div>

              <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:'10px', overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
                  <thead>
                    <tr style={{ background:'#0D1B2A' }}>
                      {['Order ID','Customer','Items','District','Amount','Status','Actions'].map(h => (
                        <th key={h} style={{ padding:'10px 12px', textAlign:'left', color:'#fff', fontWeight:600, fontSize:'11px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, i) => {
                      const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending
                      return (
                        <tr key={order.id} style={{ borderBottom:'1px solid #E4DDD3', background: i%2===0 ? '#fff' : '#FAFAFA' }}>
                          <td style={{ padding:'10px 12px', fontFamily:'monospace', color:'#0D1B2A', fontWeight:600 }}>
                            #{order.id.slice(0,8).toUpperCase()}
                          </td>
                          <td style={{ padding:'10px 12px', color:'var(--color-ink-2)' }}>{order.user_email}</td>
                          <td style={{ padding:'10px 12px', color:'var(--color-ink-2)' }}>
                            {order.items?.slice(0,2).map((it:any) => it.name).join(', ')}
                            {order.items?.length > 2 && ` +${order.items.length-2}`}
                          </td>
                          <td style={{ padding:'10px 12px', color:'var(--color-ink-2)' }}>{order.district}</td>
                          <td style={{ padding:'10px 12px', fontWeight:700, color:'var(--color-ink)' }}>
                            UGX {Number(order.total_amount).toLocaleString()}
                          </td>
                          <td style={{ padding:'10px 12px' }}>
                            <span style={{
                              background:sc.bg, color:sc.color,
                              fontSize:'9px', fontWeight:700,
                              padding:'3px 8px', borderRadius:'10px',
                              textTransform:'uppercase'
                            }}>{order.status}</span>
                          </td>
                          <td style={{ padding:'10px 12px' }}>
                            <select
                              value={order.status}
                              onChange={e => handleOrderStatus(order.id, e.target.value)}
                              style={{
                                border:'1px solid var(--color-border)', borderRadius:'5px',
                                padding:'3px 6px', fontSize:'11px',
                                background:'var(--color-surface)', cursor:'pointer'
                              }}
                            >
                              {['pending','processing','dispatched','delivered','cancelled'].map(s => (
                                <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {filteredOrders.length === 0 && (
                  <div style={{ padding:'32px', textAlign:'center', color:'var(--color-ink-3)', fontSize:'13px' }}>
                    No orders with status: {filter}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── VENDORS ── */}
          {tab === 'Vendors' && (
            <div>
              <div style={{ marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <h2 style={{ fontFamily:'sans-serif', fontSize:'16px', fontWeight:800, color:'#0D1B2A' }}>
                  Vendor Applications
                  {vendors.filter(v=>v.status==='pending').length > 0 && (
                    <span style={{ marginLeft:'8px', background:'#E65100', color:'#fff', fontSize:'10px', padding:'2px 8px', borderRadius:'10px' }}>
                      {vendors.filter(v=>v.status==='pending').length} pending
                    </span>
                  )}
                </h2>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {vendors.map(vendor => (
                  <div key={vendor.id} style={{
                    background:'var(--color-surface)', border:'1px solid var(--color-border)',
                    borderRadius:'10px', padding:'16px',
                    display:'flex', alignItems:'center', gap:'16px'
                  }}>
                    <div style={{
                      width:'44px', height:'44px', borderRadius:'10px',
                      background:'var(--color-bg)', display:'flex', alignItems:'center',
                      justifyContent:'center', fontSize:'20px', flexShrink:0
                    }}>🏪</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'14px', fontWeight:700, color:'var(--color-ink)', marginBottom:'2px' }}>
                        {vendor.store_name}
                      </div>
                      <div style={{ fontSize:'11px', color:'var(--color-ink-3)' }}>
                        {vendor.user_email} · {vendor.district} · {vendor.plan} plan
                      </div>
                      <div style={{ fontSize:'10px', color:'#ABABAB', marginTop:'2px' }}>
                        Applied: {new Date(vendor.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span style={{
                      background: vendor.status==='pending' ? '#FFF3E0' : vendor.status==='active' ? '#E8F5E9' : '#FFEBEE',
                      color: vendor.status==='pending' ? '#E65100' : vendor.status==='active' ? '#1B5E20' : '#B71C1C',
                      fontSize:'10px', fontWeight:700, padding:'3px 10px', borderRadius:'10px'
                    }}>
                      {vendor.status.toUpperCase()}
                    </span>
                    {vendor.status === 'pending' && (
                      <div style={{ display:'flex', gap:'8px' }}>
                        <button
                          onClick={() => handleVendorAction(vendor.id, 'approve')}
                          style={{
                            background:'#1B5E20', color:'#fff', border:'none',
                            borderRadius:'7px', padding:'7px 14px',
                            fontSize:'12px', fontWeight:700, cursor:'pointer'
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleVendorAction(vendor.id, 'suspend')}
                          style={{
                            background:'#FFEBEE', color:'#B71C1C', border:'1px solid #B71C1C',
                            borderRadius:'7px', padding:'7px 14px',
                            fontSize:'12px', fontWeight:700, cursor:'pointer'
                          }}
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {vendors.length === 0 && (
                  <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:'10px', padding:'32px', textAlign:'center', color:'var(--color-ink-3)' }}>
                    No pending vendor applications
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PRODUCTS ── */}
          {tab === 'Products' && (
            <div>
              <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:'10px', overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
                  <thead>
                    <tr style={{ background:'#0D1B2A' }}>
                      {['Product','Brand','Vendor','Price','Stock','Status'].map(h => (
                        <th key={h} style={{ padding:'10px 12px', textAlign:'left', color:'#fff', fontWeight:600, fontSize:'11px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, i) => (
                      <tr key={p.id} style={{ borderBottom:'1px solid #E4DDD3', background: i%2===0?'#fff':'#FAFAFA' }}>
                        <td style={{ padding:'10px 12px', fontWeight:600, color:'var(--color-ink)' }}>{p.name}</td>
                        <td style={{ padding:'10px 12px', color:'var(--color-ink-3)' }}>{p.brand}</td>
                        <td style={{ padding:'10px 12px', color:'var(--color-ink-2)', fontSize:'11px' }}>{p.vendor_name}</td>
                        <td style={{ padding:'10px 12px', fontWeight:700, color:'var(--color-ink)' }}>
                          UGX {Number(p.price).toLocaleString()}
                        </td>
                        <td style={{ padding:'10px 12px' }}>
                          <span style={{
                            fontWeight:700, fontSize:'12px',
                            color: p.stock_qty === 0 ? '#B71C1C' : p.stock_qty < 5 ? '#E65100' : '#1B5E20'
                          }}>
                            {p.stock_qty === 0 ? 'Out of stock' : `${p.stock_qty} units`}
                          </span>
                        </td>
                        <td style={{ padding:'10px 12px' }}>
                          <span style={{
                            background: p.is_active ? '#E8F5E9' : '#FFEBEE',
                            color: p.is_active ? '#1B5E20' : '#B71C1C',
                            fontSize:'9px', fontWeight:700,
                            padding:'3px 8px', borderRadius:'10px'
                          }}>
                            {p.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── PROMOTIONS ── */}
          {tab === 'Promotions' && (
            <div>
              <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:'10px', padding:'24px', textAlign:'center' }}>
                <div style={{ fontSize:'32px', marginBottom:'12px' }}>⚡</div>
                <div style={{ fontSize:'15px', fontWeight:700, color:'var(--color-ink)', marginBottom:'6px' }}>
                  Manage promotions in Django Admin
                </div>
                <p style={{ fontSize:'13px', color:'var(--color-ink-3)', marginBottom:'16px', lineHeight:1.6 }}>
                  Create flash sales, brand weeks, and clearance events from the admin panel.
                  Promotions activate automatically at their scheduled time.
                </p>
                <a
                  href="http://localhost:8000/admin/promotions_promotion/"
                  target="_blank" rel="noreferrer"
                  style={{
                    display:'inline-block', background:'#0D1B2A',
                    color:'#F5B942', borderRadius:'8px',
                    padding:'10px 20px', textDecoration:'none',
                    fontWeight:700, fontSize:'13px'
                  }}
                >
                  Open Promotions in Admin →
                </a>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
