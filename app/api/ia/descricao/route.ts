import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Chave da OpenAI não configurada.' }, { status: 500 });
    }

    const { tipo, operacao, cidadeBairro, quartos, banheiros, vagas, area, amenidades } = await req.json();

    const prompt = `Você é um corretor de imóveis experiente e redator publicitário de alto nível.
Crie uma descrição atraente e persuasiva (com no máximo 3 parágrafos curtos) para um anúncio de imóvel.
Utilize os seguintes dados fornecidos:
- Tipo: ${tipo || 'Não especificado'}
- Operação: ${operacao || 'Não especificado'}
- Localização: ${cidadeBairro || 'Não especificado'}
- Área: ${area ? area + 'm²' : 'Não especificado'}
- Quartos: ${quartos || 0}
- Banheiros: ${banheiros || 0}
- Vagas de garagem: ${vagas || 0}
- Amenidades/Diferenciais: ${amenidades && amenidades.length > 0 ? amenidades.join(', ') : 'Nenhum informado'}

A linguagem deve ser voltada para converter visitantes em leads (compradores ou locatários), destacando os benefícios do imóvel. Evite clichês e não inclua saudações ou dados de contato, foque apenas no imóvel.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 400,
    });

    const descricao = response.choices[0].message.content;

    return NextResponse.json({ descricao });
  } catch (error: any) {
    console.error('Erro ao gerar descrição:', error);
    return NextResponse.json({ error: 'Erro ao conectar com a IA.' }, { status: 500 });
  }
}
