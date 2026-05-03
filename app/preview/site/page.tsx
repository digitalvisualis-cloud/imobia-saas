'use client';

import { useEffect, useState } from 'react';
import { ThemeRenderer } from '@/components/themes/ThemeRenderer';
import type { Customization, ThemeId } from '@/types/site-customization';
import type { ImovelPublic, TenantPublic } from '@/app/_templates/types';

/**
 * Página de preview standalone — usada como iframe pelo editor `/sites`.
 *
 * Lê dados do localStorage (gravados pelo editor):
 *   - site-preview-data:  { tenant, imoveis } — gravado uma vez no mount do editor
 *   - site-preview-state: { theme, config } — gravado a cada mudança no Zustand
 *
 * Reage a `storage` events para refletir mudanças do editor em tempo real.
 * Como localStorage é per-origin e iframe + parent compartilham origin, o evento
 * dispara automaticamente no iframe quando o editor escreve.
 */
interface PreviewData {
  tenant: TenantPublic;
  imoveis: ImovelPublic[];
}
interface PreviewState {
  theme: ThemeId;
  config: Customization;
}

export default function SitePreviewPage() {
  const [data, setData] = useState<PreviewData | null>(null);
  const [state, setState] = useState<PreviewState | null>(null);

  useEffect(() => {
    function loadAll() {
      try {
        const rawData = localStorage.getItem('site-preview-data');
        const rawState = localStorage.getItem('site-preview-state');
        if (rawData) setData(JSON.parse(rawData));
        if (rawState) setState(JSON.parse(rawState));
      } catch {
        /* ignore parse errors */
      }
    }
    loadAll();

    function onStorage(e: StorageEvent) {
      if (e.key === 'site-preview-data' && e.newValue) {
        try {
          setData(JSON.parse(e.newValue));
        } catch {
          /* ignore */
        }
      }
      if (e.key === 'site-preview-state' && e.newValue) {
        try {
          setState(JSON.parse(e.newValue));
        } catch {
          /* ignore */
        }
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
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
    />
  );
}
