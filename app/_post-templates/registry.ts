import { CleanTemplate } from './Clean';
import { BordaTemplate } from './Borda';
import { PremiumTemplate } from './Premium';
import type { PostTemplate } from './types';

/**
 * Registry dos 3 templates do MVP. Pra adicionar mais templates basta criar
 * um componente novo e registrar aqui.
 */
export const POST_TEMPLATES: PostTemplate[] = [
  {
    id: 'clean',
    nome: 'Clean',
    descricao: 'Foto cheia + barra inferior com preço',
    vibe: 'Direto · Moderno',
    Component: CleanTemplate,
  },
  {
    id: 'borda',
    nome: 'Borda',
    descricao: 'Fundo branco com moldura colorida da marca',
    vibe: 'Boutique · Sofisticado',
    Component: BordaTemplate,
  },
  {
    id: 'premium',
    nome: 'Premium',
    descricao: 'Header colorido + foto + bloco escuro com preço',
    vibe: 'Lançamento · Alto padrão',
    Component: PremiumTemplate,
  },
];

export function getTemplate(id: string): PostTemplate | undefined {
  return POST_TEMPLATES.find((t) => t.id === id);
}
