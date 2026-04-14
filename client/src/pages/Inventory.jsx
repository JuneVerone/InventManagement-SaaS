// src/pages/Inventory.jsx
//
// Full product catalog page with:
//   - Product table (name, SKU, category, stock, price)
//   - Search by name or SKU
//   - Filter by category
//   - Add / Edit / Delete product
//   - Pagination

import { useState }      from 'react'
import { useAuth }       from '../hooks/useAuth'
import { useProducts }   from '../hooks/useProducts'
import { useCategories } from '../hooks/useCategories'
import { useWarehouses } from '../hooks/useWarehouses'
import ProductModal      from '../components/inventory/ProductModal'

const Inventory = () => {
  const { org, logout, isAtLeastStaff, isAdmin } = useAuth()
  const { products, pagination, isLoading, error, createProduct, updateProduct, deleteProduct, goToPage, search, filterBy } = useProducts()
  const { categories } = useCategories()
  const { warehouses }  = useWarehouses()

  const [searchTerm,    setSearchTerm]    = useState('')
  const [categoryFilter,setCategoryFilter]= useState('')
  const [modalOpen,     setModalOpen]     = useState(false)
  const [editingProduct,setEditingProduct]= useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [actionError,   setActionError]   = useState(null)

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    const val = e.target.value
    setSearchTerm(val)
    // Debounce: wait until user stops typing for 400ms before fetching
    clearTimeout(window._searchTimer)
    window._searchTimer = setTimeout(() => search(val), 400)
  }

  // ── Category filter ───────────────────────────────────────────────────────
  const handleCategoryFilter = (e) => {
    const val = e.target.value
    setCategoryFilter(val)
    filterBy(val)
  }

  // ── Open modal ────────────────────────────────────────────────────────────
  const openAdd  = () => { setEditingProduct(null); setModalOpen(true) }
  const openEdit = (product) => { setEditingProduct(product); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditingProduct(null) }

  // ── Save (create or update) ───────────────────────────────────────────────
  const handleSave = async (formData) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, formData)
    } else {
      await createProduct(formData)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setActionError(null)
    try {
      await deleteProduct(id)
      setDeleteConfirm(null)
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete product.')
    }
  }

  // ── Stock badge colour ────────────────────────────────────────────────────
  const stockStyle = (qty, reorderAt) => {
    if (qty === 0)          return { color: '#dc2626', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }
    if (qty <= reorderAt)   return { color: '#92400e', backgroundColor: '#fef3c7', border: '1px solid #fde68a' }
    return                         { color: '#15803d', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }
  }

  return (
    <div style={s.page}>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav style={s.nav}>
        <div style={s.navLeft}>
          <div style={s.navLogo}>IS</div>
          <span style={s.navTitle}>Inventory SaaS</span>
          {org && <span style={s.orgPill}>{org.name}</span>}
        </div>
        <div style={s.navRight}>
          <NavLink href="/dashboard" label="Dashboard" />
          <NavLink href="/inventory" label="Inventory" active />
          <button onClick={logout} style={s.logoutBtn}>Sign out</button>
        </div>
      </nav>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main style={s.main}>

        {/* Page header */}
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.pageTitle}>Inventory</h1>
            <p style={s.pageSubtitle}>
              {pagination.total} product{pagination.total !== 1 ? 's' : ''} in your catalog
            </p>
          </div>
          {isAtLeastStaff && (
            <button onClick={openAdd} style={s.addBtn}>+ Add product</button>
          )}
        </div>

        {/* Error banner */}
        {(error || actionError) && (
          <div style={s.errorBanner}>{error || actionError}</div>
        )}

        {/* ── Filters ─────────────────────────────────────────────────── */}
        <div style={s.filterBar}>
          <input
            type="text"
            placeholder="Search by name or SKU…"
            value={searchTerm}
            onChange={handleSearch}
            style={s.searchInput}
          />
          <select value={categoryFilter} onChange={handleCategoryFilter} style={s.filterSelect}>
            <option value="">All categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* ── Table ───────────────────────────────────────────────────── */}
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr style={s.theadRow}>
                <Th>Product</Th>
                <Th>SKU</Th>
                <Th>Category</Th>
                <Th>Stock</Th>
                <Th>Sale price</Th>
                <Th>Reorder at</Th>
                {isAtLeastStaff && <Th align="right">Actions</Th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={s.emptyCell}>
                    <div style={s.loadingRow}>Loading products…</div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} style={s.emptyCell}>
                    <div style={s.emptyState}>
                      <div style={s.emptyIcon}>📦</div>
                      <div style={s.emptyTitle}>No products found</div>
                      <div style={s.emptySub}>
                        {searchTerm || categoryFilter
                          ? 'Try a different search or filter'
                          : 'Add your first product to get started'}
                      </div>
                      {isAtLeastStaff && !searchTerm && !categoryFilter && (
                        <button onClick={openAdd} style={{ ...s.addBtn, marginTop: '12px' }}>
                          + Add product
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                products.map(product => (
                  <tr key={product.id} style={s.tr}>
                    <td style={s.td}>
                      <div style={s.productName}>{product.name}</div>
                      {product.description && (
                        <div style={s.productDesc}>
                          {product.description.length > 60
                            ? product.description.slice(0, 60) + '…'
                            : product.description}
                        </div>
                      )}
                    </td>
                    <td style={s.td}>
                      <span style={s.skuBadge}>{product.sku}</span>
                    </td>
                    <td style={s.td}>
                      {product.category
                        ? <span style={s.categoryBadge}>{product.category.name}</span>
                        : <span style={s.noBadge}>—</span>
                      }
                    </td>
                    <td style={s.td}>
                      <span style={{ ...s.stockBadge, ...stockStyle(product.totalStock, product.reorderAt) }}>
                        {product.totalStock} units
                      </span>
                    </td>
                    <td style={s.td}>
                      ${parseFloat(product.salePrice).toFixed(2)}
                    </td>
                    <td style={s.td}>
                      {product.reorderAt} units
                    </td>
                    {isAtLeastStaff && (
                      <td style={{ ...s.td, textAlign: 'right' }}>
                        <button onClick={() => openEdit(product)} style={s.editBtn}>Edit</button>
                        {isAdmin && (
                          <button onClick={() => setDeleteConfirm(product)} style={s.deleteBtn}>
                            Delete
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ──────────────────────────────────────────────── */}
        {pagination.totalPages > 1 && (
          <div style={s.pagination}>
            <button
              disabled={pagination.page <= 1}
              onClick={() => goToPage(pagination.page - 1)}
              style={{ ...s.pageBtn, opacity: pagination.page <= 1 ? 0.4 : 1 }}
            >
              ← Prev
            </button>
            <span style={s.pageInfo}>
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => goToPage(pagination.page + 1)}
              style={{ ...s.pageBtn, opacity: pagination.page >= pagination.totalPages ? 0.4 : 1 }}
            >
              Next →
            </button>
          </div>
        )}

      </main>

      {/* ── Product modal ────────────────────────────────────────────────── */}
      {modalOpen && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          warehouses={warehouses}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}

      {/* ── Delete confirmation ───────────────────────────────────────────── */}
      {deleteConfirm && (
        <div style={s.backdrop}>
          <div style={s.confirmBox}>
            <h3 style={s.confirmTitle}>Delete product?</h3>
            <p style={s.confirmText}>
              <strong>{deleteConfirm.name}</strong> will be soft-deleted. It won't appear
              in your catalog but historical records are preserved.
            </p>
            <div style={s.confirmBtns}>
              <button onClick={() => setDeleteConfirm(null)} style={s.cancelBtn}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} style={s.confirmDeleteBtn}>
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ── Small helper components ───────────────────────────────────────────────────
const Th = ({ children, align = 'left' }) => (
  <th style={{ ...s.th, textAlign: align }}>{children}</th>
)

const NavLink = ({ href, label, active }) => (
  <a
    href={href}
    style={{
      fontSize: '14px', fontWeight: active ? '500' : '400',
      color: active ? '#0f172a' : '#64748b',
      textDecoration: 'none', padding: '4px 0',
      borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
    }}
  >
    {label}
  </a>
)

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  page:       { minHeight: '100vh', backgroundColor: '#f8fafc' },
  nav: {
    backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0',
    padding: '0 24px', height: '60px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  navLeft:    { display: 'flex', alignItems: 'center', gap: '12px' },
  navLogo: {
    width: '32px', height: '32px', backgroundColor: '#3b82f6', color: '#fff',
    borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '700', fontSize: '12px',
  },
  navTitle:   { fontWeight: '600', fontSize: '15px', color: '#0f172a' },
  orgPill:    { fontSize: '12px', color: '#64748b', backgroundColor: '#f1f5f9', padding: '3px 10px', borderRadius: '999px' },
  navRight:   { display: 'flex', alignItems: 'center', gap: '20px' },
  logoutBtn:  { fontSize: '13px', color: '#64748b', background: 'transparent', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer' },
  main:       { maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' },
  pageHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  pageTitle:  { fontSize: '22px', fontWeight: '600', color: '#0f172a', margin: '0 0 4px' },
  pageSubtitle:{ fontSize: '13px', color: '#64748b', margin: 0 },
  addBtn: {
    backgroundColor: '#3b82f6', color: '#fff', border: 'none',
    borderRadius: '8px', padding: '10px 18px', fontSize: '13px',
    fontWeight: '500', cursor: 'pointer',
  },
  errorBanner: {
    backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
    borderRadius: '8px', padding: '12px 16px', fontSize: '13px', marginBottom: '16px',
  },
  filterBar:  { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
  searchInput: {
    flex: 1, minWidth: '200px', padding: '9px 14px',
    border: '1px solid #e2e8f0', borderRadius: '8px',
    fontSize: '13px', color: '#0f172a', outline: 'none',
  },
  filterSelect: {
    padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: '8px',
    fontSize: '13px', color: '#0f172a', outline: 'none', backgroundColor: '#fff',
  },
  tableWrap:  { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' },
  table:      { width: '100%', borderCollapse: 'collapse' },
  theadRow:   { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th:         { padding: '12px 16px', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tr:         { borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' },
  td:         { padding: '14px 16px', fontSize: '13px', color: '#374151', verticalAlign: 'middle' },
  emptyCell:  { padding: 0, border: 'none' },
  loadingRow: { padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' },
  emptyState: { padding: '56px 24px', textAlign: 'center' },
  emptyIcon:  { fontSize: '36px', marginBottom: '12px' },
  emptyTitle: { fontSize: '15px', fontWeight: '600', color: '#0f172a', marginBottom: '6px' },
  emptySub:   { fontSize: '13px', color: '#64748b' },
  productName:{ fontWeight: '500', color: '#0f172a', marginBottom: '2px' },
  productDesc:{ fontSize: '12px', color: '#94a3b8' },
  skuBadge:   { fontFamily: 'monospace', fontSize: '12px', backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px' },
  categoryBadge:{ fontSize: '12px', backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bfdbfe' },
  noBadge:    { color: '#cbd5e1' },
  stockBadge: { fontSize: '12px', padding: '3px 10px', borderRadius: '999px', fontWeight: '500' },
  editBtn: {
    fontSize: '12px', padding: '5px 12px', border: '1px solid #e2e8f0',
    borderRadius: '6px', backgroundColor: '#fff', color: '#374151',
    cursor: 'pointer', marginRight: '6px',
  },
  deleteBtn: {
    fontSize: '12px', padding: '5px 12px', border: '1px solid #fecaca',
    borderRadius: '6px', backgroundColor: '#fff', color: '#dc2626', cursor: 'pointer',
  },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '24px' },
  pageBtn: {
    padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '8px',
    fontSize: '13px', backgroundColor: '#fff', color: '#374151', cursor: 'pointer',
  },
  pageInfo:   { fontSize: '13px', color: '#64748b' },
  backdrop:   { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' },
  confirmBox: { backgroundColor: '#fff', borderRadius: '12px', padding: '28px', maxWidth: '400px', width: '100%' },
  confirmTitle:{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: '0 0 10px' },
  confirmText: { fontSize: '14px', color: '#64748b', lineHeight: '1.6', margin: '0 0 20px' },
  confirmBtns: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
  cancelBtn:  { padding: '9px 18px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#64748b', backgroundColor: '#fff', cursor: 'pointer' },
  confirmDeleteBtn: { padding: '9px 18px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', backgroundColor: '#ef4444', color: '#fff', cursor: 'pointer' },
}

export default Inventory