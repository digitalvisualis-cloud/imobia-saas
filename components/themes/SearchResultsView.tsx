'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import type { Customization, ThemeId } from '@/types/site-customization';
import type { ImovelPublic, TenantPublic } from '@/app/_templates/types';
import { ThemeScope } from './ThemeScope';
import { BrisaHeader, BrisaFooter } from './brisa/BrisaChrome';
import { BrisaCard } from './brisa/BrisaCard';
import { AuraHeader, AuraFooter } from './aura/AuraChrome';
import { AuraCard } from './aura/AuraCard';

interface Props {
  theme: ThemeId;
  config: Customization;
  tenant: TenantPublic;
  results: ImovelPublic[];
  filtersLabels: string[];
}

export function SearchResultsView({
  theme,
  config,
  tenant,
  results,
  filtersLabels,
}: Props) {
  const Header = theme === 'aura' ? AuraHeader : BrisaHeader;
  const Footer = theme === 'aura' ? AuraFooter : BrisaFooter;

  return (
    <ThemeScope config={config}>
      <Header config={config} tenant={tenant} />
      <main className={theme === 'aura' ? 'pt-32' : 'pt-8'}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1
                style={{ fontFamily: 'var(--t-font-heading)' }}
                className="text-2xl font-semibold sm:text-3xl"
              >
                {results.length === 0
                  ? 'Nenhum imóvel encontrado'
                  : results.length === 1
                    ? '1 imóvel encontrado'
                    : `${results.length} imóveis encontrados`}
              </h1>
              {filtersLabels.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {filtersLabels.map((l, i) => (
                    <span
                      key={i}
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      style={{
                        background: 'rgb(var(--t-primary-rgb) / 0.1)',
                        color: 'var(--t-primary)',
                      }}
                    >
                      {l}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <Link
              href={`/s/${tenant.slug}`}
              className="inline-flex w-fit items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium hover:opacity-80"
              style={{ borderColor: 'rgb(var(--t-fg-rgb) / 0.2)' }}
            >
              <X className="h-3.5 w-3.5" /> Limpar busca
            </Link>
          </div>

          {results.length === 0 ? (
            <div
              className="mt-12 rounded-2xl border-2 border-dashed p-12 text-center"
              style={{ borderColor: 'rgb(var(--t-fg-rgb) / 0.15)' }}
            >
              <p className="text-base opacity-70">
                Não encontramos imóveis com esses filtros. Tente refinar a busca.
              </p>
            </div>
          ) : (
            <div
              className={
                theme === 'aura'
                  ? 'mt-10 grid gap-x-6 gap-y-12 sm:gap-x-10 sm:gap-y-20 md:grid-cols-2'
                  : 'mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3'
              }
            >
              {results.map((i) =>
                theme === 'aura' ? (
                  <AuraCard key={i.id} imovel={i} slug={tenant.slug} />
                ) : (
                  <BrisaCard key={i.id} imovel={i} slug={tenant.slug} />
                ),
              )}
            </div>
          )}
        </div>
      </main>
      <Footer config={config} tenant={tenant} />
    </ThemeScope>
  );
}
