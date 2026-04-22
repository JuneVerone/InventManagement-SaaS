import { Router }         from 'express'
import { authenticate }   from '../../middleware/auth.js'
import { resolveTenant }  from '../../middleware/tenant.js'
import { requireMinRole } from '../../middleware/rbac.js'
import {
  getProducts, getProduct,
  createProduct, updateProduct, updateStock, deleteProduct,
} from './product.controller.js'

const router = Router()
router.use(authenticate, resolveTenant)

router.get   ('/',           requireMinRole('VIEWER'), getProducts)
router.post  ('/',           requireMinRole('STAFF'),  createProduct)
router.get   ('/:id',        requireMinRole('VIEWER'), getProduct)
router.patch ('/:id',        requireMinRole('STAFF'),  updateProduct)
router.patch ('/:id/stock',  requireMinRole('STAFF'),  updateStock)
router.delete('/:id',        requireMinRole('ADMIN'),  deleteProduct)

export default router