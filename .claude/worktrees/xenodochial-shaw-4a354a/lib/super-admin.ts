/**
 * Super Admin = quem é da equipe Visualis Digital e enxerga o painel de
 * plataforma (tenants, logs IA/API, chaves globais, doc API, planos).
 *
 * Diferente do `Role` do User (ADMIN/CORRETOR/VIEWER) que é admin DENTRO
 * de um tenant. Super admin atravessa todos os tenants.
 *
 * Config via env: SUPER_ADMIN_EMAILS="pablo@visualis.com,andre@visualis.com"
 * Default fallback inclui pablomedinafilmes@gmail.com.
 */

const DEFAULT_SUPER_ADMINS = ['pablomedinafilmes@gmail.com'];

export function getSuperAdminEmails(): string[] {
  const fromEnv = (process.env.SUPER_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return fromEnv.length > 0 ? fromEnv : DEFAULT_SUPER_ADMINS;
}

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return getSuperAdminEmails().includes(email.toLowerCase());
}
