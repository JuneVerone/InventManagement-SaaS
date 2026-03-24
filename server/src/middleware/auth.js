import { verifyAccessToken } from '../config/jwt.js'

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token required.' })
    }
    const token   = authHeader.split(' ')[1]
    const decoded = verifyAccessToken(token)
    req.user = { userId: decoded.userId, orgId: decoded.orgId, role: decoded.role }
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.', code: 'TOKEN_EXPIRED' })
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' })
  }
}