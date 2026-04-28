import { Router }         from 'express'
import { authenticate }   from '../../middleware/auth.js'
import { resolveTenant }  from '../../middleware/tenant.js'
import { requireMinRole } from '../../middleware/rbac.js'
import { getAlerts, resolveAlert, resolveAllAlerts } from './alert.controller.js'

const router = Router()
router.use(authenticate, resolveTenant)

router.get   ('/',           requireMinRole('VIEWER'), getAlerts)
router.patch ('/:id/resolve',requireMinRole('STAFF'),  resolveAlert)
router.patch ('/resolve-all',requireMinRole('STAFF'),  resolveAllAlerts)

export default router