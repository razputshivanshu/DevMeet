import { PrismaClient } from '@prisma/client';
import { env } from './env';

/**
 * Singleton Prisma client. Uses global caching in dev to survive HMR.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isDev ? ['warn', 'error'] : ['error'],
  });

if (env.isDev) globalForPrisma.prisma = prisma;
