import { Activity } from 'lucide-react';
import { AdminPlaceholder } from '../_components/Placeholder';

export default function LogsApiPage() {
  return (
    <AdminPlaceholder
      title="Logs API"
      description="Todas as requisições nos endpoints públicos da plataforma."
      Icon={Activity}
      bullets={[
        'Tabela: tenant, endpoint, método, status, latência, IP, user-agent',
        'Filtros por tenant, status, período, endpoint',
        'Detectar abuso, rate-limit estourado, erros 5xx em produção',
        'Export CSV pra análise externa',
      ]}
    />
  );
}
