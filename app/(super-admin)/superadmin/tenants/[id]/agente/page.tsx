import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { isSuperAdminEmail } from '@/lib/super-admin';
import { prisma } from '@/lib/prisma';
import { maskSecret } from '@/lib/crypto';
import AgenteAdminClient from './AgenteAdminClient';

export const dynamic = 'force-dynamic';

export default async function AgenteAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (!isSuperAdminEmail(session.user.email)) redirect('/dashboard');

  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: { marca: { select: { nomeEmpresa: true, slogan: true } } },
  });
  if (!tenant) notFound();

  const agente = await (prisma as any).agenteIA.findUnique({
    where: { tenantId: id },
  });

  return (
    <AgenteAdminClient
      tenant={{
        id: tenant.id,
        slug: tenant.slug,
        plano: tenant.plano,
        nomeEmpresa: tenant.marca?.nomeEmpresa ?? null,
        slogan: tenant.marca?.slogan ?? null,
      }}
      agenteInicial={
        agente
          ? {
              ...agente,
              openaiApiKey: maskSecret(agente.openaiApiKey),
              anthropicApiKey: maskSecret(agente.anthropicApiKey),
              elevenLabsApiKey: maskSecret(agente.elevenLabsApiKey),
              remotionApiKey: maskSecret(agente.remotionApiKey),
              chatwootToken: maskSecret(agente.chatwootToken),
              webhookSecret: maskSecret(agente.webhookSecret),
              createdAt: agente.createdAt?.toISOString() ?? null,
              updatedAt: agente.updatedAt?.toISOString() ?? null,
            }
          : null
      }
    />
  );
}
