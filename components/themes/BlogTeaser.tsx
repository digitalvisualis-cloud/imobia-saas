import Link from 'next/link';
import { ArrowRight, FileText } from 'lucide-react';

export interface ArtigoTeaser {
  id: string;
  slug: string;
  titulo: string;
  resumo: string | null;
  capaUrl: string | null;
  publicadoEm: string | null;
}

/**
 * Faixa "Do nosso blog" pra home page de cada tema. Mostra ate 3 artigos
 * publicados mais recentes + CTA pro blog completo. SEO bonus: link
 * interno reforca crawl e descoberta de posts pelo Google.
 *
 * Estilo neutro pra encaixar em qualquer tema — usa CSS vars do tema ativo
 * (--t-primary, --t-font-heading) e classes utilitarias.
 */
export function BlogTeaser({
  slug,
  artigos,
  variant = 'light',
}: {
  slug: string;
  artigos: ArtigoTeaser[];
  /** 'light' = bg branco/claro (Brisa/Onyx homes); 'dark' = bg escuro (Aura) */
  variant?: 'light' | 'dark';
}) {
  if (artigos.length === 0) return null;
  const isDark = variant === 'dark';

  return (
    <section className={`py-16 ${isDark ? 'bg-neutral-900 text-white' : 'bg-stone-50 text-stone-900'}`}>
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-60">
              <FileText className="inline h-3 w-3 mr-1" /> Blog
            </p>
            <h2
              style={{ fontFamily: 'var(--t-font-heading)' }}
              className="mt-2 text-2xl font-bold sm:text-3xl md:text-4xl"
            >
              Dicas e novidades do mercado imobiliário
            </h2>
          </div>
          <Link
            href={`/s/${slug}/blog`}
            className="inline-flex items-center gap-1 text-sm font-semibold hover:opacity-80"
            style={{ color: 'var(--t-primary)' }}
          >
            Ver todos os artigos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {artigos.slice(0, 3).map((a) => (
            <Link
              key={a.id}
              href={`/s/${slug}/blog/${a.slug}`}
              className={`group block rounded-xl overflow-hidden transition-shadow hover:shadow-lg ${
                isDark ? 'bg-white/5 ring-1 ring-white/10' : 'bg-white ring-1 ring-stone-200'
              }`}
            >
              {a.capaUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.capaUrl}
                  alt={a.titulo}
                  className="h-44 w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className={`h-44 w-full ${isDark ? 'bg-white/5' : 'bg-stone-100'}`} />
              )}
              <div className="p-4">
                {a.publicadoEm && (
                  <p className="text-[10px] uppercase tracking-wider opacity-60">
                    {new Date(a.publicadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                )}
                <h3
                  className="mt-1.5 font-semibold leading-snug line-clamp-2"
                  style={{ fontFamily: 'var(--t-font-heading)' }}
                >
                  {a.titulo}
                </h3>
                {a.resumo && (
                  <p className="mt-2 text-sm opacity-70 line-clamp-3">{a.resumo}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
