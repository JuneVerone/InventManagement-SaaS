// src/api/auth.js
//
// All auth-related HTTP calls in one place.
// Components NEVER call axios directly — they call these functions.
//
// Benefits of this pattern:
//   • One place to update if an endpoint URL changes
//   • Easy to mock in tests (just mock this module)
//   • Consistent response unwrapping — callers get clean data, not nested wrappers
//
// Each function unwraps the response envelope so callers get clean objects.
// Backend always returns { success: true, data: { ... } }
//   res.data      = { success, data }   (axios unwraps the HTTP body)
//   res.data.data = { accessToken, user, org, role }  (we unwrap the envelope)

import api from './axios'

// ── POST /auth/register ───────────────────────────────────────────────────────
// Creates a new user + organization in one transaction.
// Returns: { accessToken, user, org, role }
export const registerApi = ({ name, email, password, orgName }) =>
  api.post('/auth/register', { name, email, password, orgName })
     .then(res => res.data.data)

// ── POST /auth/login ──────────────────────────────────────────────────────────
// Returns: { accessToken, user, org, role }
export const loginApi = ({ email, orgSlug, password }) =>
  api.post('/auth/login', { email, orgSlug, password })
     .then(res => res.data.data)

// ── POST /auth/refresh ────────────────────────────────────────────────────────
// The refresh-token cookie is sent automatically by the browser.
// No token argument needed — the cookie does the work.
// Returns: { accessToken, user, org, role }
export const refreshTokenApi = () =>
  api.post('/auth/refresh')
     .then(res => res.data.data)

// ── POST /auth/logout ─────────────────────────────────────────────────────────
// Tells the server to clear the httpOnly refresh-token cookie.
export const logoutApi = () =>
  api.post('/auth/logout')

// ── GET /auth/me ──────────────────────────────────────────────────────────────
// Returns the current user's profile (requires valid access token).
// Returns: { user, org, role }
export const getMeApi = () =>
  api.get('/auth/me')
     .then(res => res.data.data)