// src/modules/categories/category.service.js
//
// Categories are simple — just a name scoped to an org.
// Notice EVERY query has orgId in the where clause.
// That single constraint is what makes multi-tenancy work.

import prisma from '../../config/db.js'

// Get all categories for the current org
export const getCategoriesService = async (orgId) => {
  return prisma.category.findMany({
    where:   { orgId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
    // _count tells us how many products use each category
  })
}

// Create a new category
export const createCategoryService = async (orgId, { name }) => {
  return prisma.category.create({
    data: { name: name.trim(), orgId },
  })
}

// Delete a category (only if it has no products)
export const deleteCategoryService = async (orgId, categoryId) => {
  // First confirm it belongs to this org
  const category = await prisma.category.findFirst({
    where: { id: categoryId, orgId },
    include: { _count: { select: { products: true } } },
  })

  if (!category) {
    throw Object.assign(new Error('Category not found.'), { statusCode: 404 })
  }

  if (category._count.products > 0) {
    throw Object.assign(
      new Error(`Cannot delete — ${category._count.products} product(s) use this category.`),
      { statusCode: 409 }
    )
  }

  return prisma.category.delete({ where: { id: categoryId } })
}