'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  X,
  Loader2,
  Check,
  Search,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { PostPreview } from './PostPreview';
import { TEMPLATES, FORMATOS } from './types';
import type { ImovelLite, TemplateVariant, Customizacao } from './types';

type Step = 'imovel' | 'formato' | 'template';

const FORMATO_REDE: Record<string, 'instagram' | 'facebook'> = {
  'feed-square': 'instagram',
  story: 'instagram',
  'feed-carrossel': 'instagram',
  'story-carrossel': 'instagram',
  'facebook-square': 'facebook',
};

function RedeIcon({ rede }: { rede: 'instagram' | 'facebook' }) {
  if (rede === 'instagram') {
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-[14px] font-bold text-white">
        IG
      </span>
    );
  }
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#1877F2] text-[14px] font-bold text-white">
      f
    </span>
  );
}

export function GerarPostModal({
  open,
  onClose,
  imoveis,
  imovelIdProp,
  customizacao,
}: {
  open: boolean;
  onClose: () => void;
  imoveis: ImovelLite[];
  imovelIdProp?: string;
  customizacao?: Partial<Customizacao>;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(imovelIdProp ? 'formato' : 'imovel');
  const [imovelId, setImovelId] = useState<string | undefined>(imovelIdProp);
  const [formato, setFormato] = useState<string>('story');
  const [templateSel, setTemplateSel] = useState<TemplateVariant | null>(null);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const pub = imoveis.filter((i) => i.publicado);
    if (!q) return pub;
    return pub.filter(
      (i) =>
        i.titulo.toLowerCase().includes(q) ||
        (i.bairro || '').toLowerCase().includes(q) ||
        i.cidade.toLowerCase().includes(q) ||
        i.codigo.toLowerCase().includes(q),
    );
  }, [imoveis, busca]);

  const imovelAtual = imovelId ? imoveis.find((i) => i.id === imovelId) : undefined;
  const fmtAtual = FORMATOS.find((f) => f.id === formato);

  if (!open) return null;

  function close() {
    setStep(imovelIdProp ? 'formato' : 'imovel');
    setImovelId(imovelIdProp);
    setTemplateSel(null);
    setBusca('');
    onClose();
  }

  async function gerar() {
    if (!imovelId || !templateSel || !fmtAtual) return;
    setLoading(true);
    try {
      const imovel = imoveis.find((i) => i.id === imovelId)!;
      const conteudo = `✨ ${imovel.titulo} em ${imovel.bairro || imovel.cidade}. ${
        imovel.areaM2 || ''
      }m², ${imovel.quartos}q. Manda DM!`;
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imovelId,
          tipo: fmtAtual.tipo,
          templateId: templateSel,
          formato: fmtAtual.id,
          conteudo,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? 'Falha ao gerar post');
      }
      toast.success('Post gerado!');
      close();
      router.push(`/conteudo/imovel/${imovelId}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={close}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          className="absolute right-4 top-4 z-10 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        {step === 'imovel' && (
          <>
            <div className="space-y-1.5 p-6 pb-4">
              <h2 className="font-display text-xl font-bold tracking-tight">Escolhe o imóvel</h2>
              <p className="text-sm text-muted-foreground">
                Seleciona qual imóvel da tua carteira vai virar conteúdo.
              </p>
              <div className="relative pt-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-[40%] text-muted-foreground" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por título, bairro ou código..."
                  className="w-full rounded-md border border-input bg-card py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="grid max-h-[55vh] grid-cols-1 gap-2 overflow-y-auto px-6 pb-4">
              {lista.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhum imóvel encontrado.
                </p>
              )}
              {lista.map((imv) => (
                <button
                  key={imv.id}
                  type="button"
                  onClick={() => {
                    setImovelId(imv.id);
                    setStep('formato');
                  }}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-all hover:border-primary/50"
                >
                  {imv.capaUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imv.capaUrl} alt="" className="h-14 w-14 flex-shrink-0 rounded-md object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-[10px] text-muted-foreground">{imv.codigo}</span>
                    <div className="truncate text-sm font-semibold">{imv.titulo}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {[imv.bairro, imv.cidade].filter(Boolean).join(' · ')}/{imv.estado}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/30 px-6 py-4">
              <button onClick={close} className="rounded-md border border-input bg-card px-4 py-2 text-sm font-medium hover:bg-muted">
                Cancelar
              </button>
            </div>
          </>
        )}

        {step === 'formato' && (
          <>
            <div className="space-y-1.5 p-6 pb-4">
              {!imovelIdProp && (
                <button
                  onClick={() => setStep('imovel')}
                  className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3 w-3" /> Trocar imóvel
                </button>
              )}
              <h2 className="font-display text-xl font-bold tracking-tight">Escolhe o formato</h2>
              <p className="text-sm text-muted-foreground">Onde esse post vai ser publicado?</p>
            </div>

            <div className="grid max-h-[55vh] grid-cols-1 gap-3 overflow-y-auto px-6 pb-4 sm:grid-cols-2">
              {FORMATOS.map((f) => {
                const active = formato === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormato(f.id)}
                    className={cn(
                      'group relative flex items-start gap-3 rounded-xl border bg-card p-4 text-left transition-all hover:border-primary/50',
                      active ? 'border-primary bg-primary/5 ring-2 ring-primary/30' : 'border-border',
                    )}
                  >
                    <RedeIcon rede={FORMATO_REDE[f.id]} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold leading-tight">{f.nome}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{f.dim}</div>
                      {f.hint && (
                        <div className="mt-0.5 text-xs text-muted-foreground">{f.hint}</div>
                      )}
                    </div>
                    {active && (
                      <span className="absolute right-3 top-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-6 py-4">
              <button onClick={close} className="rounded-md border border-input bg-card px-4 py-2 text-sm font-medium hover:bg-muted">
                Cancelar
              </button>
              <button
                onClick={() => setStep('template')}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
              >
                Próximo <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </>
        )}

        {step === 'template' && imovelAtual && (
          <>
            <div className="space-y-1.5 p-6 pb-4">
              <button
                onClick={() => setStep('formato')}
                className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3" /> Voltar pro formato
              </button>
              <h2 className="font-display text-xl font-bold tracking-tight">Escolhe um template</h2>
              <p className="text-sm text-muted-foreground">
                Selecione o estilo visual. Você poderá personalizar cores, fonte e logo depois.
              </p>
            </div>

            <div className="grid max-h-[55vh] grid-cols-2 gap-3 overflow-y-auto px-6 pb-4 sm:grid-cols-3 md:grid-cols-4">
              {TEMPLATES.map((t) => {
                const active = templateSel === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplateSel(t.id)}
                    className={cn(
                      'relative flex flex-col items-center gap-2 rounded-xl border bg-card p-2 text-left transition-all hover:border-primary/50',
                      active ? 'border-primary bg-primary/5 ring-2 ring-primary/30' : 'border-border',
                    )}
                  >
                    <div className="overflow-hidden rounded-md">
                      <PostPreview
                        imovel={imovelAtual}
                        variant={t.id}
                        scale={0.32}
                        custom={customizacao}
                        ratio={fmtAtual?.ratio ?? '4/5'}
                      />
                    </div>
                    <div className="w-full px-1">
                      <div className="text-xs font-semibold leading-tight">{t.nome}</div>
                      <div className="truncate text-[10px] text-muted-foreground">{t.descricao}</div>
                    </div>
                    {active && (
                      <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-6 py-4">
              <button
                onClick={close}
                className="rounded-md border border-input bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={gerar}
                disabled={loading || !templateSel}
                className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-violet-600 to-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? 'Gerando…' : 'Gerar post'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
