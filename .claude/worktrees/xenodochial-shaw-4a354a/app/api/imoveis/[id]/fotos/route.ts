import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadFotoImovel, removeFotoImovel } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Limite por arquivo (25MB) — bate com o bucket no Supabase
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_MIME = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

/**
 * GET /api/imoveis/[id]/fotos
 * Retorna a lista de URLs e a capa atual do imóvel.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const tenantId = (session.user as any).tenantId;
  const { id } = await ctx.params;

  const imovel = await prisma.imovel.findFirst({
    where: { id, tenantId },
    select: {
      id: true,
      titulo: true,
      codigo: true,
      imagens: true,
      capaUrl: true,
    },
  });
  if (!imovel) {
    return NextResponse.json(
      { error: "Imóvel não encontrado" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    imovelId: imovel.id,
    titulo: imovel.titulo,
    codigo: imovel.codigo,
    imagens: imovel.imagens ?? [],
    capaUrl: imovel.capaUrl,
  });
}

/**
 * POST /api/imoveis/[id]/fotos
 * Upload de uma ou mais fotos via multipart/form-data.
 * Field: "files" (pode aparecer N vezes).
 *
 * - Se o imóvel ainda não tem capa, a primeira foto enviada vira capa.
 * - As URLs são adicionadas ao final do array `imagens`.
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const tenantId = (session.user as any).tenantId;
  const { id } = await ctx.params;

  // Garante que o imóvel existe e é do tenant
  const imovel = await prisma.imovel.findFirst({
    where: { id, tenantId },
    select: { id: true, imagens: true, capaUrl: true },
  });
  if (!imovel) {
    return NextResponse.json(
      { error: "Imóvel não encontrado" },
      { status: 404 },
    );
  }

  // Parse multipart
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Body inválido (esperado multipart/form-data)" },
      { status: 400 },
    );
  }

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json(
      { error: 'Nenhum arquivo recebido (campo "files")' },
      { status: 400 },
    );
  }

  // Valida cada arquivo
  for (const f of files) {
    if (!ALLOWED_MIME.includes(f.type)) {
      return NextResponse.json(
        { error: `Tipo não permitido: ${f.type} (${f.name})` },
        { status: 415 },
      );
    }
    if (f.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Arquivo muito grande: ${f.name} (max 25MB)` },
        { status: 413 },
      );
    }
  }

  // Upload em paralelo
  const uploaded: { url: string; path: string }[] = [];
  const errors: string[] = [];

  await Promise.all(
    files.map(async (file) => {
      try {
        const buf = Buffer.from(await file.arrayBuffer());
        const result = await uploadFotoImovel({
          buffer: buf,
          contentType: file.type,
          tenantId,
          imovelId: id,
        });
        uploaded.push(result);
      } catch (e: any) {
        errors.push(`${file.name}: ${e.message ?? "erro desconhecido"}`);
      }
    }),
  );

  if (uploaded.length === 0) {
    return NextResponse.json(
      { error: "Nenhuma foto foi enviada", details: errors },
      { status: 500 },
    );
  }

  // Atualiza imovel.imagens (append) + capa (se vazia)
  const novasUrls = uploaded.map((u) => u.url);
  const imagensAtualizadas = [...(imovel.imagens ?? []), ...novasUrls];
  const novaCapaUrl = imovel.capaUrl ?? novasUrls[0];

  const updated = await prisma.imovel.update({
    where: { id },
    data: {
      imagens: imagensAtualizadas,
      capaUrl: novaCapaUrl,
    },
    select: { imagens: true, capaUrl: true },
  });

  return NextResponse.json({
    ok: true,
    uploaded: novasUrls,
    imagens: updated.imagens,
    capaUrl: updated.capaUrl,
    errors: errors.length > 0 ? errors : undefined,
  });
}

/**
 * DELETE /api/imoveis/[id]/fotos?url=https://...
 * Remove uma foto específica do array + apaga do Storage.
 * Se a foto removida era a capa, define a primeira restante como nova capa.
 */
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const tenantId = (session.user as any).tenantId;
  const { id } = await ctx.params;

  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json(
      { error: "Query param 'url' obrigatório" },
      { status: 400 },
    );
  }

  const imovel = await prisma.imovel.findFirst({
    where: { id, tenantId },
    select: { imagens: true, capaUrl: true },
  });
  if (!imovel) {
    return NextResponse.json(
      { error: "Imóvel não encontrado" },
      { status: 404 },
    );
  }

  const imagens = (imovel.imagens ?? []).filter((u) => u !== url);
  let capaUrl = imovel.capaUrl;
  if (capaUrl === url) {
    capaUrl = imagens[0] ?? null;
  }

  await prisma.imovel.update({
    where: { id },
    data: { imagens, capaUrl },
  });

  // best-effort delete no Storage (não bloqueia se falhar)
  removeFotoImovel(url).catch(() => {});

  return NextResponse.json({ ok: true, imagens, capaUrl });
}

/**
 * PATCH /api/imoveis/[id]/fotos
 *
 * Body: { action: 'set-capa', url: string }
 *     | { action: 'reorder', imagens: string[] }
 */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const tenantId = (session.user as any).tenantId;
  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  if (!body || !body.action) {
    return NextResponse.json(
      { error: "Body precisa de { action: 'set-capa'|'reorder' }" },
      { status: 400 },
    );
  }

  const imovel = await prisma.imovel.findFirst({
    where: { id, tenantId },
    select: { imagens: true, capaUrl: true },
  });
  if (!imovel) {
    return NextResponse.json(
      { error: "Imóvel não encontrado" },
      { status: 404 },
    );
  }

  if (body.action === "set-capa") {
    if (typeof body.url !== "string" || body.url.length === 0) {
      return NextResponse.json(
        { error: "url ausente" },
        { status: 400 },
      );
    }
    if (!(imovel.imagens ?? []).includes(body.url)) {
      return NextResponse.json(
        { error: "Foto não pertence a esse imóvel" },
        { status: 400 },
      );
    }
    const updated = await prisma.imovel.update({
      where: { id },
      data: { capaUrl: body.url },
      select: { imagens: true, capaUrl: true },
    });
    return NextResponse.json({ ok: true, ...updated });
  }

  if (body.action === "reorder") {
    if (!Array.isArray(body.imagens)) {
      return NextResponse.json(
        { error: "imagens precisa ser array de URLs" },
        { status: 400 },
      );
    }
    // valida que são exatamente as mesmas URLs (sem invenção/remoção)
    const set = new Set(imovel.imagens ?? []);
    const novaSet = new Set(body.imagens as string[]);
    if (
      set.size !== novaSet.size ||
      [...set].some((u) => !novaSet.has(u))
    ) {
      return NextResponse.json(
        { error: "Reorder não pode adicionar/remover fotos — use POST/DELETE" },
        { status: 400 },
      );
    }
    const updated = await prisma.imovel.update({
      where: { id },
      data: { imagens: body.imagens },
      select: { imagens: true, capaUrl: true },
    });
    return NextResponse.json({ ok: true, ...updated });
  }

  return NextResponse.json({ error: "action desconhecida" }, { status: 400 });
}
