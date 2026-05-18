import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Prisma 7: adapter eh obrigatorio em runtime (URL nao vem mais do
// schema). Cria pool pg explicito com SSL nao-verificado pra Supabase.
//
// LAZY INIT (Proxy): cliente so eh criado na primeira query — evita
// crash em `next build > Collecting page data` (onde envs nao chegam)
// pra routes que importam `prisma` no top-level.

const globalForPrisma = globalThis as unknown as { _prismaClient: PrismaClient | null };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL ?? '';
  const isSupabase = connectionString.includes('supabase.co');

  const pool = new pg.Pool({
    connectionString,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30_000,
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  } as any);
}

function getPrisma(): PrismaClient {
  if (!globalForPrisma._prismaClient) {
    globalForPrisma._prismaClient = createPrismaClient();
  }
  return globalForPrisma._prismaClient;
}

// Proxy lazy — defere a criacao do PrismaClient ate o primeiro acesso
// (ex: prisma.user.findUnique). Isso evita o constructor rodar em
// `next build` quando DATABASE_URL nao existe ainda.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getPrisma() as object, prop, receiver);
  },
});
