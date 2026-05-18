/**
 * Cliente minimalista de email (Resend HTTP API).
 *
 * Sem SDK — usa fetch() puro pra evitar dep extra. Se RESEND_API_KEY nao
 * estiver setado, faz log no console e retorna { ok: false } (degradacao
 * graceful — nao quebra o fluxo principal de cadastro de imovel).
 */

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  /** Sobrescreve EMAIL_FROM. Use pra by-passar quando tem dominio verificado por tenant. */
  from?: string;
  replyTo?: string;
}

interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
  skipped?: boolean;
}

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const DEFAULT_FROM = process.env.EMAIL_FROM ?? 'ImobIA Alertas <onboarding@resend.dev>';

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('[email] RESEND_API_KEY ausente — pulando envio.', {
      to: params.to,
      subject: params.subject,
    });
    return { ok: false, skipped: true, error: 'RESEND_API_KEY ausente' };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: params.from ?? DEFAULT_FROM,
        to: params.to,
        subject: params.subject,
        html: params.html,
        ...(params.replyTo ? { reply_to: params.replyTo } : {}),
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.error('[email] Resend respondeu erro:', res.status, txt);
      return { ok: false, error: `Resend ${res.status}: ${txt.slice(0, 200)}` };
    }

    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id };
  } catch (e: any) {
    console.error('[email] Erro inesperado:', e);
    return { ok: false, error: e.message ?? 'unknown' };
  }
}
