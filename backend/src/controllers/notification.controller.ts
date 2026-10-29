import { Response } from 'express'
import prisma from '../config/database'
import * as R from '../utils/response'

/**
 * Helper to create a notification in-app
 */
export async function createNotification(data: {
  userId: string
  title: string
  message: string
  type: 'TRANSACTION' | 'PROMO' | 'SECURITY' | 'SYSTEM'
  actionUrl?: string
  metadata?: any
}) {
  try {
    return await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        actionUrl: data.actionUrl || null,
        metadata: data.metadata || null,
      },
    })
  } catch (err) {
    // Non-blocking notification failure
    console.error('Failed to create notification:', err)
    return null
  }
}

/**
 * GET /api/notifications
 */
export async function getNotifications(req: any, res: Response): Promise<void> {
  const userId = req.user!.userId
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 15))
  const skip = (page - 1) * limit

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ])

  R.ok(res, 'Notifications retrieved', {
    items: notifications,
    unreadCount,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

/**
 * PATCH /api/notifications/:id/read
 */
export async function markAsRead(req: any, res: Response): Promise<void> {
  const userId = req.user!.userId
  const id = req.params.id

  const notification = await prisma.notification.findFirst({
    where: { id, userId },
  })

  if (!notification) {
    R.notFound(res, 'Notification not found')
    return
  }

  await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  })

  R.ok(res, 'Notification marked as read')
}

/**
 * POST /api/notifications/mark-all-read
 */
export async function markAllAsRead(req: any, res: Response): Promise<void> {
  const userId = req.user!.userId

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  })

  R.ok(res, 'All notifications marked as read')
}
