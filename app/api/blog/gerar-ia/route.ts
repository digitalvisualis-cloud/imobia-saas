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

  const prompt = `Voce e um redator especialista em SEO imobiliario brasileiro. Gere um artigo de blog em portugues do Brasil sobre o topico abaixo. O artigo deve:
- Ter ate 800 palavras, tom natural e direto (sem "embarcar numa viagem", sem clicheis de IA)
- Ter densidade de palavras-chave de cauda longa relevantes pro nicho imobiliario${cidadeAlvo ? ` em ${cidadeAlvo}` : ''}
- Incluir subtitulos com ## (H2) pra estruturar
- Citar dados praticos quando fizer sentido (sem inventar numeros precisos)
- Terminar com um CTA suave pra contatar a imobiliaria${empresa ? ` (${empresa})` : ''}
- Ser editavel — nao usar bold/italico em excesso

Topico: "${topico}"${cidadeAlvo ? `\nCidade alvo: ${cidadeAlvo}` : ''}

Retorne JSON com:
- titulo (string, ate 70 caracteres, com chamado SEO)
- resumo (string, ate 160 caracteres, vira meta description tambem)
- conteudoMd (string, o corpo em markdown completo, com H2/H3)
- metaTitle (string, ate 60 caracteres)
- metaDescription (string, ate 160 caracteres)
- tags (array de ate 5 strings)`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Voce e um redator SEO imobiliario brasileiro. Sempre responde em JSON valido.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });
    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);
    return NextResponse.json({
      titulo: String(parsed.titulo ?? '').slice(0, 200),
      resumo: String(parsed.resumo ?? '').slice(0, 300),
      conteudoMd: String(parsed.conteudoMd ?? ''),
      metaTitle: String(parsed.metaTitle ?? '').slice(0, 70),
      metaDescription: String(parsed.metaDescription ?? '').slice(0, 200),
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5).map(String) : [],
    });
  } catch (e: any) {
    console.error('[blog/gerar-ia]', e);
    return NextResponse.json({ error: e.message ?? 'Erro ao gerar' }, { status: 500 });
  }
}
