import { PrismaClient } from '@prisma/client';

// Singleton global pra evitar exhaust de connections em dev (hot reload
// criava novo client a cada save). Em prod, cada container instancia 1x.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
