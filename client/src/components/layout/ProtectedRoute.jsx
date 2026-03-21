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

import { Navigate }     from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

// Numeric levels let us do "at least STAFF" comparisons
const ROLE_LEVEL = { VIEWER: 0, STAFF: 1, ADMIN: 2 }

const ProtectedRoute = ({ children, requiredRole = null, minRole = null }) => {
  const accessToken = useAuthStore(s => s.accessToken)
  const role        = useAuthStore(s => s.role)
  const isLoading   = useAuthStore(s => s.isLoading)

  // ① Still restoring session — show spinner, DO NOT redirect yet.
  //
  //   WHY THIS MATTERS:
  //   When the page loads, isLoading starts as `true` and accessToken is null.
  //   Without this check, the guard would see null token and redirect to /login
  //   BEFORE the session restore has a chance to run — even for logged-in users.
  //   This spinner buys the 100–200ms needed for the restore to complete.
  if (isLoading) {
    return (
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        height:         '100vh',
        gap:            '10px',
        color:          '#64748b',
        fontSize:       '14px',
      }}>
        <div style={spinnerStyle} />
        Restoring session…
      </div>
    )
  }

  // ② Not authenticated → send to login
  // `replace` removes the current URL from browser history so the back button
  // doesn't send the user back to the protected page after they log in.
  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  // ③ Exact role required — must be specifically that role
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />
  }

  // ④ Minimum role required — user level must be >= the minimum
  if (minRole) {
    const userLevel = ROLE_LEVEL[role]    ?? -1
    const minLevel  = ROLE_LEVEL[minRole] ?? 0
    if (userLevel < minLevel) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  // ⑤ All checks passed — render the actual page
  return children
}

// CSS spinner via border trick:
// Full border = grey ring. Top border only = coloured arc.
// CSS animation rotates it continuously → spinning effect.
const spinnerStyle = {
  width:          '18px',
  height:         '18px',
  border:         '2px solid #e2e8f0',
  borderTopColor: '#3b82f6',
  borderRadius:   '50%',
  animation:      'spin 0.7s linear infinite',
}

// Inject the @keyframes rule once into <head> — no separate CSS file needed
const styleEl = document.createElement('style')
styleEl.textContent = '@keyframes spin { to { transform: rotate(360deg); } }'
document.head.appendChild(styleEl)

export default ProtectedRoute