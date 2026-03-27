import { Router }        from 'express'
import { authenticate }  from '../../middleware/auth.js'
import { resolveTenant } from '../../middleware/tenant.js'
import { requireMinRole } from '../../middleware/rbac.js'
import { getCategories, createCategory, deleteCategory } from './category.controller.js'

const router = Router()
router.use(authenticate, resolveTenant)

router.get   ('/',    requireMinRole('VIEWER'), getCategories)
router.post  ('/',    requireMinRole('STAFF'),  createCategory)
router.delete('/:id', requireMinRole('ADMIN'),  deleteCategory)

export default router