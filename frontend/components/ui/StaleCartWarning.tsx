/**
 * components/ui/StaleCartWarning.tsx
 *
 * HCI Principle 3 — Visibility:
 * When the user opens their cart, check whether any items
 * have gone out of stock since they were added.
 *
 * Dombelo never warned users about stock changes.
 * Users would proceed all the way to checkout only to discover
 * the item was no longer available.
 *
 * Racks checks live stock when the cart is opened and warns
 * immediately so the user can adjust before starting checkout.
 */

'use client'
import { useState, useEffect } from 'react'
import { getProduct } from '@/lib/api'
import { CartItem }   from '@/lib/useCart'

interface Props {
  items: CartItem[]
  onRemove: (productId: string) => void
}

interface StaleItem {
  product_id: string
  name:       string
  issue:      'out_of_stock' | 'low_stock' | 'price_changed'
  oldPrice?:  number
  newPrice?:  number
  stock?:     number
}

export default function StaleCartWarning({ items, onRemove }: Props) {
  const [staleItems, setStaleItems] = useState<StaleItem[]>([])
  const [checked,    setChecked]    = useState(false)

  useEffect(() => {
    if (items.length === 0) return

    const checkStock = async () => {
      const issues: StaleItem[] = []

      // Check each cart item against live product data
      await Promise.allSettled(
        items.map(async (item) => {
          try {
            const { data } = await getProduct(item.product_id)

            // HCI Principle 3 — Visibility: warn about stock issues
            if (data.stock_qty === 0) {
              issues.push({
                product_id: item.product_id,
                name:       item.name,
                issue:      'out_of_stock',
              })
            } else if (data.stock_qty < item.qty) {
              issues.push({
                product_id: item.product_id,
                name:       item.name,
                issue:      'low_stock',
                stock:      data.stock_qty,
              })
            }

            // Warn about significant price changes (>10%)
            const priceDiff = Math.abs(data.current_price - item.price) / item.price
            if (priceDiff > 0.1) {
              issues.push({
                product_id: item.product_id,
                name:       item.name,
                issue:      'price_changed',
                oldPrice:   item.price,
                newPrice:   data.current_price,
              })
            }
          } catch {
            // Product not found — it may have been removed
            issues.push({
              product_id: item.product_id,
              name:       item.name,
              issue:      'out_of_stock',
            })
          }
        })
      )

      setStaleItems(issues)
      setChecked(true)
    }

    checkStock()
  }, []) // Only check once when cart opens

  if (!checked || staleItems.length === 0) return null

  return (
    <div style={{
      background:   '#FFF3E0',
      border:       '1px solid #E65100',
      borderRadius: '10px',
      padding:      '14px 16px',
      marginBottom: '16px',
    }}>
      <div style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '8px',
        marginBottom: '10px',
      }}>
        <span style={{ fontSize:'18px' }}>⚠️</span>
        <span style={{ fontSize:'13px', fontWeight:700, color:'#E65100' }}>
          Some items in your cart have changed
        </span>
      </div>

      {staleItems.map(item => (
        <div key={item.product_id} style={{
          background:   '#fff',
          border:       '1px solid #E4DDD3',
          borderRadius: '7px',
          padding:      '10px 12px',
          marginBottom: '6px',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'space-between',
          gap:          '10px',
        }}>
          <div>
            <div style={{ fontSize:'12px', fontWeight:600, color:'#1A1A1A', marginBottom:'2px' }}>
              {item.name}
            </div>
            <div style={{ fontSize:'11px', color:'#E65100' }}>
              {item.issue === 'out_of_stock' && '❌ Now out of stock — remove from cart'}
              {item.issue === 'low_stock'    && `⚠️ Only ${item.stock} left — you have ${
                items.find(i => i.product_id === item.product_id)?.qty
              } in cart`}
              {item.issue === 'price_changed' && `Price changed: UGX ${item.oldPrice?.toLocaleString()} → UGX ${item.newPrice?.toLocaleString()}`}
            </div>
          </div>

          {item.issue === 'out_of_stock' && (
            <button
              onClick={() => onRemove(item.product_id)}
              style={{
                flexShrink:   0,
                background:   '#FFEBEE',
                color:        '#B71C1C',
                border:       '1px solid #B71C1C',
                borderRadius: '5px',
                padding:      '5px 10px',
                fontSize:     '11px',
                fontWeight:   700,
                cursor:       'pointer',
              }}
            >
              Remove
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
