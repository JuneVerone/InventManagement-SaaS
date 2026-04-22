import { useState, useEffect } from 'react'
import { updateStockApi }      from '../../api/products'

const EMPTY_FORM = {
  name: '', sku: '', description: '',
  unitCost: '', salePrice: '', reorderAt: '10', categoryId: '',
}

const ProductModal = ({ product, categories, warehouses, onSave, onClose }) => {
  const isEdit = !!product

  const [form,       setForm      ] = useState(EMPTY_FORM)
  const [stockLevels,setStockLevels] = useState([])
  const [errors,     setErrors    ] = useState({})
  const [isSaving,   setIsSaving  ] = useState(false)
  const [saveError,  setSaveError ] = useState(null)
  const [activeTab,  setActiveTab ] = useState('details') // 'details' | 'stock'

  // Initialise form when product or warehouses change
  useEffect(() => {
    if (product) {
      // Edit mode — pre-fill fields
      setForm({
        name:        product.name        || '',
        sku:         product.sku         || '',
        description: product.description || '',
        unitCost:    product.unitCost    ?? '',
        salePrice:   product.salePrice   ?? '',
        reorderAt:   product.reorderAt   ?? '10',
        categoryId:  product.categoryId  || '',
      })
      // Pre-fill stock levels from existing data
      setStockLevels(
        warehouses.map(w => {
          const existing = product.stockLevels?.find(sl => sl.warehouseId === w.id)
          return { warehouseId: w.id, name: w.name, quantity: existing?.quantity ?? 0 }
        })
      )
    } else {
      // Add mode — blank form, zero stock for each warehouse
      setForm(EMPTY_FORM)
      setStockLevels(warehouses.map(w => ({ warehouseId: w.id, name: w.name, quantity: 0 })))
    }
  }, [product, warehouses])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  const handleStockChange = (warehouseId, value) => {
    setStockLevels(prev =>
      prev.map(s => s.warehouseId === warehouseId
        ? { ...s, quantity: parseInt(value) || 0 }
        : s
      )
    )
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.sku.trim())  errs.sku  = 'SKU is required'
    if (form.unitCost  !== '' && isNaN(parseFloat(form.unitCost)))  errs.unitCost  = 'Must be a number'
    if (form.salePrice !== '' && isNaN(parseFloat(form.salePrice))) errs.salePrice = 'Must be a number'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); setActiveTab('details'); return }

    setIsSaving(true)
    setSaveError(null)
    try {
      if (isEdit) {
        // Save product fields
        await onSave(form)
        // Save stock levels separately if on stock tab or always
        if (stockLevels.length > 0) {
          await updateStockApi(
            product.id,
            stockLevels.map(({ warehouseId, quantity }) => ({ warehouseId, quantity }))
          )
        }
      } else {
        // Add mode — send everything including initialStock
        await onSave({
          ...form,
          initialStock: stockLevels.map(({ warehouseId, quantity }) => ({ warehouseId, quantity })),
        })
      }
      onClose()
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save product.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div style={s.backdrop} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={s.header}>
          <h2 style={s.headerTitle}>{isEdit ? 'Edit product' : 'Add product'}</h2>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          <button
            onClick={() => setActiveTab('details')}
            style={{ ...s.tab, ...(activeTab === 'details' ? s.tabActive : {}) }}
          >
            Product details
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            style={{ ...s.tab, ...(activeTab === 'stock' ? s.tabActive : {}) }}
          >
            Stock levels {warehouses.length > 0 && `(${warehouses.length} warehouse${warehouses.length > 1 ? 's' : ''})`}
          </button>
        </div>

        {saveError && <div style={s.errorBox}>{saveError}</div>}

        <form onSubmit={handleSubmit} style={s.form}>

          {/* ── Details tab ─────────────────────────────────────────────── */}
          {activeTab === 'details' && (
            <>
              <div style={s.grid2}>
                <Field label="Product name *" error={errors.name}>
                  <input name="name" value={form.name} onChange={handleChange}
                    placeholder="Widget Pro" style={inp(errors.name)} />
                </Field>
                <Field label="SKU *" error={errors.sku}>
                  <input name="sku" value={form.sku} onChange={handleChange}
                    placeholder="WGT-001" style={inp(errors.sku)} />
                </Field>
              </div>

              <Field label="Description">
                <textarea name="description" value={form.description} onChange={handleChange}
                  placeholder="Optional description..." rows={2}
                  style={{ ...s.input, resize: 'vertical' }} />
              </Field>

              <div style={s.grid3}>
                <Field label="Unit cost ($)" error={errors.unitCost}>
                  <input name="unitCost" type="number" min="0" step="0.01"
                    value={form.unitCost} onChange={handleChange}
                    placeholder="0.00" style={inp(errors.unitCost)} />
                </Field>
                <Field label="Sale price ($)" error={errors.salePrice}>
                  <input name="salePrice" type="number" min="0" step="0.01"
                    value={form.salePrice} onChange={handleChange}
                    placeholder="0.00" style={inp(errors.salePrice)} />
                </Field>
                <Field label="Reorder at (units)">
                  <input name="reorderAt" type="number" min="0"
                    value={form.reorderAt} onChange={handleChange}
                    placeholder="10" style={s.input} />
                </Field>
              </div>

              <Field label="Category">
                <select name="categoryId" value={form.categoryId} onChange={handleChange} style={s.input}>
                  <option value="">— No category —</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
            </>
          )}

          {/* ── Stock tab ────────────────────────────────────────────────── */}
          {activeTab === 'stock' && (
            <div>
              {warehouses.length === 0 ? (
                <div style={s.noWarehouses}>
                  No warehouses set up yet. Create a warehouse first to track stock.
                </div>
              ) : (
                <>
                  <p style={s.stockHint}>
                    {isEdit
                      ? 'Update the current stock quantity for each warehouse.'
                      : 'Set the starting stock quantity for each warehouse.'}
                  </p>
                  <div style={s.stockList}>
                    {stockLevels.map(sl => (
                      <div key={sl.warehouseId} style={s.stockRow}>
                        <div style={s.warehouseInfo}>
                          <div style={s.warehouseName}>{sl.name}</div>
                          <div style={s.warehouseLabel}>warehouse</div>
                        </div>
                        <div style={s.qtyWrap}>
                          <button
                            type="button"
                            onClick={() => handleStockChange(sl.warehouseId, Math.max(0, sl.quantity - 1))}
                            style={s.qtyBtn}
                          >−</button>
                          <input
                            type="number" min="0"
                            value={sl.quantity}
                            onChange={e => handleStockChange(sl.warehouseId, e.target.value)}
                            style={s.qtyInput}
                          />
                          <button
                            type="button"
                            onClick={() => handleStockChange(sl.warehouseId, sl.quantity + 1)}
                            style={s.qtyBtn}
                          >+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={s.stockTotal}>
                    Total: <strong>{stockLevels.reduce((sum, sl) => sum + sl.quantity, 0)} units</strong>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Footer */}
          <div style={s.footer}>
            <button type="button" onClick={onClose} style={s.cancelBtn}>Cancel</button>
            <button type="submit" disabled={isSaving}
              style={{ ...s.saveBtn, opacity: isSaving ? 0.65 : 1 }}>
              {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Add product'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

const Field = ({ label, error, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
    <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>{label}</label>
    {children}
    {error && <span style={{ fontSize: '11px', color: '#dc2626' }}>{error}</span>}
  </div>
)

const inp = (err) => ({ ...s.input, borderColor: err ? '#f87171' : '#d1d5db' })

const s = {
  backdrop:  { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' },
  modal:     { backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' },
  header:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1 },
  headerTitle:{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: 0 },
  closeBtn:  { background: 'none', border: 'none', fontSize: '18px', color: '#94a3b8', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' },
  tabs:      { display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '0 24px' },
  tab:       { padding: '12px 16px', fontSize: '13px', fontWeight: '500', color: '#64748b', background: 'none', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer', marginBottom: '-1px' },
  tabActive: { color: '#3b82f6', borderBottomColor: '#3b82f6' },
  errorBox:  { margin: '12px 24px 0', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '10px 14px', fontSize: '13px' },
  form:      { padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  grid2:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  grid3:     { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' },
  input:     { padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', color: '#0f172a', outline: 'none', width: '100%', backgroundColor: '#fff' },
  noWarehouses: { padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', backgroundColor: '#f8fafc', borderRadius: '8px' },
  stockHint: { fontSize: '13px', color: '#64748b', marginBottom: '16px', marginTop: '-4px' },
  stockList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  stockRow:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' },
  warehouseInfo: { flex: 1 },
  warehouseName: { fontSize: '14px', fontWeight: '500', color: '#0f172a' },
  warehouseLabel:{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' },
  qtyWrap:   { display: 'flex', alignItems: 'center', gap: '8px' },
  qtyBtn:    { width: '32px', height: '32px', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#fff', fontSize: '18px', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 },
  qtyInput:  { width: '64px', padding: '6px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', textAlign: 'center', outline: 'none' },
  stockTotal:{ fontSize: '13px', color: '#64748b', textAlign: 'right', marginTop: '8px' },
  footer:    { display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', marginTop: '4px' },
  cancelBtn: { padding: '9px 18px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#64748b', backgroundColor: '#fff', cursor: 'pointer' },
  saveBtn:   { padding: '9px 20px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', color: '#fff', backgroundColor: '#3b82f6', cursor: 'pointer' },
}

export default ProductModal