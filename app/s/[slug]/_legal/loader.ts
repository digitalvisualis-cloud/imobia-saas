import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import {
  templatePoliticaPrivacidade,
  templateTermosUso,
  templatePoliticaCookies,
  type DadosTenantParaTemplate,
} from '@/lib/templates-legais';

export type LegalPageData = {
  texto: string;
  titulo: string;
  tenantNome: string;
};

/**
 * Carrega o texto de uma pagina legal do tenant pelo slug. Se o tenant
 * nao tiver texto custom salvo, renderiza o template padrao interpolado.
 */
export async function loadLegalPage(
  slug: string,
  qual: 'privacidade' | 'termos' | 'cookies',
): Promise<LegalPageData> {
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { marca: true, site: true },
  });

  if (!tenant || !tenant.site?.publicado) notFound();

  const dados: DadosTenantParaTemplate = {
    nomeEmpresa: tenant.marca?.nomeEmpresa ?? tenant.slug,
    email: tenant.marca?.email ?? '',
    cidade: tenant.marca?.endereco ?? '',
  };

  let textoSalvo: string | null | undefined;
  let titulo: string;
  let textoTemplate: string;

  if (qual === 'privacidade') {
    textoSalvo = tenant.marca?.politicaPrivacidade;
    titulo = 'Política de Privacidade';
    textoTemplate = templatePoliticaPrivacidade(dados);
  } else if (qual === 'termos') {
    textoSalvo = tenant.marca?.termosUso;
    titulo = 'Termos de Uso';
    textoTemplate = templateTermosUso(dados);
  } else {
    textoSalvo = tenant.marca?.politicaCookies;
    titulo = 'Política de Cookies';
    textoTemplate = templatePoliticaCookies(dados);
  }

  return {
    texto: textoSalvo?.trim() ? textoSalvo : textoTemplate,
    titulo,
    tenantNome: dados.nomeEmpresa,
  };
}
