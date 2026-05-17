/**
 * Dispatcher de alertas de novo imovel pros inscritos da newsletter.
 *
 * Quando corretor cadastra/publica imovel novo, este modulo:
 *  1. Busca inscritos ativos do tenant
 *  2. Filtra os que batem (cidade case-insensitive, tipo, operacao, precoMax)
 *  3. Dispara email pra cada um (via lib/email — Resend)
 *  4. Atualiza ultimoEnvio na inscricao
 *
 * Roda em background — chamado com fire-and-forget no POST /api/imoveis
 * pra nao atrasar a resposta do form de cadastro.
 */

import { prisma } from './prisma';
import { sendEmail } from './email';

interface ImovelMinimo {
  id: string;
  codigo: string;
  titulo: string;
  tipo: string;
  operacao: string;
  preco: number;
  cidade: string;
  bairro: string | null;
  quartos: number;
  banheiros: number;
  vagas: number;
  areaM2: number | null;
  capaUrl: string | null;
  imagens: string[];
}

function formatPrice(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function buildHtml({
  imovel,
  tenantNome,
  siteUrl,
  unsubscribeUrl,
}: {
  imovel: ImovelMinimo;
  tenantNome: string;
  siteUrl: string;
  unsubscribeUrl: string;
}): string {
  const isAluguel = imovel.operacao === 'ALUGUEL';
  const opLabel = isAluguel ? 'Aluguel' : 'À venda';
  const sufixo = isAluguel ? '/mês' : '';
  const imgUrl = imovel.capaUrl ?? imovel.imagens[0] ?? '';
  const local = imovel.bairro ? `${imovel.bairro} · ${imovel.cidade}` : imovel.cidade;
  const specs: string[] = [];
  if (imovel.quartos > 0) specs.push(`${imovel.quartos} quarto${imovel.quartos > 1 ? 's' : ''}`);
  if (imovel.banheiros > 0) specs.push(`${imovel.banheiros} banh.`);
  if (imovel.vagas > 0) specs.push(`${imovel.vagas} vaga${imovel.vagas > 1 ? 's' : ''}`);
  if (imovel.areaM2) specs.push(`${imovel.areaM2}m²`);

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1917;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.05);">
      ${
        imgUrl
          ? `<img src="${imgUrl}" alt="${imovel.titulo}" style="display:block;width:100%;height:240px;object-fit:cover;" />`
          : ''
      }
      <div style="padding:20px;">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#78716c;">
          Novo imóvel · ${opLabel}
        </p>
        <h1 style="margin:0 0 6px;font-size:22px;line-height:1.2;font-weight:700;">${imovel.titulo}</h1>
        <p style="margin:0 0 14px;font-size:13px;color:#78716c;">${local}</p>
        ${specs.length ? `<p style="margin:0 0 14px;font-size:13px;color:#44403c;">${specs.join(' · ')}</p>` : ''}
        <p style="margin:0 0 18px;font-size:22px;font-weight:700;color:#1c1917;">
          ${formatPrice(imovel.preco)}<span style="font-size:13px;font-weight:400;color:#78716c;">${sufixo}</span>
        </p>
        <a href="${siteUrl}" style="display:inline-block;background:#1c1917;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
          Ver imóvel completo →
        </a>
      </div>
    </div>
    <p style="margin:18px 0 0;font-size:11px;color:#a8a29e;text-align:center;line-height:1.5;">
      Você está recebendo este e-mail porque assinou os alertas de novos imóveis da ${tenantNome}.<br/>
      <a href="${unsubscribeUrl}" style="color:#a8a29e;text-decoration:underline;">Cancelar inscrição</a>
    </p>
  </div>
</body>
</html>`;
}

/**
 * Dispara emails pros inscritos cujos filtros batem com o imovel.
 * Retorna # de emails efetivamente enviados (ou que cairam no log fallback).
 */
export async function dispatchNewsletterForImovel(imovelId: string): Promise<number> {
  try {
    const imovel = await prisma.imovel.findUnique({
      where: { id: imovelId },
      select: {
        id: true,
        codigo: true,
        titulo: true,
        tipo: true,
        operacao: true,
        preco: true,
        cidade: true,
        bairro: true,
        quartos: true,
        banheiros: true,
        vagas: true,
        areaM2: true,
        capaUrl: true,
        imagens: true,
        publicado: true,
        tenantId: true,
        tenant: {
          select: {
            id: true,
            slug: true,
            marca: { select: { nomeEmpresa: true } },
          },
        },
      },
    });

    if (!imovel || !imovel.publicado) {
      console.log('[newsletter] imovel nao encontrado ou nao publicado:', imovelId);
      return 0;
    }

    // Busca inscritos ativos do tenant e filtra em memoria (mais simples
    // que SQL composto, e a base de inscritos eh pequena no inicio).
    const inscritos = await prisma.newsletterInscricao.findMany({
      where: { tenantId: imovel.tenantId, ativo: true },
    });

    const precoNum = Number(imovel.preco);
    const matches = inscritos.filter((i) => {
      // Cidade: bate se nao filtrou OU se inscrito.cidade === imovel.cidade (case-insensitive)
      if (i.cidadeInteresse) {
        if (i.cidadeInteresse.toLowerCase() !== imovel.cidade.toLowerCase()) return false;
      }
      if (i.tipoInteresse && i.tipoInteresse !== imovel.tipo) return false;
      if (i.operacaoInteresse && i.operacaoInteresse !== imovel.operacao) return false;
      if (i.precoMax && Number(i.precoMax) < precoNum) return false;
      return true;
    });

    if (matches.length === 0) {
      console.log('[newsletter] nenhum inscrito bate com o imovel', imovel.codigo);
      return 0;
    }

    const tenantNome = imovel.tenant.marca?.nomeEmpresa ?? imovel.tenant.slug;
    const baseUrl = process.env.IMOBIA_PUBLIC_URL ?? '';
    const siteUrl = `${baseUrl}/s/${imovel.tenant.slug}/imovel/${imovel.codigo}`;
    const subject = `Novo imóvel: ${imovel.titulo} — ${formatPrice(precoNum)}`;

    let enviados = 0;
    for (const inscrito of matches) {
      const unsubscribeUrl = `${baseUrl}/s/${imovel.tenant.slug}/newsletter/cancelar?id=${inscrito.id}`;
      const html = buildHtml({
        imovel: {
          ...imovel,
          preco: precoNum,
          areaM2: imovel.areaM2 ? Number(imovel.areaM2) : null,
        },
        tenantNome,
        siteUrl,
        unsubscribeUrl,
      });
      const res = await sendEmail({ to: inscrito.email, subject, html });
      if (res.ok || res.skipped) {
        enviados++;
        // Atualiza ultimoEnvio mesmo no fallback skip (registra que processamos)
        await prisma.newsletterInscricao.update({
          where: { id: inscrito.id },
          data: { ultimoEnvio: new Date() },
        });
      }
    }
    console.log(`[newsletter] ${enviados}/${matches.length} alertas processados pro imovel ${imovel.codigo}`);
    return enviados;
  } catch (e: any) {
    console.error('[newsletter] erro no dispatcher:', e);
    return 0;
  }
}
