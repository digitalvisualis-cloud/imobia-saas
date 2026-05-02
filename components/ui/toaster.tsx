'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Toast — sistema simples sem deps externas (sem sonner, sem react-hot-toast).
 *
 * Uso:
 *   import { toast } from '@/lib/toast';
 *   toast.success('Salvo!');
 *   toast.error('Falhou');
 *   toast.info('Carregando...', { duration: 2000 });
 *   const id = toast.loading('Salvando...');
 *   toast.dismiss(id);
 *
 * Renderiza fixed bottom-right com slide-in/fade animations.
 */

export type ToastVariant = 'success' | 'error' | 'info' | 'loading';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  message: string;
  description?: string;
  duration?: number; // ms, undefined = não auto-dismiss
}

// Event bus simples — sem context, qualquer componente pode disparar
type Listener = (action: { type: 'add' | 'remove'; toast?: ToastItem; id?: string }) => void;
const listeners = new Set<Listener>();

export function emit(action: Parameters<Listener>[0]) {
  listeners.forEach((l) => l(action));
}

export function subscribe(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/* ---------- Toaster (provider visual) ---------- */

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = subscribe((action) => {
      if (action.type === 'add' && action.toast) {
        setItems((prev) => [...prev, action.toast!]);
        if (action.toast.duration && action.toast.variant !== 'loading') {
          setTimeout(() => {
            setItems((prev) => prev.filter((t) => t.id !== action.toast!.id));
          }, action.toast.duration);
        }
      }
      if (action.type === 'remove' && action.id) {
        setItems((prev) => prev.filter((t) => t.id !== action.id));
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notificações"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none w-[calc(100vw-2rem)] sm:w-auto sm:max-w-sm"
    >
      {items.map((t) => (
        <ToastCard key={t.id} item={t} />
      ))}
    </div>
  );
}

function ToastCard({ item }: { item: ToastItem }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // entrada animada — pequeno delay pra trigger transition
    const t = setTimeout(() => setShow(true), 10);
    return () => clearTimeout(t);
  }, []);

  const variant = VARIANTS[item.variant];
  const Icon = variant.Icon;

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto rounded-lg border shadow-lg backdrop-blur-md',
        'flex items-start gap-3 px-4 py-3 pr-9 relative',
        'transition-all duration-300 ease-out',
        show ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0',
        variant.classes,
      )}
    >
      <div className={cn('shrink-0 mt-0.5', variant.iconColor)}>
        {item.variant === 'loading' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground leading-snug">
          {item.message}
        </p>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
            {item.description}
          </p>
        )}
      </div>
      <button
        onClick={() => emit({ type: 'remove', id: item.id })}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
        aria-label="Fechar notificação"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

const VARIANTS: Record<
  ToastVariant,
  { Icon: typeof CheckCircle2; classes: string; iconColor: string }
> = {
  success: {
    Icon: CheckCircle2,
    classes: 'bg-card/95 border-green-500/30',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  error: {
    Icon: AlertCircle,
    classes: 'bg-card/95 border-destructive/40',
    iconColor: 'text-destructive',
  },
  info: {
    Icon: Info,
    classes: 'bg-card/95 border-border',
    iconColor: 'text-primary',
  },
  loading: {
    Icon: Loader2,
    classes: 'bg-card/95 border-border',
    iconColor: 'text-primary',
  },
};
