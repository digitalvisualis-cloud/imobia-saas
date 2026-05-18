import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Header } from '@/app/_templates/elegance/Header';
import { Footer } from '@/app/_templates/elegance/Footer';
import { WhatsAppButton } from '@/app/_templates/elegance/WhatsAppButton';
import type { TenantPublic } from '@/app/_templates/types';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { marca: true },
  });

  if (!tenant) return { title: 'Página não encontrada' };

  const nome = tenant.marca?.nomeEmpresa || titleCase(slug);
  return {
    title: nome,
    description:
      tenant.marca?.slogan ||
      tenant.marca?.descricao ||
      'Encontre seu imóvel ideal.',
    icons: {
      icon: tenant.marca?.faviconUrl || '/favicon.ico',
    },
  };
}

function titleCase(slug: string) {
  return slug
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { marca: true },
  });

  if (!tenant) notFound();

  const tenantCtx: TenantPublic = {
    slug: tenant.slug,
    nome: tenant.marca?.nomeEmpresa || titleCase(slug),
    marca: tenant.marca
      ? {
          nomeEmpresa: tenant.marca.nomeEmpresa,
          slogan: tenant.marca.slogan,
          descricao: tenant.marca.descricao,
          logoUrl: tenant.marca.logoUrl,
          faviconUrl: tenant.marca.faviconUrl,
          corPrimaria: tenant.marca.corPrimaria,
          corSecundaria: tenant.marca.corSecundaria,
          whatsapp: tenant.marca.whatsapp,
          email: tenant.marca.email,
          telefone: tenant.marca.telefone,
          endereco: tenant.marca.endereco,
          instagram: tenant.marca.instagram,
          facebook: tenant.marca.facebook,
          youtube: tenant.marca.youtube,
          linkedin: tenant.marca.linkedin,
          tiktok: tenant.marca.tiktok,
        }
      : null,
  };

  // O tema do Lovable (gold + forest) fica fixo. Se o tenant tiver
  // corPrimaria definida, ela disponível em --brand-primary pra futuro
  // (não sobrescreve o ouro do template — preserva a estética).
  const themeStyle: React.CSSProperties = {};
  if (tenantCtx.marca?.corPrimaria) {
    (themeStyle as Record<string, string>)['--brand-primary'] =
      tenantCtx.marca.corPrimaria;
  }
  if (tenantCtx.marca?.corSecundaria) {
    (themeStyle as Record<string, string>)['--brand-secondary'] =
      tenantCtx.marca.corSecundaria;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background" style={themeStyle}>
      <Header tenant={tenantCtx} />
      <main className="flex-1">{children}</main>
      <Footer tenant={tenantCtx} />
      <WhatsAppButton tenant={tenantCtx} />
    </div>
  );
}
