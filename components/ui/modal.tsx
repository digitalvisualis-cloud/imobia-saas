'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Modal usando React Portal — renderiza direto em document.body,
 * escapando qualquer containing block criado por overflow/transform
 * em ancestrais. Resolve o bug do modal "preso" dentro do <main>
 * que tem overflow-y-auto no nosso dashboard layout.
 *
 * Padrao:
 * - Overlay fixo cobre 100vw x 100vh com bg-black/50
 * - Container interno: min-h-screen flex items-center pra centralizar
 * - Modal box pode crescer naturalmente; overlay scrolla se passa
 * - z-index 100 pra ficar acima da sidebar (z-50)
 * - Esc fecha; click no overlay fecha; click no modal nao propaga
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-2xl',
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** max-width do modal box. Default max-w-2xl. */
  maxWidth?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    // Trava o scroll do body enquanto modal aberto
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/60 overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-screen flex items-center justify-center p-4">
        <div
          className={`bg-background rounded-xl shadow-2xl w-full ${maxWidth} my-4`}
          onClick={(e) => e.stopPropagation()}
        >
          {title !== undefined && (
            <div className="border-b border-border px-5 py-3 flex items-center justify-between">
              <div className="font-display text-lg font-semibold">{title}</div>
              <button
                type="button"
                onClick={onClose}
                className="rounded p-1 hover:bg-muted"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div>{children}</div>
          {footer && (
            <div className="border-t border-border px-5 py-3 flex items-center justify-end gap-2">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
