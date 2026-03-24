// src/modules/products/product.routes.js
//
// REST conventions for products:
//   GET    /products          list all (paginated, filterable)
//   POST   /products          create
//   GET    /products/:id      get one
//   PATCH  /products/:id      update (partial — only send changed fields)
//   DELETE /products/:id      soft delete

import { Router }         from 'express'
import { authenticate }   from '../../middleware/auth.js'
import { resolveTenant }  from '../../middleware/tenant.js'
import { requireMinRole } from '../../middleware/rbac.js'
import {
  getProducts, getProduct,
  createProduct, updateProduct, deleteProduct,
} from './product.controller.js'

const router = Router()

// All product routes require authentication + tenant resolution
router.use(authenticate, resolveTenant)

router.get   ('/',    requireMinRole('VIEWER'), getProducts)
router.post  ('/',    requireMinRole('STAFF'),  createProduct)
router.get   ('/:id', requireMinRole('VIEWER'), getProduct)
router.patch ('/:id', requireMinRole('STAFF'),  updateProduct)
router.delete('/:id', requireMinRole('ADMIN'),  deleteProduct)

export default router