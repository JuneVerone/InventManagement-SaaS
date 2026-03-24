// src/modules/products/product.service.js
//
// This is the most important service in Phase 2.
// Study these patterns — they repeat in every feature you build:
//
//   1. EVERY query has orgId in where → multi-tenancy
//   2. Soft delete — products get a deletedAt timestamp, never truly removed
//   3. $transaction — create product + stock levels atomically
//   4. Pagination — offset-based with page + limit
//   5. Search + filter — combined in one query with optional Prisma conditions

import prisma from '../../config/db.js'

// ── GET ALL PRODUCTS ──────────────────────────────────────────────────────────
// Supports: pagination, search by name/sku, filter by category
export const getProductsService = async (orgId, { page = 1, limit = 20, search, categoryId }) => {
  const skip = (page - 1) * limit

  // Build the where clause dynamically
  // Only add conditions if the parameter was actually provided
  const where = {
    orgId,
    deletedAt: null,                      // exclude soft-deleted products
    ...(categoryId && { categoryId }),    // filter by category if provided
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { sku:  { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  // Run count + data queries in parallel for performance
  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
        stockLevels: {
          include: { warehouse: { select: { id: true, name: true } } },
        },
      },
    }),
  ])

  // Add a computed totalStock field to each product
  // totalStock = sum of quantity across all warehouses
  const productsWithTotal = products.map(p => ({
    ...p,
    totalStock: p.stockLevels.reduce((sum, sl) => sum + sl.quantity, 0),
  }))

  return {
    products: productsWithTotal,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// ── GET SINGLE PRODUCT ────────────────────────────────────────────────────────
export const getProductByIdService = async (orgId, productId) => {
  const product = await prisma.product.findFirst({
    where: { id: productId, orgId, deletedAt: null },
    include: {
      category: true,
      stockLevels: {
        include: { warehouse: true },
      },
    },
  })

  if (!product) {
    throw Object.assign(new Error('Product not found.'), { statusCode: 404 })
  }

  return {
    ...product,
    totalStock: product.stockLevels.reduce((sum, sl) => sum + sl.quantity, 0),
  }
}

// ── CREATE PRODUCT ────────────────────────────────────────────────────────────
// Creates the product + initial stock levels in ONE atomic transaction.
// If anything fails, everything rolls back — no orphan products.
export const createProductService = async (orgId, data) => {
  const {
    name, sku, description, unitCost, salePrice,
    reorderAt, imageUrl, categoryId,
    initialStock = [],  // [{ warehouseId, quantity }]
  } = data

  return prisma.$transaction(async (tx) => {
    // 1. Create the product
    const product = await tx.product.create({
      data: {
        name, sku: sku.toUpperCase(), description,
        unitCost:  parseFloat(unitCost  || 0),
        salePrice: parseFloat(salePrice || 0),
        reorderAt: parseInt(reorderAt  || 10),
        imageUrl:  imageUrl || null,
        categoryId: categoryId || null,
        orgId,
      },
    })

    // 2. Create a stock level for each warehouse in initialStock
    // If no initial stock provided, product starts with 0 stock
    if (initialStock.length > 0) {
      await tx.stockLevel.createMany({
        data: initialStock.map(({ warehouseId, quantity }) => ({
          productId:   product.id,
          warehouseId,
          quantity:    parseInt(quantity) || 0,
        })),
      })
    }

    // 3. Return the product with stock levels included
    return tx.product.findUnique({
      where: { id: product.id },
      include: {
        category:    { select: { id: true, name: true } },
        stockLevels: { include: { warehouse: { select: { id: true, name: true } } } },
      },
    })
  })
}

// ── UPDATE PRODUCT ────────────────────────────────────────────────────────────
export const updateProductService = async (orgId, productId, data) => {
  // First verify it belongs to this org and isn't deleted
  const existing = await prisma.product.findFirst({
    where: { id: productId, orgId, deletedAt: null },
  })

  if (!existing) {
    throw Object.assign(new Error('Product not found.'), { statusCode: 404 })
  }

  const {
    name, sku, description, unitCost,
    salePrice, reorderAt, imageUrl, categoryId,
  } = data

  return prisma.product.update({
    where: { id: productId },
    data: {
      ...(name        !== undefined && { name }),
      ...(sku         !== undefined && { sku: sku.toUpperCase() }),
      ...(description !== undefined && { description }),
      ...(unitCost    !== undefined && { unitCost:  parseFloat(unitCost) }),
      ...(salePrice   !== undefined && { salePrice: parseFloat(salePrice) }),
      ...(reorderAt   !== undefined && { reorderAt: parseInt(reorderAt) }),
      ...(imageUrl    !== undefined && { imageUrl }),
      ...(categoryId  !== undefined && { categoryId: categoryId || null }),
    },
    include: {
      category:    { select: { id: true, name: true } },
      stockLevels: { include: { warehouse: { select: { id: true, name: true } } } },
    },
  })
}

// ── SOFT DELETE PRODUCT ───────────────────────────────────────────────────────
// Sets deletedAt timestamp — product is hidden from all queries but stays in DB.
// WHY SOFT DELETE?
//   Hard delete breaks historical records — you'd lose purchase orders,
//   stock movement history, and reports that reference the product.
//   Soft delete keeps the data intact while hiding it from active views.
export const deleteProductService = async (orgId, productId) => {
  const existing = await prisma.product.findFirst({
    where: { id: productId, orgId, deletedAt: null },
  })

  if (!existing) {
    throw Object.assign(new Error('Product not found.'), { statusCode: 404 })
  }

  return prisma.product.update({
    where: { id: productId },
    data:  { deletedAt: new Date() },
  })
}