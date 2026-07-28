import { Request, Response } from 'express'
import bcrypt    from 'bcryptjs'
import jwt, { SignOptions } from "jsonwebtoken";
import crypto    from 'crypto'
import prisma    from '../config/database'
import { env }   from '../config/env'
import { redisClient, CacheKeys } from '../config/redis'
import { emailService } from '../services/email.service'
import { smsService }   from '../services/sms.service'
import { walletService } from '../services/wallet.service'
import {
  generateRef, generateReferralCode, generateOtp,
  getOtpExpiry, normalizePhone,
} from '../utils'
import * as R    from '../utils/response'
import { AuthRequest, JwtPayload } from '../types'

// ─── Token helpers ────────────────────────────────────────────

function signTokens(payload: JwtPayload) {
  const access = jwt.sign(payload, env.JWT_SECRET, {
  expiresIn: env.JWT_EXPIRES_IN,
} as SignOptions);

const refresh = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
  expiresIn: env.JWT_REFRESH_EXPIRES_IN,
} as SignOptions);
  return { access, refresh }
}

// ─── POST /api/auth/register ──────────────────────────────────

export async function register(req: Request, res: Response): Promise<void> {
  const { fullName, email, phone, password, referralCode } = req.body
  const normalizedPhone = normalizePhone(phone)

  // Check duplicates
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone: normalizedPhone }] },
    select: { email: true, phone: true },
  })

  if (existing) {
    const field = existing.email === email ? 'email' : 'phone number'
    R.conflict(res, `An account with this ${field} already exists`)
    return
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12)

  // Find referrer
  let referredById: string | undefined
  if (referralCode) {
    const referrer = await prisma.user.findUnique({
      where: { referralCode },
      select: { id: true },
    })
    referredById = referrer?.id
  }

  // Create user + wallet in one transaction
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        fullName,
        email,
        phone:        normalizedPhone,
        passwordHash,
        referralCode: generateReferralCode(),
        referredById,
      },
      select: { id: true, fullName: true, email: true, phone: true, referralCode: true },
    })
    await tx.wallet.create({ data: { userId: created.id } })
    return created
  })

  // Send email OTP
  const otp = generateOtp()
  await prisma.otp.create({
    data: {
      userId:    user.id,
      code:      await bcrypt.hash(otp, 8),
      purpose:   'EMAIL_VERIFY',
      expiresAt: getOtpExpiry(10),
    },
  })
  await emailService.sendOtp(email, fullName, otp, 'EMAIL_VERIFY')

  // Welcome email (don't await — fire and forget)
  emailService.sendWelcome(email, fullName).catch(() => {})

  R.created(res, 'Account created. Check your email for a verification code.', {
    userId:      user.id,
    email:       user.email,
    referralCode: user.referralCode,
  })
}

// ─── POST /api/auth/verify-email ─────────────────────────────

export async function verifyEmail(req: any, res: Response): Promise<void> {
  const { userId, otp } = req.body

  const record = await prisma.otp.findFirst({
    where: {
      userId,
      purpose:  'EMAIL_VERIFY',
      usedAt:   null,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!record) { R.badRequest(res, 'OTP not found or expired'); return }

  // Increment attempts guard
  if (record.attempts >= 5) {
    await prisma.otp.update({ where: { id: record.id }, data: { usedAt: new Date() } })
    R.badRequest(res, 'Too many incorrect attempts. Request a new OTP.'); return
  }

  const valid = await bcrypt.compare(otp, record.code)
  if (!valid) {
    await prisma.otp.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } })
    R.badRequest(res, `Incorrect OTP. ${5 - record.attempts - 1} attempt(s) remaining.`); return
  }

  // Mark used + verify user
  await prisma.$transaction([
    prisma.otp.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: userId },   data: { isEmailVerified: true } }),
  ])

  R.ok(res, 'Email verified successfully')
}

// ─── POST /api/auth/login ─────────────────────────────────────

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body

  // Brute-force protection
  const attemptsKey = CacheKeys.loginAttempts(email)
  const attempts    = await redisClient.incr(attemptsKey, 15 * 60)
  if (attempts > 10) {
    R.tooMany(res, 'Too many login attempts. Please wait 15 minutes.')
    return
  }

  const user = await prisma.user.findUnique({
    where:  { email },
    select: { id: true, fullName: true, email: true, phone: true,
              role: true, passwordHash: true, isBlocked: true,
              isEmailVerified: true, kycStatus: true },
  })

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    R.unauthorized(res, 'Invalid email or password')
    return
  }

  if (user.isBlocked) {
    R.forbidden(res, 'Your account has been suspended. Contact support.')
    return
  }

  // Clear attempts on success
  await redisClient.del(attemptsKey)

  const payload: JwtPayload = {
    userId: user.id,
    email:  user.email,
    role:   user.role,
  }
  const { access, refresh } = signTokens(payload)

  // Save refresh token to Redis (7d TTL)
  await redisClient.set(`refresh:${user.id}`, refresh, 7 * 24 * 3600)

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data:  { lastLoginAt: new Date(), lastLoginIp: req.ip },
  })

  R.ok(res, 'Login successful', {
    accessToken:  access,
    refreshToken: refresh,
    user: {
      id:              user.id,
      fullName:        user.fullName,
      email:           user.email,
      phone:           user.phone,
      role:            user.role,
      kycStatus:       user.kycStatus,
      isEmailVerified: user.isEmailVerified,
    },
  })
}

// ─── POST /api/auth/refresh ───────────────────────────────────

export async function refreshToken(req: Request, res: Response): Promise<void> {
  const { refreshToken: token } = req.body
  if (!token) { R.badRequest(res, 'Refresh token required'); return }

  let payload: JwtPayload
  try {
    payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload
  } catch {
    R.unauthorized(res, 'Invalid or expired refresh token')
    return
  }

  // Validate against stored token
  const stored = await redisClient.get(`refresh:${payload.userId}`)
  if (stored !== token) {
    R.unauthorized(res, 'Refresh token has been revoked')
    return
  }

  const { access, refresh } = signTokens(payload)
  await redisClient.set(`refresh:${payload.userId}`, refresh, 7 * 24 * 3600)

  R.ok(res, 'Token refreshed', { accessToken: access, refreshToken: refresh })
}

// ─── POST /api/auth/logout ────────────────────────────────────

export async function logout(req: any, res: Response): Promise<void> {
  const token = req.headers.authorization?.split(' ')[1]
  if (token) {
    // Blacklist current access token for its remaining TTL
    await redisClient.set(`blacklist:${token}`, '1', 24 * 3600)
  }
  if (req.user?.userId) {
    await redisClient.del(`refresh:${req.user.userId}`)
  }
  R.ok(res, 'Logged out successfully')
}

// ─── POST /api/auth/forgot-password ──────────────────────────

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body
  const user = await prisma.user.findUnique({
    where: { email }, select: { id: true, fullName: true, email: true }
  })

  // Always return success (don't reveal if account exists)
  if (!user) { R.ok(res, 'If this email exists, a reset link has been sent.'); return }

  const token    = crypto.randomBytes(32).toString('hex')
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`

  await redisClient.set(CacheKeys.resetToken(token), user.id, 30 * 60) // 30 min
  await emailService.sendPasswordReset(email, user.fullName, resetUrl)

  R.ok(res, 'If this email exists, a reset link has been sent.')
}

// ─── POST /api/auth/reset-password ───────────────────────────

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, password } = req.body

  const userId = await redisClient.get(CacheKeys.resetToken(token))
  if (!userId) { R.badRequest(res, 'Reset link is invalid or has expired'); return }

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
  await redisClient.del(CacheKeys.resetToken(token))
  // Invalidate all sessions
  await redisClient.del(`refresh:${userId}`)

  R.ok(res, 'Password reset successfully. Please log in.')
}

// ─── POST /api/auth/set-pin ───────────────────────────────────

export async function setPin(req: any, res: Response): Promise<void> {
  const { pin } = req.body
  const userId  = req.user!.userId

  const pinHash = await bcrypt.hash(pin, 10)
  await prisma.user.update({ where: { id: userId }, data: { pinHash } })

  R.ok(res, 'Transaction PIN set successfully')
}

// ─── POST /api/auth/send-otp ─────────────────────────────────

export async function sendOtp(req: any, res: Response): Promise<void> {
  const { purpose } = req.body
  const userId      = req.user!.userId

  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { fullName: true, email: true, phone: true },
  })
  if (!user) { R.notFound(res, 'User not found'); return }

  // Expire old OTPs
  await prisma.otp.updateMany({
    where: { userId, purpose, usedAt: null },
    data:  { usedAt: new Date() },
  })

  const otp = generateOtp()
  await prisma.otp.create({
    data: {
      userId,
      code:      await bcrypt.hash(otp, 8),
      purpose,
      expiresAt: getOtpExpiry(5),
    },
  })

  if (purpose === 'PHONE_VERIFY') {
    await smsService.sendOtp(user.phone, otp)
  } else {
    await emailService.sendOtp(user.email, user.fullName, otp, purpose)
  }

  R.ok(res, 'OTP sent successfully')
}

// ─── GET /api/auth/me ─────────────────────────────────────────

export async function getMe(req: any, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where:  { id: req.user!.userId },
    select: {
      id: true, fullName: true, email: true, phone: true,
      role: true, kycStatus: true, referralCode: true,
      isEmailVerified: true, isPhoneVerified: true,
      profilePhoto: true, createdAt: true,
      wallet: { select: { mainBalance: true, bonusBalance: true } },
    },
  })

  if (!user) { R.notFound(res, 'User not found'); return }
  R.ok(res, 'User profile', user)
}
