import type { Metadata } from 'next';
import { loadLegalPage } from '../_legal/loader';
import { PaginaLegalRender } from '../_legal/PaginaLegalRender';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { titulo, tenantNome } = await loadLegalPage(slug, 'privacidade');
  return { title: `${titulo} — ${tenantNome}` };
}

export default async function PrivacidadePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { texto } = await loadLegalPage(slug, 'privacidade');
  return <PaginaLegalRender texto={texto} />;
}
