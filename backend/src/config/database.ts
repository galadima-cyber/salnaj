// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client')
import { env } from './env'

// Singleton pattern — prevents connection pool exhaustion in development
const globalForPrisma = globalThis as unknown as { prisma: InstanceType<typeof PrismaClient> }

export const prisma: InstanceType<typeof PrismaClient> =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: env.isDev() ? ['query', 'error', 'warn'] : ['error'],
  })

if (env.isDev()) globalForPrisma.prisma = prisma

export default prisma
