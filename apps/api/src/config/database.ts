import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

// Singleton para evitar múltiples conexiones en desarrollo (hot reload)
export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma
}

// Manejo de cierre limpio
process.on('beforeExit', async () => {
  await prisma.$disconnect()
  logger.info('Database disconnected')
})
