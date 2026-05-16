import type { Metadata } from 'next';
import { loadLegalPage } from '../_legal/loader';
import { PaginaLegalRender } from '../_legal/PaginaLegalRender';
import { BotaoAceitarCookies } from '../_legal/BotaoAceitarCookies';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { titulo, tenantNome } = await loadLegalPage(slug, 'cookies');
  return { title: `${titulo} — ${tenantNome}` };
}

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { texto } = await loadLegalPage(slug, 'cookies');
  return (
    <PaginaLegalRender
      texto={texto}
      slug={slug}
      footerExtra={<BotaoAceitarCookies slug={slug} />}
    />
  );
}
