import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { isSuperAdminEmail } from '@/lib/super-admin';
import { CredenciaisClient } from './CredenciaisClient';

export const dynamic = 'force-dynamic';

/**
 * /superadmin/api-keys
 *
 * Painel READ-ONLY do estado das env vars críticas da plataforma.
 * Edição é via CLI/Vercel — nunca via UI (princípio de segurança).
 */

const VARS_CRITICAS = [
  // IA
  { key: 'ANTHROPIC_API_KEY', label: 'Anthropic (Claude Haiku)', grupo: 'IA', critica: true },
  { key: 'OPENAI_API_KEY', label: 'OpenAI (gpt-image-1, gpt-4o-mini)', grupo: 'IA', critica: true },
  { key: 'ELEVENLABS_API_KEY', label: 'ElevenLabs (voz)', grupo: 'IA', critica: false },
  { key: 'REMOTION_API_KEY', label: 'Remotion (vídeo, futuro)', grupo: 'IA', critica: false },
  // n8n
  { key: 'N8N_BASE_URL', label: 'n8n base URL', grupo: 'Automação', critica: true },
  { key: 'N8N_API_KEY', label: 'n8n API key (gerencia workflows via app)', grupo: 'Automação', critica: true },
  { key: 'N8N_WEBHOOK_SECRET', label: 'n8n webhook HMAC secret', grupo: 'Automação', critica: true },
  { key: 'N8N_MASTER_WEBHOOK_PATH', label: 'Path do workflow master (ex: /webhook/imobia-master)', grupo: 'Automação', critica: false },
  { key: 'IMOBIA_INTERNAL_TOKEN', label: 'Token compartilhado n8n→ImobIA (/api/internal/*)', grupo: 'Automação', critica: true },
  { key: 'IMOBIA_PUBLIC_URL', label: 'URL pública do ImobIA (pra n8n alcançar)', grupo: 'Automação', critica: true },
  // WAHA
  { key: 'WAHA_BASE_URL', label: 'WAHA base URL (WhatsApp HTTP API)', grupo: 'WhatsApp', critica: false },
  { key: 'WAHA_API_KEY', label: 'WAHA API key', grupo: 'WhatsApp', critica: false },
  // Pagamento
  { key: 'ASAAS_API_KEY', label: 'Asaas (pagamento)', grupo: 'Pagamento', critica: true },
  { key: 'ASAAS_WEBHOOK_TOKEN', label: 'Asaas webhook token', grupo: 'Pagamento', critica: true },
  // Crypto (cifra das chaves IA por tenant em DB)
  { key: 'MASTER_ENCRYPTION_KEY', label: 'AES-256 master key (cifra agente_ia)', grupo: 'Auth', critica: true },
  // Auth & DB
  { key: 'AUTH_SECRET', label: 'NextAuth secret', grupo: 'Auth', critica: true },
  { key: 'DATABASE_URL', label: 'Postgres connection (Supabase)', grupo: 'Auth', critica: true },
  { key: 'GOOGLE_CLIENT_ID', label: 'Google OAuth client', grupo: 'Auth', critica: false },
  { key: 'GOOGLE_CLIENT_SECRET', label: 'Google OAuth secret', grupo: 'Auth', critica: false },
  // Storage
  { key: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Supabase URL público', grupo: 'Storage', critica: true },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Supabase service role', grupo: 'Storage', critica: true },
] as const;

export default async function CredenciaisPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (!isSuperAdminEmail(session.user.email)) redirect('/dashboard');

  // Server-side: lê env e detecta status
  const status = VARS_CRITICAS.map((v) => {
    const raw = process.env[v.key];
    const present = !!raw && raw.trim().length > 5;
    return {
      ...v,
      present,
      preview: present ? maskValue(raw!) : null,
    };
  });

  // Estatísticas
  const total = status.length;
  const setadas = status.filter((s) => s.present).length;
  const criticasFaltando = status.filter((s) => s.critica && !s.present).length;

  return (
    <CredenciaisClient
      status={status}
      total={total}
      setadas={setadas}
      criticasFaltando={criticasFaltando}
    />
  );
}

function maskValue(v: string): string {
  if (v.length <= 12) return '••••••';
  // Mostra prefixo (sk-, sb-, etc) e últimos 4
  const prefix = v.slice(0, 4);
  const suffix = v.slice(-4);
  return `${prefix}••••${suffix}`;
}
