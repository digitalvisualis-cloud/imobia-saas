'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from '@/lib/toast';
import type { ImovelLite } from './types';

export function CaptionCard({
  imovel,
  initial,
  onChange,
}: {
  imovel: ImovelLite;
  initial?: string;
  onChange?: (text: string) => void;
}) {
  const seed = initial ?? `✨ ${imovel.titulo} em ${imovel.bairro || imovel.cidade}. ${imovel.areaM2 || ''}m², ${imovel.quartos}q. Manda DM!`;
  const [text, setText] = useState(seed);
  const [loading, setLoading] = useState(false);

  function update(v: string) {
    setText(v);
    onChange?.(v);
  }

  function gerar() {
    setLoading(true);
    setTimeout(() => {
      const novo = `🏡 Acabou de chegar: ${imovel.titulo}. Localizado em ${imovel.bairro || imovel.cidade}, com ${imovel.areaM2 || ''}m² e ${imovel.quartos} quartos. Quer ser o primeiro a visitar? Manda DM agora 💜 #${imovel.cidade.replace(/\s/g, '')}`;
      update(novo);
      setLoading(false);
      toast.success('Legenda gerada pela IA');
    }, 1100);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Legenda
        </div>
        <button
          onClick={gerar}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-violet-600 to-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-70"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          Gerar com IA
        </button>
      </div>
      <textarea
        rows={5}
        value={text}
        onChange={(e) => update(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
