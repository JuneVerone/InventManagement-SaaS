import bcrypt from 'bcryptjs'
import prisma from '../../config/db.js'
import { generateAccessToken, generateRefreshToken } from '../../config/jwt.js'

export const registerService = async ({ name, email, password, orgName }) => {
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) throw Object.assign(new Error('Email already in use.'), { statusCode: 409 })

  const hashedPassword = await bcrypt.hash(password, 12)
  const slug = `${orgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Math.random().toString(36).slice(2, 6)}`

  const { user, org, membership } = await prisma.$transaction(async (tx) => {
    const org        = await tx.organization.create({ data: { name: orgName, slug } })
    const user       = await tx.user.create({ data: { name, email: email.toLowerCase(), password: hashedPassword } })
    const membership = await tx.orgMember.create({ data: { userId: user.id, orgId: org.id, role: 'ADMIN' } })
    return { user, org, membership }
  })

  const payload = { userId: user.id, orgId: org.id, role: membership.role }
  return {
    accessToken:  generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    user: { id: user.id, name: user.name, email: user.email },
    org:  { id: org.id, name: org.name, slug: org.slug, plan: org.plan },
    role: membership.role,
  }
}

export const loginService = async ({ email, orgSlug, password }) => {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user) throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401 })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401 })

  const membership = await prisma.orgMember.findFirst({
    where: { userId: user.id, org: { slug: orgSlug } },
    include: { org: true },
  })
  if (!membership) throw Object.assign(new Error('You are not a member of this organization.'), { statusCode: 403 })

  const payload = { userId: user.id, orgId: membership.orgId, role: membership.role }
  return {
    accessToken:  generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    user: { id: user.id, name: user.name, email: user.email },
    org:  { id: membership.org.id, name: membership.org.name, slug: membership.org.slug, plan: membership.org.plan },
    role: membership.role,
  }
}

export const refreshTokenService = async (decoded) => {
  const membership = await prisma.orgMember.findFirst({
    where: { userId: decoded.userId, orgId: decoded.orgId },
    include: { user: { select: { id: true, name: true, email: true } }, org: true },
  })
  if (!membership) throw Object.assign(new Error('Session no longer valid.'), { statusCode: 401 })

  const accessToken = generateAccessToken({ userId: membership.userId, orgId: membership.orgId, role: membership.role })
  return {
    accessToken,
    user: membership.user,
    org:  { id: membership.org.id, name: membership.org.name, slug: membership.org.slug, plan: membership.org.plan },
    role: membership.role,
  }
}

export const getMeService = async (userId, orgId) => {
  const membership = await prisma.orgMember.findFirst({
    where: { userId, orgId },
    include: { user: { select: { id: true, name: true, email: true, createdAt: true } }, org: true },
  })
  if (!membership) throw Object.assign(new Error('User not found.'), { statusCode: 404 })
  return {
    user: membership.user,
    org:  { id: membership.org.id, name: membership.org.name, slug: membership.org.slug, plan: membership.org.plan },
    role: membership.role,
  }
}
