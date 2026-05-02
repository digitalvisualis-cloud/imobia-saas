import { emit, type ToastItem, type ToastVariant } from '@/components/ui/toaster';

/**
 * Toast API — funções utilitárias pra disparar notificações de qualquer
 * componente sem precisar passar context.
 *
 * Uso:
 *   toast.success('Salvo com sucesso');
 *   toast.error('Falha ao salvar', { description: 'Tente novamente' });
 *   const id = toast.loading('Enviando...');
 *   // depois:
 *   toast.dismiss(id);
 */

interface ToastOptions {
  description?: string;
  /** Duração em ms. 0 = não auto-dismiss. Default: 4000 (3000 pra success). */
  duration?: number;
}

function makeId() {
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function show(
  variant: ToastVariant,
  message: string,
  options?: ToastOptions,
): string {
  const id = makeId();
  const defaultDuration =
    variant === 'loading' ? 0 : variant === 'success' ? 3000 : 4500;
  const item: ToastItem = {
    id,
    variant,
    message,
    description: options?.description,
    duration: options?.duration ?? defaultDuration,
  };
  emit({ type: 'add', toast: item });
  return id;
}

export const toast = {
  success: (msg: string, opt?: ToastOptions) => show('success', msg, opt),
  error: (msg: string, opt?: ToastOptions) => show('error', msg, opt),
  info: (msg: string, opt?: ToastOptions) => show('info', msg, opt),
  loading: (msg: string, opt?: ToastOptions) => show('loading', msg, opt),
  dismiss: (id: string) => emit({ type: 'remove', id }),
};
