import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ConteudoClient from './ConteudoClient';
import {
  prismaImovelToLovable,
  prismaMarcaToLovable,
} from '@/app/_post-templates/lovable/adapter';

export const dynamic = 'force-dynamic';

/**
 * /conteudo — F-Lovable. Editor de posts usando a engine portada do
 * post-magic-builder (14 templates novos, render nativo 1080px,
 * tipografia em --u sem hack de scale 3x).
 *
 * O editor antigo continua disponivel em /conteudo/legacy ate o Pablo
 * confirmar que esta tudo OK e ai a gente apaga.
 */
export default async function ConteudoPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const tenantId = (session.user as any).tenantId as string;

  const [imoveisRaw, marca] = await Promise.all([
    prisma.imovel.findMany({
      where: { tenantId, publicado: true },
      orderBy: [{ destaque: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        codigo: true,
        titulo: true,
        descricao: true,
        operacao: true,
        preco: true,
        cidade: true,
        bairro: true,
        endereco: true,
        quartos: true,
        suites: true,
        banheiros: true,
        vagas: true,
        areaM2: true,
        imagens: true,
        capaUrl: true,
      },
    }),
    prisma.configMarca.findUnique({
      where: { tenantId },
      select: {
        id: true,
        nomeEmpresa: true,
        whatsapp: true,
        corPrimaria: true,
        corSecundaria: true,
        logoUrl: true,
      },
    }),
  ]);

  const imoveis = imoveisRaw.map((i) =>
    prismaImovelToLovable({
      ...i,
      operacao: i.operacao as unknown as string,
    }),
  );
  const marcaLovable = prismaMarcaToLovable(marca, tenantId);

  return <ConteudoClient imoveis={imoveis} marca={marcaLovable} />;
}
