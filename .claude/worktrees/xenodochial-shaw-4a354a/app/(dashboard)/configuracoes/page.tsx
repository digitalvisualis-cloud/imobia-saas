import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ConfiguracoesClient from './ConfiguracoesClient';

export const dynamic = 'force-dynamic';

export default async function ConfiguracoesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const tenantId = (session.user as any).tenantId as string;
  const userId = (session.user as any).id as string;

  const [tenant, user, equipe, site] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { marca: true },
    }),
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.user.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        nome: true,
        email: true,
        whatsapp: true,
        creci: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    }),
    prisma.site.findUnique({ where: { tenantId } }).catch(() => null),
  ]);

  if (!tenant || !user) redirect('/login');

  return (
    <ConfiguracoesClient
      perfil={{
        id: user.id,
        nome: user.nome,
        email: user.email,
        whatsapp: user.whatsapp ?? '',
        creci: user.creci ?? '',
      }}
      marca={{
        nomeEmpresa: tenant.marca?.nomeEmpresa ?? '',
        slogan: tenant.marca?.slogan ?? '',
        descricao: tenant.marca?.descricao ?? '',
        logoUrl: tenant.marca?.logoUrl ?? '',
        faviconUrl: tenant.marca?.faviconUrl ?? '',
        corPrimaria: tenant.marca?.corPrimaria ?? '#c5a64f',
        corSecundaria: tenant.marca?.corSecundaria ?? '#1a2e1a',
        email: tenant.marca?.email ?? '',
        whatsapp: tenant.marca?.whatsapp ?? '',
        telefone: tenant.marca?.telefone ?? '',
        endereco: tenant.marca?.endereco ?? '',
        instagram: tenant.marca?.instagram ?? '',
        facebook: tenant.marca?.facebook ?? '',
        youtube: tenant.marca?.youtube ?? '',
        linkedin: tenant.marca?.linkedin ?? '',
        tiktok: tenant.marca?.tiktok ?? '',
      }}
      tenantInfo={{
        slug: tenant.slug,
        plano: tenant.plano,
        siteSlug: site?.slug ?? null,
        sitePublicado: site?.publicado ?? false,
      }}
      equipe={equipe.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      }))}
      currentUserId={user.id}
    />
  );
}
