/**
 * Gera URLs do WhatsApp Click-to-Chat com mensagem pré-preenchida.
 *
 * Uso típico:
 *   - Card de imóvel no site: link com código pra agente IA reconhecer
 *   - Botão "Falar no WhatsApp" geral: link sem código (saudação genérica)
 *
 * O agente IA no n8n vai parsear o código `[CÓDIGO IMV-XXX]` da mensagem
 * via regex e usar pra puxar contexto do imóvel via /api/internal/lead-context.
 *
 * IMPORTANTE: o código tem que aparecer EXATO entre colchetes pra o regex
 * do n8n pegar. Não mexer no formato sem atualizar o regex no workflow.
 *
 * Regex esperado pelo n8n: /\[\s*([A-Z]{3,4}-[A-Z0-9-]+)\s*\]/i
 */

type WaLinkOpts = {
  /** Número do WhatsApp da imobiliária — formato livre, função normaliza */
  whatsapp: string;
  /** Mensagem livre, ou monta default baseado no imóvel */
  mensagem?: string;
  /** Se passado, vira deep link de imóvel específico */
  imovel?: {
    codigo: string;
    titulo: string;
    bairro?: string | null;
    cidade?: string | null;
  };
  /** Nome da imobiliária — pra mensagem genérica ficar mais humana */
  nomeEmpresa?: string;
};

/**
 * Limpa número e retorna só dígitos. Aceita "+55 11 99999-9999", "(11) 9999...", etc.
 * Retorna empty se número inválido.
 */
export function normalizeWhatsappNumber(raw: string | null | undefined): string {
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  // Brasil: 11 dígitos sem DDI; 13 com DDI 55
  if (digits.length === 11) digits = `55${digits}`;
  else if (digits.length === 10) digits = `55${digits}`;
  if (digits.length < 10 || digits.length > 15) return '';
  return digits;
}

export function buildWhatsappLink(opts: WaLinkOpts): string {
  const numero = normalizeWhatsappNumber(opts.whatsapp);
  if (!numero) return '#';

  let mensagem: string;

  if (opts.mensagem) {
    mensagem = opts.mensagem;
  } else if (opts.imovel) {
    const local = [opts.imovel.bairro, opts.imovel.cidade]
      .filter(Boolean)
      .join(', ');
    mensagem = `Olá! Tenho interesse no imóvel [${opts.imovel.codigo}] - ${opts.imovel.titulo}${local ? ` (${local})` : ''}. Pode me passar mais informações?`;
  } else {
    const empresa = opts.nomeEmpresa ? ` da ${opts.nomeEmpresa}` : '';
    mensagem = `Olá! Vi o site${empresa} e gostaria de conhecer os imóveis disponíveis.`;
  }

  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

/**
 * Extrai código de imóvel de uma mensagem do WhatsApp.
 * Retorna null se não encontrar.
 *
 * Match: "[IMV-VLS-101]" → "IMV-VLS-101"
 *        "[ AP-12 ]"     → "AP-12"
 *        "Olá [APV-99]!" → "APV-99"
 */
export function extractImovelCodigo(mensagem: string): string | null {
  if (!mensagem) return null;
  const match = mensagem.match(/\[\s*([A-Z]{2,5}-[A-Z0-9-]+)\s*\]/i);
  return match ? match[1].toUpperCase() : null;
}
