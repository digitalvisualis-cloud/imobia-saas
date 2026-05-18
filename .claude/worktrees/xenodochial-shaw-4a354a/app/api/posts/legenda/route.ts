import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/posts/legenda
 *
 * Gera legenda inteligente de marketing imobiliário pra Instagram usando
 * gpt-4o-mini. Recebe imovelId + (opcional) tom desejado, busca os dados
 * do imóvel e do tenant no banco, monta o prompt e retorna a legenda.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    const tenantId = (session.user as any).tenantId as string;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY não configurada no servidor.' },
        { status: 500 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const { imovelId, tom } = body as { imovelId?: string; tom?: string };

    if (!imovelId) {
      return NextResponse.json(
        { error: 'imovelId é obrigatório.' },
        { status: 400 },
      );
    }

    const [imovel, marca] = await Promise.all([
      prisma.imovel.findFirst({ where: { id: imovelId, tenantId } }),
      prisma.configMarca.findUnique({ where: { tenantId } }),
    ]);

    if (!imovel) {
      return NextResponse.json(
        { error: 'Imóvel não encontrado.' },
        { status: 404 },
      );
    }

    const especificacoes: string[] = [];
    if (imovel.areaM2) especificacoes.push(`${Number(imovel.areaM2)} m² de área útil`);
    if (imovel.quartos > 0)
      especificacoes.push(
        `${imovel.quartos} quarto${imovel.quartos > 1 ? 's' : ''}`,
      );
    if (imovel.suites > 0)
      especificacoes.push(
        `${imovel.suites} suíte${imovel.suites > 1 ? 's' : ''}`,
      );
    if (imovel.banheiros > 0)
      especificacoes.push(
        `${imovel.banheiros} banheiro${imovel.banheiros > 1 ? 's' : ''}`,
      );
    if (imovel.vagas > 0)
      especificacoes.push(`${imovel.vagas} vaga${imovel.vagas > 1 ? 's' : ''}`);

    const localizacao = [imovel.bairro, imovel.cidade].filter(Boolean).join(', ');
    const operacaoTexto =
      imovel.operacao === 'VENDA'
        ? 'à venda'
        : imovel.operacao === 'ALUGUEL'
          ? 'para alugar'
          : 'para temporada';

    const tipoTexto =
      imovel.tipo === 'APARTAMENTO'
        ? 'apartamento'
        : imovel.tipo === 'CASA'
          ? 'casa'
          : imovel.tipo === 'COBERTURA'
            ? 'cobertura'
            : imovel.tipo.toLowerCase();

    const tomDesc = tom || 'sofisticado e convidativo';

    const preco = Number(imovel.preco).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    const empresa = marca?.nomeEmpresa ?? '';
    const whatsapp = marca?.whatsapp ?? '';

    const prompt = `Você é um copywriter sênior de marketing imobiliário. Escreve para Instagram de imobiliárias brasileiras. Tom: ${tomDesc}.

Crie uma LEGENDA DE INSTAGRAM (não uma descrição de site) para o imóvel abaixo. A legenda deve:
- Começar com 1 frase de impacto que prende atenção (use emoji apenas se fizer sentido com o imóvel)
- Ter 2 a 3 parágrafos curtos
- Destacar o estilo de vida/benefício, não só os dados (ex: em vez de "150m²", diga "espaço pra família crescer")
- Mencionar o bairro com personalidade (use referência da região se for conhecida)
- Terminar com chamada pra ação clara
- Incluir 6 a 10 hashtags relevantes na última linha (mistura: marca, bairro, cidade, tipo, lifestyle)
- NUNCA use clichês como "oportunidade única", "imperdível", "casa dos sonhos"
- Português do Brasil
- Máximo 1200 caracteres no total
- Use no máximo 2-3 emojis bem escolhidos

DADOS DO IMÓVEL:
- Título: ${imovel.titulo}
- Tipo: ${tipoTexto}
- Operação: ${operacaoTexto}
- Localização: ${localizacao || 'a confirmar'}
- Especificações: ${especificacoes.join(', ') || 'a confirmar'}
- Diferenciais: ${(imovel.amenidades ?? []).join(', ') || 'a confirmar'}
- Descrição já existente: ${imovel.descricao ?? 'sem descrição'}
- Preço: ${preco}
${empresa ? `- Imobiliária: ${empresa}` : ''}
${whatsapp ? `- WhatsApp da imobiliária: wa.me/${whatsapp.replace(/\D/g, '')}` : ''}

Retorne APENAS o texto da legenda. Nada antes, nada depois. Sem aspas, sem markdown.`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.85, // mais criatividade que descrição de site
      max_tokens: 700,
    });

    const legenda = response.choices[0]?.message?.content?.trim();
    if (!legenda) {
      return NextResponse.json(
        { error: 'A IA não retornou conteúdo. Tente novamente.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ legenda });
  } catch (error: any) {
    console.error('[posts/legenda] erro:', error);
    const msg =
      error?.error?.message ||
      error?.message ||
      'Erro desconhecido ao chamar a OpenAI.';
    const status = error?.status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
