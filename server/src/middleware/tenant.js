import prisma from '../config/db.js'

export const resolveTenant = async (req, res, next) => {
  try {
    const org = await prisma.organization.findUnique({
      where:  { id: req.user.orgId },
      select: { id: true, name: true, slug: true, plan: true },
    })
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found.' })
    req.org = org
    next()
  } catch {
    res.status(500).json({ success: false, message: 'Failed to resolve organization.' })
  }
}