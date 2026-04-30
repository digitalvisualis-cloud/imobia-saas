import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

/**
 * KpiCard — card padrão de métrica/indicador.
 *
 * Usado em todas as telas de dashboard pra mostrar números/valores curtos
 * (Status, Total, Próxima cobrança, etc). Substitui as ~3 implementações
 * inline duplicadas em Sites/Conteúdo/Financeiro.
 */

export type KpiAccent =
  | 'primary'
  | 'green'
  | 'amber'
  | 'violet'
  | 'blue'
  | 'pink'
  | 'red';

const ACCENT_STYLES: Record<KpiAccent, string> = {
  primary: 'bg-primary/10 text-primary',
  green: 'bg-green-500/10 text-green-600 dark:text-green-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  pink: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  red: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

export interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: KpiAccent;
  /** Texto value em fonte monoespaçada (URLs, códigos) */
  mono?: boolean;
  /** Renderiza value desbotado (placeholder/em breve) */
  soft?: boolean;
  /** Variante compacta (KPIs 5+ por linha) */
  compact?: boolean;
  className?: string;
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  accent = 'primary',
  mono,
  soft,
  compact,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card',
        compact ? 'p-3' : 'p-4',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {Icon && (
          <div
            className={cn(
              'rounded-md grid place-items-center',
              compact ? 'h-6 w-6' : 'h-7 w-7',
              ACCENT_STYLES[accent],
            )}
          >
            <Icon className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
          </div>
        )}
      </div>
      <p
        className={cn(
          'mt-1.5 font-display font-semibold truncate',
          compact ? 'text-base' : 'text-xl',
          mono && 'font-mono text-sm',
          soft ? 'text-muted-foreground' : 'text-foreground',
        )}
        title={String(value)}
      >
        {value}
      </p>
    </div>
  );
}
