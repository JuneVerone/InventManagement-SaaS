const ROLE_HIERARCHY = { VIEWER: 0, STAFF: 1, ADMIN: 2 }

export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated.' })
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: `Required role: ${allowedRoles.join(' or ')}` })
  }
  next()
}

export const requireMinRole = (minRole) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated.' })
  const userLevel = ROLE_HIERARCHY[req.user.role] ?? -1
  const minLevel  = ROLE_HIERARCHY[minRole] ?? 0
  if (userLevel < minLevel) {
    return res.status(403).json({ success: false, message: `Minimum required role: ${minRole}` })
  }
  next()
}

export const requireAnyRole = requireRole('VIEWER', 'STAFF', 'ADMIN')