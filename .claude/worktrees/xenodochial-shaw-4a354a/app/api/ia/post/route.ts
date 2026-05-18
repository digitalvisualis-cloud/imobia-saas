import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { imovel, formato, corretorNome, corretorWhatsapp, nomeEmpresa } = body;

  const precoFormatado = `R$ ${Number(imovel.preco).toLocaleString('pt-BR')}`;

  const prompts: Record<string, string> = {
    INSTAGRAM_FEED: `Crie um post para Instagram (feed) para este imóvel. Use emojis relevantes, seja envolvente e termine com CTA e hashtags relevantes do mercado imobiliário brasileiro. Máximo 2200 caracteres.

Imóvel: ${imovel.titulo}
${imovel.quartos} quartos | ${imovel.banheiros} banheiros | ${imovel.vagas} vagas | ${imovel.areaM2}m²
Localização: ${imovel.bairro ? imovel.bairro + ', ' : ''}${imovel.cidade}
Preço: ${precoFormatado}
${imovel.amenidades?.length ? 'Diferenciais: ' + imovel.amenidades.join(', ') : ''}
${corretorNome ? `\nCorretor: ${corretorNome}` : ''}
${corretorWhatsapp ? `WhatsApp: ${corretorWhatsapp}` : ''}`,

    INSTAGRAM_STORIES: `Crie um texto curto e impactante para Instagram Stories sobre este imóvel. Use emojis, seja direto e chame para ação (swipe up ou DM). Máximo 300 caracteres.

${imovel.titulo} | ${precoFormatado} | ${imovel.cidade}`,

    WHATSAPP: `Crie uma mensagem de WhatsApp profissional mas informal para divulgar este imóvel. Seja direto, use emojis com moderação, inclua as informações principais e termine com CTA. Máximo 500 caracteres.

${imovel.titulo} - ${precoFormatado}
${imovel.quartos}q | ${imovel.banheiros}b | ${imovel.vagas}v | ${imovel.areaM2}m²
${imovel.cidade}${imovel.bairro ? ' - ' + imovel.bairro : ''}`,
  };

  const prompt = prompts[formato] ?? prompts['INSTAGRAM_FEED'];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 800,
    temperature: 0.8,
  });

  const conteudo = completion.choices[0]?.message?.content ?? '';

  return NextResponse.json({ conteudo, formato });
}
