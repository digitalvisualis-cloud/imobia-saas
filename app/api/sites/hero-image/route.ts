import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadAssetMarca } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB pra hero
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * POST /api/sites/hero-image
 * multipart/form-data com field "file". Sobe pro bucket site-assets como
 * `${tenantId}/hero-banner.{ext}`. Retorna a URL pra ser salva em
 * configBrisa.hero.imageUrl ou configAura.hero.imageUrl.
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
      { error: `Tipo nao suportado: ${file.type}` },
      { status: 415 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { url } = await uploadAssetMarca({
    buffer,
    contentType: file.type,
    tenantId,
    tipo: 'hero-banner',
  });

  return NextResponse.json({ url });
}
