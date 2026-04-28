// src/jobs/stockAlert.job.js
//
// A cron job that runs every 5 minutes, checks ALL products across ALL orgs,
// and fires alerts for any product whose total stock is at or below its reorderAt threshold.
//
// WHY A CRON JOB IN ADDITION TO REAL-TIME CHECKS?
//   The real-time check in stock.service.js fires when stock is ADJUSTED manually.
//   But stock can also go low due to other reasons (bulk imports, data corrections).
//   The cron job is the safety net — it catches anything the real-time check missed.
//
// node-cron syntax: '*/5 * * * *'
//   */5 = every 5 minutes
//   *   = any hour, any day of month, any month, any day of week

import cron         from 'node-cron'
import prisma       from '../config/db.js'
import { emitToOrg } from '../config/socket.js'

export const startStockAlertJob = () => {
  cron.schedule('*/5 * * * *', async () => {
    console.log('⏰ Running low stock check...')

    try {
      // Find all active products that have at least one stock level
      const products = await prisma.product.findMany({
        where:   { deletedAt: null },
        include: { stockLevels: true },
      })

      for (const product of products) {
        const totalStock = product.stockLevels.reduce((sum, sl) => sum + sl.quantity, 0)

        if (totalStock <= product.reorderAt) {
          // Check if there's already an unresolved alert for this product
          const existingAlert = await prisma.alert.findFirst({
            where: { productId: product.id, resolvedAt: null },
          })

          // Don't spam — only create a new alert if there isn't one already
          if (!existingAlert) {
            const message = `Low stock: "${product.name}" has ${totalStock} unit${totalStock !== 1 ? 's' : ''} left (reorder at ${product.reorderAt}).`

            const alert = await prisma.alert.create({
              data: { orgId: product.orgId, productId: product.id, message },
            })

            // Push to all connected users in this org
            emitToOrg(product.orgId, 'stock:low', {
              alertId:     alert.id,
              productId:   product.id,
              productName: product.name,
              currentStock: totalStock,
              reorderAt:   product.reorderAt,
              message,
            })

            console.log(`🔔 Low stock alert fired for: ${product.name} (${totalStock} units)`)
          }
        }
      }
    } catch (error) {
      console.error('❌ Stock alert job error:', error)
    }
  })

  console.log('✅ Stock alert cron job started (runs every 5 minutes)')
}