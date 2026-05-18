import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

/**
 * EmptyState — estado vazio padrão pras listas/seções sem itens.
 *
 * Substitui o pattern repetido em /imoveis, /conteudo, /financeiro,
 * /agenda, /configuracoes (equipe) e /superadmin/tenants.
 */

export interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
}

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  /** Variante mais discreta (sem card, padding menor) — pra usar dentro de outros cards */
  inline?: boolean;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  inline,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'text-center',
        inline ? 'py-8' : 'py-16 bg-card border border-border rounded-lg',
        className,
      )}
    >
      {Icon && (
        <Icon className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
      )}
      <p className="text-foreground font-medium mb-1">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground max-w-md mx-auto mb-4 px-4">
          {description}
        </p>
      )}
      {action && <EmptyStateActionButton action={action} />}
    </div>
  );
}

function EmptyStateActionButton({ action }: { action: EmptyStateAction }) {
  const ActionIcon = action.icon;
  const content = (
    <>
      {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
      {action.label}
    </>
  );
  if (action.href) {
    return (
      <Button asChild>
        <Link href={action.href}>{content}</Link>
      </Button>
    );
  }
  return <Button onClick={action.onClick}>{content}</Button>;
}
