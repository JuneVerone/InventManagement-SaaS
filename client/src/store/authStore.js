// src/store/authStore.js
//
// Zustand global store — holds the logged-in user's auth state.
//
// ── WHY ZUSTAND INSTEAD OF useState? ────────────────────────────────────────
//   useState is LOCAL to one component. To share auth state across the whole
//   app you'd have to "prop drill" it through every component in the tree.
//   For state needed everywhere (nav bar, pages, guards), a global store is cleaner.
//
// ── WHY ZUSTAND INSTEAD OF Context API? ─────────────────────────────────────
//   React Context re-renders EVERY subscriber whenever anything changes.
//   Zustand is selective — a component only re-renders when the specific
//   slice of state it reads actually changes.
//
// ── SECURITY — why is the accessToken in MEMORY only? ───────────────────────
//   localStorage is readable by any JavaScript on the page (XSS attacks).
//   Storing a JWT there means if an attacker injects JS, they steal the token.
//   Memory (a JS variable) is NOT accessible to injected scripts.
//   On page refresh the token is gone, BUT the httpOnly refresh-token cookie
//   silently restores the session — invisible to the user.
//
// ── USAGE IN COMPONENTS ──────────────────────────────────────────────────────
//   const user = useAuthStore(s => s.user)        // read one field
//   const setAuth = useAuthStore(s => s.setAuth)   // read one action

import { create } from 'zustand'

export const useAuthStore = create((set, get) => ({

  // ── State ──────────────────────────────────────────────────────────────────
  accessToken: null,  // JWT — lives in memory only, NEVER in localStorage
  user:        null,  // { id, name, email }
  org:         null,  // { id, name, slug, plan }
  role:        null,  // 'ADMIN' | 'STAFF' | 'VIEWER'
  isLoading:   true,  // true while the initial silent session check runs on page load
                      // ProtectedRoute shows a spinner while this is true, preventing
                      // a flash-redirect to /login for users who ARE logged in.

  // ── Actions ────────────────────────────────────────────────────────────────

  // Called after login, register, or a successful token refresh.
  // Sets all auth state at once and marks loading as done.
  setAuth: ({ accessToken, user, org, role }) =>
    set({ accessToken, user, org, role, isLoading: false }),

  // Called by the Axios interceptor after a SILENT token refresh.
  // Updates only the token — no need to re-fetch user/org/role.
  setAccessToken: (accessToken) => set({ accessToken }),

  // Called on logout or when the refresh token has expired.
  // Wipes everything back to null so ProtectedRoute redirects to /login.
  clearAuth: () =>
    set({ accessToken: null, user: null, org: null, role: null, isLoading: false }),

  // Called at the START of the initial session check.
  setLoading: (isLoading) => set({ isLoading }),

  // ── Computed helpers ───────────────────────────────────────────────────────
  // These read the current state via get() and return derived booleans.
  // Usage: useAuthStore(s => s.isAdmin())
  isAuthenticated: () => !!get().accessToken,
  isAdmin:         () => get().role === 'ADMIN',
  isAtLeastStaff:  () => ['ADMIN', 'STAFF'].includes(get().role),

}))