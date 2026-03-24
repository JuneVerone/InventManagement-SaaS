import jwt from 'jsonwebtoken'

export const generateAccessToken  = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' })

export const generateRefreshToken = (payload) =>
  jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' })

export const verifyAccessToken    = (token) => jwt.verify(token, process.env.JWT_SECRET)
export const verifyRefreshToken   = (token) => jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)

export const setRefreshTokenCookie = (res, token) =>
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000,
  })

export const clearRefreshTokenCookie = (res) =>
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  })