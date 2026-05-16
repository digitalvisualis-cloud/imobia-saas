'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Globe, Eye, EyeOff, Copy, Check, Monitor, Smartphone } from 'lucide-react';
import { CustomizerPanel } from '@/components/customizer/CustomizerPanel';
import { useSiteStore } from '@/lib/site-store';
import type { Customization, ThemeId } from '@/types/site-customization';
import type { ImovelPublic, TenantPublic } from '@/app/_templates/types';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

interface SiteData {
  publicado: boolean;
  slug: string;
  dominio: string | null;
  themeId: ThemeId;
  configBrisa: Customization;
  configAura: Customization;
  configOnyx: Customization;
}

interface Props {
  site: SiteData;
  tenant: TenantPublic;
  imoveis: ImovelPublic[];
}

type Viewport = 'desktop' | 'mobile';

export default function SiteEditorClient({ site, tenant, imoveis }: Props) {
  const hydrate = useSiteStore((s) => s.hydrate);
  const setActiveTheme = useSiteStore((s) => s.setActiveTheme);
  const markSaved = useSiteStore((s) => s.markSaved);

  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publicado, setPublicado] = useState(site.publicado);
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [origin, setOrigin] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewOuterRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Mantem o preview renderizando em 1440x900 (desktop "real") e escala pra
  // caber na area disponivel. Sem isso, o iframe ganha apenas a largura
  // residual depois do customizer (~1100px) e renderiza como tablet.
  // Medimos o outer container (não o wrap) pra evitar feedback loop com a
  // largura do proprio iframe.
  useEffect(() => {
    if (viewport !== 'desktop') {
      setPreviewScale(1);
      return;
    }
    const outer = previewOuterRef.current;
    if (!outer) return;
    const update = () => {
      // outer.clientWidth inclui o p-4 (32px); subtrai pra usar so o espaco util
      const w = outer.clientWidth - 32;
      if (w > 0) setPreviewScale(Math.min(1, w / 1440));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(outer);
    return () => ro.disconnect();
  }, [viewport]);

  // Hidrata o store com a config salva ao montar e escreve o estado inicial
  // no localStorage (pra primeira renderizacao do iframe ler antes do
  // postMessage chegar).
  useEffect(() => {
    hydrate('brisa', site.configBrisa);
    hydrate('aura', site.configAura);
    hydrate('onyx', site.configOnyx);
    setActiveTheme(site.themeId);
    markSaved();
    try {
      localStorage.setItem('site-preview-data', JSON.stringify({ tenant, imoveis }));
      const s = useSiteStore.getState();
      localStorage.setItem(
        'site-preview-state',
        JSON.stringify({ theme: s.activeTheme, config: s.byTheme[s.activeTheme] }),
      );
    } catch {
      /* localStorage cheio? ignora */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincroniza mudancas do Zustand para o iframe via postMessage (mais
  // confiavel que storage event entre mesma origin) + grava no localStorage
  // como cache pra refresh do iframe.
  useEffect(() => {
    function pushToPreview(payload: { theme: ThemeId; config: Customization }) {
      try {
        localStorage.setItem('site-preview-state', JSON.stringify(payload));
      } catch {}
      const win = iframeRef.current?.contentWindow;
      if (win) {
        win.postMessage(
          { type: 'site-preview/state', payload },
          window.location.origin,
        );
      }
    }
    // Push inicial (logo apos hidratacao) — garante que o iframe receba mesmo
    // se ele tiver montado primeiro
    const s0 = useSiteStore.getState();
    pushToPreview({ theme: s0.activeTheme, config: s0.byTheme[s0.activeTheme] });

    const unsub = useSiteStore.subscribe((s) => {
      pushToPreview({ theme: s.activeTheme, config: s.byTheme[s.activeTheme] });
    });
    return unsub;
  }, []);

  // O iframe envia 'ready' quando monta — re-envia o state pra garantir
  function handleIframeLoad() {
    const s = useSiteStore.getState();
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: 'site-preview/state',
        payload: { theme: s.activeTheme, config: s.byTheme[s.activeTheme] },
      },
      window.location.origin,
    );
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'site-preview/data', payload: { tenant, imoveis } },
      window.location.origin,
    );
  }

  const siteUrl = site.dominio
    ? `https://${site.dominio}`
    : `${origin}/s/${site.slug}`;

  async function handleSave() {
    setSaving(true);
    try {
      const state = useSiteStore.getState();
      const res = await fetch('/api/sites/customization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themeId: state.activeTheme,
          configBrisa: state.byTheme.brisa,
          configAura: state.byTheme.aura,
          configOnyx: state.byTheme.onyx,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      markSaved();
      setSavedAt(Date.now());
      toast.success('Site salvo');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    const next = !publicado;
    try {
      const res = await fetch('/api/sites/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicado: next }),
      });
      if (!res.ok) throw new Error(await res.text());
      setPublicado(next);
      toast.success(next ? 'Site publicado' : 'Site despublicado');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao publicar');
    } finally {
      setPublishing(false);
    }
  }

  function copyUrl() {
    navigator.clipboard.writeText(siteUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  }

  const recentlySaved = savedAt != null && Date.now() - savedAt < 3000;

  return (
    <div className="flex min-h-screen w-full bg-slate-100">
      <CustomizerPanel onSave={handleSave} saving={saving} saved={recentlySaved} />

      <div className="min-w-0 flex-1 lg:pl-[380px]">
        {/* Topbar do editor */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider',
                publicado
                  ? 'bg-green-50 text-green-700 ring-1 ring-green-200'
                  : 'bg-slate-100 text-slate-500',
              )}
            >
              {publicado ? '● Publicado' : '○ Rascunho'}
            </span>
            <button
              onClick={copyUrl}
              className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
            >
              <Globe className="h-3 w-3" />
              <span className="font-mono">{siteUrl.replace(/^https?:\/\//, '')}</span>
              {copiedUrl ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white p-0.5">
              <button
                onClick={() => setViewport('desktop')}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded',
                  viewport === 'desktop' ? 'bg-slate-100 text-slate-900' : 'text-slate-500',
                )}
                aria-label="Desktop"
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewport('mobile')}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded',
                  viewport === 'mobile' ? 'bg-slate-100 text-slate-900' : 'text-slate-500',
                )}
                aria-label="Mobile"
              >
                <Smartphone className="h-3.5 w-3.5" />
              </button>
            </div>

            <a
              href={siteUrl}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              <ExternalLink className="h-3 w-3" /> Abrir
            </a>

            <button
              onClick={handlePublish}
              disabled={publishing}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-colors',
                publicado
                  ? 'bg-slate-700 hover:bg-slate-800'
                  : 'bg-emerald-600 hover:bg-emerald-700',
                publishing && 'cursor-wait opacity-70',
              )}
            >
              {publicado ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {publicado ? 'Despublicar' : 'Publicar'}
            </button>
          </div>
        </div>

        {/* Preview area */}
        <div ref={previewOuterRef} className="p-4">
          {viewport === 'mobile' ? (
            <div
              className="mx-auto overflow-hidden rounded-lg bg-white shadow-lg transition-all w-[414px]"
              style={{ border: '8px solid #1e293b', borderRadius: 36 }}
            >
              <iframe
                ref={iframeRef}
                src="/preview/site"
                title="Preview"
                onLoad={handleIframeLoad}
                className="w-full"
                style={{ height: 720, border: 0, background: 'white' }}
              />
            </div>
          ) : (
            <div
              className="mx-auto overflow-hidden rounded-lg bg-white shadow-lg transition-all"
              style={{
                width: 1440 * previewScale,
                height: 900 * previewScale,
              }}
            >
              <iframe
                ref={iframeRef}
                src="/preview/site"
                title="Preview"
                onLoad={handleIframeLoad}
                style={{
                  width: 1440,
                  height: 900,
                  border: 0,
                  background: 'white',
                  transformOrigin: 'top left',
                  transform: `scale(${previewScale})`,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

