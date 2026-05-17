import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import MediaKitClient from './MediaKitClient';

export const dynamic = 'force-dynamic';

export default async function MediaKitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const tenantId = (session.user as any).tenantId as string;
  const { id } = await params;

  const [imovel, marca, posts, allImoveis] = await Promise.all([
    prisma.imovel.findFirst({ where: { id, tenantId } }),
    prisma.configMarca.findUnique({ where: { tenantId } }),
    prisma.postGerado.findMany({
      where: { tenantId, imovelId: id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.imovel.findMany({
      where: { tenantId, publicado: true },
      orderBy: { createdAt: 'desc' },
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
  ]);

  if (!imovel) notFound();

  return (
    <MediaKitClient
      imovel={{
        id: imovel.id,
        codigo: imovel.codigo,
        titulo: imovel.titulo,
        capaUrl: imovel.capaUrl,
        imagens: imovel.imagens ?? [],
        cidade: imovel.cidade,
        estado: imovel.estado,
        bairro: imovel.bairro,
        tipo: imovel.tipo as unknown as string,
        operacao: imovel.operacao as unknown as string,
        preco: Number(imovel.preco),
        areaM2: imovel.areaM2 != null ? Number(imovel.areaM2) : 0,
        quartos: imovel.quartos ?? 0,
        banheiros: imovel.banheiros ?? 0,
        vagas: imovel.vagas ?? 0,
        publicado: imovel.publicado,
        postsCount: posts.length,
      }}
      marca={{
        logoUrl: marca?.logoUrl ?? null,
        corPrimaria: marca?.corPrimaria ?? '#3b6cf5',
        corTexto: '#0F172A',
        fonte: 'Inter',
      }}
      postsExistentes={posts.map((p) => {
        const match = /^\[template:([^|\]]+)\|formato:([^\]]+)\]\n?/.exec(p.conteudo ?? '');
        const template = (match?.[1] ?? 'clean') as
          | 'ia' | 'clean' | 'borda' | 'premium' | 'minimal'
          | 'magazine' | 'split' | 'dark' | 'tag' | 'polaroid';
        const formato = match?.[2] ?? 'feed-square';
        const legenda = match ? (p.conteudo ?? '').slice(match[0].length) : (p.conteudo ?? '');
        return {
          id: p.id,
          imovelId: id,
          tipo: p.tipo as unknown as string,
          template,
          formato,
          imageUrl: p.imageUrl,
          legenda,
          carrossel: formato.includes('carrossel'),
          createdAt: p.createdAt.toISOString(),
        };
      })}
      allImoveis={allImoveis.map((i) => ({
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
        areaM2: i.areaM2 != null ? Number(i.areaM2) : 0,
        quartos: i.quartos ?? 0,
        banheiros: i.banheiros ?? 0,
        vagas: i.vagas ?? 0,
        publicado: i.publicado,
        postsCount: i._count.posts,
      }))}
    />
  );
}
