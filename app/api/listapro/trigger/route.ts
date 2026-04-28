import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { imovelId, assets, dados } = await req.json();

    if (!imovelId) {
      return NextResponse.json({ error: 'imovelId é obrigatório' }, { status: 400 });
    }

    // Marca o imóvel como GERANDO
    const imovel = await prisma.imovel.update({
      where: { id: imovelId },
      data: {
        statusGeracao: 'GERANDO',
        // Opcionalmente atualizar o timestamp
        geradoAt: new Date(),
      }
    });

    // AQUI ENTRARIA A CHAMADA REAL PARA O N8N WEBHOOK
    // ex: fetch('https://seu-n8n.com/webhook/listapro', { method: 'POST', body: JSON.stringify({ imovel, assets }) })

    return NextResponse.json({ success: true, status: 'GERANDO' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
