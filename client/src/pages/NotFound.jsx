// src/pages/NotFound.jsx
// Shown by the `path="*"` catch-all route in App.jsx for any unknown URL.

import { useNavigate } from 'react-router-dom'

const NotFound = () => {
  const navigate = useNavigate()
  return (
    <div style={s.page}>
      <div style={s.box}>
        <div style={s.code}>404</div>
        <h1 style={s.title}>Page not found</h1>
        <p  style={s.sub}>This page doesn't exist or has been moved.</p>
        <button onClick={() => navigate('/dashboard')} style={s.btn}>
          Go to dashboard
        </button>
      </div>
    </div>
  )
}

const s = {
  page:  { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'#f8fafc' },
  box:   { textAlign:'center', padding:'40px' },
  code:  { fontSize:'72px', fontWeight:'700', color:'#e2e8f0', lineHeight:1 },
  title: { fontSize:'20px', fontWeight:'600', color:'#0f172a', margin:'12px 0 8px' },
  sub:   { fontSize:'14px', color:'#64748b', marginBottom:'24px' },
  btn:   { backgroundColor:'#3b82f6', color:'#fff', border:'none', borderRadius:'8px', padding:'10px 22px', fontSize:'14px', fontWeight:'500', cursor:'pointer' },
}

export default NotFound