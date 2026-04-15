// src/App.jsx
//
// Root component — the very top of the React component tree.
// Every other component is a child of this one.
// Its only job: set up React Router so URLs map to the right page.
//
// ── HOW REACT ROUTER WORKS ───────────────────────────────────────────────────
//   Traditional website:
//     Click a link → browser fetches a NEW HTML file from the server → full reload
//
//   React SPA (Single Page Application):
//     Click a link → URL changes → React swaps components → NO page reload
//     The browser never fetches a new HTML file after the first one.
//     This makes navigation feel instant.
//
// ── KEY COMPONENTS ───────────────────────────────────────────────────────────
//   <BrowserRouter>  wraps the whole app — enables routing via browser History API
//   <Routes>         looks at the current URL and renders the FIRST matching <Route>
//   <Route>          maps a URL path → component
//   <Navigate>       immediately redirects to another path (no UI rendered)
//
// ── ROUTE MAP ────────────────────────────────────────────────────────────────
//   /               → redirect to /dashboard
//   /login          → Login page       (public)
//   /register       → Register page    (public)
//   /dashboard      → Dashboard        (protected — any logged-in user)
//   /unauthorized   → 403 page         (shown when role check fails)
//   *               → 404 page         (any URL that doesn't match above)
//
// ── HOW PROTECTION WORKS ─────────────────────────────────────────────────────
//   1. User visits /dashboard
//   2. <ProtectedRoute> checks Zustand store
//   3a. isLoading=true  → show spinner (session restore in progress)
//   3b. no accessToken  → <Navigate to="/login"> (not logged in)
//   3c. wrong role      → <Navigate to="/unauthorized">
//   3d. all good        → render <Dashboard />

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Login          from './pages/Login'
import Register       from './pages/Register'
import Dashboard      from './pages/Dashboard'
import Inventory      from './pages/Inventory'
import Unauthorized   from './pages/Unauthorized'
import NotFound       from './pages/NotFound'

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />

      <Route path="/inventory" element={
        <ProtectedRoute><Inventory /></ProtectedRoute>
      } />

      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*"             element={<NotFound />} />
    </Routes>
  </BrowserRouter>
)

export default App