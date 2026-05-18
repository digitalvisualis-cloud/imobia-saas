'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PostPreview } from './PostPreview';
import type { ImovelLite, TemplateVariant, Customizacao } from './types';

export function TemplateCard({
  imovel,
  variant,
  label,
  descricao,
  onSelect,
  selected,
  custom,
}: {
  imovel: ImovelLite;
  variant: TemplateVariant;
  label: string;
  descricao?: string;
  onSelect: () => void;
  selected?: boolean;
  custom?: Partial<Customizacao>;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group flex flex-col gap-2 rounded-xl border border-border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md',
        selected && 'ring-2 ring-primary',
      )}
    >
      <div className="flex items-center justify-center rounded-md bg-muted/40 p-2">
        <PostPreview imovel={imovel} variant={variant} scale={0.42} custom={custom} />
      </div>
      <div>
        <div className="font-display text-sm font-semibold">{label}</div>
        {descricao && <div className="text-[11px] text-muted-foreground">{descricao}</div>}
      </div>
    </button>
  );
}

export function IACard({
  imovel,
  onSelect,
  selected,
  custom,
}: {
  imovel: ImovelLite;
  onSelect: () => void;
  selected?: boolean;
  custom?: Partial<Customizacao>;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group relative flex flex-col gap-2 overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-emerald-500/15 p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
        selected && 'ring-2 ring-primary',
      )}
    >
      <span className="absolute right-3 top-3 z-10 rounded-sm bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
        Novo
      </span>
      <div className="flex items-center justify-center rounded-md bg-background/50 p-2">
        <PostPreview imovel={imovel} variant="ia" scale={0.42} custom={custom} />
      </div>
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="font-display text-sm font-semibold">IA Vibrante</span>
      </div>
    </button>
  );
}
