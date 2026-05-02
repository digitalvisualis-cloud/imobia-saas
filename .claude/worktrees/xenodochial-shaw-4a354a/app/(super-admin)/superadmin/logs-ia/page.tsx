import { Brain } from 'lucide-react';
import { AdminPlaceholder } from '../_components/Placeholder';

export default function LogsIaPage() {
  return (
    <AdminPlaceholder
      title="Logs IA"
      description="Histórico de chamadas de Claude Haiku, OpenAI Image e ElevenLabs."
      Icon={Brain}
      bullets={[
        'Tabela: tenant, modelo, tokens in/out, custo estimado, latência, sucesso',
        'Filtros por tenant, modelo, período, status',
        'Identificar quem está estourando o uso de IA',
        'Custo total por tenant (input pra revisar pricing)',
      ]}
    />
  );
}
