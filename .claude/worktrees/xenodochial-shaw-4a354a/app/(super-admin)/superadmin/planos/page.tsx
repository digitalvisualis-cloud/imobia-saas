import { Receipt } from 'lucide-react';
import { AdminPlaceholder } from '../_components/Placeholder';

export default function PlanosAdminPage() {
  return (
    <AdminPlaceholder
      title="Planos"
      description="Configure os planos e preços que aparecem no signup."
      Icon={Receipt}
      bullets={[
        'CRUD de planos: nome, preço, ciclo (mensal/anual), features, limites',
        'Toggle ativo/inativo (planos ocultos no signup mas mantém assinantes)',
        'Cupons de desconto e trials',
        'Sincronização com Asaas (já temos integração)',
      ]}
    />
  );
}
