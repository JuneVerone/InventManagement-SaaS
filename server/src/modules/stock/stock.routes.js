import { Router }         from 'express'
import { authenticate }   from '../../middleware/auth.js'
import { resolveTenant }  from '../../middleware/tenant.js'
import { requireMinRole } from '../../middleware/rbac.js'
import { adjustStock, getStockHistory } from './stock.controller.js'

const router = Router()
router.use(authenticate, resolveTenant)

// POST /stock/adjust — add, remove or adjust stock
router.post('/adjust', requireMinRole('STAFF'), adjustStock)

// GET /stock/history/:productId — full movement log for a product
router.get('/history/:productId', requireMinRole('VIEWER'), getStockHistory)

export default router