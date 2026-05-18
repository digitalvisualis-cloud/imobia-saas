import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID ausente' }, { status: 400 });

    const imovel = await prisma.imovel.findUnique({ where: { id } });
    if (!imovel) return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 });

    // Simulação do Job N8N (Se estiver GERANDO há mais de 10 segundos, muda pra PRONTO)
    if (imovel.statusGeracao === 'GERANDO' && imovel.geradoAt) {
      const elapsedSeconds = (new Date().getTime() - new Date(imovel.geradoAt).getTime()) / 1000;
      
      if (elapsedSeconds > 10) {
        const mockResultado = {
          pdf_url: 'https://imobia.io/assets/mock-ficha.pdf',
          post_url: 'https://imobia.io/assets/mock-post.png',
          story_url: 'https://imobia.io/assets/mock-story.png',
          reels_url: 'https://imobia.io/assets/mock-reels.mp4',
          copy: 'Olha que incrível essa oportunidade! 🏡✨\n\n' + imovel.titulo + ' por apenas R$ ' + Number(imovel.preco).toLocaleString('pt-BR') + '.\n\n#Imoveis #Oportunidade #Imobia'
        };

        const updated = await prisma.imovel.update({
          where: { id },
          data: {
            statusGeracao: 'PRONTO',
            formatosGerados: mockResultado as any
          }
        });

        return NextResponse.json({ status: 'PRONTO', resultado: mockResultado });
      }
    }

    return NextResponse.json({ status: imovel.statusGeracao, resultado: imovel.formatosGerados });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
