import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Section — wrapper padrão pra blocos de configuração / formulário.
 *
 * Substitui o pattern repetido em /configuracoes, /sites e /financeiro.
 * Aceita ícone opcional, hint (descrição curta) e ações no canto.
 */

export interface SectionProps {
  title: string;
  hint?: string;
  icon?: LucideIcon;
  /** Ações no canto superior direito (botões, links, etc) */
  actions?: React.ReactNode;
  /** Variante compacta com menos padding */
  compact?: boolean;
  /** Sem borda/card — só agrupa visualmente */
  bare?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Section({
  title,
  hint,
  icon: Icon,
  actions,
  compact,
  bare,
  className,
  children,
}: SectionProps) {
  return (
    <div
      className={cn(
        bare
          ? ''
          : 'rounded-lg border border-border bg-card',
        bare ? '' : compact ? 'p-4' : 'p-5 md:p-6',
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            <h2
              className={cn(
                'font-display font-semibold text-foreground',
                compact ? 'text-base' : 'text-lg md:text-xl',
              )}
            >
              {title}
            </h2>
          </div>
          {hint && (
            <p className="text-sm text-muted-foreground mt-0.5">{hint}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
