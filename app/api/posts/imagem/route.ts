import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { uploadPostGerado } from '@/lib/storage';
import { resolveAiKey } from '@/lib/ai-keys';
import { guardRate } from '@/lib/rate-limit';
import { logAiCall, estimateCostBrl } from '@/lib/logger';

export const dynamic = 'force-dynamic';
// gpt-image-1 demora — aumenta o timeout do route
export const maxDuration = 90;

/**
 * POST /api/posts/imagem
 *
 * Gera uma arte de marketing imobiliário via OpenAI gpt-image-1,
 * faz upload pro Supabase Storage e retorna a URL pública.
 *
 * Body: {
 *   imovelId: string,           // pra puxar dados do imóvel
 *   formato: 'POST_QUADRADO' | 'POST_VERTICAL' | 'STORY',
 *   estilo?: 'fotografico' | 'minimalista' | 'lifestyle' | 'arquitetonico',
 *   instrucoes?: string,        // override do prompt (opcional)
 * }
 *
 * Retorno: { imageUrl, path, prompt, custoEstimado }
 */

type Formato = 'POST_QUADRADO' | 'POST_VERTICAL' | 'STORY';
type Estilo = 'fotografico' | 'minimalista' | 'lifestyle' | 'arquitetonico';

const SIZE_BY_FORMATO: Record<Formato, '1024x1024' | '1024x1536' | '1536x1024'> = {
  POST_QUADRADO: '1024x1024',
  POST_VERTICAL: '1024x1536',
  STORY: '1024x1536',
};

const ESTILO_PROMPTS: Record<Estilo, string> = {
  fotografico:
    'Profissional, fotografia editorial de imóvel, iluminação natural quente, lente grande angular, composição arquitetônica',
  minimalista:
    'Composição minimalista, paleta de cores reduzida, espaço negativo amplo, geométrico, clean, premium',
  lifestyle:
    'Cena lifestyle aspiracional, ambiente quente e acolhedor, sutil presença humana implícita, hora dourada',
  arquitetonico:
    'Detalhe arquitetônico, ângulo dramático, contraste forte, premium, ênfase em texturas e materiais',
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    const tenantId = (session.user as any).tenantId as string;

    // Rate limit por tenant — gerar imagem custa $$, não pode spam
    const rl = guardRate(req, {
      key: 'posts-imagem',
      identifier: tenantId,
      limit: 10,
      windowMs: 60_000,
    });
    if (rl) return rl;

    // Resolve key: tenant override → master fallback
    const resolved = await resolveAiKey(tenantId, 'openai');
    if (!resolved) {
      return NextResponse.json(
        {
          error:
            'Chave OpenAI não configurada. Adicione em /configuracoes/agente-ia ou peça pro super admin configurar a master.',
        },
        { status: 500 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      imovelId,
      formato = 'POST_QUADRADO',
      estilo = 'fotografico',
      instrucoes,
    } = body as {
      imovelId?: string;
      formato?: Formato;
      estilo?: Estilo;
      instrucoes?: string;
    };

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

    /* ──── Monta prompt ──── */

    const tipoTexto =
      imovel.tipo === 'APARTAMENTO'
        ? 'apartamento residencial'
        : imovel.tipo === 'CASA'
          ? 'casa residencial'
          : imovel.tipo === 'COBERTURA'
            ? 'cobertura de luxo'
            : imovel.tipo === 'STUDIO'
              ? 'studio moderno'
              : imovel.tipo.toLowerCase();
    const localizacao = [imovel.bairro, imovel.cidade]
      .filter(Boolean)
      .join(', ');
    const specs: string[] = [];
    if (imovel.areaM2) specs.push(`${Number(imovel.areaM2)}m²`);
    if (imovel.quartos > 0)
      specs.push(`${imovel.quartos} quarto${imovel.quartos > 1 ? 's' : ''}`);
    if (imovel.banheiros > 0)
      specs.push(`${imovel.banheiros} banheiro${imovel.banheiros > 1 ? 's' : ''}`);
    const amenidadesStr =
      imovel.amenidades && imovel.amenidades.length > 0
        ? imovel.amenidades.slice(0, 5).join(', ')
        : null;

    const promptBase = instrucoes?.trim()
      ? instrucoes.trim()
      : [
          `Imagem profissional de marketing imobiliário pra anúncio de ${tipoTexto}`,
          localizacao ? `localizado em ${localizacao}` : null,
          specs.length > 0 ? `com ${specs.join(', ')}` : null,
          amenidadesStr ? `destaque pra ${amenidadesStr}` : null,
          ESTILO_PROMPTS[estilo],
          `Cores predominantes: ${marca?.corPrimaria ?? 'tons quentes'} e ${marca?.corSecundaria ?? 'neutros sofisticados'}`,
          'Aparência fotográfica realista. SEM texto na imagem. SEM logos. SEM marcas d\'água. SEM pessoas reconhecíveis.',
          'Composição publicitária premium, qualidade editorial.',
        ]
          .filter(Boolean)
          .join('. ');

    /* ──── Chama OpenAI ──── */

    const openai = new OpenAI({ apiKey: resolved.key });
    const size = SIZE_BY_FORMATO[formato];
    const startedAt = Date.now();

    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: promptBase,
      size,
      n: 1,
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      await logAiCall({
        tenantId,
        provider: 'openai-image',
        model: 'gpt-image-1',
        operation: 'image-gen',
        keySource: resolved.source,
        promptPreview: promptBase,
        latencyMs: Date.now() - startedAt,
        status: 'error',
        error: 'OpenAI não retornou b64_json',
      });
      return NextResponse.json(
        { error: 'OpenAI não retornou imagem. Tente novamente.' },
        { status: 502 },
      );
    }

    await logAiCall({
      tenantId,
      provider: 'openai-image',
      model: 'gpt-image-1',
      operation: 'image-gen',
      keySource: resolved.source,
      promptPreview: promptBase,
      costEstimateBrl: estimateCostBrl({
        provider: 'openai-image',
        imageSize: size,
      }),
      latencyMs: Date.now() - startedAt,
      status: 'success',
      metadata: { size, formato, estilo, imovelId },
    });

    /* ──── Upload pro Supabase Storage ──── */

    const buffer = Buffer.from(b64, 'base64');
    const upload = await uploadPostGerado({
      buffer,
      contentType: 'image/png',
      tenantId,
      imovelId,
    });

    return NextResponse.json({
      success: true,
      imageUrl: upload.url,
      path: upload.path,
      prompt: promptBase,
      keySource: resolved.source, // 'tenant' ou 'master' — útil pra debug e billing
      // gpt-image-1 medium quality 1024 ~ R$ 0,17 / 1024x1536 ~ R$ 0,30
      custoEstimadoBRL: size === '1024x1024' ? 0.17 : 0.3,
    });
  } catch (error: any) {
    console.error('[posts/imagem] erro:', error);
    const msg =
      error?.error?.message ||
      error?.message ||
      'Erro ao gerar imagem.';
    const status = error?.status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
