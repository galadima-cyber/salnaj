import Redis from 'ioredis'
import { env } from './env'
import { logger } from './logger'

let redis: Redis | null = null

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    })

    redis.on('connect',   () => logger.info('Redis connected'))
    redis.on('error',     (err) => logger.error('Redis error', { err: err.message }))
    redis.on('reconnecting', () => logger.warn('Redis reconnecting...'))
  }
  return redis
}

export const redisClient = {
  /** Set a key with optional TTL in seconds */
  set: async (key: string, value: string, ttlSeconds?: number): Promise<void> => {
    try {
      const client = getRedis()
      if (ttlSeconds) {
        await client.setex(key, ttlSeconds, value)
      } else {
        await client.set(key, value)
      }
    } catch (err) {
      logger.warn('Redis SET failed, continuing without cache', { key })
    }
  },

  /** Get a key — returns null if missing or Redis unavailable */
  get: async (key: string): Promise<string | null> => {
    try {
      return await getRedis().get(key)
    } catch {
      logger.warn('Redis GET failed', { key })
      return null
    }
  },

  /** Delete one or more keys */
  del: async (...keys: string[]): Promise<void> => {
    try {
      await getRedis().del(...keys)
    } catch {
      logger.warn('Redis DEL failed', { keys })
    }
  },

  /** Check if key exists */
  exists: async (key: string): Promise<boolean> => {
    try {
      return (await getRedis().exists(key)) === 1
    } catch {
      return false
    }
  },

  /** Increment a counter — for rate limiting / attempt tracking */
  incr: async (key: string, ttlSeconds?: number): Promise<number> => {
    try {
      const client = getRedis()
      const val = await client.incr(key)
      if (ttlSeconds && val === 1) await client.expire(key, ttlSeconds)
      return val
    } catch {
      return 0
    }
  },

  /** Set JSON value */
  setJSON: async (key: string, value: unknown, ttlSeconds?: number): Promise<void> => {
    await redisClient.set(key, JSON.stringify(value), ttlSeconds)
  },

  /** Get JSON value */
  getJSON: async <T>(key: string): Promise<T | null> => {
    const raw = await redisClient.get(key)
    if (!raw) return null
    try { return JSON.parse(raw) as T } catch { return null }
  },

  /** Graceful disconnect */
  disconnect: async (): Promise<void> => {
    if (redis) {
      await redis.quit()
      redis = null
    }
  },
}

// ─── Cache key factory ────────────────────────────────────────
export const CacheKeys = {
  otp:            (userId: string, purpose: string) => `otp:${userId}:${purpose}`,
  session:        (userId: string)  => `session:${userId}`,
  walletBalance:  (userId: string)  => `wallet:${userId}`,
  dataPlans:      (network: string) => `plans:${network}`,
  allPlans:       ()                => 'plans:all',
  userProfile:    (userId: string)  => `profile:${userId}`,
  txRateLimit:    (userId: string)  => `tx_rate:${userId}`,
  loginAttempts:  (email: string)   => `login_attempts:${email}`,
  resetToken:     (token: string)   => `reset:${token}`,
  vtpassStatus:   ()                => 'vtpass:status',
}
