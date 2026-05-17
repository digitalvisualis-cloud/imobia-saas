import { KeyRound } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

export const dynamic = 'force-dynamic';

/**
 * /controle-chaves — placeholder. Vai cuidar de entrada/saida de chaves,
 * quem pegou/devolveu, etc. Implementacao em F2.
 */
export default function ControleChavesPage() {
  return (
    <div className="fade-in">
      <PageHeader
        title="Controle de Chaves"
        description="Em breve — controle de quem retirou e devolveu chave de cada imóvel"
        icon={KeyRound}
      />
      <EmptyState
        icon={KeyRound}
        title="Funcionalidade em construção"
        description="Logo logo aqui vai listar todas as chaves dos seus imóveis com histórico de quem pegou e devolveu, com lembretes de devolução."
      />
    </div>
  );
}
