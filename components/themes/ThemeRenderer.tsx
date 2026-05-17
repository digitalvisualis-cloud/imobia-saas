'use client';

import type { Customization, ThemeId } from '@/types/site-customization';
import type { ImovelPublic, TenantPublic } from '@/app/_templates/types';
import { ThemeScope } from './ThemeScope';
import { SectionsRenderer } from './SectionsRenderer';
import { CookieBanner } from './CookieBanner';
import { BrisaHeader, BrisaFooter } from './brisa/BrisaChrome';
import {
  BrisaHero,
  BrisaDestaques,
  BrisaCategorias,
  BrisaSobre,
  BrisaDepoimentos,
  BrisaFAQ,
  BrisaCTA,
  BrisaContato,
} from './brisa/BrisaSections';
import { AuraHeader, AuraFooter } from './aura/AuraChrome';
import {
  AuraHero,
  AuraDestaques,
  AuraCategorias,
  AuraSobre,
  AuraDepoimentos,
  AuraFAQ,
  AuraCTA,
  AuraContato,
} from './aura/AuraSections';
import { OnyxHeader, OnyxFooter } from './onyx/OnyxChrome';
import {
  OnyxHero,
  OnyxDestaques,
  OnyxCategorias,
  OnyxSobre,
  OnyxDepoimentos,
  OnyxFAQ,
  OnyxCTA,
  OnyxContato,
  OnyxAnuncie,
} from './onyx/OnyxSections';
import { BlogTeaser } from './BlogTeaser';

interface Props {
  theme: ThemeId;
  config: Customization;
  tenant: TenantPublic;
  imoveis: ImovelPublic[];
  artigos?: Array<{
    id: string;
    slug: string;
    titulo: string;
    resumo: string | null;
    capaUrl: string | null;
    publicadoEm: string | null;
  }>;
}

/**
 * Renderiza o tema escolhido (brisa ou aura) com header/footer + seções na ordem
 * configurada. Componente client porque alguns sub-componentes (FAQ accordion) usam
 * estado local. O ThemeScope injeta CSS vars; SectionsRenderer filtra/ordena.
 */
export function ThemeRenderer({ theme, config, tenant, imoveis, artigos = [] }: Props) {
  const sectionProps = { tenant, imoveis, config };

  if (theme === 'aura') {
    return (
      <ThemeScope config={config}>
        <AuraHeader config={config} tenant={tenant} />
        <main>
          <SectionsRenderer
            config={config}
            render={{
              hero: () => <AuraHero {...sectionProps} />,
              destaques: () => <AuraDestaques {...sectionProps} />,
              categorias: () => <AuraCategorias {...sectionProps} />,
              sobre: () => <AuraSobre {...sectionProps} />,
              depoimentos: () => <AuraDepoimentos />,
              faq: () => <AuraFAQ />,
              cta: () => (
                <>
                  <AuraCTA {...sectionProps} />
                  <BlogTeaser slug={tenant.slug} artigos={artigos} variant="dark" />
                </>
              ),
              contato: () => <AuraContato />,
            }}
          />
        </main>
        <AuraFooter config={config} tenant={tenant} />
        <CookieBanner slug={tenant.slug} />
      </ThemeScope>
    );
  }

  if (theme === 'onyx') {
    return (
      <ThemeScope config={config}>
        <OnyxHeader config={config} tenant={tenant} />
        <main>
          <SectionsRenderer
            config={config}
            render={{
              hero: () => <OnyxHero {...sectionProps} />,
              destaques: () => <OnyxDestaques {...sectionProps} />,
              categorias: () => <OnyxCategorias {...sectionProps} />,
              sobre: () => <OnyxSobre {...sectionProps} />,
              depoimentos: () => <OnyxDepoimentos />,
              faq: () => <OnyxFAQ />,
              cta: () => (
                <>
                  <OnyxAnuncie {...sectionProps} />
                  <BlogTeaser slug={tenant.slug} artigos={artigos} variant="light" />
                  <OnyxCTA {...sectionProps} />
                </>
              ),
              contato: () => <OnyxContato tenant={tenant} imoveis={imoveis} />,
            }}
          />
        </main>
        <OnyxFooter config={config} tenant={tenant} />
        <CookieBanner slug={tenant.slug} />
      </ThemeScope>
    );
  }

  // brisa (default)
  return (
    <ThemeScope config={config}>
      <BrisaHeader config={config} tenant={tenant} />
      <main className="pb-10">
        <SectionsRenderer
          config={config}
          render={{
            hero: () => <BrisaHero {...sectionProps} />,
            destaques: () => <BrisaDestaques {...sectionProps} />,
            categorias: () => <BrisaCategorias {...sectionProps} />,
            sobre: () => <BrisaSobre {...sectionProps} />,
            depoimentos: () => <BrisaDepoimentos />,
            faq: () => <BrisaFAQ />,
            cta: () => (
              <>
                <BrisaCTA tenant={tenant} />
                <BlogTeaser slug={tenant.slug} artigos={artigos} variant="light" />
              </>
            ),
            contato: () => <BrisaContato />,
          }}
        />
      </main>
      <BrisaFooter config={config} tenant={tenant} />
      <CookieBanner slug={tenant.slug} />
    </ThemeScope>
  );
}
