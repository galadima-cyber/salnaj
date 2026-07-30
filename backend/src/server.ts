import express, { Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { env } from './config/env'
import { logger } from './config/logger'
import { redisClient } from './config/redis'
import prisma from './config/database'

import router from './routes'
import { generalLimiter } from './middlewares/rateLimiter.middleware'
import {
  notFoundHandler,
  globalErrorHandler,
} from './middlewares/error.middleware'

const app = express()

// ─────────────────────────────────────────────────────────────
// Security Headers
// ─────────────────────────────────────────────────────────────

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: [
          "'self'",
          'https://api.paystack.co',
          'https://vtpass.com',
        ],
        imgSrc: [
          "'self'",
          'data:',
          'https://res.cloudinary.com',
        ],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  })
)

// ─────────────────────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────────────────────

const allowedOrigins = new Set([
  env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'https://salnaj-d7t4.vercel.app',
])

console.log('========== CORS ==========')
console.log(env.FRONTEND_URL)
console.log(process.env.FRONTEND_URL)
console.log('==========================')

app.use(
  cors({
    origin(origin, callback) {
      // Allow Postman, curl, mobile apps
      if (!origin) {
        return callback(null, true)
      }

      if (allowedOrigins.has(origin)) {
        return callback(null, true)
      }

      logger.warn(`Blocked CORS request from: ${origin}`)

      return callback(new Error(`CORS: origin ${origin} not allowed`))
    },

    credentials: true,

    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-api-key',
    ],
  })
)

// Handle preflight requests
app.options('*', cors())

// ─────────────────────────────────────────────────────────────
// Body Parsing
// ─────────────────────────────────────────────────────────────

app.use(
  '/api/webhooks/paystack',
  express.raw({
    type: 'application/json',
  })
)

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// ─────────────────────────────────────────────────────────────
// Logging
// ─────────────────────────────────────────────────────────────

if (env.isDev()) {
  app.use(morgan('dev'))
} else {
  app.use(
    morgan('combined', {
      stream: {
        write: (msg: string) => logger.http(msg.trim()),
      },
      skip: (_req, res) => res.statusCode < 400,
    })
  )
}

// ─────────────────────────────────────────────────────────────
// Trust Proxy
// ─────────────────────────────────────────────────────────────

app.set('trust proxy', 1)

// ─────────────────────────────────────────────────────────────
// Rate Limiter
// ─────────────────────────────────────────────────────────────

app.use('/api', generalLimiter)

// ─────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────

app.use('/api', router)

// ─────────────────────────────────────────────────────────────
// Root Route
// ─────────────────────────────────────────────────────────────

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: `${env.APP_NAME} API is running`,
    version: '1.0.0',
    docs: `${env.APP_URL}/api/health`,
    env: env.NODE_ENV,
  })
})

// ─────────────────────────────────────────────────────────────
// Error Handlers
// ─────────────────────────────────────────────────────────────

app.use(notFoundHandler)
app.use(globalErrorHandler)

// ─────────────────────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────────────────────

async function start() {
  try {
    await prisma.$connect()

    logger.info('Database connected ✓')

    app.listen(env.PORT, () => {
      logger.info(`🚀 ${env.APP_NAME} API started`)
      logger.info(`Environment : ${env.NODE_ENV}`)
      logger.info(`Port        : ${env.PORT}`)
      logger.info(`Frontend    : ${env.FRONTEND_URL}`)
      logger.info(`VTPass URL  : ${env.VTPASS_BASE_URL}`)
    })
  } catch (err) {
    logger.error('Failed to start server', { err })
    process.exit(1)
  }
}

// ─────────────────────────────────────────────────────────────
// Graceful Shutdown
// ─────────────────────────────────────────────────────────────

async function shutdown(signal: string) {
  logger.info(`${signal} received. Shutting down...`)

  try {
    await prisma.$disconnect()
    await redisClient.disconnect()

    logger.info('Shutdown complete.')

    process.exit(0)
  } catch (err) {
    logger.error('Shutdown error', { err })
    process.exit(1)
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection', { reason })
})

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception', {
    message: err.message,
    stack: err.stack,
  })

  process.exit(1)
})

start()

export default app