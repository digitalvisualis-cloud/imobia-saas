'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Inbox,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  Flame,
  Snowflake,
  Bot,
  Power,
  ExternalLink,
  Filter,
  Search,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

type Lead = {
  id: string;
  nome: string;
  whatsapp: string | null;
  email: string | null;
  etapa: string;
  temperatura: string;
  interesse: string | null;
  bairroDesejado: string | null;
  orcamento: number | null;
  resumoConversa: string | null;
  dataVisita: string | null;
  origem: string | null;
  notas: string | null;
  imovel: { id: string; codigo: string; titulo: string } | null;
  createdAt: string;
  updatedAt: string;
};

const ETAPA_CORES: Record<string, string> = {
  NOVO: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  QUALIFICANDO: 'bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30',
  INTERESSADO: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  VISITA_AGENDADA: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30',
  PROPOSTA: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-500/30',
  FECHADO_GANHO: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  FECHADO_PERDIDO: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
};

const ETAPAS_ORDEM = [
  'NOVO',
  'QUALIFICANDO',
  'INTERESSADO',
  'VISITA_AGENDADA',
  'PROPOSTA',
  'FECHADO_GANHO',
  'FECHADO_PERDIDO',
];

export default function LeadsInboxClient({
  leads,
  agente,
}: {
  leads: Lead[];
  agente: { nome: string; ativo: boolean; objetivo: string } | null;
}) {
  const [busca, setBusca] = useState('');
  const [etapaFiltro, setEtapaFiltro] = useState<string | null>(null);
  const [tempFiltro, setTempFiltro] = useState<string | null>(null);
  const [selecionado, setSelecionado] = useState<Lead | null>(leads[0] ?? null);

  const filtrados = useMemo(() => {
    return leads.filter((l) => {
      if (etapaFiltro && l.etapa !== etapaFiltro) return false;
      if (tempFiltro && l.temperatura !== tempFiltro) return false;
      if (busca) {
        const q = busca.toLowerCase();
        return (
          l.nome.toLowerCase().includes(q) ||
          l.whatsapp?.includes(q) ||
          l.resumoConversa?.toLowerCase().includes(q) ||
          l.imovel?.titulo.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [leads, etapaFiltro, tempFiltro, busca]);

  // KPIs por etapa
  const kpis = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of leads) counts[l.etapa] = (counts[l.etapa] ?? 0) + 1;
    return counts;
  }, [leads]);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Atendimento"
        icon={Inbox}
        title="Caixa de leads"
        description="Conversas que o agente IA capturou nos últimos 30 dias."
        actions={
          agente && (
            <Link
              href="/configuracoes/agente-ia"
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium border',
                agente.ativo
                  ? 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400'
                  : 'border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:bg-muted',
              )}
            >
              <Bot className="h-4 w-4" />
              {agente.nome} {agente.ativo ? 'ativo' : 'desativado'}
              <Power className="h-3 w-3 opacity-60" />
            </Link>
          )
        }
      />

      {!agente?.ativo && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-3">
          <Bot className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Agente IA não tá ativo</p>
            <p className="text-amber-700/80 dark:text-amber-300/80">
              Os leads não chegam aqui automaticamente enquanto o agente tiver
              desligado.{' '}
              <Link href="/configuracoes/agente-ia" className="underline">
                Configurar agente →
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* KPIs por etapa */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {ETAPAS_ORDEM.map((e) => {
          const count = kpis[e] ?? 0;
          const active = etapaFiltro === e;
          return (
            <button
              key={e}
              onClick={() => setEtapaFiltro(active ? null : e)}
              className={cn(
                'rounded-lg border p-3 text-left transition-colors',
                active
                  ? ETAPA_CORES[e]
                  : 'border-border bg-card hover:border-primary/40',
              )}
            >
              <p className="text-[10px] uppercase tracking-wider font-semibold opacity-80">
                {e.replace('_', ' ')}
              </p>
              <p className="text-2xl font-bold mt-0.5">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Layout split: lista esquerda + detalhe direita */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 min-h-[60vh]">
        {/* Lista */}
        <div className="rounded-lg border border-border bg-card flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nome, telefone, imóvel..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter className="h-3 w-3 text-muted-foreground" />
              {(['QUENTE', 'MORNO', 'FRIO'] as const).map((t) => {
                const Icon = t === 'QUENTE' ? Flame : t === 'FRIO' ? Snowflake : MessageSquare;
                const active = tempFiltro === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTempFiltro(active ? null : t)}
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold border',
                      active
                        ? t === 'QUENTE'
                          ? 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400'
                          : t === 'FRIO'
                            ? 'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400'
                            : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                        : 'border-border text-muted-foreground hover:border-primary/40',
                    )}
                  >
                    <Icon className="h-2.5 w-2.5" />
                    {t}
                  </button>
                );
              })}
              {(etapaFiltro || tempFiltro || busca) && (
                <button
                  onClick={() => {
                    setEtapaFiltro(null);
                    setTempFiltro(null);
                    setBusca('');
                  }}
                  className="text-[10px] text-muted-foreground hover:text-foreground ml-auto"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtrados.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title={
                  leads.length === 0
                    ? 'Nenhum lead ainda'
                    : 'Nenhum lead pra esse filtro'
                }
                description={
                  leads.length === 0
                    ? 'Quando o agente capturar um lead via WhatsApp, ele aparece aqui.'
                    : 'Tenta limpar os filtros pra ver tudo.'
                }
              />
            ) : (
              <div className="divide-y divide-border">
                {filtrados.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setSelecionado(l)}
                    className={cn(
                      'w-full p-3 text-left hover:bg-muted transition-colors',
                      selecionado?.id === l.id && 'bg-primary/5',
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm flex-1 truncate">
                        {l.nome}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[9px] uppercase tracking-wider',
                          ETAPA_CORES[l.etapa],
                        )}
                      >
                        {l.etapa.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {l.resumoConversa ?? '(sem resumo da conversa)'}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                      {l.imovel && (
                        <span className="truncate font-mono">
                          {l.imovel.codigo}
                        </span>
                      )}
                      <span className="ml-auto shrink-0">
                        {timeAgoShort(l.updatedAt)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detalhe */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {selecionado ? (
            <LeadDetalhe lead={selecionado} />
          ) : (
            <div className="h-full grid place-items-center text-muted-foreground p-8 text-center">
              <div>
                <Inbox className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Selecione um lead pra ver o detalhe.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LeadDetalhe({ lead }: { lead: Lead }) {
  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h2 className="font-display text-xl font-bold">{lead.nome}</h2>
            <p className="text-xs text-muted-foreground">
              Lead há {timeAgoLong(lead.createdAt)}
              {lead.origem && ` · via ${lead.origem}`}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn('text-[10px] uppercase tracking-wider', ETAPA_CORES[lead.etapa])}
          >
            {lead.etapa.replace('_', ' ')}
          </Badge>
        </div>
        <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
          {lead.whatsapp && (
            <a
              href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <Phone className="h-3 w-3" />
              {lead.whatsapp}
              <ExternalLink className="h-3 w-3 opacity-50" />
            </a>
          )}
          {lead.email && (
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {lead.email}
            </span>
          )}
          {lead.dataVisita && (
            <span className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-medium">
              <Calendar className="h-3 w-3" />
              Visita: {new Date(lead.dataVisita).toLocaleString('pt-BR')}
            </span>
          )}
        </div>
      </div>

      {/* Resumo da IA */}
      <div className="p-5 border-b border-border">
        <h3 className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-violet-500" /> Resumo da conversa (gerado pelo agente)
        </h3>
        {lead.resumoConversa ? (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {lead.resumoConversa}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Sem resumo. Conversa ainda não foi processada pelo agente.
          </p>
        )}
      </div>

      {/* Perfil */}
      <div className="p-5 border-b border-border space-y-3">
        <h3 className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
          Perfil do lead
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info label="Interesse" value={lead.interesse} />
          <Info label="Bairro desejado" value={lead.bairroDesejado} />
          <Info
            label="Orçamento"
            value={
              lead.orcamento
                ? `R$ ${lead.orcamento.toLocaleString('pt-BR')}`
                : null
            }
          />
          <Info label="Temperatura" value={lead.temperatura} />
        </div>
      </div>

      {/* Imóvel */}
      {lead.imovel && (
        <div className="p-5 border-b border-border">
          <h3 className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
            Imóvel de interesse
          </h3>
          <Link
            href={`/imoveis/${lead.imovel.id}`}
            className="block rounded-md border border-border p-3 hover:border-primary transition-colors"
          >
            <p className="font-mono text-xs text-muted-foreground">
              {lead.imovel.codigo}
            </p>
            <p className="font-medium text-sm">{lead.imovel.titulo}</p>
          </Link>
        </div>
      )}

      {/* Notas */}
      {lead.notas && (
        <div className="p-5">
          <h3 className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
            Notas
          </h3>
          <p className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
            {lead.notas}
          </p>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium">{value ?? '—'}</p>
    </div>
  );
}

function timeAgoShort(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function timeAgoLong(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'menos de 1 minuto';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} horas`;
  return `${Math.floor(diff / 86400)} dias`;
}
