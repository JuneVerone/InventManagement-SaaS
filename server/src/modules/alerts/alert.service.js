import prisma from '../../config/db.js'

// Get all unresolved alerts for the org (newest first)
export const getAlertsService = async (orgId) => {
  return prisma.alert.findMany({
    where:   { orgId, resolvedAt: null },
    orderBy: { createdAt: 'desc' },
    take:    50,
  })
}

// Mark an alert as resolved
export const resolveAlertService = async (orgId, alertId) => {
  const alert = await prisma.alert.findFirst({
    where: { id: alertId, orgId },
  })
  if (!alert) throw Object.assign(new Error('Alert not found.'), { statusCode: 404 })

  return prisma.alert.update({
    where: { id: alertId },
    data:  { resolvedAt: new Date() },
  })
}

// Resolve all alerts for the org
export const resolveAllAlertsService = async (orgId) => {
  return prisma.alert.updateMany({
    where: { orgId, resolvedAt: null },
    data:  { resolvedAt: new Date() },
  })
}