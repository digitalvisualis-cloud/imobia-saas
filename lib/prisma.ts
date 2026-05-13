import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Prisma 7: adapter eh obrigatorio em runtime (nao tem engine binario
// fallback como em v5). URL nao vem mais do schema — passa direto aqui.
//
// Pra Supabase Pooler em prod, precisamos:
// - sslmode=require na URL (Supabase exige TLS)
// - rejectUnauthorized: false (Supabase usa cert intermediario que
//   nao tem no truststore default do Node)

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL ?? '';
  const isSupabase = connectionString.includes('supabase.com');
  const adapter = new PrismaPg({
    connectionString,
    // Em conexoes Supabase, aceitar cert sem CA local
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  } as any);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
