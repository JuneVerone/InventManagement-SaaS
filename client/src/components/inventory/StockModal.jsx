// src/components/inventory/StockModal.jsx
// Modal for adjusting stock — IN, OUT, or ADJ with a note.

import { useState }      from 'react'
import { adjustStockApi } from '../../api/stock'

const StockModal = ({ product, warehouses, onClose, onAdjusted }) => {
  const [form, setForm] = useState({
    warehouseId: warehouses[0]?.id || '',
    type:        'IN',
    quantity:    '',
    note:        '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error,    setError   ] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.quantity || parseInt(form.quantity) <= 0) {
      setError('Quantity must be a positive number.')
      return
    }
    if (!form.warehouseId) {
      setError('Please select a warehouse.')
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      const movement = await adjustStockApi({
        productId:   product.id,
        warehouseId: form.warehouseId,
        type:        form.type,
        quantity:    parseInt(form.quantity),
        note:        form.note || undefined,
      })
      onAdjusted(movement)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to adjust stock.')
    } finally {
      setIsSaving(false)
    }
  }

  const typeLabels = { IN: 'Add stock (IN)', OUT: 'Remove stock (OUT)', ADJ: 'Manual adjustment (ADJ)' }
  const typeColors = { IN: '#15803d', OUT: '#dc2626', ADJ: '#1d4ed8' }

  return (
    <div style={s.backdrop} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>

        <div style={s.header}>
          <div>
            <h2 style={s.title}>Adjust stock</h2>
            <p style={s.subtitle}>{product.name} · <span style={s.sku}>{product.sku}</span></p>
          </div>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>

        {/* Current stock summary */}
        <div style={s.stockSummary}>
          {product.stockLevels?.length > 0 ? (
            product.stockLevels.map(sl => (
              <div key={sl.warehouseId} style={s.stockItem}>
                <span style={s.stockWarehouse}>{sl.warehouse?.name}</span>
                <span style={s.stockQty}>{sl.quantity} units</span>
              </div>
            ))
          ) : (
            <p style={s.noStock}>No stock levels recorded yet.</p>
          )}
        </div>

        {error && <div style={s.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>

          <div style={s.field}>
            <label style={s.label}>Movement type</label>
            <div style={s.typeGrid}>
              {Object.entries(typeLabels).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, type: val }))}
                  style={{
                    ...s.typeBtn,
                    ...(form.type === val ? {
                      backgroundColor: typeColors[val],
                      color: '#fff',
                      borderColor: typeColors[val],
                    } : {}),
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={s.grid2}>
            <div style={s.field}>
              <label style={s.label}>Warehouse</label>
              <select name="warehouseId" value={form.warehouseId} onChange={handleChange} style={s.input}>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div style={s.field}>
              <label style={s.label}>Quantity</label>
              <input
                name="quantity" type="number" min="1"
                value={form.quantity} onChange={handleChange}
                placeholder="0" style={s.input}
              />
            </div>
          </div>

          <div style={s.field}>
            <label style={s.label}>Note (optional)</label>
            <input
              name="note" type="text"
              value={form.note} onChange={handleChange}
              placeholder="e.g. Received from supplier, damaged goods…"
              style={s.input}
            />
          </div>

          <div style={s.footer}>
            <button type="button" onClick={onClose} style={s.cancelBtn}>Cancel</button>
            <button
              type="submit" disabled={isSaving}
              style={{ ...s.saveBtn, opacity: isSaving ? 0.65 : 1, backgroundColor: typeColors[form.type] }}
            >
              {isSaving ? 'Saving…' : `Confirm ${form.type}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const s = {
  backdrop:       { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' },
  modal:          { backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' },
  header:         { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' },
  title:          { fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: '0 0 2px' },
  subtitle:       { fontSize: '13px', color: '#64748b', margin: 0 },
  sku:            { fontFamily: 'monospace', fontSize: '12px' },
  closeBtn:       { background: 'none', border: 'none', fontSize: '18px', color: '#94a3b8', cursor: 'pointer' },
  stockSummary:   { padding: '12px 24px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '12px' },
  stockItem:      { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' },
  stockWarehouse: { color: '#64748b' },
  stockQty:       { fontWeight: '600', color: '#0f172a' },
  noStock:        { fontSize: '13px', color: '#94a3b8', margin: 0 },
  errorBox:       { margin: '12px 24px 0', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '10px 14px', fontSize: '13px' },
  form:           { padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  field:          { display: 'flex', flexDirection: 'column', gap: '6px' },
  label:          { fontSize: '12px', fontWeight: '500', color: '#374151' },
  typeGrid:       { display: 'flex', flexDirection: 'column', gap: '6px' },
  typeBtn:        { padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', textAlign: 'left', cursor: 'pointer', backgroundColor: '#fff', color: '#374151', transition: 'all 0.15s' },
  grid2:          { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  input:          { padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', color: '#0f172a', outline: 'none', width: '100%', backgroundColor: '#fff' },
  footer:         { display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', marginTop: '4px' },
  cancelBtn:      { padding: '9px 18px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#64748b', backgroundColor: '#fff', cursor: 'pointer' },
  saveBtn:        { padding: '9px 20px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', color: '#fff', cursor: 'pointer' },
}

export default StockModal