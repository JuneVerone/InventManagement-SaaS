// src/pages/Login.jsx
//
// ── KEY REACT CONCEPTS DEMONSTRATED ─────────────────────────────────────────
//
// 1. CONTROLLED COMPONENT
//    React "controls" the input — state drives the value, the DOM does not.
//    Flow: user types → onChange fires → setState → React re-renders the input
//    This gives React full visibility into the form at all times.
//    You can always read formData.email to know what's in the input.
//
// 2. SINGLE CHANGE HANDLER
//    One handleChange function updates ANY field using e.target.name.
//    Computed property key [name] means: { email: '' } becomes { email: value }.
//    Adding a new field = add it to state + give the input name="fieldName".
//    No new handler function needed.
//
// 3. REDIRECT IF ALREADY LOGGED IN
//    Line: if (isAuthenticated) return <Navigate to="/dashboard" replace />
//    A logged-in user visiting /login gets sent straight to /dashboard.
//    The `replace` removes /login from history so back-button works correctly.

import { useState }         from 'react'
import { Link, Navigate }   from 'react-router-dom'
import { useAuth }          from '../hooks/useAuth'

const Login = () => {
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth()

  // Controlled form state — one object for all fields
  const [formData, setFormData] = useState({
    email:   '',
    orgSlug: '',
    password:'',
  })

  // Redirect if already logged in — no need to show the login form
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  // One handler for all inputs — uses the input's `name` attribute as the key
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) clearError()  // clear the error message when user starts editing
  }

  const handleSubmit = async (e) => {
    e.preventDefault()          // stop the browser reloading the page
    await login(formData)       // useAuth handles everything else
  }

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Logo mark */}
        <div style={s.logo}>IS</div>

        <h1 style={s.title}>Welcome back</h1>
        <p  style={s.sub}>Sign in to your organization</p>

        {/* Server-side error (e.g. wrong password) */}
        {error && <div style={s.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>

          <Field label="Email address">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@company.com"
              required
              style={s.input}
            />
          </Field>

          <Field
            label="Organization slug"
            hint="The short ID shown when your org was created — e.g. acme-corp-ab12"
          >
            <input
              type="text"
              name="orgSlug"
              value={formData.orgSlug}
              onChange={handleChange}
              placeholder="acme-corp-ab12"
              required
              style={s.input}
            />
          </Field>

          <Field label="Password">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              style={s.input}
            />
          </Field>

          <button
            type="submit"
            disabled={isLoading}
            style={{ ...s.btn, opacity: isLoading ? 0.65 : 1 }}
          >
            {isLoading ? 'Signing in…' : 'Sign in →'}
          </button>

        </form>

        <p style={s.footer}>
          Don't have an account?{' '}
          <Link to="/register" style={s.link}>Create one</Link>
        </p>

      </div>
    </div>
  )
}

// ── Reusable field wrapper ───────────────────────────────────────────────────
// Keeps the form JSX clean — wraps label + input + optional hint text
const Field = ({ label, hint, children }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
    <label style={{ fontSize:'13px', fontWeight:'500', color:'#374151' }}>
      {label}
    </label>
    {children}
    {hint && <span style={{ fontSize:'12px', color:'#94a3b8' }}>{hint}</span>}
  </div>
)

// ── Styles ───────────────────────────────────────────────────────────────────
const s = {
  page: {
    minHeight:'100vh', display:'flex', alignItems:'center',
    justifyContent:'center', backgroundColor:'#f8fafc', padding:'24px',
  },
  card: {
    backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'16px',
    padding:'40px', width:'100%', maxWidth:'400px',
    display:'flex', flexDirection:'column', gap:'4px',
  },
  logo: {
    width:'40px', height:'40px', backgroundColor:'#3b82f6', color:'#fff',
    borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center',
    fontWeight:'700', fontSize:'14px', marginBottom:'14px',
  },
  title:    { fontSize:'22px', fontWeight:'600', color:'#0f172a' },
  sub:      { fontSize:'14px', color:'#64748b', marginBottom:'12px' },
  errorBox: {
    backgroundColor:'#fef2f2', border:'1px solid #fecaca',
    color:'#dc2626', borderRadius:'8px', padding:'12px 14px', fontSize:'13px',
  },
  form:  { display:'flex', flexDirection:'column', gap:'18px', marginTop:'8px' },
  input: {
    padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:'8px',
    fontSize:'14px', color:'#0f172a', outline:'none', width:'100%',
  },
  btn: {
    backgroundColor:'#3b82f6', color:'#fff', borderRadius:'8px',
    padding:'11px', fontSize:'14px', fontWeight:'500', marginTop:'4px',
    transition:'opacity 0.15s',
  },
  footer: { fontSize:'13px', color:'#64748b', textAlign:'center', marginTop:'20px' },
  link:   { color:'#3b82f6', fontWeight:'500' },
}

export default Login