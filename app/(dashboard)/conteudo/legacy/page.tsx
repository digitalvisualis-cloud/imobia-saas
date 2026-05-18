import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ConteudoClient from './ConteudoClient';

export const dynamic = 'force-dynamic';

export default async function ConteudoPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const tenantId = (session.user as any).tenantId as string;

  const [imoveis, posts, tenant] = await Promise.all([
    prisma.imovel.findMany({
      where: { tenantId },
      orderBy: [{ destaque: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        codigo: true,
        titulo: true,
        capaUrl: true,
        imagens: true,
        cidade: true,
        estado: true,
        bairro: true,
        tipo: true,
        operacao: true,
        preco: true,
        areaM2: true,
        quartos: true,
        banheiros: true,
        vagas: true,
        publicado: true,
        _count: { select: { posts: true } },
      },
    }),
    prisma.postGerado.findMany({
      where: { tenantId, imovelId: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        imovelId: true,
        tipo: true,
        imageUrl: true,
        conteudo: true,
        createdAt: true,
      },
    }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { marca: true },
    }),
  ]);

  const marca = (tenant?.marca ?? {}) as Record<string, unknown>;
  const customizacao = {
    corPrincipal: (marca.corPrimaria as string) ?? '#3b6cf5',
    corTexto: (marca.corTexto as string) ?? '#0F172A',
    fonte: (marca.fonte as string) ?? 'Inter',
    logoUrl: (marca.logoUrl as string) ?? null,
  };

  return (
    <ConteudoClient
      imoveis={imoveis.map((i) => ({
        id: i.id,
        codigo: i.codigo,
        titulo: i.titulo,
        capaUrl: i.capaUrl,
        imagens: i.imagens ?? [],
        cidade: i.cidade,
        estado: i.estado,
        bairro: i.bairro,
        tipo: i.tipo as unknown as string,
        operacao: i.operacao as unknown as string,
        preco: Number(i.preco),
        areaM2: i.areaM2 ? Number(i.areaM2) : 0,
        quartos: i.quartos ?? 0,
        banheiros: i.banheiros ?? 0,
        vagas: i.vagas ?? 0,
        publicado: i.publicado,
        postsCount: i._count.posts,
      }))}
      posts={posts.map((p) => {
        // O endpoint /api/posts persiste template+formato como prefixo no
        // conteudo: "[template:ia|formato:story]\nlegenda…". Extrai aqui.
        const match = /^\[template:([^|\]]+)\|formato:([^\]]+)\]\n?/.exec(p.conteudo ?? '');
        const template = (match?.[1] ?? 'clean') as
          | 'ia' | 'clean' | 'borda' | 'premium' | 'minimal'
          | 'magazine' | 'split' | 'dark' | 'tag' | 'polaroid';
        const formato = match?.[2] ?? 'feed-square';
        const legenda = match ? (p.conteudo ?? '').slice(match[0].length) : (p.conteudo ?? '');
        return {
          id: p.id,
          imovelId: p.imovelId!,
          tipo: p.tipo as unknown as string,
          template,
          formato,
          imageUrl: p.imageUrl,
          legenda,
          carrossel: formato.includes('carrossel'),
          createdAt: p.createdAt.toISOString(),
        };
      })}
      customizacao={customizacao}
    />
  );
}
