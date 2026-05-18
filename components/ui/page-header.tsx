import Link from 'next/link';
import { ArrowLeft, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * PageHeader — cabeçalho padrão de TODA tela de dashboard.
 *
 * Hierarquia visual rica:
 *   1. Breadcrumb / Voltar  (opcional)
 *   2. Kicker / Eyebrow      (opcional, uppercase tracked)
 *   3. Título h1             (font-display, grande)
 *   4. Description           (opcional, muted)
 *   5. Meta (badges, status) (opcional, embaixo)
 *   6. Actions               (botões à direita)
 *
 * Substitui o pattern manual repetido em 8+ telas.
 */

export interface PageHeaderBackLink {
  href: string;
  label?: string;
}

export interface PageHeaderProps {
  /** Texto pequeno acima do título (ex: "Media Kit · IMV-1234") */
  kicker?: React.ReactNode;
  /** Ícone decorativo ao lado do título */
  icon?: LucideIcon;
  /** Título principal (h1) */
  title: React.ReactNode;
  /** Subtítulo curto */
  description?: React.ReactNode;
  /** Botão "voltar" — aparece como link no topo */
  back?: PageHeaderBackLink;
  /** Slot pra ações no canto superior direito (Button, Badge, etc) */
  actions?: React.ReactNode;
  /** Slot embaixo do título (Badges, status, métricas inline) */
  meta?: React.ReactNode;
  /** Variante mais compacta (sem espaço grande) */
  compact?: boolean;
  className?: string;
}

export function PageHeader({
  kicker,
  icon: Icon,
  title,
  description,
  back,
  actions,
  meta,
  compact,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn(compact ? 'space-y-2' : 'space-y-3', className)}>
      {/* Linha 1 — Voltar + Kicker (se ambos, voltar fica acima) */}
      {(back || kicker) && (
        <div className="flex flex-col gap-1.5">
          {back && (
            <Link
              href={back.href}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit -ml-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{back.label ?? 'Voltar'}</span>
            </Link>
          )}
          {kicker && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              {kicker}
            </p>
          )}
        </div>
      )}

      {/* Linha 2 — Título + Actions */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {Icon && (
            <div
              className={cn(
                'rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0',
                compact ? 'h-9 w-9 mt-0.5' : 'h-11 w-11 mt-1',
              )}
            >
              <Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1
              className={cn(
                'font-display font-semibold text-foreground tracking-tight leading-[1.1]',
                compact
                  ? 'text-2xl md:text-3xl'
                  : 'text-3xl md:text-4xl lg:text-[2.6rem]',
              )}
            >
              {title}
            </h1>
            {description && (
              <p
                className={cn(
                  'text-muted-foreground leading-relaxed',
                  compact ? 'text-sm mt-1' : 'text-sm md:text-base mt-1.5',
                )}
              >
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Linha 3 — Meta (Badges, etc) */}
      {meta && (
        <div className="flex items-center gap-2 flex-wrap pt-1">{meta}</div>
      )}
    </header>
  );
}
