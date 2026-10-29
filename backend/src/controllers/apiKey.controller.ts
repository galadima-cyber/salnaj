import { Response } from 'express'
import crypto from 'crypto'
import prisma from '../config/database'
import * as R from '../utils/response'
import { createNotification } from './notification.controller'

function generateKeyString(): string {
  return `salnaj_live_${crypto.randomBytes(24).toString('hex')}`
}

/**
 * Automatically creates an API key for a user if they don't have one
 */
export async function ensureUserApiKey(userId: string) {
  const existing = await prisma.apiKey.findFirst({
    where: { userId, status: 'ACTIVE' },
  })
  if (existing) return existing

  return await prisma.apiKey.create({
    data: {
      userId,
      key: generateKeyString(),
      label: 'Default Live Key',
      status: 'ACTIVE',
      monthlyLimit: 50000,
    },
  })
}

/**
 * GET /api/api-keys
 */
export async function getApiKey(req: any, res: Response): Promise<void> {
  const userId = req.user!.userId
  const apiKey = await ensureUserApiKey(userId)

  R.ok(res, 'API Key details', {
    id: apiKey.id,
    key: apiKey.key,
    label: apiKey.label,
    status: apiKey.status,
    webhookUrl: apiKey.webhookUrl || '',
    requestCount: apiKey.requestCount,
    monthlyLimit: apiKey.monthlyLimit,
    createdAt: apiKey.createdAt,
    lastUsedAt: apiKey.lastUsedAt,
    endpoints: {
      baseUrl: 'http://localhost:5000/api',
      documentationUrl: '/settings?tab=api',
    },
  })
}

/**
 * POST /api/api-keys/regenerate
 */
export async function regenerateApiKey(req: any, res: Response): Promise<void> {
  const userId = req.user!.userId

  // Revoke old keys
  await prisma.apiKey.updateMany({
    where: { userId, status: 'ACTIVE' },
    data: { status: 'REVOKED' },
  })

  // Create new key
  const newKey = await prisma.apiKey.create({
    data: {
      userId,
      key: generateKeyString(),
      label: 'Regenerated Live Key',
      status: 'ACTIVE',
      monthlyLimit: 50000,
    },
  })

  createNotification({
    userId,
    title: 'API Key Regenerated',
    message: 'Your developer API key has been regenerated. Old keys are now inactive.',
    type: 'SECURITY',
    actionUrl: '/settings?tab=api',
  })

  R.ok(res, 'New API Key generated successfully', {
    id: newKey.id,
    key: newKey.key,
    label: newKey.label,
    status: newKey.status,
    createdAt: newKey.createdAt,
  })
}

/**
 * PUT /api/api-keys/webhook
 */
export async function updateWebhook(req: any, res: Response): Promise<void> {
  const userId = req.user!.userId
  const { webhookUrl } = req.body

  if (webhookUrl && !/^https?:\/\/.+/.test(webhookUrl)) {
    R.badRequest(res, 'Please provide a valid HTTP or HTTPS webhook URL')
    return
  }

  const apiKey = await ensureUserApiKey(userId)

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { webhookUrl: webhookUrl || null },
  })

  R.ok(res, 'Webhook URL updated successfully', {
    webhookUrl: webhookUrl || '',
  })
}
