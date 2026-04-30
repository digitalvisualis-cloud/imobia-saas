import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY não configurada no servidor.' },
        { status: 500 },
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const body = await req.json();
    const {
      tipo,
      operacao,
      cidadeBairro,
      bairro,
      cidade,
      quartos,
      suites,
      banheiros,
      vagas,
      area,
      areaTotal,
      amenidades,
    } = body;

    const localizacao =
      cidadeBairro || [bairro, cidade].filter(Boolean).join(', ') || 'Não informado';

    const especificacoes: string[] = [];
    if (area) especificacoes.push(`${area} m² de área útil`);
    if (areaTotal && areaTotal !== area) especificacoes.push(`${areaTotal} m² de área total`);
    if (quartos > 0) especificacoes.push(`${quartos} quarto${quartos > 1 ? 's' : ''}`);
    if (suites > 0) especificacoes.push(`${suites} suíte${suites > 1 ? 's' : ''}`);
    if (banheiros > 0) especificacoes.push(`${banheiros} banheiro${banheiros > 1 ? 's' : ''}`);
    if (vagas > 0) especificacoes.push(`${vagas} vaga${vagas > 1 ? 's' : ''} de garagem`);

    const prompt = `Você é um copywriter especialista em imóveis no Brasil. Escreve em português-BR.
Crie uma descrição persuasiva e elegante de 2 a 3 parágrafos curtos (máximo 800 caracteres no total)
para o anúncio do imóvel abaixo. Não use saudações, não inclua dados de contato, não use clichês como
"oportunidade única". Foque em benefícios concretos, em quem vai morar/usar o imóvel.

DADOS:
- Tipo: ${tipo || 'imóvel'}
- Operação: ${operacao || 'venda'}
- Localização: ${localizacao}
- Especificações: ${especificacoes.join(', ') || 'a confirmar'}
- Características e diferenciais: ${
      amenidades && amenidades.length > 0 ? amenidades.join(', ') : 'a confirmar'
    }

REGRAS:
- Português do Brasil
- Tom elegante mas acessível
- Sem emojis
- Sem hashtags
- Apenas o texto da descrição, nada antes ou depois`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    const descricao = response.choices[0]?.message?.content?.trim();
    if (!descricao) {
      return NextResponse.json(
        { error: 'A IA não retornou conteúdo. Tente novamente.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ descricao });
  } catch (error: any) {
    console.error('[ia/descricao] erro:', error);
    // Devolve a mensagem real pro cliente conseguir debugar
    const msg =
      error?.error?.message ||
      error?.message ||
      'Erro desconhecido ao chamar a OpenAI.';
    const status = error?.status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
