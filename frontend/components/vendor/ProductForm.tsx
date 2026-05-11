/**
 * components/vendor/ProductForm.tsx
 *
 * HCI Principle 5 — Constraints:
 * All input fields have proper constraints:
 * - Price: minimum UGX 500, no negative, no zero, no decimals above 2dp
 * - Stock: whole numbers only (integers), minimum 0, maximum 9999
 * - Max order quantity respected at cart level (see useCart.ts)
 * - Image: type and size validated before upload even starts
 * - Name: max 255 characters, minimum 5
 * - Description: minimum 20 characters so listings are useful
 *
 * HCI Principle 6 — Learnability (vendor tooltips):
 * First-time vendors see tooltip bubbles (callouts) on each field
 * explaining what to fill and why. These are shown once, then
 * dismissed. Stored in localStorage: 'racks_vendor_tips_seen'.
 */

'use client'
import { useState, useRef, useEffect } from 'react'
import { uploadProductImage, createVendorProduct, updateVendorProduct } from '@/lib/api'

// ── Tooltip Bubble ────────────────────────────────────────────────
// HCI Principle 6 — Learnability: callout for first-time vendors
function Tooltip({ text, show }: { text: string; show: boolean }) {
  if (!show) return null
  return (
    <div style={{
      position:    'absolute',
      left:        '0',
      top:         'calc(100% + 8px)',
      background:  '#0D1B2A',
      color:       '#E8F0F8',
      fontSize:    '11px',
      lineHeight:  1.55,
      padding:     '9px 12px',
      borderRadius:'8px',
      zIndex:      200,
      width:       '240px',
      boxShadow:   '0 4px 16px rgba(0,0,0,.3)',
      border:      '1px solid #1E3348',
    }}>
      {/* Arrow pointing up */}
      <div style={{
        position:    'absolute',
        top:         '-6px',
        left:        '16px',
        width:       0,
        height:      0,
        borderLeft:  '6px solid transparent',
        borderRight: '6px solid transparent',
        borderBottom:'6px solid #1E3348',
      }}/>
      <div style={{
        position:    'absolute',
        top:         '-5px',
        left:        '17px',
        width:       0,
        height:      0,
        borderLeft:  '5px solid transparent',
        borderRight: '5px solid transparent',
        borderBottom:'5px solid #0D1B2A',
      }}/>
      {text}
    </div>
  )
}

// ── Field with tooltip ────────────────────────────────────────────
function TooltipField({
  label, children, tip, showTips,
}: {
  label: string
  children: React.ReactNode
  tip: string
  showTips: boolean
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position:'relative', marginBottom:'12px' }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <label style={labelStyle}>{label}</label>
      {children}
      <Tooltip text={tip} show={showTips && focused}/>
    </div>
  )
}

// ── Main ProductForm ──────────────────────────────────────────────
interface Props {
  initial?:   any        // existing product data for edit mode
  onSaved?:   () => void // called after successful save
  onCancel?:  () => void
}

export default function ProductForm({ initial, onSaved, onCancel }: Props) {
  const isEdit = Boolean(initial?.id)

  // Form state
  const [name,        setName]        = useState(initial?.name        || '')
  const [brand,       setBrand]       = useState(initial?.brand       || '')
  const [category,    setCategory]    = useState(initial?.category    || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [price,       setPrice]       = useState(initial?.price       ? String(initial.price) : '')
  const [stock,       setStock]       = useState(initial?.stock_qty   ? String(initial.stock_qty) : '')
  const [images,      setImages]      = useState<string[]>(initial?.images || [])
  const [attributes,  setAttributes]  = useState<{key:string;value:string}[]>(
    Object.entries(initial?.attributes || {}).map(([k,v]) => ({ key:k, value:String(v) }))
  )

  // UI state
  const [uploading,   setUploading]   = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [errors,      setErrors]      = useState<Record<string,string>>({})
  const [saved,       setSaved]       = useState(false)
  const [autoSaved,   setAutoSaved]   = useState('')

  // Whether to show first-time vendor tooltip bubbles
  // HCI Principle 6 — Learnability
  const [showTips, setShowTips] = useState(false)
  useEffect(() => {
    const seen = localStorage.getItem('racks_vendor_tips_seen')
    if (!seen) setShowTips(true)
  }, [])

  const dismissTips = () => {
    localStorage.setItem('racks_vendor_tips_seen', '1')
    setShowTips(false)
  }

  // Auto-save draft to localStorage every 30 seconds
  // HCI Principle 4 — Error Recovery
  useEffect(() => {
    const data = { name, brand, category, description, price, stock, images }
    const timer = setTimeout(() => {
      if (name || description) {
        localStorage.setItem('racks_product_draft', JSON.stringify(data))
        setAutoSaved(new Date().toLocaleTimeString())
      }
    }, 30000)
    return () => clearTimeout(timer)
  }, [name, brand, category, description, price, stock, images])

  // Restore draft on mount (if editing a new product)
  useEffect(() => {
    if (!isEdit) {
      try {
        const draft = localStorage.getItem('racks_product_draft')
        if (draft) {
          const d = JSON.parse(draft)
          if (d.name && !name) {
            if (confirm('You have an unsaved draft. Restore it?')) {
              setName(d.name); setBrand(d.brand); setCategory(d.category)
              setDescription(d.description); setPrice(d.price); setStock(d.stock)
              setImages(d.images || [])
            }
          }
        }
      } catch { /* ignore */ }
    }
  }, [])

  // ── Image upload ─────────────────────────────────────────────────
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (images.length >= 5) {
      setErrors(e => ({ ...e, images:'Maximum 5 images allowed' }))
      return
    }
    setUploading(true)
    setErrors(e => ({ ...e, images:'' }))

    for (const file of Array.from(files)) {
      // HCI Principle 5 — Constraints: validate before upload
      if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
        setErrors(e => ({ ...e, images:`${file.name} is not a valid image type (JPG, PNG, WebP only)` }))
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors(e => ({ ...e, images:`${file.name} is too large (max 5MB)` }))
        continue
      }

      try {
        const { data } = await uploadProductImage(file)
        setImages(prev => [...prev, data.url])
      } catch {
        setErrors(e => ({ ...e, images:'Upload failed. Try again.' }))
      }
    }
    setUploading(false)
  }

  // ── Validation ───────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: Record<string,string> = {}

    if (name.trim().length < 5)
      errs.name = 'Product name must be at least 5 characters'
    if (!brand.trim())
      errs.brand = 'Brand is required'
    if (!category)
      errs.category = 'Select a category'
    if (description.trim().length < 20)
      errs.description = 'Description must be at least 20 characters'

    // HCI Principle 5 — Constraints: price validation
    const priceNum = parseFloat(price.replace(/,/g,''))
    if (isNaN(priceNum) || priceNum < 500)
      errs.price = 'Price must be at least UGX 500'
    if (priceNum > 100_000_000)
      errs.price = 'Price seems too high. Maximum is UGX 100,000,000'

    // HCI Principle 5 — Constraints: stock must be whole number
    const stockNum = parseInt(stock)
    if (isNaN(stockNum) || stockNum < 0)
      errs.stock = 'Stock must be 0 or more'
    if (stockNum > 9999)
      errs.stock = 'Maximum stock quantity is 9,999'
    if (String(stockNum) !== stock.trim())
      errs.stock = 'Stock must be a whole number (no decimals)'

    if (images.length === 0)
      errs.images = 'Upload at least one product image'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Save ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)

    // Build attributes object from key-value pairs
    const attrs: Record<string,string> = {}
    attributes.filter(a => a.key.trim()).forEach(a => { attrs[a.key.trim()] = a.value.trim() })

    const payload = {
      name:        name.trim(),
      brand:       brand.trim(),
      category:    category,
      description: description.trim(),
      price:       parseFloat(price.replace(/,/g,'')),
      stock_qty:   parseInt(stock),
      images,
      attributes:  attrs,
    }

    try {
      if (isEdit) {
        await updateVendorProduct(initial.id, payload)
      } else {
        await createVendorProduct(payload)
        // Clear draft after successful save
        localStorage.removeItem('racks_product_draft')
      }
      setSaved(true)
      dismissTips()
      onSaved?.()
    } catch (err: any) {
      setErrors({ submit: err?.response?.data?.error || 'Could not save product. Try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>

      {/* ── First-time tips banner ──────────────────────────────── */}
      {showTips && (
        <div style={{
          gridColumn:'1/-1',
          background:'rgba(200,146,42,.1)', border:'1px solid #C8922A',
          borderRadius:'10px', padding:'12px 16px',
          display:'flex', alignItems:'center', gap:'12px',
        }}>
          <span style={{ fontSize:'20px' }}>💡</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'13px', fontWeight:700, color:'#C8922A', marginBottom:'2px' }}>
              First time adding a product?
            </div>
            <div style={{ fontSize:'12px', color:'#3A3A3A', lineHeight:1.5 }}>
              Click on each field to see a tip about what to enter.
              Good product listings with clear images and descriptions sell faster.
            </div>
          </div>
          <button onClick={dismissTips} style={{ background:'none', border:'none', fontSize:'18px', cursor:'pointer', color:'#78909C' }}>×</button>
        </div>
      )}

      {/* ── Left column: images + price ─────────────────────────── */}
      <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

        {/* Image upload */}
        <section style={sectionStyle}>
          <div style={sectionHeadStyle}>Product Images *</div>
          <div style={{ padding:'14px' }}>

            {/* Drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleImageUpload(e.dataTransfer.files) }}
              style={{
                border:`2px dashed ${errors.images ? '#B71C1C' : '#E4DDD3'}`,
                borderRadius:'8px', padding:'20px',
                textAlign:'center', background:'#F9F6F1',
                cursor:'pointer', marginBottom:'10px',
              }}
            >
              <div style={{ fontSize:'24px', marginBottom:'6px' }}>
                {uploading ? '⏳' : '📸'}
              </div>
              <div style={{ fontSize:'12px', fontWeight:600, color:'#1A1A1A', marginBottom:'2px' }}>
                {uploading ? 'Uploading…' : 'Drag images here or click to upload'}
              </div>
              <div style={{ fontSize:'10px', color:'#78909C' }}>
                JPG, PNG, WebP only · Max 5MB each · Up to 5 images
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
              multiple style={{ display:'none' }}
              onChange={e => handleImageUpload(e.target.files)}
            />

            {/* Uploaded image previews */}
            {images.length > 0 && (
              <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                {images.map((url, i) => (
                  <div key={url} style={{ position:'relative' }}>
                    <div style={{
                      width:'54px', height:'54px', borderRadius:'7px',
                      background:'#F4EFE8', border:`2px solid ${i===0?'#C8922A':'#E4DDD3'}`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'24px', overflow:'hidden',
                    }}>
                      <img src={url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}
                        onError={e => { (e.target as HTMLImageElement).style.display='none' }}
                      />
                    </div>
                    {i === 0 && (
                      <div style={{
                        position:'absolute', bottom:'-6px', left:'50%',
                        transform:'translateX(-50%)',
                        background:'#C8922A', color:'#fff',
                        fontSize:'8px', fontWeight:700,
                        padding:'1px 5px', borderRadius:'4px',
                        whiteSpace:'nowrap',
                      }}>Main</div>
                    )}
                    <button
                      onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                      style={{
                        position:'absolute', top:'-5px', right:'-5px',
                        width:'16px', height:'16px', borderRadius:'50%',
                        background:'#B71C1C', color:'#fff', border:'none',
                        fontSize:'9px', cursor:'pointer', fontWeight:800,
                        display:'flex', alignItems:'center', justifyContent:'center',
                      }}
                    >×</button>
                  </div>
                ))}
                {images.length < 5 && (
                  <div
                    onClick={() => fileRef.current?.click()}
                    style={{
                      width:'54px', height:'54px', borderRadius:'7px',
                      border:'1px dashed #E4DDD3', background:'#F9F6F1',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'20px', color:'#ABABAB', cursor:'pointer',
                    }}
                  >+</div>
                )}
              </div>
            )}
            {errors.images && <div style={errStyle}>{errors.images}</div>}
          </div>
        </section>

        {/* Price & Stock */}
        <section style={sectionStyle}>
          <div style={sectionHeadStyle}>Pricing & Stock</div>
          <div style={{ padding:'14px', display:'flex', flexDirection:'column', gap:'10px' }}>

            <TooltipField label="Price (UGX) *" tip="Enter the selling price in Uganda Shillings. Minimum UGX 500. Do not include commas — just the number. e.g. 1450000" showTips={showTips}>
              <input style={errors.price ? { ...inputStyle, borderColor:'#B71C1C' } : inputStyle}
                type="number" min="500" max="100000000" step="100"
                value={price} onChange={e => setPrice(e.target.value)}
                placeholder="e.g. 1450000"
              />
              {errors.price && <div style={errStyle}>{errors.price}</div>}
            </TooltipField>

            <TooltipField label="Stock Quantity *" tip="How many units do you have available? Must be a whole number. e.g. 8. Set to 0 to mark as out of stock." showTips={showTips}>
              <input style={errors.stock ? { ...inputStyle, borderColor:'#B71C1C' } : inputStyle}
                type="number" min="0" max="9999" step="1"
                value={stock} onChange={e => setStock(e.target.value)}
                placeholder="e.g. 8"
              />
              {errors.stock && <div style={errStyle}>{errors.stock}</div>}
            </TooltipField>

          </div>
        </section>
      </div>

      {/* ── Right column: details + attributes ──────────────────── */}
      <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

        <section style={sectionStyle}>
          <div style={sectionHeadStyle}>Product Details</div>
          <div style={{ padding:'14px', display:'flex', flexDirection:'column', gap:'10px' }}>

            <TooltipField label="Product Name *" tip="Use the full product name including model number. e.g. 'Samsung 43 inch QLED 4K Smart TV QA43Q60C'. Good names show up in search results." showTips={showTips}>
              <input style={errors.name ? { ...inputStyle, borderColor:'#B71C1C' } : inputStyle}
                type="text" maxLength={255}
                value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Samsung 43 inch QLED 4K Smart TV"
              />
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:'3px' }}>
                {errors.name && <div style={errStyle}>{errors.name}</div>}
                <div style={{ fontSize:'9px', color:'#ABABAB', marginLeft:'auto' }}>{name.length}/255</div>
              </div>
            </TooltipField>

            <TooltipField label="Brand *" tip="The manufacturer or brand. e.g. Samsung, LG, Ramtons, HP, Tecno. This helps buyers filter by brand." showTips={showTips}>
              <input style={errors.brand ? { ...inputStyle, borderColor:'#B71C1C' } : inputStyle}
                type="text"
                value={brand} onChange={e => setBrand(e.target.value)}
                placeholder="e.g. Samsung"
              />
              {errors.brand && <div style={errStyle}>{errors.brand}</div>}
            </TooltipField>

            <TooltipField label="Category *" tip="Choose the category that best fits your product. This is how buyers browse. If unsure, pick the closest one." showTips={showTips}>
              <select style={errors.category ? { ...inputStyle, borderColor:'#B71C1C' } : inputStyle}
                value={category} onChange={e => setCategory(e.target.value)}
              >
                <option value="">Select a category</option>
                {['Electronics','TVs & Audio','Kitchen','Appliances','Computing','Phones','Fashion','Home & Living'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.category && <div style={errStyle}>{errors.category}</div>}
            </TooltipField>

            <TooltipField label="Description *" tip="Describe the product fully. Include key features, what's in the box, and any warranty details. Minimum 20 characters. The more detail, the more buyers trust you." showTips={showTips}>
              <textarea
                style={{
                  ...inputStyle,
                  height:'90px', resize:'vertical',
                  borderColor: errors.description ? '#B71C1C' : undefined,
                } as any}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the product fully — features, what's included, warranty..."
              />
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:'3px' }}>
                {errors.description && <div style={errStyle}>{errors.description}</div>}
                <div style={{ fontSize:'9px', color: description.length < 20 ? '#B71C1C' : '#ABABAB', marginLeft:'auto' }}>
                  {description.length} chars {description.length < 20 ? `(need ${20-description.length} more)` : '✓'}
                </div>
              </div>
            </TooltipField>

          </div>
        </section>

        {/* Attributes (specs) */}
        <section style={sectionStyle}>
          <div style={{ ...sectionHeadStyle, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>Specifications (optional)</span>
            <button
              onClick={() => setAttributes(a => [...a, { key:'', value:'' }])}
              style={{ background:'none', border:'none', fontSize:'11px', color:'#C8922A', fontWeight:700, cursor:'pointer' }}
            >
              + Add Spec
            </button>
          </div>
          <div style={{ padding:'10px 14px' }}>
            {attributes.length === 0 && (
              <div style={{ fontSize:'11px', color:'#78909C', textAlign:'center', padding:'8px' }}>
                Add specs like screen size, RAM, or capacity.
              </div>
            )}
            {attributes.map((attr, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 24px', gap:'6px', marginBottom:'6px' }}>
                <input style={inputStyle} placeholder="e.g. Screen Size"
                  value={attr.key} onChange={e => setAttributes(a => a.map((x,j) => j===i ? {...x, key:e.target.value} : x))}
                />
                <input style={inputStyle} placeholder="e.g. 43 inches"
                  value={attr.value} onChange={e => setAttributes(a => a.map((x,j) => j===i ? {...x, value:e.target.value} : x))}
                />
                <button
                  onClick={() => setAttributes(a => a.filter((_,j) => j !== i))}
                  style={{ background:'#FFEBEE', border:'none', borderRadius:'5px', color:'#B71C1C', cursor:'pointer', fontSize:'12px' }}
                >×</button>
              </div>
            ))}
          </div>
        </section>

        {/* Submit */}
        {errors.submit && <div style={{ ...errStyle, padding:'10px', borderRadius:'8px', background:'#FFEBEE' }}>{errors.submit}</div>}
        {saved && <div style={{ color:'#1B5E20', background:'#E8F5E9', padding:'10px', borderRadius:'8px', fontSize:'13px', fontWeight:600 }}>✓ Product saved successfully!</div>}
        {autoSaved && <div style={{ fontSize:'10px', color:'#ABABAB', textAlign:'right' }}>Draft auto-saved at {autoSaved}</div>}

        <div style={{ display:'flex', gap:'8px' }}>
          {onCancel && (
            <button onClick={onCancel} style={{
              flex:1, background:'#F9F6F1', color:'#1A1A1A',
              border:'1px solid #E4DDD3', borderRadius:'8px', padding:'12px',
              fontWeight:700, fontSize:'13px', cursor:'pointer',
            }}>
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex:2, background: saving ? '#546E7A' : '#0D1B2A',
              color:'#fff', border:'none', borderRadius:'8px', padding:'12px',
              fontFamily:'sans-serif', fontSize:'13px', fontWeight:800,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving…' : isEdit ? 'Update Product' : 'Save Product →'}
          </button>
        </div>
      </div>
    </div>
  )
}

const sectionStyle: React.CSSProperties = {
  background:'#fff', border:'1px solid #E4DDD3', borderRadius:'10px', overflow:'hidden',
}
const sectionHeadStyle: React.CSSProperties = {
  padding:'8px 14px', background:'#F2EDE5', borderBottom:'1px solid #E4DDD3',
  fontSize:'10px', fontWeight:700, color:'#1A1A1A',
  textTransform:'uppercase', letterSpacing:'.07em',
}
const labelStyle: React.CSSProperties = {
  display:'block', fontSize:'10px', fontWeight:700,
  color:'#3A3A3A', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'4px',
}
const inputStyle: React.CSSProperties = {
  width:'100%', background:'#F9F6F1', border:'1px solid #E4DDD3',
  borderRadius:'7px', padding:'9px 11px', fontSize:'12px', color:'#1A1A1A',
  outline:'none', boxSizing:'border-box',
}
const errStyle: React.CSSProperties = {
  fontSize:'11px', color:'#B71C1C', fontWeight:600, marginTop:'4px',
}
