'use client';

import { useState } from 'react';
import { Send, Check } from 'lucide-react';

interface LeadFormProps {
  slug: string;
  imovelId?: string;
  /** Texto inicial do campo "mensagem" — ex "Olá, tenho interesse no imóvel IMV-1234" */
  defaultMessage?: string;
  /** Variante visual:
   *  - 'light': bg branco, bordas cinza (default — sidebar de imovel)
   *  - 'dark': bg preto, inputs translucidos brancos (faixa de "Anuncie")
   */
  variant?: 'light' | 'dark';
  /** Texto do botao (default "Enviar") */
  ctaLabel?: string;
  /** Tipo de lead — define o funil/Kanban onde vai aparecer.
   *  COMPRADOR (default) = quer comprar/alugar; VENDEDOR = quer anunciar imovel.
   */
  tipoLead?: 'COMPRADOR' | 'LOCATARIO' | 'VENDEDOR' | 'LOCADOR';
}

/**
 * Formulario publico de captura de lead. Posta em /api/public/leads.
 * Reusado em ImovelDetail (sidebar) e nas secoes "Anuncie seu imovel"
 * dos 3 temas (Brisa/Aura/Onyx).
 */
export function LeadForm({
  slug,
  imovelId,
  defaultMessage,
  variant = 'light',
  ctaLabel = 'Enviar',
  tipoLead = 'COMPRADOR',
}: LeadFormProps) {
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState(defaultMessage ?? '');

  /** Formata BR enquanto digita: (DD) NNNNN-NNNN ou (DD) NNNN-NNNN. */
  function onWhatsappChange(raw: string) {
    const d = raw.replace(/\D/g, '').slice(0, 11);
    if (d.length === 0) return setWhatsapp('');
    if (d.length <= 2) return setWhatsapp(`(${d}`);
    if (d.length <= 6) return setWhatsapp(`(${d.slice(0, 2)}) ${d.slice(2)}`);
    if (d.length <= 10) return setWhatsapp(`(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`);
    setWhatsapp(`(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`);
  }
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!nome.trim() || (!whatsapp.trim() && !email.trim())) {
      setErro('Preencha nome + (WhatsApp ou e-mail).');
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch('/api/public/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          nome: nome.trim(),
          whatsapp: whatsapp.trim() || undefined,
          email: email.trim() || undefined,
          mensagem: mensagem.trim() || undefined,
          imovelId,
          tipoLead,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? 'Erro ao enviar.');
      }
      setOk(true);
    } catch (err: any) {
      setErro(err.message ?? 'Erro ao enviar.');
    } finally {
      setEnviando(false);
    }
  }

  const isDark = variant === 'dark';
  const inputCls = isDark
    ? 'rounded-md border-0 bg-white/10 px-3 py-2.5 text-sm text-white placeholder-white/40 focus:bg-white/15 focus:outline-none focus:ring-1 focus:ring-white/30'
    : 'rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none';

  if (ok) {
    return (
      <div
        className={`flex items-start gap-3 rounded-md p-4 text-sm ${
          isDark ? 'bg-white/10 text-white' : 'border border-green-200 bg-green-50 text-green-800'
        }`}
      >
        <Check className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Mensagem enviada!</p>
          <p className="opacity-80">
            Entraremos em contato em breve via WhatsApp ou e-mail.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submeter} className="grid gap-2">
      <input
        type="text"
        required
        placeholder="Seu nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        className={inputCls}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          type="tel"
          inputMode="numeric"
          placeholder="(11) 99999-9999"
          value={whatsapp}
          onChange={(e) => onWhatsappChange(e.target.value)}
          className={inputCls}
        />
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
        />
      </div>
      <textarea
        placeholder="Mensagem (opcional)"
        rows={3}
        value={mensagem}
        onChange={(e) => setMensagem(e.target.value)}
        className={`${inputCls} resize-none`}
      />
      {erro && (
        <p className={`text-xs ${isDark ? 'text-red-300' : 'text-red-600'}`}>{erro}</p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className="mt-1 inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-60"
        style={{ background: 'var(--t-primary)' }}
      >
        <Send className="h-4 w-4" />
        {enviando ? 'Enviando...' : ctaLabel}
      </button>
      <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
        Ao enviar voce concorda com nossa Política de Privacidade.
      </p>
    </form>
  );
}
