/**
 * Conversões de cor.
 *
 * O Tailwind do template usa CSS vars no formato `--primary: 39 46% 61%`
 * (sem o `hsl()`, porque é interpolado dentro de `hsl(var(--primary))` no
 * tailwind.config). As cores do cliente vêm em hex no banco. Esse helper
 * converte um pra outro.
 */

/**
 * Converte hex (#RRGGBB ou #RGB) em HSL "H S% L%".
 * Retorna null se o input for inválido.
 */
export function hexToHsl(hex: string | null | undefined): string | null {
  if (!hex) return null;
  let h = hex.trim().replace('#', '');
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hVal = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        hVal = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        hVal = (b - r) / d + 2;
        break;
      case b:
        hVal = (r - g) / d + 4;
        break;
    }
    hVal /= 6;
  }

  return `${Math.round(hVal * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Calcula a cor de texto contrastante (preto ou branco) para um fundo hex.
 * Útil pra `--primary-foreground` e `--secondary-foreground`.
 */
export function pickForeground(hex: string | null | undefined): string {
  if (!hex) return '0 0% 100%'; // branco
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return '0 0% 100%';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // luminância YIQ
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '0 0% 10%' : '0 0% 98%';
}
