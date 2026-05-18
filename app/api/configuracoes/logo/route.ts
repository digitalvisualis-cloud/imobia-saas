import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { uploadAssetMarca } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB — logo nao precisa ser grande
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];

/**
 * POST /api/configuracoes/logo
 *
 * multipart/form-data com field "file". Sobe pro bucket site-assets como
 * `${tenantId}/logo.{ext}` e ja persiste a URL em ConfigMarca.logoUrl.
 *
 * Retorna: { url }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const tenantId = (session.user as any).tenantId as string;

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
      { error: `Arquivo maior que ${MAX_FILE_SIZE / 1024 / 1024}MB` },
      { status: 413 },
    );
  }

  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json(
      { error: `Tipo nao suportado: ${file.type}. Use PNG, JPG, WEBP ou SVG.` },
      { status: 415 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { url } = await uploadAssetMarca({
    buffer,
    contentType: file.type,
    tenantId,
    tipo: 'logo',
  });

  // Persiste direto em ConfigMarca — assim o logo fica salvo mesmo se o
  // usuario nao clicar "Salvar" na secao de marca depois
  await prisma.configMarca.upsert({
    where: { tenantId },
    update: { logoUrl: url },
    create: { tenantId, logoUrl: url },
  });

  return NextResponse.json({ url });
}
