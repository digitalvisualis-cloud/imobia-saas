'use client';

import { useEffect, useState } from 'react';
import { ThemeRenderer } from '@/components/themes/ThemeRenderer';
import type { Customization, ThemeId } from '@/types/site-customization';
import type { ImovelPublic, TenantPublic } from '@/app/_templates/types';

/**
 * Página de preview standalone — usada como iframe pelo editor `/sites`.
 *
 * Recebe atualizações do editor por DOIS canais:
 *   1. postMessage (canal principal — disparado direto do editor pro iframe)
 *   2. localStorage (fallback / leitura inicial — caso o iframe monte antes
 *      do editor enviar o postMessage)
 *
 * Tipos de mensagem aceitos:
 *   - { type: 'site-preview/data', payload: { tenant, imoveis } }
 *   - { type: 'site-preview/state', payload: { theme, config } }
 */
interface PreviewArtigo {
  id: string;
  slug: string;
  titulo: string;
  resumo: string | null;
  capaUrl: string | null;
  publicadoEm: string | null;
}
interface PreviewData {
  tenant: TenantPublic;
  imoveis: ImovelPublic[];
  artigos?: PreviewArtigo[];
}
interface PreviewState {
  theme: ThemeId;
  config: Customization;
}

type Msg =
  | { type: 'site-preview/data'; payload: PreviewData }
  | { type: 'site-preview/state'; payload: PreviewState };

export default function SitePreviewPage() {
  const [data, setData] = useState<PreviewData | null>(null);
  const [state, setState] = useState<PreviewState | null>(null);

  useEffect(() => {
    // Leitura inicial do localStorage (fallback enquanto postMessage nao chega)
    try {
      const rawData = localStorage.getItem('site-preview-data');
      const rawState = localStorage.getItem('site-preview-state');
      if (rawData) setData(JSON.parse(rawData));
      if (rawState) setState(JSON.parse(rawState));
    } catch {
      /* ignore parse errors */
    }

    function onMessage(e: MessageEvent) {
      // Aceita so mesma origin
      if (e.origin !== window.location.origin) return;
      const msg = e.data as Msg;
      if (!msg || typeof msg !== 'object') return;
      if (msg.type === 'site-preview/data') {
        setData(msg.payload);
      } else if (msg.type === 'site-preview/state') {
        setState(msg.payload);
      }
    }

    function onStorage(e: StorageEvent) {
      if (e.key === 'site-preview-data' && e.newValue) {
        try { setData(JSON.parse(e.newValue)); } catch {}
      }
      if (e.key === 'site-preview-state' && e.newValue) {
        try { setState(JSON.parse(e.newValue)); } catch {}
      }
    }

    window.addEventListener('message', onMessage);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('message', onMessage);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  if (!data || !state) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-slate-500">
        Carregando preview...
      </div>
    );
  }

  return (
    <ThemeRenderer
      theme={state.theme}
      config={state.config}
      tenant={data.tenant}
      imoveis={data.imoveis}
      artigos={data.artigos ?? []}
      isPreview
    />
  );
}
