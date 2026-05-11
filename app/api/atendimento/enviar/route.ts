import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendImage, sendText, sendVoice, sessionName } from '@/lib/whatsapp/waha';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/atendimento/enviar
 *
 * Corretor manda mensagem pelo dashboard ImobIA.
 * Salva no banco como `direcao=OUT, autorTipo=HUMANO` e dispara
 * envio no provider.
 *
 * Body:
 *   {
 *     conversaId: string,
 *     tipo: 'TEXTO' | 'IMAGEM' | 'AUDIO',
 *     conteudo?: string,           // texto OU caption
 *     anexoUrl?: string,           // pra IMAGEM ou AUDIO
 *     anexoMime?: string
 *   }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const tenantId = (session.user as any).tenantId as string;
  const userId = (session.user as any).id as string;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Body invalido' }, { status: 400 });

  const { conversaId, tipo, conteudo, anexoUrl, anexoMime } = body as Record<string, any>;
  if (!conversaId || !tipo) {
    return NextResponse.json(
      { error: 'conversaId e tipo obrigatorios' },
      { status: 400 },
    );
  }

  const conversa = await prisma.conversa.findFirst({
    where: { id: conversaId, tenantId },
  });
  if (!conversa) {
    return NextResponse.json({ error: 'Conversa nao encontrada' }, { status: 404 });
  }
  if (conversa.status === 'FECHADA') {
    return NextResponse.json({ error: 'Conversa fechada' }, { status: 409 });
  }

  const name = conversa.providerInstance || sessionName(tenantId);

  // Envia no provider
  let providerMsgId: string | undefined;
  try {
    if (conversa.providerType === 'WAHA') {
      if (tipo === 'TEXTO') {
        if (!conteudo) throw new Error('conteudo obrigatorio pra TEXTO');
        const r = await sendText({ session: name, to: conversa.clienteWa, text: conteudo });
        providerMsgId = r.id;
      } else if (tipo === 'IMAGEM') {
        if (!anexoUrl) throw new Error('anexoUrl obrigatorio pra IMAGEM');
        const r = await sendImage({
          session: name,
          to: conversa.clienteWa,
          url: anexoUrl,
          caption: conteudo,
        });
        providerMsgId = r.id;
      } else if (tipo === 'AUDIO') {
        if (!anexoUrl) throw new Error('anexoUrl obrigatorio pra AUDIO');
        const r = await sendVoice({ session: name, to: conversa.clienteWa, url: anexoUrl });
        providerMsgId = r.id;
      } else {
        return NextResponse.json({ error: `Tipo nao suportado: ${tipo}` }, { status: 400 });
      }
    } else {
      // Evolution e Cloud API serao implementados depois
      return NextResponse.json(
        { error: `Provider ${conversa.providerType} ainda nao suportado` },
        { status: 501 },
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'erro envio';
    return NextResponse.json({ error: `Falha no provider: ${msg}` }, { status: 502 });
  }

  // Persiste mensagem como saida humana
  const mensagem = await prisma.mensagem.create({
    data: {
      conversaId,
      tenantId,
      direcao: 'OUT',
      autorTipo: 'HUMANO',
      autorId: userId,
      tipo: tipo as any,
      conteudo: String(conteudo ?? ''),
      anexoUrl: anexoUrl ?? null,
      anexoMime: anexoMime ?? null,
      providerMsgId: providerMsgId ?? null,
    },
  });

  await prisma.conversa.update({
    where: { id: conversaId },
    data: { ultimaMsgEm: new Date() },
  });

  return NextResponse.json({ mensagemId: mensagem.id, providerMsgId });
}
