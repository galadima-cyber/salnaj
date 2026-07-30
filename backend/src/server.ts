import express, { Request, Response, NextFunction } from 'express'
import cors      from 'cors'
import helmet    from 'helmet'
import morgan    from 'morgan'
import { env }   from './config/env'
import { logger } from './config/logger'
import { redisClient } from './config/redis'
import prisma    from './config/database'
import router    from './routes'
import { generalLimiter }    from './middlewares/rateLimiter.middleware'
import { notFoundHandler, globalErrorHandler } from './middlewares/error.middleware'

const app = express()

// ─── Security Headers ─────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      connectSrc:  ["'self'", 'https://api.paystack.co', 'https://vtpass.com'],
      imgSrc:      ["'self'", 'data:', 'https://res.cloudinary.com'],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'", "'unsafe-inline'"],
    },
  },
}))

// ─── CORS ─────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    const allowed = [
      env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:5174',
      'https://salnaj-d7t4.vercel.app/login',
      'http://localhost:3000',
    ]
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin || allowed.includes(origin)) {
      cb(null, true)
    } else {
      cb(new Error(`CORS: origin ${origin} not allowed`))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
}))

// ─── Body Parsing ─────────────────────────────────────────────
// Raw body needed for Paystack webhook signature verification
app.use('/api/webhooks/paystack', express.raw({ type: 'application/json' }))

// JSON for everything else
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// ─── HTTP Request Logging ─────────────────────────────────────
if (env.isDev()) {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined', {
    stream: { write: (msg: string) => logger.http(msg.trim()) },
    skip:   (_req, res) => res.statusCode < 400, // only log errors in prod
  }))
}

// ─── Trust Proxy (for Railway / Render / DigitalOcean) ────────
app.set('trust proxy', 1)

// ─── General Rate Limiter ─────────────────────────────────────
app.use('/api', generalLimiter)

// ─── Routes ───────────────────────────────────────────────────
app.use('/api', router)

// ─── Root ─────────────────────────────────────────────────────
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message:  `${env.APP_NAME} API is running`,
    version:  '1.0.0',
    docs:     `${env.APP_URL}/api/health`,
    env:      env.NODE_ENV,
  })
})

// ─── 404 + Error Handlers ─────────────────────────────────────
app.use(notFoundHandler)
app.use(globalErrorHandler)

// ─── Startup ──────────────────────────────────────────────────
async function start() {
  try {
    // Verify DB connection
    await prisma.$connect()
    logger.info('Database connected ✓')

    app.listen(env.PORT, () => {
      logger.info(`\n  🚀 ${env.APP_NAME} API started`)
      logger.info(`  ✅ Environment : ${env.NODE_ENV}`)
      logger.info(`  ✅ Port        : ${env.PORT}`)
      logger.info(`  ✅ Frontend    : ${env.FRONTEND_URL}`)
      logger.info(`  ✅ VTPass URL  : ${env.VTPASS_BASE_URL}\n`)
    })
  } catch (err) {
    logger.error('Failed to start server', { err })
    process.exit(1)
  }
}

// ─── Graceful Shutdown ────────────────────────────────────────
async function shutdown(signal: string) {
  logger.info(`${signal} received — shutting down gracefully`)
  try {
    await prisma.$disconnect()
    await redisClient.disconnect()
    logger.info('All connections closed. Exiting.')
    process.exit(0)
  } catch (err) {
    logger.error('Error during shutdown', { err })
    process.exit(1)
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT',  () => shutdown('SIGINT'))

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled promise rejection', { reason })
})

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught exception', { err: err.message, stack: err.stack })
  process.exit(1)
})

start()

export default app
