import prisma from '../../config/db.js'

export const getProductsService = async (orgId, { page = 1, limit = 20, search, categoryId }) => {
  const skip = (page - 1) * limit
  const where = {
    orgId,
    deletedAt: null,
    ...(categoryId && { categoryId }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { sku:  { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category:    { select: { id: true, name: true } },
        stockLevels: { include: { warehouse: { select: { id: true, name: true } } } },
      },
    }),
  ])

  const productsWithTotal = products.map(p => ({
    ...p,
    totalStock: p.stockLevels.reduce((sum, sl) => sum + sl.quantity, 0),
  }))

  return {
    products:   productsWithTotal,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  }
}

export const getProductByIdService = async (orgId, productId) => {
  const product = await prisma.product.findFirst({
    where:   { id: productId, orgId, deletedAt: null },
    include: {
      category:    true,
      stockLevels: { include: { warehouse: true } },
    },
  })
  if (!product) throw Object.assign(new Error('Product not found.'), { statusCode: 404 })
  return { ...product, totalStock: product.stockLevels.reduce((sum, sl) => sum + sl.quantity, 0) }
}

export const createProductService = async (orgId, data) => {
  const { name, sku, description, unitCost, salePrice, reorderAt, imageUrl, categoryId, initialStock = [] } = data

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name,
        sku:        sku.toUpperCase(),
        description,
        unitCost:   parseFloat(unitCost  || 0),
        salePrice:  parseFloat(salePrice || 0),
        reorderAt:  parseInt(reorderAt   || 10),
        imageUrl:   imageUrl || null,
        categoryId: categoryId || null,
        orgId,
      },
    })

    if (initialStock.length > 0) {
      await tx.stockLevel.createMany({
        data: initialStock.map(({ warehouseId, quantity }) => ({
          productId:   product.id,
          warehouseId,
          quantity:    parseInt(quantity) || 0,
        })),
      })
    }

    return tx.product.findUnique({
      where:   { id: product.id },
      include: {
        category:    { select: { id: true, name: true } },
        stockLevels: { include: { warehouse: { select: { id: true, name: true } } } },
      },
    })
  })
}

export const updateProductService = async (orgId, productId, data) => {
  const existing = await prisma.product.findFirst({ where: { id: productId, orgId, deletedAt: null } })
  if (!existing) throw Object.assign(new Error('Product not found.'), { statusCode: 404 })

  const { name, sku, description, unitCost, salePrice, reorderAt, imageUrl, categoryId } = data

  return prisma.product.update({
    where: { id: productId },
    data: {
      ...(name        !== undefined && { name }),
      ...(sku         !== undefined && { sku: sku.toUpperCase() }),
      ...(description !== undefined && { description }),
      ...(unitCost    !== undefined && { unitCost:   parseFloat(unitCost) }),
      ...(salePrice   !== undefined && { salePrice:  parseFloat(salePrice) }),
      ...(reorderAt   !== undefined && { reorderAt:  parseInt(reorderAt) }),
      ...(imageUrl    !== undefined && { imageUrl }),
      ...(categoryId  !== undefined && { categoryId: categoryId || null }),
    },
    include: {
      category:    { select: { id: true, name: true } },
      stockLevels: { include: { warehouse: { select: { id: true, name: true } } } },
    },
  })
}

// ── NEW: Update stock levels for a product ────────────────────────────────────
// stockLevels = [{ warehouseId, quantity }]
// Uses upsert — creates the row if it doesn't exist, updates if it does
export const updateStockService = async (orgId, productId, stockLevels) => {
  // Verify product belongs to this org
  const product = await prisma.product.findFirst({
    where: { id: productId, orgId, deletedAt: null },
  })
  if (!product) throw Object.assign(new Error('Product not found.'), { statusCode: 404 })

  // Upsert each stock level in a transaction
  await prisma.$transaction(
    stockLevels.map(({ warehouseId, quantity }) =>
      prisma.stockLevel.upsert({
        where:  { productId_warehouseId: { productId, warehouseId } },
        create: { productId, warehouseId, quantity: parseInt(quantity) || 0 },
        update: { quantity: parseInt(quantity) || 0 },
      })
    )
  )

  // Return updated product with new stock levels
  return prisma.product.findUnique({
    where:   { id: productId },
    include: {
      category:    { select: { id: true, name: true } },
      stockLevels: { include: { warehouse: { select: { id: true, name: true } } } },
    },
  })
}

export const deleteProductService = async (orgId, productId) => {
  const existing = await prisma.product.findFirst({ where: { id: productId, orgId, deletedAt: null } })
  if (!existing) throw Object.assign(new Error('Product not found.'), { statusCode: 404 })
  return prisma.product.update({ where: { id: productId }, data: { deletedAt: new Date() } })
}