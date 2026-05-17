import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ThemeScope } from '@/components/themes/ThemeScope';
import { BrisaHeader, BrisaFooter } from '@/components/themes/brisa/BrisaChrome';
import { AuraHeader, AuraFooter } from '@/components/themes/aura/AuraChrome';
import { OnyxHeader, OnyxFooter } from '@/components/themes/onyx/OnyxChrome';
import { CookieBanner } from '@/components/themes/CookieBanner';
import { mergeCustomization, type ThemeId } from '@/types/site-customization';
import { buildTenantPublic } from '@/lib/build-tenant-public';

export const dynamic = 'force-dynamic';

function isThemeId(v: unknown): v is ThemeId {
  return v === 'brisa' || v === 'aura' || v === 'onyx';
}

export default async function BlogIndex({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { marca: true, site: true },
  });
  if (!tenant) notFound();
  if (!tenant.site?.publicado) notFound();

  const artigos = await prisma.artigoBlog.findMany({
    where: { tenantId: tenant.id, publicado: true },
    orderBy: { publicadoEm: 'desc' },
    take: 30,
  });

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

  return (
    <ThemeScope config={config}>
      {themeId === 'aura' ? (
        <AuraHeader config={config} tenant={tenantPublic} transparent={false} />
      ) : (
        <Header config={config} tenant={tenantPublic} />
      )}
      <main className="mx-auto max-w-[1100px] px-6 py-12 md:py-20">
        <header className="mb-10 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-60">Blog</p>
          <h1
            style={{ fontFamily: 'var(--t-font-heading)' }}
            className="mt-2 text-3xl font-bold sm:text-4xl md:text-5xl"
          >
            Conteúdo &amp; dicas do mercado imobiliário
          </h1>
        </header>

        {artigos.length === 0 ? (
          <p className="text-center text-stone-500 py-20">Em breve postaremos conteúdo aqui.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {artigos.map((a) => (
              <Link
                key={a.id}
                href={`/s/${slug}/blog/${a.slug}`}
                className="group rounded-xl overflow-hidden bg-card border border-border hover:shadow-lg transition-shadow"
              >
                {a.capaUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.capaUrl}
                    alt={a.titulo}
                    className="h-44 w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="h-44 w-full bg-stone-100" />
                )}
                <div className="p-4">
                  {a.publicadoEm && (
                    <p className="text-[10px] uppercase tracking-wider opacity-60">
                      {new Date(a.publicadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                  <h2 className="mt-1 font-semibold leading-snug line-clamp-2" style={{ fontFamily: 'var(--t-font-heading)' }}>
                    {a.titulo}
                  </h2>
                  {a.resumo && <p className="mt-2 text-sm opacity-70 line-clamp-3">{a.resumo}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer config={config} tenant={tenantPublic} />
      <CookieBanner slug={slug} />
    </ThemeScope>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { marca: { select: { nomeEmpresa: true } } } });
  const empresa = tenant?.marca?.nomeEmpresa ?? slug;
  return {
    title: `Blog · ${empresa}`,
    description: `Conteúdo e dicas do mercado imobiliário por ${empresa}.`,
  };
}
