// src/modules/warehouses/warehouse.service.js
import prisma from '../../config/db.js'

export const getWarehousesService = async (orgId) => {
  return prisma.warehouse.findMany({
    where:   { orgId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { stockLevels: true } } },
  })
}

export const createWarehouseService = async (orgId, { name, location }) => {
  return prisma.warehouse.create({
    data: { name: name.trim(), location: location?.trim() || null, orgId },
  })
}

export const deleteWarehouseService = async (orgId, warehouseId) => {
  const warehouse = await prisma.warehouse.findFirst({
    where: { id: warehouseId, orgId },
    include: { _count: { select: { stockLevels: true } } },
  })

  if (!warehouse) {
    throw Object.assign(new Error('Warehouse not found.'), { statusCode: 404 })
  }

  if (warehouse._count.stockLevels > 0) {
    throw Object.assign(
      new Error('Cannot delete a warehouse that has stock. Move the stock first.'),
      { statusCode: 409 }
    )
  }

  return prisma.warehouse.delete({ where: { id: warehouseId } })
}

