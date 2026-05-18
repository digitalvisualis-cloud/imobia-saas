// Ícones SVG inline pra specs — evita dep externa dentro do canvas exportado.
import type { SpecIconKey } from './_shared';

export function SpecIcon({ kind, size = 1 }: { kind: SpecIconKey; size?: number }) {
  const s = `calc(var(--u) * ${2.4 * size})`;
  const common = {
    width: s,
    height: s,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (kind) {
    case 'bed':
      return (
        <svg {...common}>
          <path d="M3 10v8" />
          <path d="M21 18v-5a3 3 0 0 0-3-3H7" />
          <path d="M3 14h18" />
          <path d="M7 10V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3" />
        </svg>
      );
    case 'bath':
      return (
        <svg {...common}>
          <path d="M3 12h18" />
          <path d="M5 12V6a2 2 0 0 1 2-2h2" />
          <path d="M21 12v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3" />
          <path d="M7 19v2M17 19v2" />
        </svg>
      );
    case 'garage':
      return (
        <svg {...common}>
          <path d="M3 11 12 4l9 7v9H3z" />
          <path d="M7 20v-5h10v5" />
          <path d="M7 15h10" />
        </svg>
      );
    case 'area':
      return (
        <svg {...common}>
          <path d="M4 9V4h5" />
          <path d="M20 9V4h-5" />
          <path d="M4 15v5h5" />
          <path d="M20 15v5h-5" />
        </svg>
      );
    case 'suite':
      return (
        <svg {...common}>
          <path d="M3 18v-7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v7" />
          <path d="M3 18h18" />
          <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <circle cx="18" cy="6" r="1.5" fill="currentColor" />
        </svg>
      );
  }
}
