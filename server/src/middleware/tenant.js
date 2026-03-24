// src/middleware/tenant.js
//
// Multi-tenancy middleware — runs after `authenticate` on every protected route.
// Reads orgId from the verified JWT (already on req.user) and attaches the
// full Organization record to req.org.
//
// WHY THIS MIDDLEWARE EXISTS:
//   The JWT carries orgId as a plain string.
//   This middleware fetches the actual org record so controllers can:
//     1. Use req.org.id  in every Prisma where clause
//     2. Check req.org.plan to gate features (Starter vs Pro)
//     3. Be confident the org actually exists and is active
//
// USAGE IN ROUTES:
//   router.get('/products', authenticate, resolveTenant, getProducts)
//                                         ^^^^^^^^^^^^^
//                                         runs second, after JWT is verified
//
// THE GOLDEN RULE OF MULTI-TENANCY:
//   Every single Prisma query that touches org data MUST include:
//     where: { orgId: req.org.id, ...otherConditions }
//   Never skip this. One missing orgId = data leak between organisations.

import prisma from '../config/db.js'

export const resolveTenant = async (req, res, next) => {
  try {
    // req.user.orgId was set by the authenticate middleware
    const org = await prisma.organization.findUnique({
      where: { id: req.user.orgId },
      select: { id: true, name: true, slug: true, plan: true },
    })

    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found.',
      })
    }

    // Attach to request — all downstream controllers use req.org.id
    req.org = org
    next()

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to resolve organization.',
    })
  }
}