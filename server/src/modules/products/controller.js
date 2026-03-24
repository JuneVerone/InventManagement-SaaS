// src/modules/products/product.controller.js
import { z }    from 'zod'
import {
  getProductsService,
  getProductByIdService,
  createProductService,
  updateProductService,
  deleteProductService,
} from './product.service.js'

// ── Validation schemas ────────────────────────────────────────────────────────

const createProductSchema = z.object({
  name:         z.string().min(1, 'Name is required').max(200),
  sku:          z.string().min(1, 'SKU is required').max(50),
  description:  z.string().max(1000).optional(),
  unitCost:     z.coerce.number().min(0).optional(),
  salePrice:    z.coerce.number().min(0).optional(),
  reorderAt:    z.coerce.number().int().min(0).optional(),
  imageUrl:     z.string().url().optional().or(z.literal('')),
  categoryId:   z.string().optional(),
  // Array of { warehouseId, quantity } for initial stock
  initialStock: z.array(z.object({
    warehouseId: z.string().min(1),
    quantity:    z.coerce.number().int().min(0),
  })).optional().default([]),
})

const updateProductSchema = createProductSchema.partial().omit({ initialStock: true })

// Helper: format Zod errors consistently
const formatErrors = (zodError) =>
  zodError.errors.map(e => ({ field: e.path.join('.'), message: e.message }))

// ── Controllers ───────────────────────────────────────────────────────────────

// GET /products?page=1&limit=20&search=widget&categoryId=abc
export const getProducts = async (req, res) => {
  try {
    const { page, limit, search, categoryId } = req.query
    const result = await getProductsService(req.org.id, {
      page:       parseInt(page)  || 1,
      limit:      parseInt(limit) || 20,
      search:     search     || undefined,
      categoryId: categoryId || undefined,
    })
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /products/:id
export const getProduct = async (req, res) => {
  try {
    const product = await getProductByIdService(req.org.id, req.params.id)
    res.json({ success: true, data: product })
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message })
  }
}

// POST /products
export const createProduct = async (req, res) => {
  try {
    const result = createProductSchema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: formatErrors(result.error) })
    }
    const product = await createProductService(req.org.id, result.data)
    res.status(201).json({ success: true, data: product })
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'A product with that SKU already exists.' })
    }
    res.status(err.statusCode || 500).json({ success: false, message: err.message })
  }
}

// PATCH /products/:id
export const updateProduct = async (req, res) => {
  try {
    const result = updateProductSchema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: formatErrors(result.error) })
    }
    const product = await updateProductService(req.org.id, req.params.id, result.data)
    res.json({ success: true, data: product })
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'A product with that SKU already exists.' })
    }
    res.status(err.statusCode || 500).json({ success: false, message: err.message })
  }
}

// DELETE /products/:id  (soft delete)
export const deleteProduct = async (req, res) => {
  try {
    await deleteProductService(req.org.id, req.params.id)
    res.json({ success: true, message: 'Product deleted.' })
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message })
  }
}