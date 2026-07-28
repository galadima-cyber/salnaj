import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env }          from '../config/env'
import { redisClient, CacheKeys } from '../config/redis'
import { AuthRequest, JwtPayload } from '../types'
import { unauthorized, forbidden } from '../utils/response'
import { UserRole }     from '@prisma/client'

/** Verify JWT and attach user to request */
export async function authenticate(
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      unauthorized(res, 'Access token required')
      return
    }

    const token = authHeader.split(' ')[1]

    let payload: JwtPayload
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        unauthorized(res, 'Token expired. Please refresh.')
      } else {
        unauthorized(res, 'Invalid token')
      }
      return
    }

    // Check if session is blacklisted (logout / password change)
    const blacklisted = await redisClient.exists(`blacklist:${token}`)
    if (blacklisted) {
      unauthorized(res, 'Session has been invalidated. Please log in again.')
      return
    }

    req.user = payload
    next()
  } catch {
    unauthorized(res)
  }
}

/** Role-based access — call after authenticate */
export function requireRole(...roles: UserRole[]) {
  return (req: any, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorized(res)
      return
    }
    if (!roles.includes(req.user.role)) {
      forbidden(res, 'You do not have permission to access this resource')
      return
    }
    next()
  }
}

/** Shorthand guards */
export const requireAdmin = requireRole('ADMIN', 'SUPER_ADMIN')
export const requireAgent = requireRole('AGENT', 'SUPER_AGENT', 'ADMIN', 'SUPER_ADMIN')
