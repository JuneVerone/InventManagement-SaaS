// src/components/layout/ProtectedRoute.jsx
//
// Guards pages from unauthorised access.
// Wrap any page component with this in App.jsx and it gets protected automatically.
//
// ── THREE JOBS ───────────────────────────────────────────────────────────────
//   1. Show a loading spinner while the session is being checked on page load
//   2. Redirect to /login if not authenticated
//   3. Redirect to /unauthorized if authenticated but wrong role
//
// ── USAGE IN App.jsx ─────────────────────────────────────────────────────────
//
//   Any logged-in user:
//   <ProtectedRoute><Dashboard /></ProtectedRoute>
//
//   Admins only:
//   <ProtectedRoute requiredRole="ADMIN"><UserSettings /></ProtectedRoute>
//
//   Staff or above:
//   <ProtectedRoute minRole="STAFF"><Inventory /></ProtectedRoute>
//
// ── WHY READ FROM STORE DIRECTLY (not useAuth)? ──────────────────────────────
//   useAuth contains a useEffect for session restore. If ProtectedRoute used
//   useAuth, it would trigger a SECOND restore attempt every time a protected
//   page renders. We read the store directly to avoid that duplication.
//   The one restore happens in useAuth inside a page that calls it.
import { useEffect, useState } from 'react'
import { Navigate }            from 'react-router-dom'
import { useAuthStore }        from '../../store/authStore'

const ROLE_LEVEL = { VIEWER: 0, STAFF: 1, ADMIN: 2 }

const ProtectedRoute = ({ children, requiredRole = null, minRole = null }) => {
  const accessToken = useAuthStore(s => s.accessToken)
  const role        = useAuthStore(s => s.role)
  const isLoading   = useAuthStore(s => s.isLoading)

  // Safety timeout — if loading takes more than 5 seconds, stop waiting
  // This prevents infinite spinner if the refresh endpoint never responds
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (!isLoading) { setTimedOut(false); return }
    const timer = setTimeout(() => setTimedOut(true), 5000)
    return () => clearTimeout(timer)
  }, [isLoading])

  // Still loading and not timed out — show spinner
  if (isLoading && !timedOut) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', gap: '10px', color: '#64748b', fontSize: '14px',
      }}>
        <div style={spinnerStyle} />
        Restoring session…
      </div>
    )
  }

  // Not authenticated (or timed out) → go to login
  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  // Exact role check
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />
  }

  // Minimum role check
  if (minRole) {
    const userLevel = ROLE_LEVEL[role]    ?? -1
    const minLevel  = ROLE_LEVEL[minRole] ?? 0
    if (userLevel < minLevel) return <Navigate to="/unauthorized" replace />
  }

  return children
}

const spinnerStyle = {
  width: '18px', height: '18px',
  border: '2px solid #e2e8f0',
  borderTopColor: '#3b82f6',
  borderRadius: '50%',
  animation: 'spin 0.7s linear infinite',
}

const styleEl = document.createElement('style')
styleEl.textContent = '@keyframes spin { to { transform: rotate(360deg); } }'
document.head.appendChild(styleEl)

export default ProtectedRoute