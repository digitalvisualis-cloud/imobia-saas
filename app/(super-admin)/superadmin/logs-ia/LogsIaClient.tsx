'use client';

import { useState, useMemo } from 'react';
import { Brain, CheckCircle2, XCircle, Filter, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type Log = {
  id: string;
  tenantId: string;
  provider: string;
  model: string | null;
  operation: string;
  keySource: string | null;
  promptPreview: string | null;
  responsePreview: string | null;
  tokensInput: number | null;
  tokensOutput: number | null;
  costEstimateBrl: number | null;
  latencyMs: number | null;
  status: string;
  error: string | null;
  createdAt: string;
};

type Stat = {
  provider: string;
  status: string;
  count: number;
  costBrl: number;
  tokensIn: number;
  tokensOut: number;
};

export default function LogsIaClient({
  logs,
  stats,
}: {
  logs: Log[];
  stats: Stat[];
}) {
  const [busca, setBusca] = useState('');
  const [providerFiltro, setProviderFiltro] = useState<string | null>(null);
  const [statusFiltro, setStatusFiltro] = useState<string | null>(null);
  const [selecionado, setSelecionado] = useState<Log | null>(null);

  const filtrados = useMemo(() => {
    return logs.filter((l) => {
      if (providerFiltro && l.provider !== providerFiltro) return false;
      if (statusFiltro && l.status !== statusFiltro) return false;
      if (busca) {
        const q = busca.toLowerCase();
        return (
          l.tenantId.toLowerCase().includes(q) ||
          l.promptPreview?.toLowerCase().includes(q) ||
          l.error?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, providerFiltro, statusFiltro, busca]);

  // Agregados pra KPIs
  const totalCusto24h = stats.reduce((acc, s) => acc + s.costBrl, 0);
  const totalCalls24h = stats.reduce((acc, s) => acc + s.count, 0);
  const erros24h = stats
    .filter((s) => s.status === 'error')
    .reduce((acc, s) => acc + s.count, 0);

  // Por provider
  const porProvider = stats.reduce<
    Record<string, { count: number; cost: number; errors: number }>
  >((acc, s) => {
    if (!acc[s.provider]) acc[s.provider] = { count: 0, cost: 0, errors: 0 };
    acc[s.provider].count += s.count;
    acc[s.provider].cost += s.costBrl;
    if (s.status === 'error') acc[s.provider].errors += s.count;
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Brain className="h-5 w-5 text-red-400" />
          <h1 className="font-display text-3xl font-bold">Logs IA</h1>
        </div>
        <p className="text-sm text-zinc-400">
          Chamadas de Claude, OpenAI e ElevenLabs nas últimas 24h.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Calls 24h" value={totalCalls24h} accent="zinc" />
        <Stat
          label="Custo 24h (BRL)"
          value={`R$ ${totalCusto24h.toFixed(2)}`}
          accent={totalCusto24h > 100 ? 'red' : 'zinc'}
        />
        <Stat
          label="Erros 24h"
          value={erros24h}
          accent={erros24h > 0 ? 'red' : 'green'}
        />
        <Stat
          label="Logs total"
          value={logs.length}
          accent="zinc"
        />
      </div>

      {/* Por provider */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Object.entries(porProvider).map(([provider, p]) => (
          <button
            key={provider}
            onClick={() =>
              setProviderFiltro(providerFiltro === provider ? null : provider)
            }
            className={cn(
              'rounded-lg border p-4 text-left transition-colors',
              providerFiltro === provider
                ? 'border-red-500/40 bg-red-500/5'
                : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700',
            )}
          >
            <p className="text-[10px] uppercase tracking-wider opacity-80 font-semibold mb-0.5">
              {provider}
            </p>
            <p className="text-xl font-bold text-zinc-200">
              {p.count} calls{' '}
              <span className="text-xs text-zinc-500">
                · R$ {p.cost.toFixed(2)}
              </span>
            </p>
            {p.errors > 0 && (
              <p className="text-xs text-red-400 mt-1">{p.errors} erros</p>
            )}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por tenant, prompt, erro..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md border border-zinc-800 bg-zinc-900 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="h-3 w-3 text-zinc-500" />
          {(['success', 'error', 'rate_limited'] as const).map((s) => {
            const active = statusFiltro === s;
            return (
              <button
                key={s}
                onClick={() => setStatusFiltro(active ? null : s)}
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold border',
                  active
                    ? s === 'error'
                      ? 'border-red-500/40 bg-red-500/10 text-red-400'
                      : s === 'success'
                        ? 'border-green-500/40 bg-green-500/10 text-green-400'
                        : 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                    : 'border-zinc-700 text-zinc-500 hover:border-zinc-600',
                )}
              >
                {s}
              </button>
            );
          })}
        </div>
        {(providerFiltro || statusFiltro || busca) && (
          <button
            onClick={() => {
              setProviderFiltro(null);
              setStatusFiltro(null);
              setBusca('');
            }}
            className="text-[10px] text-zinc-500 hover:text-zinc-300"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Tabela */}
      {filtrados.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 text-sm">
          {logs.length === 0
            ? 'Nenhuma chamada IA logada ainda. Faça um teste em /configuracoes/agente-ia ou gere uma imagem por IA.'
            : 'Nenhum log pra esse filtro.'}
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-zinc-900 text-zinc-400">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Status</th>
                <th className="text-left px-3 py-2 font-semibold">Provider</th>
                <th className="text-left px-3 py-2 font-semibold">Tenant</th>
                <th className="text-right px-3 py-2 font-semibold">Tokens</th>
                <th className="text-right px-3 py-2 font-semibold">Custo</th>
                <th className="text-right px-3 py-2 font-semibold">Latência</th>
                <th className="text-right px-3 py-2 font-semibold">Quando</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtrados.map((l) => (
                <tr
                  key={l.id}
                  onClick={() => setSelecionado(l)}
                  className="hover:bg-zinc-900/60 cursor-pointer"
                >
                  <td className="px-3 py-2">
                    <StatusBadge status={l.status} />
                  </td>
                  <td className="px-3 py-2 text-zinc-300">
                    {l.provider}{' '}
                    <span className="text-zinc-500 text-[10px]">
                      {l.model?.split('-').slice(0, 3).join('-')}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-zinc-400 truncate max-w-[160px]">
                    {l.tenantId.slice(0, 12)}…
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-zinc-500">
                    {l.tokensInput || l.tokensOutput
                      ? `${l.tokensInput ?? 0}/${l.tokensOutput ?? 0}`
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-zinc-400">
                    {l.costEstimateBrl
                      ? `R$ ${l.costEstimateBrl.toFixed(3)}`
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-zinc-500">
                    {l.latencyMs ? `${l.latencyMs}ms` : '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-zinc-500">
                    {timeAgo(l.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de detalhe */}
      {selecionado && (
        <div
          className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-6"
          onClick={() => setSelecionado(null)}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-zinc-100">
                  Log {selecionado.id.slice(0, 8)}
                </h3>
                <p className="text-xs text-zinc-500 font-mono">
                  {new Date(selecionado.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
              <StatusBadge status={selecionado.status} />
            </div>
            <div className="space-y-4 text-sm">
              <Field label="Provider" value={`${selecionado.provider} · ${selecionado.model ?? ''}`} />
              <Field label="Tenant" value={selecionado.tenantId} mono />
              <Field
                label="Operation / Key source"
                value={`${selecionado.operation} · ${selecionado.keySource ?? '—'}`}
              />
              <Field
                label="Tokens (in/out) / Custo / Latência"
                value={`${selecionado.tokensInput ?? 0} / ${selecionado.tokensOutput ?? 0}  ·  R$ ${selecionado.costEstimateBrl?.toFixed(4) ?? '—'}  ·  ${selecionado.latencyMs ?? '—'}ms`}
              />
              {selecionado.promptPreview && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                    Prompt
                  </p>
                  <pre className="bg-zinc-950 border border-zinc-800 p-3 rounded text-xs whitespace-pre-wrap text-zinc-300">
                    {selecionado.promptPreview}
                  </pre>
                </div>
              )}
              {selecionado.responsePreview && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                    Resposta
                  </p>
                  <pre className="bg-zinc-950 border border-zinc-800 p-3 rounded text-xs whitespace-pre-wrap text-zinc-300">
                    {selecionado.responsePreview}
                  </pre>
                </div>
              )}
              {selecionado.error && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-red-400 mb-1">
                    Erro
                  </p>
                  <pre className="bg-red-500/5 border border-red-500/30 p-3 rounded text-xs whitespace-pre-wrap text-red-300">
                    {selecionado.error}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const ok = status === 'success';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold border',
        ok
          ? 'border-green-500/30 bg-green-500/10 text-green-400'
          : status === 'rate_limited'
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
            : 'border-red-500/30 bg-red-500/10 text-red-400',
      )}
    >
      {ok ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
      {status}
    </span>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: 'zinc' | 'red' | 'green';
}) {
  const colors = {
    zinc: 'border-zinc-800 bg-zinc-900/40 text-zinc-300',
    red: 'border-red-500/30 bg-red-500/5 text-red-400',
    green: 'border-green-500/30 bg-green-500/5 text-green-400',
  };
  return (
    <div className={cn('rounded-lg border p-4', colors[accent])}>
      <p className="text-[10px] uppercase tracking-wider opacity-80 font-semibold mb-0.5">
        {label}
      </p>
      <p className="text-2xl font-bold leading-tight">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-0.5">
        {label}
      </p>
      <p className={cn('text-sm text-zinc-300', mono && 'font-mono')}>{value}</p>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
