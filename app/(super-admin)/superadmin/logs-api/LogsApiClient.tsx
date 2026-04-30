'use client';

import { useState, useMemo } from 'react';
import { Activity, Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

type Log = {
  id: string;
  tenantId: string | null;
  route: string;
  method: string;
  status: number;
  latencyMs: number | null;
  ip: string | null;
  userId: string | null;
  errorMessage: string | null;
  createdAt: string;
};

export default function LogsApiClient({ logs }: { logs: Log[] }) {
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    return logs.filter((l) => {
      if (statusFiltro === 'errors' && l.status < 400) return false;
      if (statusFiltro === 'rate' && l.status !== 429) return false;
      if (busca) {
        const q = busca.toLowerCase();
        return (
          l.route.toLowerCase().includes(q) ||
          l.tenantId?.toLowerCase().includes(q) ||
          l.ip?.includes(q) ||
          l.errorMessage?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, statusFiltro, busca]);

  const errors = logs.filter((l) => l.status >= 400).length;
  const rateLimited = logs.filter((l) => l.status === 429).length;

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Activity className="h-5 w-5 text-red-400" />
          <h1 className="font-display text-3xl font-bold">Logs API</h1>
        </div>
        <p className="text-sm text-zinc-400">
          Requests recentes nos endpoints sensíveis (webhooks, internal,
          super-admin). Loga só o que importa pra debug e billing.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Logs total" value={logs.length} accent="zinc" />
        <Stat
          label="Erros (4xx/5xx)"
          value={errors}
          accent={errors > 0 ? 'red' : 'green'}
        />
        <Stat
          label="Rate limited (429)"
          value={rateLimited}
          accent={rateLimited > 0 ? 'amber' : 'zinc'}
        />
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por route, tenant, IP, erro..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md border border-zinc-800 bg-zinc-900 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="h-3 w-3 text-zinc-500" />
          {(['errors', 'rate'] as const).map((s) => {
            const active = statusFiltro === s;
            return (
              <button
                key={s}
                onClick={() => setStatusFiltro(active ? null : s)}
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold border',
                  active
                    ? s === 'errors'
                      ? 'border-red-500/40 bg-red-500/10 text-red-400'
                      : 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                    : 'border-zinc-700 text-zinc-500 hover:border-zinc-600',
                )}
              >
                {s === 'errors' ? 'Só erros' : 'Rate-limited'}
              </button>
            );
          })}
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 text-sm">
          {logs.length === 0
            ? 'Nenhum request loggado ainda. Os logs aparecem conforme webhooks e endpoints são chamados.'
            : 'Nenhum log pra esse filtro.'}
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-zinc-900 text-zinc-400">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Status</th>
                <th className="text-left px-3 py-2 font-semibold">Method</th>
                <th className="text-left px-3 py-2 font-semibold">Route</th>
                <th className="text-left px-3 py-2 font-semibold">Tenant</th>
                <th className="text-left px-3 py-2 font-semibold">IP</th>
                <th className="text-right px-3 py-2 font-semibold">Latência</th>
                <th className="text-right px-3 py-2 font-semibold">Quando</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtrados.map((l) => (
                <tr key={l.id} className="hover:bg-zinc-900/60">
                  <td className="px-3 py-2">
                    <StatusBadge code={l.status} />
                  </td>
                  <td className="px-3 py-2 font-mono text-zinc-400">{l.method}</td>
                  <td className="px-3 py-2 font-mono text-zinc-300 truncate max-w-[260px]">
                    {l.route}
                  </td>
                  <td className="px-3 py-2 font-mono text-zinc-500 truncate max-w-[120px]">
                    {l.tenantId?.slice(0, 12) ?? '—'}
                  </td>
                  <td className="px-3 py-2 font-mono text-zinc-500">
                    {l.ip ?? '—'}
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
    </div>
  );
}

function StatusBadge({ code }: { code: number }) {
  const color =
    code >= 500
      ? 'border-red-500/30 bg-red-500/10 text-red-400'
      : code >= 400
        ? code === 429
          ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
          : 'border-orange-500/30 bg-orange-500/10 text-orange-400'
        : 'border-green-500/30 bg-green-500/10 text-green-400';
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold border',
        color,
      )}
    >
      {code}
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
  accent: 'zinc' | 'red' | 'green' | 'amber';
}) {
  const colors = {
    zinc: 'border-zinc-800 bg-zinc-900/40 text-zinc-300',
    red: 'border-red-500/30 bg-red-500/5 text-red-400',
    green: 'border-green-500/30 bg-green-500/5 text-green-400',
    amber: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
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

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
