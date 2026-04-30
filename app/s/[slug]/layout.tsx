import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Header } from '@/app/_templates/elegance/Header';
import { Footer } from '@/app/_templates/elegance/Footer';
import { WhatsAppButton } from '@/app/_templates/elegance/WhatsAppButton';
import type { TenantPublic } from '@/app/_templates/types';
import { hexToHsl, pickForeground } from '@/lib/colors';
import { getFamilyTitulo, getFamilyCorpo } from '@/lib/fonts';

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

  // Aplica as cores do brand kit do cliente como CSS vars do Tailwind.
  // Sobrescreve --primary, --secondary e variações foreground com as cores
  // que o cliente cadastrou em /configuracoes (ConfigMarca).
  // Fallback: usa o tema padrão do template (gold + forest) se não cadastrou.
  const themeStyle: React.CSSProperties = {};
  const primariaHsl = hexToHsl(tenantCtx.marca?.corPrimaria);
  const secundariaHsl = hexToHsl(tenantCtx.marca?.corSecundaria);

  if (primariaHsl) {
    (themeStyle as Record<string, string>)['--primary'] = primariaHsl;
    (themeStyle as Record<string, string>)['--primary-foreground'] =
      pickForeground(tenantCtx.marca?.corPrimaria);
    (themeStyle as Record<string, string>)['--ring'] = primariaHsl;
    (themeStyle as Record<string, string>)['--brand-primary'] =
      tenantCtx.marca!.corPrimaria!;
  }
  if (secundariaHsl) {
    (themeStyle as Record<string, string>)['--secondary'] = secundariaHsl;
    (themeStyle as Record<string, string>)['--secondary-foreground'] =
      pickForeground(tenantCtx.marca?.corSecundaria);
    (themeStyle as Record<string, string>)['--brand-secondary'] =
      tenantCtx.marca!.corSecundaria!;
  }

  // Aplicar fontes que o cliente escolheu em /configuracoes
  const fonteTituloKey = (tenant.marca as any)?.fonteTitulo as string | null;
  const fonteCorpoKey = (tenant.marca as any)?.fonteCorpo as string | null;
  (themeStyle as Record<string, string>)['--font-display'] =
    getFamilyTitulo(fonteTituloKey);
  (themeStyle as Record<string, string>)['--font-body'] =
    getFamilyCorpo(fonteCorpoKey);

  return (
    <div className="min-h-screen flex flex-col bg-background" style={themeStyle}>
      <Header tenant={tenantCtx} />
      <main className="flex-1">{children}</main>
      <Footer tenant={tenantCtx} />
      <WhatsAppButton tenant={tenantCtx} />
    </div>
  );
}
