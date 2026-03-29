import { useState }       from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth }        from '../hooks/useAuth'

const Register = () => {
  const { register, isAuthenticated, isLoading, error, clearError } = useAuth()

  const [formData, setFormData] = useState({
    name:     '',
    email:    '',
    password: '',
    orgName:  '',
  })

  const [fieldErrors, setFieldErrors] = useState({})

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: null }))
    if (error) clearError()
  }

  const validate = () => {
    const errs = {}
    if (!formData.name.trim() || formData.name.length < 2)
      errs.name = 'Name must be at least 2 characters'
    if (!formData.email.includes('@'))
      errs.email = 'Enter a valid email address'
    if (formData.password.length < 8)
      errs.password = 'Password must be at least 8 characters'
    else if (!/[A-Z]/.test(formData.password))
      errs.password = 'Password must include an uppercase letter'
    else if (!/[0-9]/.test(formData.password))
      errs.password = 'Password must include a number'
    if (!formData.orgName.trim() || formData.orgName.length < 2)
      errs.orgName = 'Organization name must be at least 2 characters'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }
    await register(formData)
  }

  return (
    <div style={s.page}>
      <div style={s.card}>

        <div style={s.logo}>IS</div>
        <h1 style={s.title}>Create your account</h1>
        <p  style={s.sub}>Set up your team's inventory workspace</p>

        {error && <div style={s.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>

          <Field label="Your full name" error={fieldErrors.name}>
            <input
              type="text" name="name"
              value={formData.name} onChange={handleChange}
              placeholder="Jane Smith" required
              style={{ ...s.input, borderColor: fieldErrors.name ? '#f87171' : '#d1d5db' }}
            />
          </Field>

          <Field
            label="Organization name"
            hint="Your company or team name"
            error={fieldErrors.orgName}
          >
            <input
              type="text" name="orgName"
              value={formData.orgName} onChange={handleChange}
              placeholder="Acme Corp" required
              style={{ ...s.input, borderColor: fieldErrors.orgName ? '#f87171' : '#d1d5db' }}
            />
          </Field>

          <Field label="Email address" error={fieldErrors.email}>
            <input
              type="email" name="email"
              value={formData.email} onChange={handleChange}
              placeholder="jane@acme.com" required
              style={{ ...s.input, borderColor: fieldErrors.email ? '#f87171' : '#d1d5db' }}
            />
          </Field>

          <Field
            label="Password"
            hint="Min 8 characters, one uppercase letter, one number"
            error={fieldErrors.password}
          >
            <input
              type="password" name="password"
              value={formData.password} onChange={handleChange}
              placeholder="••••••••" required
              style={{ ...s.input, borderColor: fieldErrors.password ? '#f87171' : '#d1d5db' }}
            />
          </Field>

          <button
            type="submit"
            disabled={isLoading}
            style={{ ...s.btn, opacity: isLoading ? 0.65 : 1 }}
          >
            {isLoading ? 'Creating account…' : 'Create account →'}
          </button>

        </form>

        <p style={s.footer}>
          Already have an account?{' '}
          <Link to="/login" style={s.link}>Sign in</Link>
        </p>

      </div>
    </div>
  )
}

const Field = ({ label, hint, error, children }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
    <label style={{ fontSize:'13px', fontWeight:'500', color:'#374151' }}>{label}</label>
    {children}
    {error
      ? <span style={{ fontSize:'12px', color:'#dc2626' }}>{error}</span>
      : hint && <span style={{ fontSize:'12px', color:'#94a3b8' }}>{hint}</span>
    }
  </div>
)

const s = {
  page: {
    minHeight:'100vh', display:'flex', alignItems:'center',
    justifyContent:'center', backgroundColor:'#f8fafc', padding:'24px',
  },
  card: {
    backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'16px',
    padding:'40px', width:'100%', maxWidth:'420px',
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
  form:  { display:'flex', flexDirection:'column', gap:'16px', marginTop:'8px' },
  input: {
    padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:'8px',
    fontSize:'14px', color:'#0f172a', outline:'none', width:'100%',
  },
  btn: {
    backgroundColor:'#3b82f6', color:'#fff', borderRadius:'8px',
    padding:'11px', fontSize:'14px', fontWeight:'500', marginTop:'4px',
    transition:'opacity 0.15s', border:'none', cursor:'pointer',
  },
  footer: { fontSize:'13px', color:'#64748b', textAlign:'center', marginTop:'20px' },
  link:   { color:'#3b82f6', fontWeight:'500' },
}

export default Register