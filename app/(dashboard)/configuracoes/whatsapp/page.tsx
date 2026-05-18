import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import WhatsAppClient from './WhatsAppClient';

export const dynamic = 'force-dynamic';

export default async function WhatsAppConfigPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const tenantId = (session.user as any).tenantId as string;

  const cfg = await prisma.configWhatsApp.findUnique({
    where: { tenantId },
    select: {
      providerType: true,
      instanceName: true,
      status: true,
      numeroConectado: true,
      conectadoEm: true,
      ultimoErro: true,
    },
  });

  return (
    <WhatsAppClient
      initial={
        cfg
          ? {
              providerType: cfg.providerType,
              status: cfg.status,
              numero: cfg.numeroConectado,
              conectadoEm: cfg.conectadoEm?.toISOString() ?? null,
              ultimoErro: cfg.ultimoErro,
            }
          : null
      }
    />
  );
}
