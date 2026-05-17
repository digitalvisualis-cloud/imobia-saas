import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Cria client lazy dentro do handler pra evitar avaliar top-level
// durante "next build collecting page data" (Next 16 + Turbopack).
function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * POST /api/posts-lib/upload-thumb
 * Body: { dataUrl: string }   ("data:image/png;base64,...")
 *
 * Faz upload do thumb (PNG ~50-100KB) pro bucket posts-thumbs do Supabase
 * Storage. Caminho: posts-thumbs/{tenantId}/{cuid}.png. Bucket eh publico,
 * retorna URL absoluta.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;

  const body = await req.json().catch(() => null);
  if (!body?.dataUrl || typeof body.dataUrl !== 'string') {
    return NextResponse.json({ error: 'dataUrl obrigatorio' }, { status: 400 });
  }

  const match = /^data:(image\/(png|jpeg|webp));base64,(.+)$/.exec(body.dataUrl);
  if (!match) {
    return NextResponse.json({ error: 'dataUrl invalido (PNG/JPEG/WebP)' }, { status: 400 });
  }
  const mime = match[1];
  const ext = match[2] === 'jpeg' ? 'jpg' : match[2];
  const buffer = Buffer.from(match[3], 'base64');

  if (buffer.byteLength > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'thumb maior que 5MB' }, { status: 413 });
  }

  const id = randomUUID();
  const path = `${tenantId}/${id}.${ext}`;

  const supa = admin();
  const { error } = await supa.storage.from('posts-thumbs').upload(path, buffer, {
    contentType: mime,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: pub } = supa.storage.from('posts-thumbs').getPublicUrl(path);
  return NextResponse.json({ url: pub.publicUrl, path });
}
