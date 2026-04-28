import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    const tenantId = (session.user as any).tenantId as string;
    if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado.' }, { status: 400 });

    const formData = await req.formData();

    const codigo = 'IMV-' + Math.floor(1000 + Math.random() * 9000);
    
    // Dados do imóvel
    const tipo = formData.get('tipo') as string;
    const operacao = formData.get('operacao') as string;
    const cidadeBairro = formData.get('cidadeBairro') as string;
    const endereco = formData.get('endereco') as string;
    const preco = Number(formData.get('preco'));
    const quartos = Number(formData.get('quartos'));
    const banheiros = Number(formData.get('banheiros'));
    const vagas = Number(formData.get('vagas'));
    const area = Number(formData.get('area'));
    const areaTotal = Number(formData.get('areaTotal')) || area; // Fallback para area util se vazio
    const amenidades = JSON.parse(formData.get('amenidades') as string || '[]');
    const descricao = formData.get('descricao') as string;
    const videoUrl = formData.get('videoUrl') as string;

    // ListaPro
    const videoTipo = formData.get('videoTipo') as string;
    const voiceoverVoz = formData.get('voiceoverVoz') as string;
    const voiceoverTom = formData.get('voiceoverTom') as string;
    const voiceoverContexto = formData.get('voiceoverContexto') as string;

    if (!tipo || !operacao) {
      return NextResponse.json({ error: 'Tipo e Operação são obrigatórios.' }, { status: 400 });
    }

    // Split cidadeBairro simples: "Bairro, Cidade"
    const partes = cidadeBairro.split(',').map(s => s.trim());
    const cidade = partes.length > 1 ? partes[1] : partes[0];
    const bairro = partes.length > 1 ? partes[0] : null;

    // Upload das fotos
    const fotos: string[] = [];
    let capaUrl = null;
    
    // Percorre todos os arquivos enviados
    const files = formData.getAll('fotos') as File[];
    
    for (const file of files) {
      if (file.size === 0) continue;
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${tenantId}/${codigo}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data } = await supabase.storage
        .from('imoveis')
        .upload(fileName, file, { upsert: true });
        
      if (data) {
        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/imoveis/${fileName}`;
        fotos.push(url);
        if (!capaUrl) capaUrl = url;
      }
    }

    // Salva no Prisma
    const imovel = await prisma.imovel.create({
      data: {
        tenantId,
        codigo,
        titulo: `${tipo} em ${cidadeBairro}`,
        tipo: tipo.toUpperCase().replace(' ', '_') as any, // "Casa" -> "CASA"
        operacao: operacao.toUpperCase() as any, // "Venda" -> "VENDA"
        cidade,
        bairro,
        endereco,
        preco,
        quartos,
        banheiros,
        vagas,
        areaM2: area,
        areaTotal: areaTotal,
        descricao,
        amenidades,
        imagens: fotos,
        capaUrl,
        videoUrl: videoUrl || null,
        publicado: true,
        // ListaPro
        videoTipo,
        voiceoverVoz,
        voiceoverTom,
        voiceoverContexto,
        statusGeracao: 'RASCUNHO' // Inicializa como rascunho
      }
    });

    return NextResponse.json({ success: true, imovel });

  } catch (error: any) {
    console.error('Erro ao salvar imóvel:', error);
    return NextResponse.json({ error: 'Erro interno ao salvar imóvel' }, { status: 500 });
  }
}
