import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { ThemeScope } from '@/components/themes/ThemeScope';
import { BrisaHeader, BrisaFooter } from '@/components/themes/brisa/BrisaChrome';
import { AuraHeader, AuraFooter } from '@/components/themes/aura/AuraChrome';
import { OnyxHeader, OnyxFooter } from '@/components/themes/onyx/OnyxChrome';
import { CookieBanner } from '@/components/themes/CookieBanner';
import { mergeCustomization, type ThemeId } from '@/types/site-customization';
import { buildTenantPublic } from '@/lib/build-tenant-public';
import { renderMarkdown } from '@/lib/markdown';

export const dynamic = 'force-dynamic';

function isThemeId(v: unknown): v is ThemeId {
  return v === 'brisa' || v === 'aura' || v === 'onyx';
}

export default async function ArtigoPage({
  params,
}: {
  params: Promise<{ slug: string; artigoSlug: string }>;
}) {
  const { slug, artigoSlug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { marca: true, site: true },
  });
  if (!tenant) notFound();
  if (!tenant.site?.publicado) notFound();

  const artigo = await prisma.artigoBlog.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug: artigoSlug } },
  });
  if (!artigo || !artigo.publicado) notFound();

  // Incrementa visualizacoes (fire-and-forget — ok perder em race condition)
  prisma.artigoBlog
    .update({ where: { id: artigo.id }, data: { visualizacoes: { increment: 1 } } })
    .catch(() => {});

  const siteAny = tenant.site as any;
  const rawConfig = (siteAny.config ?? {}) as Record<string, unknown>;
  const themeId: ThemeId = isThemeId(siteAny.templateId) ? siteAny.templateId : 'brisa';
  const isMultiTheme =
    rawConfig &&
    typeof rawConfig === 'object' &&
    ('brisa' in rawConfig || 'aura' in rawConfig || 'onyx' in rawConfig);
  const config = mergeCustomization(themeId, isMultiTheme ? rawConfig[themeId] : rawConfig);
  const tenantPublic = buildTenantPublic(tenant);

  const Header = themeId === 'aura' ? AuraHeader : themeId === 'onyx' ? OnyxHeader : BrisaHeader;
  const Footer = themeId === 'aura' ? AuraFooter : themeId === 'onyx' ? OnyxFooter : BrisaFooter;

  const html = renderMarkdown(artigo.conteudoMd);
  const dataFormatada = artigo.publicadoEm
    ? new Date(artigo.publicadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  return (
    <ThemeScope config={config}>
      {themeId === 'aura' ? (
        <AuraHeader config={config} tenant={tenantPublic} transparent={false} />
      ) : (
        <Header config={config} tenant={tenantPublic} />
      )}
      <main className="mx-auto max-w-[760px] px-6 py-10 md:py-16">
        <Link href={`/s/${slug}/blog`} className="inline-flex items-center gap-1 text-sm opacity-60 hover:opacity-100">
          <ChevronLeft className="h-4 w-4" /> Voltar ao blog
        </Link>

        {artigo.capaUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={artigo.capaUrl} alt={artigo.titulo} className="mt-6 w-full h-auto rounded-xl object-cover max-h-[440px]" />
        )}

        <header className="mt-8">
          {dataFormatada && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-60">
              {dataFormatada}
            </p>
          )}
          <h1
            style={{ fontFamily: 'var(--t-font-heading)' }}
            className="mt-3 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl"
          >
            {artigo.titulo}
          </h1>
          {artigo.resumo && (
            <p className="mt-4 text-lg opacity-80 leading-relaxed">{artigo.resumo}</p>
          )}
          {artigo.autor && (
            <p className="mt-4 text-sm opacity-60">por {artigo.autor}</p>
          )}
        </header>

        <article
          className="prose prose-stone max-w-none mt-10 [&>h2]:mt-10 [&>h2]:mb-4 [&>h2]:text-2xl [&>h2]:font-bold [&>h3]:mt-6 [&>h3]:mb-3 [&>h3]:text-xl [&>h3]:font-semibold [&>p]:my-4 [&>p]:leading-relaxed [&>ul]:my-4"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Structured Data — Article (Google rich result) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: artigo.titulo,
              description: artigo.resumo ?? artigo.metaDescription ?? '',
              image: artigo.capaUrl ? [artigo.capaUrl] : undefined,
              datePublished: artigo.publicadoEm?.toISOString(),
              dateModified: artigo.updatedAt.toISOString(),
              author: { '@type': 'Person', name: artigo.autor ?? tenant.marca?.nomeEmpresa ?? slug },
              publisher: {
                '@type': 'Organization',
                name: tenant.marca?.nomeEmpresa ?? slug,
                logo: tenant.marca?.logoUrl ? { '@type': 'ImageObject', url: tenant.marca.logoUrl } : undefined,
              },
            }),
          }}
        />
      </main>
      <Footer config={config} tenant={tenantPublic} />
      <CookieBanner slug={slug} />
    </ThemeScope>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; artigoSlug: string }>;
}) {
  const { slug, artigoSlug } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true, marca: { select: { nomeEmpresa: true } } } });
  if (!tenant) return { title: 'Artigo' };
  const artigo = await prisma.artigoBlog.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug: artigoSlug } },
    select: { titulo: true, resumo: true, metaTitle: true, metaDescription: true, capaUrl: true, publicado: true },
  });
  if (!artigo || !artigo.publicado) return { title: 'Artigo' };
  const empresa = tenant.marca?.nomeEmpresa ?? slug;
  return {
    title: artigo.metaTitle ?? `${artigo.titulo} · ${empresa}`,
    description: artigo.metaDescription ?? artigo.resumo ?? undefined,
    openGraph: {
      title: artigo.metaTitle ?? artigo.titulo,
      description: artigo.metaDescription ?? artigo.resumo ?? undefined,
      images: artigo.capaUrl ? [{ url: artigo.capaUrl }] : undefined,
      type: 'article',
    },
  };
}
