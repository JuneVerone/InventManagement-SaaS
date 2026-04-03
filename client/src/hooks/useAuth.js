// src/hooks/useAuth.js
//
// The single hook all components use for anything auth-related.
// It bridges UI components ↔ Zustand store ↔ API layer.
//
// ── THREE LAYERS, THREE RESPONSIBILITIES ────────────────────────────────────
//   api/auth.js     makes HTTP calls             (no React)
//   authStore.js    stores the auth data          (no React, accessible anywhere)
//   useAuth.js      exposes actions + UI state    (React only — components use this)
//
// Keeping them separate means:
//   • authStore can be read from axios.js (outside React)
//   • api/auth.js can be tested without a browser
//   • useAuth.js is the clean interface components interact with
//
// ── WHAT THIS HOOK PROVIDES ──────────────────────────────────────────────────
//   Session restore  — on every page load, tries to restore session silently
//   login()          — calls API, updates store, navigates to /dashboard
//   register()       — same flow as login
//   logout()         — clears cookie on server, clears store, navigates to /login
//   isLoading        — true during session restore OR during an action
//   error            — message from the last failed action (null if none)
//   user, org, role  — current auth data from the store
//   permission bools — isAdmin, isAtLeastStaff, isViewer

import { useState, useEffect, useCallback } from 'react'
import { useNavigate }                       from 'react-router-dom'
import { useAuthStore }                      from '../store/authStore'
import { loginApi, registerApi, logoutApi, refreshTokenApi } from '../api/auth'

export const useAuth = () => {
  const navigate = useNavigate()

  // ── Read data from the global store ────────────────────────────────────────
  // We read each field individually so the component only re-renders when
  // the specific field it cares about changes (Zustand's selective re-render).
  const accessToken    = useAuthStore(s => s.accessToken)
  const user           = useAuthStore(s => s.user)
  const org            = useAuthStore(s => s.org)
  const role           = useAuthStore(s => s.role)
  const isStoreLoading = useAuthStore(s => s.isLoading)

  // ── Read store actions (stable references — never cause re-renders) ─────────
  const setAuth    = useAuthStore(s => s.setAuth)
  const clearAuth  = useAuthStore(s => s.clearAuth)
  const setLoading = useAuthStore(s => s.setLoading)

  // ── Local UI state — only for the CURRENT action's feedback ────────────────
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [error,           setError          ] = useState(null)

  // ── SESSION RESTORE ON PAGE LOAD ────────────────────────────────────────────
  //
  // Problem:  The accessToken lives in memory. A browser refresh wipes memory.
  //           Without this, every refresh would log the user out.
  //
  // Solution: On mount, call POST /auth/refresh.
  //           The httpOnly refresh-token cookie is sent automatically.
  //           If valid → get a new accessToken → user is silently logged back in.
  //           If expired → clearAuth() → ProtectedRoute redirects to /login.
  //
  // Important: We call refreshTokenApi() NOT getMeApi().
  //            getMeApi() requires an access token — we don't have one yet on load.
  //            refreshTokenApi() uses only the cookie.

  useEffect(() => {
  const restoreSession = async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      if (response.ok) {
        const data = await response.json()
        setAuth(data.data)
      } else {
        clearAuth()
      }
    } catch {
      clearAuth()
    }
  }
  restoreSession()
}, [])
  // Empty [] = run once on mount only.
  // We exclude setAuth/clearAuth/setLoading from deps intentionally —
  // they are stable store actions and adding them causes unnecessary re-runs.

  // ── LOGIN ───────────────────────────────────────────────────────────────────
  // useCallback so the function reference is stable — prevents unnecessary
  // re-renders if this function is passed as a prop to child components.
  const login = useCallback(async (credentials) => {
    setIsActionLoading(true)
    setError(null)
    try {
      const data = await loginApi(credentials)  // { accessToken, user, org, role }
      setAuth(data)
      navigate('/dashboard')
    } catch (err) {
      // err.response.data.message is the message from our Express error handler
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setIsActionLoading(false)  // always runs, even if an error was thrown
    }
  }, [navigate, setAuth])

  // ── REGISTER ────────────────────────────────────────────────────────────────
  const register = useCallback(async (formData) => {
    setIsActionLoading(true)
    setError(null)
    try {
      const data = await registerApi(formData)
      setAuth(data)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setIsActionLoading(false)
    }
  }, [navigate, setAuth])

  // ── LOGOUT ──────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await logoutApi()  // tells server to clear the httpOnly cookie
    } finally {
      // Even if the server call fails (network offline), always clear local state
      // so the user isn't stuck with a broken session
      clearAuth()
      navigate('/login')
    }
  }, [navigate, clearAuth])

  // ── CLEAR ERROR ─────────────────────────────────────────────────────────────
  // Called by forms when the user starts typing again after an error
  const clearError = useCallback(() => setError(null), [])

  // ── Return everything components need ───────────────────────────────────────
  return {
    // Auth data (from store)
    user,
    org,
    role,
    isAuthenticated: !!accessToken,

    // Loading: true during EITHER the initial session restore OR an action
    isLoading: isStoreLoading || isActionLoading,

    // Error from the last failed action (null if no error)
    error,
    clearError,

    // Actions
    login,
    register,
    logout,

    // Permission shortcuts — derived from role
    isAdmin:        role === 'ADMIN',
    isAtLeastStaff: role === 'ADMIN' || role === 'STAFF',
    isViewer:       role === 'VIEWER',
  }
}