import { Router }        from 'express'
import { authenticate }  from '../../middleware/auth.js'
import { resolveTenant } from '../../middleware/tenant.js'
import { requireMinRole } from '../../middleware/rbac.js'
import { getWarehouses, createWarehouse, deleteWarehouse } from './warehouse.controller.js'

const router = Router()
router.use(authenticate, resolveTenant)

router.get   ('/',    requireMinRole('VIEWER'), getWarehouses)
router.post  ('/',    requireMinRole('ADMIN'),  createWarehouse)
router.delete('/:id', requireMinRole('ADMIN'),  deleteWarehouse)

export default router