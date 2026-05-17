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
  // Vars derivadas dos defaults do tema (lab) — quando user nao customizou
  // estes campos, usa fallback baseado em fg/bg pra nao quebrar.
  const c = config.colors;
  const card = c.card ?? '#ffffff';
  const muted = c.muted ?? `rgb(${hexToRgb(c.foreground)} / 0.6)`;
  const line = c.line ?? `rgb(${hexToRgb(c.foreground)} / 0.12)`;
  const primaryInk = c.primaryInk ?? '#ffffff';
  const secondaryInk = c.secondaryInk ?? '#ffffff';

  return (
    <div
      className={className ?? 'min-h-screen w-full'}
      style={{
        backgroundColor: c.background,
        color: c.foreground,
        fontFamily: fontStack(config.fonts.body),
        // Cor accent (user customiza)
        ['--t-primary' as string]: c.primary,
        ['--t-primary-rgb' as string]: hexToRgb(c.primary),
        ['--t-primary-ink' as string]: primaryInk,
        // Cor band CTA (travada por tema)
        ['--t-secondary' as string]: c.secondary,
        ['--t-secondary-rgb' as string]: hexToRgb(c.secondary),
        ['--t-secondary-ink' as string]: secondaryInk,
        // Tokens neutros (travados por tema, garantem contraste)
        ['--t-bg' as string]: c.background,
        ['--t-fg' as string]: c.foreground,
        ['--t-fg-rgb' as string]: hexToRgb(c.foreground),
        ['--t-card' as string]: card,
        ['--t-muted' as string]: muted,
        ['--t-line' as string]: line,
        // Fontes
        ['--t-font-heading' as string]: fontStack(config.fonts.heading),
        ['--t-font-body' as string]: fontStack(config.fonts.body),
      }}
    >
      {children}
    </div>
  );
}
