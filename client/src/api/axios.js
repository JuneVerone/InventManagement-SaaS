// src/api/axios.js
//
// A configured Axios instance shared across the whole app.
// NEVER import raw 'axios' directly in components — always import this file.
// That way every request automatically gets:
//   ✅ The correct baseURL
//   ✅ The Authorization header attached
//   ✅ Silent token refresh when access token expires
//
// ── HOW THE TOKEN REFRESH INTERCEPTOR WORKS ─────────────────────────────────
//
//  Normal flow (token still valid):
//    Component calls API → request interceptor adds Bearer token
//    → backend returns 200 → component gets data ✅
//
//  Expired token flow (transparent to the component):
//    Component calls API → backend returns 401 TOKEN_EXPIRED
//    → response interceptor catches it
//    → calls POST /auth/refresh (refresh-token cookie sent automatically)
//    → gets a new accessToken back
//    → updates the Zustand store
//    → RETRIES the original failed request with the new token
//    → component gets its data ✅ — never knew anything went wrong
//
//  Edge case — multiple requests expire simultaneously:
//    Request A → 401 → starts the refresh
//    Request B → 401 → sees refresh in progress → joins QUEUE
//    Request C → 401 → joins queue too
//    Refresh finishes → ALL queued requests retry with the new token
//    This prevents 3 simultaneous /auth/refresh calls to the backend.
//
// ─────────────────────────────────────────────────────────────────────────────

import axios            from 'axios'
import { useAuthStore } from '../store/authStore'

// ── Create the custom instance ───────────────────────────────────────────────
const api = axios.create({
  baseURL: '/api',
  withCredentials:  true,  // sends cookies (the httpOnly refresh token) with EVERY request
})

// ── REQUEST INTERCEPTOR ───────────────────────────────────────────────────────
// Runs before every outgoing request.
// Reads the current accessToken from Zustand and attaches it as a header.
// Without this you'd write `headers: { Authorization: ... }` in every API call.

api.interceptors.request.use(
  (config) => {
    // .getState() reads Zustand outside React — works here because
    // interceptors are plain JS functions, not React components.
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── RESPONSE INTERCEPTOR ──────────────────────────────────────────────────────
// Runs after every response — including error responses.

let isRefreshing = false   // flag: is a refresh call currently in flight?
let queue        = []      // requests waiting for the new token

// Resolve or reject every request that is waiting in the queue.
const flushQueue = (error, token = null) => {
  queue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  )
  queue = []
}

api.interceptors.response.use(
  // ✅ Success — return the response unchanged
  (response) => response,

  // ❌ Error — check if we can recover silently
  async (error) => {
    const original = error.config

    // Is this a TOKEN_EXPIRED 401 that we haven't already retried?
    // original._retry is a custom flag we set to prevent infinite retry loops.
    const isExpiredToken =
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !original._retry

    // Not a token expiry — propagate the error normally
    if (!isExpiredToken) return Promise.reject(error)

    // ── Another refresh already in progress — queue this request ─────────────
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject })
      }).then((newToken) => {
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)  // retry with the new token once refresh completes
      })
    }

    // ── Start a new refresh ───────────────────────────────────────────────────
    original._retry = true   // mark as retried so we don't loop
    isRefreshing    = true

    try {
      // POST /auth/refresh — the browser sends the httpOnly cookie automatically.
      // We use raw axios here (not our `api` instance) to avoid triggering
      // the request interceptor with a null token.
      const { data } = await axios.post(
        `${api.defaults.baseURL}/auth/refresh`,
        {},
        { withCredentials: true }
      )

      const newToken = data.data.accessToken

      // Save the new token to the Zustand store
      useAuthStore.getState().setAccessToken(newToken)

      // Unblock all queued requests — they'll retry with the new token
      flushQueue(null, newToken)

      // Retry the original request that triggered the refresh
      original.headers.Authorization = `Bearer ${newToken}`
      return api(original)

    } catch (refreshError) {
      // Refresh token is also expired — the user must log in again
      flushQueue(refreshError)
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
      return Promise.reject(refreshError)

    } finally {
      isRefreshing = false
    }
  }
)

export default api