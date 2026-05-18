import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB — limite Whisper

// Schema dos campos que o GPT vai extrair. Usa strict mode da OpenAI —
// todas as keys precisam estar em `required`, valores ausentes vem como null.
// Os enums espelham as opcoes do form em /imoveis/novo (display strings,
// nao os codes do Prisma) pra preencher direto sem mapear.
const IMOVEL_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    tipo: {
      type: ['string', 'null'],
      enum: ['Casa', 'Apartamento', 'Cobertura', 'Studio', 'Terreno', 'Sala Comercial', 'Loja', 'Galpão', 'Chácara', 'Sítio', null],
      description: 'Tipo do imóvel. null se o áudio não disser claramente.',
    },
    operacao: {
      type: ['string', 'null'],
      enum: ['Venda', 'Aluguel', 'Temporada', null],
      description: 'Operação. Quando "vende"/"venda" → Venda. "aluga"/"locação" → Aluguel.',
    },
    bairro: { type: ['string', 'null'], description: 'Bairro mencionado.' },
    cidade: { type: ['string', 'null'], description: 'Cidade mencionada.' },
    estado: { type: ['string', 'null'], description: 'Sigla UF (2 letras maiúsculas). Ex: SP, RJ.' },
    preco: {
      type: ['number', 'null'],
      description: 'Preço em reais, apenas o número. "850 mil" → 850000. "1.2 milhão" → 1200000.',
    },
    quartos: { type: ['number', 'null'] },
    suites: { type: ['number', 'null'] },
    banheiros: { type: ['number', 'null'] },
    vagas: { type: ['number', 'null'], description: 'Vagas de garagem.' },
    areaM2: {
      type: ['number', 'null'],
      description: 'Área útil/privativa em m². Apenas o número.',
    },
    areaTotal: {
      type: ['number', 'null'],
      description: 'Área total em m² se mencionada SEPARADAMENTE da área útil.',
    },
    caracteristicas: {
      type: 'array',
      items: { type: 'string' },
      description: 'Lista de características/diferenciais mencionados. Ex: ["Piscina", "Churrasqueira", "Mobiliado"].',
    },
    descricao: {
      type: ['string', 'null'],
      description: 'Descrição corrida do imóvel — 1-2 parágrafos curtos, em português natural, usando o que o corretor falou. null se ele só listou dados crus.',
    },
  },
  required: [
    'tipo', 'operacao', 'bairro', 'cidade', 'estado',
    'preco', 'quartos', 'suites', 'banheiros', 'vagas',
    'areaM2', 'areaTotal', 'caracteristicas', 'descricao',
  ],
};

const SYSTEM_PROMPT = `Você extrai dados estruturados de descrições faladas de imóveis em português brasileiro.

Regras:
- Use null pra campos não mencionados. NÃO invente.
- Valores numéricos: extraia apenas o número (sem "m²", sem "R$", sem pontos de milhar)
- Características: liste só o que foi EXPLICITAMENTE mencionado. Não infira de "casa boa" ou "imóvel bonito".
- Tipo: mapeie pra um dos valores do enum. Se o corretor disse "apê", "ape", "apto" → Apartamento. "casa térrea", "sobrado" → Casa.
- Operação: "vende", "venda", "à venda" → Venda. "aluga", "locação", "para alugar" → Aluguel. "temporada" → Temporada.
- Estado (UF): só preencha se a cidade for clara — ex: "Atibaia" → SP, "Porto Alegre" → RS. Em dúvida, null.
- Descrição: gere 1-2 parágrafos curtos em PT-BR natural, terceira pessoa, vendendo o imóvel. Não copie a fala literal — reescreva como anúncio. null se o corretor só listou dados sem narrativa.`;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Form data invalido' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Field "file" obrigatorio' }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `Audio maior que ${MAX_FILE_SIZE / 1024 / 1024}MB` },
      { status: 413 },
    );
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // 1) Whisper — transcricao do audio
  let transcricao: string;
  try {
    const r = await openai.audio.transcriptions.create({
      file: file as any, // SDK aceita File da Web API
      model: 'whisper-1',
      language: 'pt',
    });
    transcricao = r.text.trim();
  } catch (e: any) {
    console.error('[voz] Whisper error:', e);
    return NextResponse.json(
      { error: 'Erro ao transcrever áudio: ' + (e?.message ?? 'desconhecido') },
      { status: 500 },
    );
  }

  if (!transcricao) {
    return NextResponse.json(
      { error: 'Não consegui entender o áudio. Tenta de novo falando mais perto do microfone.' },
      { status: 400 },
    );
  }

  // 2) GPT — extrai campos estruturados via JSON schema strict
  let dados: any;
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'imovel_extraido',
          strict: true,
          schema: IMOVEL_SCHEMA,
        },
      },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Transcrição do áudio do corretor:\n\n"${transcricao}"\n\nExtraia os campos.`,
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error('GPT não retornou conteúdo');
    dados = JSON.parse(raw);
  } catch (e: any) {
    console.error('[voz] GPT extract error:', e);
    return NextResponse.json(
      { error: 'Erro ao extrair dados: ' + (e?.message ?? 'desconhecido'), transcricao },
      { status: 500 },
    );
  }

  return NextResponse.json({ transcricao, dados });
}
