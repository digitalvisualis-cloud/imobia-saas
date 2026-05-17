'use client';

import { useState } from 'react';
import {
  Zap,
  Copy,
  Check,
  AlertCircle,
  Clock,
  RefreshCcw,
  KeyRound,
  ArrowRightLeft,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

const EVENTOS = [
  {
    tipo: 'cobranca_atrasada',
    icone: AlertCircle,
    titulo: 'Régua de cobrança automática',
    descricao:
      'D+1, D+3, D+7, D+15 após o vencimento. Mensagem progressiva (lembrete → cobrança formal → notificação extrajudicial).',
    origem: 'Inadimplência',
    canal: 'WhatsApp + E-mail',
    accent: 'amber',
  },
  {
    tipo: 'contrato_vencendo',
    icone: FileText,
    titulo: 'Lembrete de renovação',
    descricao:
      '30, 15 e 5 dias antes do fim do contrato. Pergunta intenção (renovar / encerrar) com link de aceite.',
    origem: 'Contratos',
    canal: 'WhatsApp + E-mail',
    accent: 'primary',
  },
  {
    tipo: 'reajuste_proximo',
    icone: RefreshCcw,
    titulo: 'Aviso de reajuste anual',
    descricao:
      '60 e 30 dias antes do aniversário. Calcula valor sugerido com índice (IGP-M / IPCA) e envia carta de reajuste.',
    origem: 'Inquilinos',
    canal: 'WhatsApp + E-mail',
    accent: 'violet',
  },
  {
    tipo: 'chave_atrasada',
    icone: KeyRound,
    titulo: 'Cobrança de devolução de chave',
    descricao:
      'Imediato após o prazo passar. Lembra a pessoa que pegou a chave (visita, manutenção, etc) que precisa devolver.',
    origem: 'Controle de Chaves',
    canal: 'WhatsApp',
    accent: 'amber',
  },
  {
    tipo: 'repasse_pendente',
    icone: ArrowRightLeft,
    titulo: 'Aviso de repasse pendente',
    descricao:
      'Se repasse fica em "A repassar" há mais de 5 dias úteis, dispara aviso pro proprietário com prazo previsto.',
    origem: 'Repasses',
    canal: 'WhatsApp + E-mail',
    accent: 'teal',
  },
];

export default function AutomacoesClient({ tenantId }: { tenantId: string }) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app.visualisdigital.com';
  const endpointPendentes = `${baseUrl}/api/cron/eventos-pendentes?tenantId=${tenantId}`;
  const endpointMarcar = `${baseUrl}/api/cron/marcar-emitido`;

  const [copied, setCopied] = useState<string | null>(null);
  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      toast.success('Copiado!');
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Configurações"
        icon={Zap}
        title="Automações"
        description="Régua de mensagens automáticas via n8n — em breve no plano Pro"
      />

      <div className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-4 py-3 flex items-start gap-3">
        <Zap className="h-5 w-5 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-violet-900 dark:text-violet-200">
            🚀 Disponível com upgrade Pro
          </p>
          <p className="text-xs text-violet-800/80 dark:text-violet-300/80 mt-0.5">
            O app já está pronto: todos os pontos abaixo emitem eventos quando você usa a UI. Falta
            só conectar o n8n nos endpoints abaixo. Quando ativar o plano Pro, configuramos o n8n
            por você.
          </p>
        </div>
      </div>

      {/* Régua de eventos */}
      <section>
        <h3 className="font-display text-lg font-semibold mb-3">Eventos disponíveis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {EVENTOS.map((ev) => {
            const Icon = ev.icone;
            const colorTones: Record<string, string> = {
              amber: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
              primary: 'text-primary bg-primary/10',
              violet: 'text-violet-600 dark:text-violet-400 bg-violet-500/10',
              teal: 'text-teal-600 dark:text-teal-400 bg-teal-500/10',
            };
            return (
              <article
                key={ev.tipo}
                className="rounded-lg border border-border bg-card p-4 flex gap-3"
              >
                <div
                  className={cn(
                    'shrink-0 h-10 w-10 rounded-lg grid place-items-center',
                    colorTones[ev.accent] ?? 'bg-muted',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">{ev.titulo}</h4>
                    <Badge variant="outline" className="text-[10px] font-normal shrink-0">
                      Em breve
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{ev.descricao}</p>
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    <Badge variant="outline" className="font-normal">
                      <span className="text-muted-foreground mr-1">origem:</span> {ev.origem}
                    </Badge>
                    <Badge variant="outline" className="font-normal">
                      <span className="text-muted-foreground mr-1">canal:</span> {ev.canal}
                    </Badge>
                  </div>
                  <p className="mt-2 text-[10px] font-mono text-muted-foreground">
                    eventoTipo: <code className="bg-muted/40 px-1 rounded">{ev.tipo}</code>
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Endpoints técnicos */}
      <section>
        <h3 className="font-display text-lg font-semibold mb-3">
          Endpoints técnicos
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            (pro time técnico configurar o n8n)
          </span>
        </h3>
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 font-mono">
                GET
              </Badge>
              <h4 className="font-semibold">Listar eventos pendentes</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              n8n consome a cada X minutos. Retorna eventos prontos pra disparar com{' '}
              <code className="text-[11px] bg-muted/40 px-1 rounded">evento*Emitido = false</code>.
            </p>
            <div className="flex items-center gap-2 mb-2">
              <code className="flex-1 text-xs bg-muted/40 border border-border rounded px-2 py-1.5 font-mono break-all">
                {endpointPendentes}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copy(endpointPendentes, 'get')}
              >
                {copied === 'get' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              <strong>Header:</strong>{' '}
              <code className="bg-muted/40 px-1 rounded">X-Cron-Secret: &lt;CRON_SECRET&gt;</code>
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30 font-mono">
                POST
              </Badge>
              <h4 className="font-semibold">Marcar como emitido (callback)</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              n8n bate aqui após disparar com sucesso. Seta o flag pra cron não duplicar. Em{' '}
              <code className="text-[11px] bg-muted/40 px-1 rounded">cobranca</code> pode passar{' '}
              <code className="text-[11px] bg-muted/40 px-1 rounded">adicionarHistorico</code>{' '}
              pra registrar a tentativa.
            </p>
            <div className="flex items-center gap-2 mb-2">
              <code className="flex-1 text-xs bg-muted/40 border border-border rounded px-2 py-1.5 font-mono break-all">
                {endpointMarcar}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copy(endpointMarcar, 'post')}
              >
                {copied === 'post' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mb-2">
              <strong>Header:</strong>{' '}
              <code className="bg-muted/40 px-1 rounded">X-Cron-Secret: &lt;CRON_SECRET&gt;</code>
            </p>
            <details className="text-[11px] mt-2">
              <summary className="cursor-pointer text-primary hover:underline">
                Ver body schema
              </summary>
              <pre className="mt-2 bg-muted/40 border border-border rounded px-2 py-2 overflow-x-auto font-mono text-[11px]">
{`{
  "tenantId": "string",
  "recursoTipo": "cobranca | contrato | chaveRetirada | repasse",
  "recursoId": "string",
  "evento": "cobranca | vencimento | reajuste | atraso",
  "adicionarHistorico": {
    "canal": "whatsapp | email",
    "status": "enviado | falhou",
    "conteudo": "string (opcional)"
  }
}`}
              </pre>
            </details>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 md:p-5">
        <div className="flex items-center gap-2 mb-3">
          <ChevronRight className="h-4 w-4 text-primary" />
          <h3 className="font-display text-base font-semibold">Como funciona quando ativar</h3>
        </div>
        <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
          <li>n8n consulta o endpoint GET a cada 30 minutos.</li>
          <li>Pra cada evento retornado, roteia por <code className="text-xs bg-muted/40 px-1 rounded">eventoTipo</code> pra um sub-workflow.</li>
          <li>Sub-workflow monta a mensagem (template + dados) e dispara via WhatsApp (Twilio, Evolution ou outro).</li>
          <li>Em sucesso, bate POST no callback pra marcar evento*Emitido = true. Não duplica.</li>
          <li>Em falha (sem internet, sem saldo, etc), o evento volta no próximo ciclo.</li>
        </ol>
      </section>

      <div className="text-xs text-muted-foreground bg-muted/40 border border-border rounded-md px-3 py-2 flex items-start gap-2">
        <Clock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>
          MVP atual: os campos <code className="text-[11px] bg-background px-1 rounded">evento*Emitido</code>{' '}
          já existem no banco e são resetados automaticamente quando o estado relevante muda
          (renovação, novo reajuste, etc). Falta só o n8n consumir.
        </span>
      </div>
    </div>
  );
}
