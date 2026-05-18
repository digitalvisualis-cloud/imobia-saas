import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

/**
 * POST /api/blog/gerar-imagem
 *
 * Body: { titulo: string, resumo?: string }
 *
 * Gera URL de capa pra artigo de blog usando Pollinations.ai. Antes
 * chama gpt-4o-mini com o titulo+resumo pra criar um prompt de imagem
 * em ingles otimizado pra fotografia imobiliaria.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.titulo !== 'string' || !body.titulo.trim()) {
    return NextResponse.json({ error: 'titulo obrigatorio.' }, { status: 400 });
  }
  const titulo = body.titulo.trim();
  const resumo = body.resumo?.trim() ?? '';

  // Gera prompt em ingles via GPT (melhor qualidade visual no Pollinations)
  let imagePrompt = `professional real estate photography, ${titulo}, natural lighting, magazine quality`;

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const openai = new OpenAI({ apiKey });
      const r = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.6,
        messages: [
          {
            role: 'system',
            content:
              'You generate concise image prompts in English for AI image generators. Style: professional real estate or lifestyle photography. Output only the prompt, no quotes, no explanation. Max 30 words.',
          },
          {
            role: 'user',
            content: `Generate an image prompt for a blog article cover. Title: "${titulo}"${resumo ? `\nSummary: ${resumo}` : ''}\nFocus: realistic photo, never illustration. Include "professional real estate photography" prefix.`,
          },
        ],
      });
      const text = r.choices[0]?.message?.content?.trim();
      if (text) imagePrompt = text.slice(0, 250);
    } catch (e) {
      // Fallback no prompt default
      console.error('[blog/gerar-imagem] GPT prompt falhou, usando fallback', e);
    }
  }

  // Pollinations URL — retorna PNG direto
  const capaUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1200&height=800&nologo=true&seed=${Math.floor(Math.random() * 99999)}`;
  return NextResponse.json({ capaUrl, imagePrompt });
}
