/**
 * Helpers de upload no Supabase Storage.
 * Tudo server-side com service_role. Nunca chamar do browser direto.
 *
 * Buckets:
 *   - imoveis     → fotos dos imóveis (max 25MB, JPEG/PNG/WebP/GIF)
 *   - site-assets → logo/favicon/banners (max 10MB, +SVG/ICO)
 *
 * Path convention:
 *   imoveis/{tenantId}/{imovelId}/{uuid}.{ext}
 *   site-assets/{tenantId}/logo.{ext}
 *   site-assets/{tenantId}/favicon.{ext}
 *   site-assets/{tenantId}/hero-banner.{ext}
 */

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function extFromMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
    case "image/jpg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/svg+xml":
      return "svg";
    case "image/x-icon":
      return "ico";
    default:
      throw new Error(`MIME não suportado: ${mime}`);
  }
}

/**
 * Upload de foto de imóvel.
 * Retorna a URL pública.
 */
export async function uploadFotoImovel(opts: {
  buffer: Buffer | ArrayBuffer | Uint8Array;
  contentType: string;
  tenantId: string;
  imovelId: string;
}): Promise<{ url: string; path: string }> {
  if (!ALLOWED_IMAGE_MIME.has(opts.contentType)) {
    throw new Error(`Tipo de imagem não permitido: ${opts.contentType}`);
  }

  const ext = extFromMime(opts.contentType);
  const path = `${opts.tenantId}/${opts.imovelId}/${randomUUID()}.${ext}`;

  const sb = admin();
  const { error } = await sb.storage.from("imoveis").upload(
    path,
    opts.buffer as ArrayBuffer,
    {
      contentType: opts.contentType,
      upsert: false,
    },
  );

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = sb.storage.from("imoveis").getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/**
 * Remove foto do Storage (a partir da URL pública).
 */
export async function removeFotoImovel(publicUrl: string): Promise<void> {
  // extrai o path: .../storage/v1/object/public/imoveis/{tenantId}/{imovelId}/{uuid}.ext
  const marker = "/storage/v1/object/public/imoveis/";
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) {
    // não é URL desse bucket, ignora
    return;
  }
  const path = publicUrl.substring(idx + marker.length);
  const sb = admin();
  await sb.storage.from("imoveis").remove([path]);
}

/**
 * Upload de imagem de post gerado pela IA (OpenAI Image).
 * Bucket "imoveis" é reusado — path separa por /posts.
 * Retorna URL pública.
 */
export async function uploadPostGerado(opts: {
  buffer: Buffer | ArrayBuffer | Uint8Array;
  contentType: string;
  tenantId: string;
  imovelId?: string;
}): Promise<{ url: string; path: string }> {
  const ext = opts.contentType === 'image/png' ? 'png' : 'jpg';
  const filename = `${randomUUID()}.${ext}`;
  const path = opts.imovelId
    ? `${opts.tenantId}/posts/${opts.imovelId}/${filename}`
    : `${opts.tenantId}/posts/_geral/${filename}`;

  const sb = admin();
  const { error } = await sb.storage
    .from('imoveis')
    .upload(path, opts.buffer as ArrayBuffer, {
      contentType: opts.contentType,
      upsert: false,
    });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = sb.storage.from('imoveis').getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/**
 * Upload de asset de marca (logo, favicon, banner).
 * tipo determina o filename — sobrescreve a versão anterior automaticamente.
 */
export async function uploadAssetMarca(opts: {
  buffer: Buffer | ArrayBuffer | Uint8Array;
  contentType: string;
  tenantId: string;
  tipo: "logo" | "favicon" | "hero-banner" | "logo-dark";
}): Promise<{ url: string; path: string }> {
  const ext = extFromMime(opts.contentType);
  const path = `${opts.tenantId}/${opts.tipo}.${ext}`;

  const sb = admin();
  const { error } = await sb.storage.from("site-assets").upload(
    path,
    opts.buffer as ArrayBuffer,
    {
      contentType: opts.contentType,
      upsert: true, // sobrescreve a versão anterior
    },
  );

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  // Adiciona timestamp pra invalidar CDN
  const { data } = sb.storage.from("site-assets").getPublicUrl(path);
  return { url: `${data.publicUrl}?t=${Date.now()}`, path };
}
