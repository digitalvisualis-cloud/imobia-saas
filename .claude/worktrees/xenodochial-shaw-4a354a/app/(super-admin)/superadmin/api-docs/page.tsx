import { BookOpen } from 'lucide-react';
import { AdminPlaceholder } from '../_components/Placeholder';

export default function ApiDocsPage() {
  return (
    <AdminPlaceholder
      title="Documentação API"
      description="Referência interna de todos os endpoints REST da plataforma."
      Icon={BookOpen}
      bullets={[
        'Listagem automática a partir do app/api/* (route discovery)',
        'OpenAPI / Swagger embedado',
        'Try-it-now com auth token de teste',
        'Mudanças versionadas com deprecation notices',
      ]}
    />
  );
}
