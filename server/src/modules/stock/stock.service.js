// src/modules/stock/stock.service.js
//
// Stock adjustment = update the quantity AND log the movement in one transaction.
// This is the key pattern:
//   NEVER update stock without logging the movement.
//   NEVER log a movement without updating the stock.
//   Both happen atomically in a $transaction — either both succeed or neither does.

import prisma       from '../../config/db.js'
import { emitToOrg } from '../../config/socket.js'

// ── ADJUST STOCK ─────────────────────────────────────────────────────────────
// quantity: positive = adding stock, negative = removing stock
// type: 'IN' | 'OUT' | 'ADJ'
export const adjustStockService = async (orgId, userId, {
  productId, warehouseId, type, quantity, note
}) => {
  // Verify product belongs to this org
  const product = await prisma.product.findFirst({
    where: { id: productId, orgId, deletedAt: null },
  })
  if (!product) throw Object.assign(new Error('Product not found.'), { statusCode: 404 })

  // Verify warehouse belongs to this org
  const warehouse = await prisma.warehouse.findFirst({
    where: { id: warehouseId, orgId },
  })
  if (!warehouse) throw Object.assign(new Error('Warehouse not found.'), { statusCode: 404 })

  // Determine how much to change the quantity
  // IN and ADJ use positive quantity, OUT uses negative
  const delta = type === 'OUT' ? -Math.abs(quantity) : Math.abs(quantity)

  const result = await prisma.$transaction(async (tx) => {
    // 1. Upsert stock level — create if first time, update if exists
    const stockLevel = await tx.stockLevel.upsert({
      where:  { productId_warehouseId: { productId, warehouseId } },
      create: { productId, warehouseId, quantity: Math.max(0, delta) },
      update: { quantity: { increment: delta } },
    })

    // Prevent negative stock
    if (stockLevel.quantity < 0) {
      throw Object.assign(
        new Error(`Cannot remove ${Math.abs(quantity)} units — only ${stockLevel.quantity + Math.abs(delta)} in stock.`),
        { statusCode: 409 }
      )
    }

    // 2. Log the movement
    const movement = await tx.stockMovement.create({
      data: { productId, warehouseId, userId, type, quantity: delta, note: note || null },
      include: {
        product:   { select: { id: true, name: true, sku: true, reorderAt: true } },
        warehouse: { select: { id: true, name: true } },
        user:      { select: { id: true, name: true } },
      },
    })

    return { stockLevel, movement }
  })

  // 3. Check if stock is now below reorder threshold — fire alert if so
  const { stockLevel, movement } = result
  if (stockLevel.quantity <= product.reorderAt) {
    await fireAlert(orgId, product, stockLevel.quantity, warehouseId)
  }

  return movement
}

// ── FIRE LOW STOCK ALERT ──────────────────────────────────────────────────────
const fireAlert = async (orgId, product, currentStock, warehouseId) => {
  const message = `Low stock: "${product.name}" has only ${currentStock} unit${currentStock !== 1 ? 's' : ''} left (reorder at ${product.reorderAt}).`

  // Save alert to DB
  const alert = await prisma.alert.create({
    data: { orgId, productId: product.id, message },
  })

  // Push real-time event to all users in this org's Socket.io room
  emitToOrg(orgId, 'stock:low', {
    alertId:      alert.id,
    productId:    product.id,
    productName:  product.name,
    currentStock,
    reorderAt:    product.reorderAt,
    message,
  })

  return alert
}

// ── GET STOCK HISTORY ─────────────────────────────────────────────────────────
// Returns all movements for a product, newest first
export const getStockHistoryService = async (orgId, productId) => {
  // Verify product belongs to this org
  const product = await prisma.product.findFirst({
    where: { id: productId, orgId, deletedAt: null },
  })
  if (!product) throw Object.assign(new Error('Product not found.'), { statusCode: 404 })

  return prisma.stockMovement.findMany({
    where:   { productId },
    orderBy: { createdAt: 'desc' },
    include: {
      warehouse: { select: { id: true, name: true } },
      user:      { select: { id: true, name: true } },
    },
  })
}