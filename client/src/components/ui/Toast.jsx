// src/components/ui/Toast.jsx
//
// Displays a stack of toast notifications in the bottom-right corner.
// Used for real-time stock:low alerts from Socket.io.

import { useState, useCallback } from 'react'

// Toast manager hook — use this in your top-level component
export const useToast = () => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'warning') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 6000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, addToast, removeToast }
}

// Toast container — renders all active toasts
export const ToastContainer = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null

  return (
    <div style={s.container}>
      {toasts.map(toast => (
        <div key={toast.id} style={{
          ...s.toast,
          ...(toast.type === 'warning' ? s.warning : {}),
          ...(toast.type === 'error'   ? s.error   : {}),
          ...(toast.type === 'success' ? s.success  : {}),
        }}>
          <div style={s.toastIcon}>
            {toast.type === 'warning' ? '⚠️' : toast.type === 'error' ? '❌' : '✅'}
          </div>
          <div style={s.toastMessage}>{toast.message}</div>
          <button onClick={() => onRemove(toast.id)} style={s.closeBtn}>✕</button>
        </div>
      ))}
    </div>
  )
}

const s = {
  container: {
    position:      'fixed',
    bottom:        '24px',
    right:         '24px',
    zIndex:        9999,
    display:       'flex',
    flexDirection: 'column',
    gap:           '10px',
    maxWidth:      '360px',
    width:         '100%',
  },
  toast: {
    display:         'flex',
    alignItems:      'flex-start',
    gap:             '10px',
    padding:         '14px 16px',
    borderRadius:    '10px',
    boxShadow:       '0 4px 20px rgba(0,0,0,0.15)',
    animation:       'slideIn 0.3s ease',
    backgroundColor: '#fff',
    border:          '1px solid #e2e8f0',
  },
  warning: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  error:   { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  success: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  toastIcon:    { fontSize: '18px', flexShrink: 0, marginTop: '1px' },
  toastMessage: { flex: 1, fontSize: '13px', color: '#374151', lineHeight: '1.5' },
  closeBtn: {
    background: 'none', border: 'none', color: '#94a3b8',
    cursor: 'pointer', fontSize: '14px', padding: '2px', flexShrink: 0,
  },
}

// Inject animation keyframes
const styleEl = document.createElement('style')
styleEl.textContent = `@keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`
document.head.appendChild(styleEl)