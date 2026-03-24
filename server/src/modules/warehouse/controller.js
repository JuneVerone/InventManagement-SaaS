// src/modules/warehouses/warehouse.controller.js
import { z } from 'zod'
import {
  getWarehousesService,
  createWarehouseService,
  deleteWarehouseService,
} from './warehouse.service.js'

const warehouseSchema = z.object({
  name:     z.string().min(1, 'Name is required').max(100),
  location: z.string().max(200).optional(),
})

export const getWarehouses = async (req, res) => {
  try {
    const warehouses = await getWarehousesService(req.org.id)
    res.json({ success: true, data: warehouses })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const createWarehouse = async (req, res) => {
  try {
    const result = warehouseSchema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: result.error.errors.map(e => ({ field: e.path[0], message: e.message })),
      })
    }
    const warehouse = await createWarehouseService(req.org.id, result.data)
    res.status(201).json({ success: true, data: warehouse })
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'A warehouse with that name already exists.' })
    }
    res.status(err.statusCode || 500).json({ success: false, message: err.message })
  }
}

export const deleteWarehouse = async (req, res) => {
  try {
    await deleteWarehouseService(req.org.id, req.params.id)
    res.json({ success: true, message: 'Warehouse deleted.' })
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message })
  }
}