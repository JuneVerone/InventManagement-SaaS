import { Router }     from 'express'
import { authenticate } from '../../middleware/auth.js'
import { register, login, refreshToken, logout, getMe } from './auth.controller.js'

const router = Router()
router.post('/register', register)
router.post('/login',    login)
router.post('/refresh',  refreshToken)
router.post('/logout',   logout)
router.get ('/me',       authenticate, getMe)
export default router
