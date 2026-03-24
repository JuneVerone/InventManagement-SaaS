import { z } from 'zod'
import { registerService, loginService, refreshTokenService, getMeService } from './auth.service.js'
import { setRefreshTokenCookie, clearRefreshTokenCookie, verifyRefreshToken } from '../../config/jwt.js'

const registerSchema = z.object({
  name:    z.string().min(2),
  email:   z.string().email(),
  password:z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  orgName: z.string().min(2),
})
const loginSchema = z.object({
  email:   z.string().email(),
  orgSlug: z.string().min(1),
  password:z.string().min(1),
})

export const register = async (req, res) => {
  try {
    const v = registerSchema.safeParse(req.body)
    if (!v.success) return res.status(400).json({ success: false, message: 'Validation failed.', errors: v.error.errors.map(e => ({ field: e.path[0], message: e.message })) })
    const result = await registerService(v.data)
    setRefreshTokenCookie(res, result.refreshToken)
    res.status(201).json({ success: true, data: { accessToken: result.accessToken, user: result.user, org: result.org, role: result.role } })
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message })
  }
}

export const login = async (req, res) => {
  try {
    const v = loginSchema.safeParse(req.body)
    if (!v.success) return res.status(400).json({ success: false, message: 'Validation failed.', errors: v.error.errors.map(e => ({ field: e.path[0], message: e.message })) })
    const result = await loginService(v.data)
    setRefreshTokenCookie(res, result.refreshToken)
    res.status(200).json({ success: true, data: { accessToken: result.accessToken, user: result.user, org: result.org, role: result.role } })
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message })
  }
}

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken
    if (!token) return res.status(401).json({ success: false, message: 'Refresh token not found.' })
    let decoded
    try { decoded = verifyRefreshToken(token) }
    catch { clearRefreshTokenCookie(res); return res.status(401).json({ success: false, message: 'Refresh token expired.' }) }
    const result = await refreshTokenService(decoded)
    res.json({ success: true, data: { accessToken: result.accessToken, user: result.user, org: result.org, role: result.role } })
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message })
  }
}

export const logout = (req, res) => {
  clearRefreshTokenCookie(res)
  res.json({ success: true, message: 'Logged out.' })
}

export const getMe = async (req, res) => {
  try {
    const result = await getMeService(req.user.userId, req.user.orgId)
    res.json({ success: true, data: result })
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message })
  }
}