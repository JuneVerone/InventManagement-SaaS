// src/components/inventory/ProductModal.jsx
//
// Add / Edit product modal.
// When `product` prop is null  → Add mode
// When `product` prop is set   → Edit mode (fields pre-filled)
//
// Props:
//   product     — product to edit (null for add)
//   categories  — array of { id, name } for the dropdown
//   warehouses  — array of { id, name } for initial stock inputs
//   onSave      — called with form data when form is submitted
//   onClose     — called when modal is dismissed

import { useState, useEffect } from 'react'

const EMPTY_FORM = {
  name:        '',
  sku:         '',
  description: '',
  unitCost:    '',
  salePrice:   '',
  reorderAt:   '10',
  categoryId:  '',
  initialStock: [],
}

const ProductModal = ({ product, categories, warehouses, onSave, onClose }) => {
  const isEdit = !!product
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [errors,    setErrors]    = useState({})
  const [isSaving,  setIsSaving]  = useState(false)
  const [saveError, setSaveError] = useState(null)

  // Pre-fill form when editing
  useEffect(() => {
    if (product) {
      setForm({
        name:         product.name        || '',
        sku:          product.sku         || '',
        description:  product.description || '',
        unitCost:     product.unitCost    || '',
        salePrice:    product.salePrice   || '',
        reorderAt:    product.reorderAt   || '10',
        categoryId:   product.categoryId  || '',
        initialStock: [],
      })
    } else {
      // Add mode — initialise stock fields for each warehouse at 0
      setForm({
        ...EMPTY_FORM,
        initialStock: warehouses.map(w => ({ warehouseId: w.id, quantity: 0 })),
      })
    }
  }, [product, warehouses])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  // Update stock quantity for a specific warehouse
  const handleStockChange = (warehouseId, quantity) => {
    setForm(prev => ({
      ...prev,
      initialStock: prev.initialStock.map(s =>
        s.warehouseId === warehouseId ? { ...s, quantity: parseInt(quantity) || 0 } : s
      ),
    }))
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim())  errs.name = 'Name is required'
    if (!form.sku.trim())   errs.sku  = 'SKU is required'
    if (form.unitCost  !== '' && isNaN(parseFloat(form.unitCost)))  errs.unitCost  = 'Must be a number'
    if (form.salePrice !== '' && isNaN(parseFloat(form.salePrice))) errs.salePrice = 'Must be a number'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setIsSaving(true)
    setSaveError(null)
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save product.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    // Backdrop — clicking outside closes the modal
    <div style={s.backdrop} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={s.header}>
          <h2 style={s.headerTitle}>{isEdit ? 'Edit product' : 'Add product'}</h2>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>

        {saveError && <div style={s.errorBox}>{saveError}</div>}

        <form onSubmit={handleSubmit} style={s.form}>
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
              placeholder="Optional product description..." rows={2}
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

          {/* Initial stock — only shown when adding a new product */}
          {!isEdit && warehouses.length > 0 && (
            <div>
              <div style={s.stockTitle}>Initial stock per warehouse</div>
              <div style={s.stockGrid}>
                {warehouses.map(w => (
                  <div key={w.id} style={s.stockRow}>
                    <span style={s.stockLabel}>{w.name}</span>
                    <input
                      type="number" min="0"
                      value={form.initialStock.find(s => s.warehouseId === w.id)?.quantity || 0}
                      onChange={e => handleStockChange(w.id, e.target.value)}
                      style={{ ...s.input, width: '80px', textAlign: 'center' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={s.footer}>
            <button type="button" onClick={onClose} style={s.cancelBtn}>Cancel</button>
            <button type="submit" disabled={isSaving} style={{ ...s.saveBtn, opacity: isSaving ? 0.65 : 1 }}>
              {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Add product'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

// Small reusable field wrapper
const Field = ({ label, error, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
    <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>{label}</label>
    {children}
    {error && <span style={{ fontSize: '11px', color: '#dc2626' }}>{error}</span>}
  </div>
)

// Input style — red border on error
const inp = (err) => ({ ...s.input, borderColor: err ? '#f87171' : '#d1d5db' })

const s = {
  backdrop: {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '24px',
  },
  modal: {
    backgroundColor: '#fff', borderRadius: '16px',
    width: '100%', maxWidth: '580px',
    maxHeight: '90vh', overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
    position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1,
  },
  headerTitle: { fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: 0 },
  closeBtn: {
    background: 'none', border: 'none', fontSize: '18px',
    color: '#94a3b8', cursor: 'pointer', padding: '4px 8px',
    borderRadius: '6px', lineHeight: 1,
  },
  errorBox: {
    margin: '12px 24px 0',
    backgroundColor: '#fef2f2', border: '1px solid #fecaca',
    color: '#dc2626', borderRadius: '8px', padding: '10px 14px', fontSize: '13px',
  },
  form:    { padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  grid2:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  grid3:   { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' },
  input: {
    padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px',
    fontSize: '13px', color: '#0f172a', outline: 'none', width: '100%',
    backgroundColor: '#fff',
  },
  stockTitle: { fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '8px' },
  stockGrid:  { display: 'flex', flexDirection: 'column', gap: '8px' },
  stockRow:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' },
  stockLabel: { fontSize: '13px', color: '#475569', flex: 1 },
  footer: {
    display: 'flex', justifyContent: 'flex-end', gap: '10px',
    paddingTop: '8px', borderTop: '1px solid #e2e8f0', marginTop: '4px',
  },
  cancelBtn: {
    padding: '9px 18px', border: '1px solid #e2e8f0', borderRadius: '8px',
    fontSize: '13px', color: '#64748b', backgroundColor: '#fff', cursor: 'pointer',
  },
  saveBtn: {
    padding: '9px 20px', border: 'none', borderRadius: '8px',
    fontSize: '13px', fontWeight: '500', color: '#fff',
    backgroundColor: '#3b82f6', cursor: 'pointer',
  },
}

export default ProductModal