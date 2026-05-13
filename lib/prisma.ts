import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Prisma 7: adapter eh obrigatorio em runtime (URL nao vem mais do
// schema). Cria pool pg explicito com SSL nao-verificado pra Supabase
// (cert intermediario que truststore default do Node nao reconhece —
// sem isso o handshake TLS falha silenciosamente em prod).

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL ?? '';
  if (!connectionString) {
    throw new Error('DATABASE_URL ausente — adapter Prisma nao consegue inicializar');
  }
  const isSupabase = connectionString.includes('supabase.co');

  // Pool explicito da pg lib — assim controlamos SSL e options de
  // forma transparente. PrismaPg aceita pool ja construido como
  // primeiro argumento.
  const pool = new pg.Pool({
    connectionString,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30_000,
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter } as any);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
