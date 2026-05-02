import { type ReactNode } from 'react';
import { FONT_OPTIONS, type Customization } from '@/types/site-customization';

function fontStack(name: string) {
  return FONT_OPTIONS.find((f) => f.name === name)?.stack ?? name;
}

/** hex (#rrggbb) -> "r g b" */
function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const num = parseInt(v, 16);
  if (Number.isNaN(num)) return '0 0 0';
  return `${(num >> 16) & 255} ${(num >> 8) & 255} ${num & 255}`;
}

interface Props {
  config: Customization;
  children: ReactNode;
  className?: string;
}

/**
 * Aplica o tema (cores + fontes) via CSS variables inline.
 * Funciona em SSR e CSR — não usa useEffect, então o primeiro render
 * já vem com as variáveis corretas.
 *
 * Variáveis expostas:
 *   --t-primary, --t-primary-rgb
 *   --t-secondary, --t-secondary-rgb
 *   --t-bg, --t-fg, --t-fg-rgb
 *   --t-font-heading, --t-font-body
 */
export function ThemeScope({ config, children, className }: Props) {
  return (
    <div
      className={className ?? 'min-h-screen w-full'}
      style={{
        backgroundColor: config.colors.background,
        color: config.colors.foreground,
        fontFamily: fontStack(config.fonts.body),
        ['--t-primary' as string]: config.colors.primary,
        ['--t-primary-rgb' as string]: hexToRgb(config.colors.primary),
        ['--t-secondary' as string]: config.colors.secondary,
        ['--t-secondary-rgb' as string]: hexToRgb(config.colors.secondary),
        ['--t-bg' as string]: config.colors.background,
        ['--t-fg' as string]: config.colors.foreground,
        ['--t-fg-rgb' as string]: hexToRgb(config.colors.foreground),
        ['--t-font-heading' as string]: fontStack(config.fonts.heading),
        ['--t-font-body' as string]: fontStack(config.fonts.body),
      }}
    >
      {children}
    </div>
  );
}
