'use client';

import type { Customization, ThemeId } from '@/types/site-customization';
import type { ImovelPublic, TenantPublic } from '@/app/_templates/types';
import { ThemeScope } from './ThemeScope';
import { SectionsRenderer } from './SectionsRenderer';
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

interface Props {
  theme: ThemeId;
  config: Customization;
  tenant: TenantPublic;
  imoveis: ImovelPublic[];
}

/**
 * Renderiza o tema escolhido (brisa ou aura) com header/footer + seções na ordem
 * configurada. Componente client porque alguns sub-componentes (FAQ accordion) usam
 * estado local. O ThemeScope injeta CSS vars; SectionsRenderer filtra/ordena.
 */
export function ThemeRenderer({ theme, config, tenant, imoveis }: Props) {
  const sectionProps = { tenant, imoveis };

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
              cta: () => <AuraCTA {...sectionProps} />,
              contato: () => <AuraContato />,
            }}
          />
        </main>
        <AuraFooter config={config} tenant={tenant} />
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
            cta: () => <BrisaCTA />,
            contato: () => <BrisaContato />,
          }}
        />
      </main>
      <BrisaFooter config={config} tenant={tenant} />
    </ThemeScope>
  );
}
