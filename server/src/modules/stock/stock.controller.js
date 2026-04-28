import { z }                                        from 'zod'
import { adjustStockService, getStockHistoryService } from './stock.service.js'

const adjustSchema = z.object({
  productId:   z.string().min(1),
  warehouseId: z.string().min(1),
  type:        z.enum(['IN', 'OUT', 'ADJ']),
  quantity:    z.coerce.number().int().positive('Quantity must be a positive number'),
  note:        z.string().max(500).optional(),
})

// POST /stock/adjust
export const adjustStock = async (req, res) => {
  try {
    const result = adjustSchema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors:  result.error.errors.map(e => ({ field: e.path[0], message: e.message })),
      })
    }
    const movement = await adjustStockService(req.org.id, req.user.userId, result.data)
    res.status(201).json({ success: true, data: movement })
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message })
  }
}

// GET /stock/history/:productId
export const getStockHistory = async (req, res) => {
  try {
    const history = await getStockHistoryService(req.org.id, req.params.productId)
    res.json({ success: true, data: history })
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message })
  }
}