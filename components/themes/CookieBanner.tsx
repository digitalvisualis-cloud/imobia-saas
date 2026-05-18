'use client';

import { useEffect, useState } from 'react';

/**
 * Banner de consentimento de cookies. Mostra na 1a visita, esconde apos
 * o user clicar Aceitar (salva em localStorage). Bem simples — atende
 * o minimo LGPD pra site institucional sem cookies de terceiros pesados.
 */
export function CookieBanner({ slug }: { slug: string }) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    try {
      const ja = localStorage.getItem('imobia.cookies.ok');
      if (!ja) setVisivel(true);
    } catch {
      // localStorage bloqueado (modo privado restrito) — nao mostra
    }
  }, []);

  function aceitar() {
    try {
      localStorage.setItem('imobia.cookies.ok', '1');
    } catch {}
    setVisivel(false);
  }

  if (!visivel) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 pointer-events-none">
      <div className="mx-auto max-w-3xl pointer-events-auto rounded-xl border border-gray-200 bg-white p-4 shadow-2xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 text-sm text-gray-700">
            🍪 Este site usa cookies pra melhorar tua experiência. Ao
            continuar navegando, você concorda com nossa{' '}
            <a
              href={`/s/${slug}/cookies`}
              className="font-medium text-violet-700 underline hover:text-violet-900"
            >
              Política de Cookies
            </a>
            .
          </div>
          <div className="flex gap-2">
            <a
              href={`/s/${slug}/cookies`}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Saber mais
            </a>
            <button
              type="button"
              onClick={aceitar}
              className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Aceitar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
