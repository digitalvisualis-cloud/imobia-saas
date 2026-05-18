'use client';

import { useEffect, useState } from 'react';
import { X, SearchX } from 'lucide-react';

interface Props {
  filters: string[];
  cleanHref: string;
}

/**
 * Banner flash mostrado no topo da home quando a busca não retornou nada.
 * Auto-some depois de 5s. Usuário pode fechar manualmente também.
 */
export function SearchFlashMessage({ filters, cleanHref }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(t);
  }, []);

  // Limpa a query string da URL sem reload (mantém URL bonita)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      const t = setTimeout(() => {
        window.history.replaceState({}, '', cleanHref);
      }, 5500);
      return () => clearTimeout(t);
    }
  }, [cleanHref]);

  if (!visible) return null;

  return (
    <div className="fixed left-1/2 top-4 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-start gap-3 rounded-xl bg-slate-900 px-4 py-3 text-white shadow-2xl">
      <SearchX className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
      <div className="flex-1 text-sm">
        <p className="font-medium">Nenhum imóvel encontrado</p>
        {filters.length > 0 && (
          <p className="mt-0.5 text-xs opacity-75">
            com os filtros: {filters.join(', ')}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="rounded p-0.5 opacity-60 hover:bg-white/10 hover:opacity-100"
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
