import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/blog/gerar-ia
 *
 * Body: { topico: string, cidadeAlvo?: string }
 *
 * Gera rascunho de artigo de blog imobiliario com base no topico. Retorna
 * { titulo, resumo, conteudoMd, metaTitle, metaDescription, tags }
 * pra preencher direto o editor.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;

  const body = await req.json().catch(() => null);
  if (!body || typeof body.topico !== 'string' || !body.topico.trim()) {
    return NextResponse.json({ error: 'topico obrigatorio.' }, { status: 400 });
  }
  const topico = body.topico.trim();
  const cidadeAlvo = body.cidadeAlvo?.trim() ?? '';

  // Busca contexto do tenant pra personalizar (nome empresa, cidades dos imoveis)
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { marca: { select: { nomeEmpresa: true } } },
  });
  const empresa = tenant?.marca?.nomeEmpresa ?? '';

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY ausente' }, { status: 500 });
  }
  const openai = new OpenAI({ apiKey });

  const prompt = `Voce e um jornalista freelancer de cadernos imobiliarios da Folha/Estadao. Voce esta escrevendo uma materia investigativa de blog pra uma imobiliaria local, NAO um post de IA. Escreva o artigo abaixo seguindo essas regras inegociaveis:

REGRAS DE ESTILO (CRITICO):
- Frases curtas misturadas com frases longas. Ritmo de jornalismo.
- Use dados concretos quando fizer sentido (taxa Selic atual, dados do Secovi/Fipe, % de valorizacao tipica) — invente numeros realistas se nao souber, mas evite numeros aleatorios.
- Cite fontes ou referencias quando couber: "segundo o Secovi-SP", "dados do Sindicato da Habitacao".
- ZERO clicheis de IA. Lista de frases BANIDAS:
  · "no mundo dinamico do mercado imobiliario"
  · "vale a pena considerar"
  · "uma jornada de oportunidades"
  · "imaginar a possibilidade de"
  · "em um cenario cada vez mais"
  · "concluindo, podemos afirmar que"
  · "em suma" / "em resumo"
- Pode comecar com uma anedota, dado surpreendente ou pergunta provocadora. NUNCA comece com "Voce ja parou pra pensar" ou similar.
- Use ## pra subtitulos. Nao mais de 4 secoes.
- Conclusao curta (2-3 frases), nao recapitula tudo.
- CTA final natural — uma frase indicando que a${empresa ? ` ${empresa}` : ' imobiliaria'} pode ajudar com aquele caso especifico. Sem "entre em contato hoje mesmo" generico.
- Use voz ativa. Evite "pode-se afirmar", "deve-se considerar". Prefira "muita gente faz", "vale lembrar".
- 600-800 palavras.

OBJETIVO SEO:
- Densidade de palavras-chave de cauda longa relacionada ao nicho imobiliario${cidadeAlvo ? ` em ${cidadeAlvo}` : ''}
- Mencionar nomes de bairros conhecidos se topico for sobre cidade especifica

Topico: "${topico}"${cidadeAlvo ? `\nCidade alvo: ${cidadeAlvo}` : ''}

Retorne JSON com:
- titulo (string, ate 70 chars — pode ser provocativo, nao precisa repetir o topico literalmente)
- resumo (string, ate 160 chars — chamada que da vontade de ler)
- conteudoMd (string, corpo em markdown)
- metaTitle (string, ate 60 chars — SEO friendly)
- metaDescription (string, ate 160 chars)
- tags (array ate 5 strings)
- imagePrompt (string EM INGLES, ate 200 chars — descreve a foto ideal pra ilustrar o artigo. Estilo: "professional real estate photography, [scene], natural lighting, magazine quality")`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Voce e jornalista freelancer brasileiro de cadernos imobiliarios. Escreve com voz humana, ritmo de jornal. Sempre responde em JSON valido.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.9, // mais alto pra estilo menos previsivel
    });
    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);

    // Gera capa via Pollinations (gratis, sem API key, sem quota).
    // URL eh direta — basta encode o prompt. PNG retornado pelo URL.
    const imagePrompt = String(parsed.imagePrompt ?? `professional real estate photography ${topico}, natural lighting, magazine quality`).slice(0, 200);
    const capaUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1200&height=800&nologo=true`;

    return NextResponse.json({
      titulo: String(parsed.titulo ?? '').slice(0, 200),
      resumo: String(parsed.resumo ?? '').slice(0, 300),
      conteudoMd: String(parsed.conteudoMd ?? ''),
      metaTitle: String(parsed.metaTitle ?? '').slice(0, 70),
      metaDescription: String(parsed.metaDescription ?? '').slice(0, 200),
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5).map(String) : [],
      capaUrl,
    });
  } catch (e: any) {
    console.error('[blog/gerar-ia]', e);
    return NextResponse.json({ error: e.message ?? 'Erro ao gerar' }, { status: 500 });
  }
}
