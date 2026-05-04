import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ConteudoClient from './ConteudoClient';

export const dynamic = 'force-dynamic';

export default async function ConteudoPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const tenantId = (session.user as any).tenantId as string;

  const [imoveis, posts] = await Promise.all([
    prisma.imovel.findMany({
      where: { tenantId },
      orderBy: [{ destaque: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        codigo: true,
        titulo: true,
        capaUrl: true,
        cidade: true,
        bairro: true,
        tipo: true,
        operacao: true,
        preco: true,
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
        createdAt: true,
      },
    }),
  ]);

  return (
    <ConteudoClient
      imoveis={imoveis.map((i) => ({
        id: i.id,
        codigo: i.codigo,
        titulo: i.titulo,
        capaUrl: i.capaUrl,
        cidade: i.cidade,
        bairro: i.bairro,
        tipo: i.tipo as unknown as string,
        operacao: i.operacao as unknown as string,
        preco: Number(i.preco),
        publicado: i.publicado,
        postsCount: i._count.posts,
      }))}
      posts={posts.map((p) => ({
        id: p.id,
        imovelId: p.imovelId!,
        tipo: p.tipo as unknown as string,
        imageUrl: p.imageUrl,
        createdAt: p.createdAt.toISOString(),
      }))}
    />
  );
}
