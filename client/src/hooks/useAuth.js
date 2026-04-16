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
import { loginApi, registerApi, logoutApi }  from '../api/auth'

export const useAuth = () => {
  const navigate = useNavigate()

  const accessToken    = useAuthStore(s => s.accessToken)
  const user           = useAuthStore(s => s.user)
  const org            = useAuthStore(s => s.org)
  const role           = useAuthStore(s => s.role)
  const isStoreLoading = useAuthStore(s => s.isLoading)

  const setAuth    = useAuthStore(s => s.setAuth)
  const clearAuth  = useAuthStore(s => s.clearAuth)
  const setLoading = useAuthStore(s => s.setLoading)

  const [isActionLoading, setIsActionLoading] = useState(false)
  const [error,           setError          ] = useState(null)

  // ── SESSION RESTORE ───────────────────────────────────────────────────────
  // Uses plain fetch() instead of axios to avoid any axios configuration issues.
  // The browser automatically sends the httpOnly refreshToken cookie with the request
  // because credentials: 'include' is set.
  useEffect(() => {
    const restoreSession = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/auth/refresh', {
          method:      'POST',
          credentials: 'include',
          headers:     { 'Content-Type': 'application/json' },
        })

        if (response.ok) {
          const json = await response.json()
          // json = { success: true, data: { accessToken, user, org, role } }
          setAuth(json.data)
        } else {
          // 401 = no valid cookie — user must log in
          clearAuth()
        }
      } catch {
        // Network error or server down
        clearAuth()
      }
    }

    restoreSession()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    setIsActionLoading(true)
    setError(null)
    try {
      const data = await loginApi(credentials)
      setAuth(data)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setIsActionLoading(false)
    }
  }, [navigate, setAuth])

  // ── REGISTER ──────────────────────────────────────────────────────────────
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

  // ── LOGOUT ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await logoutApi()
    } finally {
      clearAuth()
      navigate('/login')
    }
  }, [navigate, clearAuth])

  const clearError = useCallback(() => setError(null), [])

  return {
    user,
    org,
    role,
    isAuthenticated:  !!accessToken,
    isLoading:        isStoreLoading || isActionLoading,
    error,
    clearError,
    login,
    register,
    logout,
    isAdmin:          role === 'ADMIN',
    isAtLeastStaff:   role === 'ADMIN' || role === 'STAFF',
    isViewer:         role === 'VIEWER',
  }
}