// src/modules/categories/category.controller.js
import { z } from 'zod'
import {
  getCategoriesService,
  createCategoryService,
  deleteCategoryService,
} from './category.service.js'

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
})

export const getCategories = async (req, res) => {
  try {
    const categories = await getCategoriesService(req.org.id)
    res.json({ success: true, data: categories })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const createCategory = async (req, res) => {
  try {
    const result = categorySchema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: result.error.errors.map(e => ({ field: e.path[0], message: e.message })),
      })
    }
    const category = await createCategoryService(req.org.id, result.data)
    res.status(201).json({ success: true, data: category })
  } catch (err) {
    // Unique constraint violation = duplicate name
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'A category with that name already exists.' })
    }
    res.status(err.statusCode || 500).json({ success: false, message: err.message })
  }
}

export const deleteCategory = async (req, res) => {
  try {
    await deleteCategoryService(req.org.id, req.params.id)
    res.json({ success: true, message: 'Category deleted.' })
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message })
  }
}