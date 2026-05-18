import type { ReactNode } from 'react';
import type { Customization, SectionId } from '@/types/site-customization';

interface Props {
  config: Customization;
  render: Partial<Record<SectionId, () => ReactNode>>;
}

/** Renderiza apenas as seções visíveis na ordem definida no config. */
export function SectionsRenderer({ config, render }: Props) {
  return (
    <>
      {config.sections
        .filter((s) => s.visible && render[s.id])
        .map((s) => (
          <section key={s.id} data-section={s.id}>
            {render[s.id]?.()}
          </section>
        ))}
    </>
  );
}
