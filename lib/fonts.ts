/**
 * Catálogo de fontes disponíveis pro cliente escolher em /configuracoes.
 *
 * Cada fonte vem do Google Fonts. As fontes ficam pre-loaded no globals.css
 * (ou via Next.js next/font no futuro) e o cliente só seleciona pela key.
 *
 * Aplicação: a key vai pra `--font-display` e `--font-body` (CSS vars) no
 * layout do site público (`app/s/[slug]/layout.tsx`).
 */

export type FonteTituloKey =
  | 'cormorant'
  | 'playfair'
  | 'lora'
  | 'inter'
  | 'montserrat';

export type FonteCorpoKey = 'inter' | 'montserrat' | 'lora' | 'system';

export const FONTES_TITULO: Array<{
  key: FonteTituloKey;
  nome: string;
  familyCss: string; // valor pra `font-family`
  amostra: string; // pra preview no dropdown
  vibe: string;
}> = [
  {
    key: 'cormorant',
    nome: 'Cormorant Garamond',
    familyCss: '"Cormorant Garamond", "Times New Roman", serif',
    amostra: 'Encontre o imóvel ideal',
    vibe: 'Elegante · Sofisticado',
  },
  {
    key: 'playfair',
    nome: 'Playfair Display',
    familyCss: '"Playfair Display", "Times New Roman", serif',
    amostra: 'Encontre o imóvel ideal',
    vibe: 'Editorial · Magazine',
  },
  {
    key: 'lora',
    nome: 'Lora',
    familyCss: '"Lora", Georgia, serif',
    amostra: 'Encontre o imóvel ideal',
    vibe: 'Aconchegante · Acessível',
  },
  {
    key: 'inter',
    nome: 'Inter',
    familyCss: '"Inter", system-ui, sans-serif',
    amostra: 'Encontre o imóvel ideal',
    vibe: 'Moderno · Clean',
  },
  {
    key: 'montserrat',
    nome: 'Montserrat',
    familyCss: '"Montserrat", system-ui, sans-serif',
    amostra: 'Encontre o imóvel ideal',
    vibe: 'Geométrico · Tech',
  },
];

export const FONTES_CORPO: Array<{
  key: FonteCorpoKey;
  nome: string;
  familyCss: string;
}> = [
  {
    key: 'inter',
    nome: 'Inter',
    familyCss: '"Inter", system-ui, sans-serif',
  },
  {
    key: 'montserrat',
    nome: 'Montserrat',
    familyCss: '"Montserrat", system-ui, sans-serif',
  },
  {
    key: 'lora',
    nome: 'Lora',
    familyCss: '"Lora", Georgia, serif',
  },
  {
    key: 'system',
    nome: 'Sistema (mais rápido)',
    familyCss: 'system-ui, -apple-system, sans-serif',
  },
];

export function getFamilyTitulo(key: string | null | undefined): string {
  const found = FONTES_TITULO.find((f) => f.key === key);
  return found?.familyCss ?? FONTES_TITULO[0].familyCss;
}

export function getFamilyCorpo(key: string | null | undefined): string {
  const found = FONTES_CORPO.find((f) => f.key === key);
  return found?.familyCss ?? FONTES_CORPO[0].familyCss;
}
