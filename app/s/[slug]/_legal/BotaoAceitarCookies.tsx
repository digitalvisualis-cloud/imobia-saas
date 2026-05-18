'use client';

import { useRouter } from 'next/navigation';

/**
 * Botao "Aceitar cookies e voltar" que aparece no fim da pagina /cookies.
 * Marca o consentimento em localStorage (mesma chave do CookieBanner)
 * e tenta voltar pra pagina anterior. Se nao houver historico, vai pra
 * home do site.
 */
export function BotaoAceitarCookies({ slug }: { slug: string }) {
  const router = useRouter();

  function aceitarEVoltar() {
    try {
      localStorage.setItem('imobia.cookies.ok', '1');
    } catch {}
    // history.length > 1 = veio de outra pagina; senao, vai pra home
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(`/s/${slug}`);
    }
  }

  return (
    <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
      <p className="text-sm text-emerald-900">
        Ao clicar em "Aceitar", você concorda com o uso de cookies neste site.
      </p>
      <button
        type="button"
        onClick={aceitarEVoltar}
        className="rounded-md bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-700"
      >
        Aceitar cookies e voltar
      </button>
    </div>
  );
}
