import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AtendimentoClient from './AtendimentoClient';

export const dynamic = 'force-dynamic';

export default async function AtendimentoPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const tenantId = (session.user as any).tenantId as string;

  const [config, conversas] = await Promise.all([
    prisma.configWhatsApp.findUnique({
      where: { tenantId },
      select: { providerType: true, status: true, numeroConectado: true },
    }),
    prisma.conversa.findMany({
      where: { tenantId, status: { in: ['IA', 'HUMANO'] } },
      orderBy: { ultimaMsgEm: 'desc' },
      take: 50,
      select: {
        id: true,
        clienteWa: true,
        clienteNome: true,
        status: true,
        providerType: true,
        iniciadaEm: true,
        ultimaMsgEm: true,
        imovel: { select: { id: true, codigo: true, titulo: true, capaUrl: true } },
        mensagens: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, direcao: true, autorTipo: true, tipo: true, conteudo: true, createdAt: true },
        },
        _count: { select: { mensagens: true } },
      },
    }),
  ]);

  return (
    <AtendimentoClient
      tenantId={tenantId}
      whatsappConectado={config?.status === 'CONNECTED'}
      conversasIniciais={conversas.map((c) => ({
        ...c,
        iniciadaEm: c.iniciadaEm.toISOString(),
        ultimaMsgEm: c.ultimaMsgEm.toISOString(),
        mensagens: c.mensagens.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
      }))}
      supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
      supabaseAnonKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}
    />
  );
}
