import type { TenantContext } from './PublicLayout';
import { buildWhatsappLink } from '@/lib/whatsapp-link';
import styles from './whatsapp-button.module.css';

/**
 * Botão flutuante geral do site público.
 * Mensagem genérica — agente IA cumprimenta e qualifica.
 *
 * Pra botão ESPECÍFICO de imóvel (com código), usa <ImovelWhatsAppLink/> ou
 * monta direto com `buildWhatsappLink({ imovel: { codigo, titulo } })`.
 */
export function WhatsAppButton({ tenant }: { tenant: TenantContext }) {
  const wa = tenant.marca?.whatsapp;
  if (!wa) return null;

  const href = buildWhatsappLink({
    whatsapp: wa,
    nomeEmpresa: tenant.marca?.nomeEmpresa ?? undefined,
  });

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.btn}
      aria-label="Falar no WhatsApp"
    >
      <svg viewBox="0 0 32 32" width="28" height="28" fill="currentColor" aria-hidden="true">
        <path d="M16.001 2.667C8.638 2.667 2.668 8.637 2.668 16c0 2.345.62 4.553 1.71 6.467l-1.78 6.475 6.624-1.738a13.27 13.27 0 0 0 6.78 1.864h.005c7.36 0 13.33-5.969 13.333-13.331C29.34 8.638 23.367 2.667 16 2.667zm0 24.396h-.004a11.07 11.07 0 0 1-5.642-1.546l-.405-.241-4.198 1.102 1.118-4.094-.263-.418A11.06 11.06 0 0 1 4.937 16C4.94 9.86 9.873 4.93 16.005 4.93c2.964 0 5.748 1.156 7.84 3.255a10.99 10.99 0 0 1 3.252 7.831c-.003 6.14-4.94 11.067-11.097 11.067zm6.06-8.286c-.331-.166-1.964-.97-2.27-1.082-.305-.111-.527-.166-.748.167-.221.332-.857 1.082-1.05 1.303-.193.222-.387.249-.717.083-.331-.166-1.4-.516-2.668-1.647-.987-.88-1.652-1.967-1.846-2.298-.193-.331-.02-.51.146-.674.149-.149.331-.387.497-.581.166-.193.221-.331.331-.553.111-.221.055-.414-.027-.581-.083-.166-.748-1.798-1.025-2.464-.27-.648-.544-.56-.748-.57l-.637-.012c-.221 0-.581.083-.886.414-.305.331-1.163 1.137-1.163 2.77 0 1.633 1.19 3.21 1.358 3.434.166.221 2.343 3.578 5.679 5.018.793.343 1.413.547 1.896.7.797.253 1.521.218 2.094.132.639-.095 1.964-.802 2.241-1.578.276-.776.276-1.44.193-1.578-.083-.139-.305-.222-.637-.387z"/>
      </svg>
      <span className={styles.label}>WhatsApp</span>
    </a>
  );
}
