import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AgenteIaClient from './AgenteIaClient';

export const dynamic = 'force-dynamic';

export default async function AgenteIaPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const tenantId = (session.user as any).tenantId as string;

  const agente = await (prisma as any).agenteIA.findUnique({
    where: { tenantId },
  });

  // Mascarar chaves antes de mandar pro client
  const safe = agente
    ? {
        ...agente,
        openaiApiKey: maskKey(agente.openaiApiKey),
        anthropicApiKey: maskKey(agente.anthropicApiKey),
        elevenLabsApiKey: maskKey(agente.elevenLabsApiKey),
        remotionApiKey: maskKey(agente.remotionApiKey),
        chatwootToken: maskKey(agente.chatwootToken),
        webhookSecret: maskKey(agente.webhookSecret),
        createdAt: agente.createdAt?.toISOString() ?? null,
        updatedAt: agente.updatedAt?.toISOString() ?? null,
      }
    : null;

  return <AgenteIaClient agenteInicial={safe} />;
}

function maskKey(k?: string | null): string | null {
  if (!k || typeof k !== 'string') return null;
  if (k.length <= 8) return '••••';
  return `••••${k.slice(-4)}`;
}
