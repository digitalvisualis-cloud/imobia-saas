import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const MAP_TIPO: Record<string, string> = {
  'Casa': 'CASA',
  'Apartamento': 'APARTAMENTO',
  'Cobertura': 'COBERTURA',
  'Studio': 'STUDIO',
  'Terreno': 'TERRENO',
  'Sala Comercial': 'SALA_COMERCIAL',
  'Loja': 'LOJA',
  'Galpão': 'GALPAO',
  'Chácara': 'CHACARA',
  'Sítio': 'SITIO',
  // legacy
  'Comercial': 'SALA_COMERCIAL',
};

const MAP_OPERACAO: Record<string, string> = {
  'Venda': 'VENDA',
  'Aluguel': 'ALUGUEL',
  'Temporada': 'TEMPORADA',
};

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    const tenantId = (session.user as any).tenantId as string;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant não encontrado.' }, { status: 400 });
    }

    const formData = await req.formData();

    const codigo = 'IMV-' + Math.floor(1000 + Math.random() * 9000);

    const tipoStr = (formData.get('tipo') as string) || '';
    const operacaoStr = (formData.get('operacao') as string) || '';
    if (!tipoStr || !operacaoStr) {
      return NextResponse.json(
        { error: 'Tipo e operação são obrigatórios.' },
        { status: 400 },
      );
    }
    const tipo = MAP_TIPO[tipoStr] ?? tipoStr.toUpperCase().replace(/[^A-Z]/g, '_');
    const operacao = MAP_OPERACAO[operacaoStr] ?? operacaoStr.toUpperCase();

    // Localização
    const cep = (formData.get('cep') as string) || '';
    const endereco = (formData.get('endereco') as string) || '';
    const bairro = (formData.get('bairro') as string) || null;
    const cidade =
      (formData.get('cidade') as string) ||
      // fallback: split do cidadeBairro legacy "Bairro, Cidade"
      (formData.get('cidadeBairro') as string)?.split(',').map((s) => s.trim()).pop() ||
      '';
    const estado = (formData.get('estado') as string) || 'SP';

    if (!cidade) {
      return NextResponse.json({ error: 'Cidade é obrigatória.' }, { status: 400 });
    }

    // Preço & specs
    const preco = Number(formData.get('preco'));
    const quartos = Number(formData.get('quartos') ?? 0);
    const suites = Number(formData.get('suites') ?? 0);
    const banheiros = Number(formData.get('banheiros') ?? 0);
    const vagas = Number(formData.get('vagas') ?? 0);
    const area = Number(formData.get('area') ?? 0);
    const areaTotal = Number(formData.get('areaTotal')) || area;

    if (!preco || isNaN(preco)) {
      return NextResponse.json({ error: 'Preço é obrigatório.' }, { status: 400 });
    }

    // Características
    const caracteristicasRaw = formData.get('amenidades') as string;
    const amenidades = caracteristicasRaw ? JSON.parse(caracteristicasRaw) : [];

    const descricao = (formData.get('descricao') as string) || '';
    const videoUrl = (formData.get('videoUrl') as string) || null;

    // Cria imóvel
    const imovel = await prisma.imovel.create({
      data: {
        tenantId,
        codigo,
        titulo: `${tipoStr}${bairro ? ` em ${bairro}` : cidade ? ` em ${cidade}` : ''}`,
        tipo: tipo as any,
        operacao: operacao as any,
        cep: cep || null,
        endereco: endereco || null,
        cidade,
        bairro,
        estado,
        preco,
        quartos,
        suites,
        banheiros,
        vagas,
        areaM2: area,
        areaTotal,
        descricao,
        amenidades,
        imagens: [],
        capaUrl: null,
        videoUrl,
        publicado: true,
        statusGeracao: 'RASCUNHO',
      },
    });

    return NextResponse.json({ success: true, imovel });
  } catch (error: any) {
    console.error('Erro ao salvar imóvel:', error);
    return NextResponse.json(
      { error: error.message ?? 'Erro interno ao salvar imóvel' },
      { status: 500 },
    );
  }
}
