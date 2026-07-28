import rateLimit from 'express-rate-limit'
import { env } from '../config/env'
import { tooMany } from '../utils/response'
import { Request, Response } from 'express'

const handler = (_req: Request, res: Response) =>
  tooMany(res, 'Too many requests. Please slow down and try again.')

/** General API rate limit */
export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // 15 minutes
  max:      env.RATE_LIMIT_MAX,       // 100 requests
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
})

/** Strict limiter for auth endpoints — prevent brute force */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      10,              // 10 attempts
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
  skipSuccessfulRequests: true,
})

/** OTP sending — prevent spam */
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max:      3,               // 3 OTP requests
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
})

/** Transaction limiter — prevent runaway automation */
export const transactionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max:      20,        // 20 transactions/minute
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
})

/** API key endpoints — higher limits for resellers */
export const apiKeyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      60,
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
})
