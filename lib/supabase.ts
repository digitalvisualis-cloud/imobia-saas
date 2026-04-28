import { createClient } from '@supabase/supabase-js';

// Client-side (public)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server-side (service role — só no servidor!)
export const supabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

// Upload de imagem para o bucket 'imoveis'
export async function uploadImagem(
  file: File,
  tenantId: string,
  path?: string
): Promise<string> {
  const ext = file.name.split('.').pop();
  const filePath = path ?? `${tenantId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('imoveis')
    .upload(filePath, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from('imoveis').getPublicUrl(filePath);
  return data.publicUrl;
}

// Upload de asset de marca (logo, favicon)
export async function uploadMarca(
  file: File,
  tenantId: string,
  tipo: 'logo' | 'favicon' | 'manual'
): Promise<string> {
  const ext = file.name.split('.').pop();
  const filePath = `${tenantId}/${tipo}.${ext}`;

  const { error } = await supabase.storage
    .from('site-assets')
    .upload(filePath, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from('site-assets').getPublicUrl(filePath);
  return data.publicUrl;
}
