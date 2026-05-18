import { KeyRound } from 'lucide-react';
import { AdminPlaceholder } from '../_components/Placeholder';

export default function ApiKeysPage() {
  return (
    <AdminPlaceholder
      title="Chaves API"
      description="Chaves globais de IA + webhook secrets da plataforma."
      Icon={KeyRound}
      bullets={[
        'Anthropic Haiku (Claude)',
        'OpenAI Image / GPT-4o-mini',
        'ElevenLabs (voz)',
        'Asaas (pagamento)',
        'Evolution API (WhatsApp)',
        'Cifrar com chave mestra (não texto plano)',
        'Rotação por botão + log de quem trocou',
      ]}
    />
  );
}
