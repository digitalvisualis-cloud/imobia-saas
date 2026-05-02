/**
 * Clientes Supabase.
 *
 * Pra UPLOAD DE IMAGENS: NÃO use esse arquivo. Use a API server-side:
 *   - POST   /api/imoveis/[id]/fotos    — upload de fotos do imóvel
 *   - PATCH  /api/imoveis/[id]/fotos    — set-capa, reorder
 *   - DELETE /api/imoveis/[id]/fotos    — remover foto
 *
 * Implementação real em `lib/storage.ts` (server-only, service_role).
 */

import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase pro browser (anon key).
 * Hoje só usado pra realtime/auth fallback — uploads vão pelas APIs server-side.
 *
 * Se NEXT_PUBLIC_SUPABASE_ANON_KEY estiver vazio, esse client lança erro
 * só quando alguém tentar usar — então tá ok deixar exportado.
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
);

/**
 * Cliente Supabase server-side com service_role.
 * SÓ EM ROTAS API ou Server Actions — nunca no browser.
 */
export const supabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

// Re-exports das funções server-side (compat com imports antigos).
export {
  uploadFotoImovel,
  removeFotoImovel,
  uploadAssetMarca,
} from "./storage";
