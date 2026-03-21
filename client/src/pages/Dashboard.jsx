// src/pages/Dashboard.jsx
//
// Placeholder dashboard — proves auth is working end to end.
// If you can see this page, login/register succeeded.
// The real dashboard gets built in Phase 5 (Analytics & Reports).
//
// useAuth() reads user, org, role from the Zustand store.
// No extra API call needed — the data is already in memory from login.

import { useAuth } from '../hooks/useAuth'

const Dashboard = () => {
  const { user, org, role, logout, isAdmin, isAtLeastStaff } = useAuth()

  return (
    <div style={s.page}>

      {/* ── Navigation bar ────────────────────────────────────────────────── */}
      <nav style={s.nav}>
        <div style={s.navLeft}>
          <div style={s.navLogo}>IS</div>
          <span style={s.navTitle}>Inventory SaaS</span>
          {org && <span style={s.orgPill}>{org.name}</span>}
        </div>
        <div style={s.navRight}>
          {user && <span style={s.userName}>{user.name}</span>}
          <span style={{
            ...s.rolePill,
            backgroundColor: role === 'ADMIN' ? '#dbeafe' : role === 'STAFF' ? '#dcfce7' : '#f1f5f9',
            color:           role === 'ADMIN' ? '#1e40af' : role === 'STAFF' ? '#15803d' : '#475569',
          }}>
            {role}
          </span>
          <button onClick={logout} style={s.logoutBtn}>Sign out</button>
        </div>
      </nav>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main style={s.main}>

        {/* Success banner */}
        <div style={s.successBanner}>
          <div style={s.successIcon}>✓</div>
          <div>
            <div style={s.successTitle}>Phase 1 complete — authentication working!</div>
            <div style={s.successSub}>
              Logged in as <strong>{user?.name}</strong> · Role: <strong>{role}</strong> · Org: <strong>{org?.name}</strong>
            </div>
          </div>
        </div>

        {/* Phase 1 checklist */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>What was built in Phase 1</h2>
          <div style={s.list}>
            {[
              'PostgreSQL schema — User, Organization, OrgMember (multi-tenancy)',
              'bcrypt password hashing — passwords never stored as plain text',
              'JWT access token (15 min) + refresh token (7 days)',
              'Refresh token in httpOnly cookie — JS cannot read it (XSS safe)',
              'authenticate middleware — verifies JWT on every protected route',
              'RBAC middleware — requireRole("ADMIN"), requireMinRole("STAFF")',
              'Prisma $transaction — creates user + org atomically on register',
              'Axios interceptor — silently refreshes expired access tokens',
              'Zustand store — holds auth state in memory, not localStorage',
              'ProtectedRoute — blocks unauthenticated and wrong-role access',
              'Session restore — refresh token cookie restores login on page refresh',
              'Login + Register pages — controlled forms with validation',
            ].map((item, i) => (
              <div key={i} style={s.listItem}>
                <span style={s.tick}>✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Permission demo */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Your permissions</h2>
          <div style={s.permGrid}>
            <Perm label="Authenticated"    granted={true} />
            <Perm label="At least VIEWER"  granted={true} />
            <Perm label="At least STAFF"   granted={isAtLeastStaff} />
            <Perm label="ADMIN"            granted={isAdmin} />
          </div>
        </div>

        {/* Next phase card */}
        <div style={{ ...s.card, borderLeft: '3px solid #3b82f6', borderRadius: '0 12px 12px 0' }}>
          <h2 style={s.cardTitle}>Next → Phase 2: Multi-tenancy + Product catalog</h2>
          <p style={s.nextText}>
            Every database query will be scoped with{' '}
            <code style={s.code}>{'where: { orgId: req.org.id }'}</code>{' '}
            — this one line is what keeps each organization's data completely isolated.
            Then we build full product CRUD: create, list, update, soft-delete.
          </p>
        </div>

      </main>
    </div>
  )
}

const Perm = ({ label, granted }) => (
  <div style={{
    display:'flex', alignItems:'center', gap:'8px',
    fontSize:'13px',
    color: granted ? '#15803d' : '#94a3b8',
  }}>
    <span style={{
      width:'18px', height:'18px', borderRadius:'50%', flexShrink:0,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:'10px', fontWeight:'700',
      backgroundColor: granted ? '#dcfce7' : '#f1f5f9',
      color:           granted ? '#15803d' : '#94a3b8',
    }}>
      {granted ? '✓' : '✗'}
    </span>
    {label}
  </div>
)

const s = {
  page: { minHeight:'100vh', backgroundColor:'#f8fafc' },
  nav: {
    backgroundColor:'#fff', borderBottom:'1px solid #e2e8f0',
    padding:'0 24px', height:'60px',
    display:'flex', alignItems:'center', justifyContent:'space-between',
  },
  navLeft:  { display:'flex', alignItems:'center', gap:'12px' },
  navLogo: {
    width:'32px', height:'32px', backgroundColor:'#3b82f6', color:'#fff',
    borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center',
    fontWeight:'700', fontSize:'12px',
  },
  navTitle: { fontWeight:'600', fontSize:'15px', color:'#0f172a' },
  orgPill:  {
    fontSize:'12px', color:'#64748b', backgroundColor:'#f1f5f9',
    padding:'3px 10px', borderRadius:'999px',
  },
  navRight: { display:'flex', alignItems:'center', gap:'12px' },
  userName: { fontSize:'14px', color:'#374151' },
  rolePill: { fontSize:'11px', fontWeight:'600', padding:'3px 10px', borderRadius:'999px' },
  logoutBtn:{
    fontSize:'13px', color:'#64748b', backgroundColor:'transparent',
    border:'1px solid #e2e8f0', borderRadius:'6px', padding:'6px 14px',
    cursor:'pointer',
  },
  main: {
    maxWidth:'700px', margin:'0 auto', padding:'40px 24px',
    display:'flex', flexDirection:'column', gap:'20px',
  },
  successBanner: {
    backgroundColor:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'12px',
    padding:'20px 24px', display:'flex', alignItems:'flex-start', gap:'16px',
  },
  successIcon: {
    width:'32px', height:'32px', backgroundColor:'#22c55e', color:'#fff',
    borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
    fontWeight:'700', fontSize:'16px', flexShrink:0,
  },
  successTitle: { fontWeight:'600', color:'#15803d', marginBottom:'4px' },
  successSub:   { fontSize:'13px', color:'#166534' },
  card:      { backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'12px', padding:'24px' },
  cardTitle: { fontSize:'15px', fontWeight:'600', color:'#0f172a', marginBottom:'16px' },
  list:      { display:'flex', flexDirection:'column', gap:'10px' },
  listItem:  { display:'flex', alignItems:'flex-start', gap:'10px', fontSize:'13px', color:'#374151' },
  tick:      { color:'#22c55e', fontWeight:'700', flexShrink:0 },
  permGrid:  { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' },
  nextText:  { fontSize:'13px', color:'#64748b', lineHeight:'1.7' },
  code: {
    fontFamily:'monospace', fontSize:'12px',
    backgroundColor:'#f1f5f9', padding:'2px 6px', borderRadius:'4px', color:'#0f172a',
  },
}

export default Dashboard