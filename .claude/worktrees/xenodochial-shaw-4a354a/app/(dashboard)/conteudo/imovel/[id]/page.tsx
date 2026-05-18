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

  const [imovel, marca, posts] = await Promise.all([
    prisma.imovel.findFirst({
      where: { id, tenantId },
    }),
    prisma.configMarca.findUnique({ where: { tenantId } }),
    prisma.postGerado.findMany({
      where: { tenantId, imovelId: id },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  if (!imovel) notFound();

  return (
    <MediaKitClient
      imovel={{
        id: imovel.id,
        codigo: imovel.codigo,
        titulo: imovel.titulo,
        tipo: imovel.tipo as unknown as string,
        operacao: imovel.operacao as unknown as string,
        preco: Number(imovel.preco),
        bairro: imovel.bairro,
        cidade: imovel.cidade,
        estado: imovel.estado,
        capaUrl: imovel.capaUrl,
        imagens: imovel.imagens ?? [],
        areaM2: imovel.areaM2 != null ? Number(imovel.areaM2) : null,
        quartos: imovel.quartos,
        banheiros: imovel.banheiros,
        vagas: imovel.vagas,
        amenidades: imovel.amenidades ?? [],
      }}
      marca={{
        nomeEmpresa: marca?.nomeEmpresa ?? null,
        logoUrl: marca?.logoUrl ?? null,
        corPrimaria: marca?.corPrimaria ?? '#c5a64f',
        corSecundaria: marca?.corSecundaria ?? '#1a2e1a',
        whatsapp: marca?.whatsapp ?? null,
        instagram: marca?.instagram ?? null,
      }}
      postsExistentes={posts.map((p) => ({
        id: p.id,
        tipo: p.tipo as unknown as string,
        conteudo: p.conteudo,
        imageUrl: p.imageUrl,
        createdAt: p.createdAt.toISOString(),
      }))}
    />
  );
}
