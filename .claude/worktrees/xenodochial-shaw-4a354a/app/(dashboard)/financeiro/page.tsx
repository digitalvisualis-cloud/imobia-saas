import FinanceiroClient from './FinanceiroClient';

export const dynamic = 'force-dynamic';

export default function FinanceiroPage() {
  // TODO próxima sessão: criar tabela `contratos` no schema e buscar do banco.
  // Por enquanto a tela funciona com state local — Pablo já pode ver o ambiente.
  return <FinanceiroClient />;
}
