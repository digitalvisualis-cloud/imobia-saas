'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ExternalLink,
  Webhook,
  Server,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Config = {
  baseUrl: string | null;
  workflowPath: string;
  secretConfigured: boolean;
};

type HealthState = {
  status: 'unknown' | 'checking' | 'up' | 'down';
  latencyMs: number | null;
  workflowFound: boolean | null;
  lastExecution: {
    at: string;
    status: 'success' | 'error' | 'running';
  } | null;
  errors24h: number;
  leadsProcessed24h: number;
  tenantsAtivos: number;
};

const INITIAL: HealthState = {
  status: 'unknown',
  latencyMs: null,
  workflowFound: null,
  lastExecution: null,
  errors24h: 0,
  leadsProcessed24h: 0,
  tenantsAtivos: 0,
};

export default function N8nSaudeClient({ config }: { config: Config }) {
  const [health, setHealth] = useState<HealthState>(INITIAL);
  const [checking, setChecking] = useState(false);

  async function check() {
    setChecking(true);
    setHealth((p) => ({ ...p, status: 'checking' }));
    try {
      const r = await fetch('/api/admin/n8n/health', {
        method: 'GET',
        cache: 'no-store',
      });
      const data = await r.json();
      setHealth({
        status: data.up ? 'up' : 'down',
        latencyMs: data.latencyMs ?? null,
        workflowFound: data.workflowFound ?? null,
        lastExecution: data.lastExecution ?? null,
        errors24h: data.errors24h ?? 0,
        leadsProcessed24h: data.leadsProcessed24h ?? 0,
        tenantsAtivos: data.tenantsAtivos ?? 0,
      });
    } catch {
      setHealth((p) => ({ ...p, status: 'down' }));
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    if (config.baseUrl) check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const semConfig = !config.baseUrl;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-5 w-5 text-red-400" />
            <h1 className="font-display text-3xl font-bold">Saúde do n8n</h1>
          </div>
          <p className="text-sm text-zinc-400">
            Status do workflow master que faz toda automação multi-tenant.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {config.baseUrl && (
            <a
              href={config.baseUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1 px-3 py-2 rounded-md border border-zinc-800 hover:bg-zinc-900"
            >
              <ExternalLink className="h-3 w-3" /> Abrir n8n
            </a>
          )}
          <button
            onClick={check}
            disabled={checking || semConfig}
            className="text-xs inline-flex items-center gap-1 px-3 py-2 rounded-md bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 disabled:opacity-50"
          >
            {checking ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            Atualizar
          </button>
        </div>
      </div>

      {semConfig && (
        <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-300 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">n8n não configurado</p>
            <p className="text-yellow-300/80">
              Defina <code className="font-mono">N8N_BASE_URL</code>,{' '}
              <code className="font-mono">N8N_WEBHOOK_SECRET</code> e{' '}
              <code className="font-mono">N8N_MASTER_WEBHOOK_PATH</code> nas
              variáveis de ambiente. Veja "Chaves & Credenciais".
            </p>
          </div>
        </div>
      )}

      {/* Status geral */}
      <div
        className={cn(
          'rounded-lg border p-5 flex items-center gap-4',
          health.status === 'up'
            ? 'border-green-500/40 bg-green-500/5'
            : health.status === 'down'
              ? 'border-red-500/40 bg-red-500/10'
              : 'border-zinc-800 bg-zinc-900/30',
        )}
      >
        <div
          className={cn(
            'h-12 w-12 rounded-full grid place-items-center shrink-0',
            health.status === 'up'
              ? 'bg-green-500/20 text-green-400'
              : health.status === 'down'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-zinc-800 text-zinc-500',
          )}
        >
          {health.status === 'checking' ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : health.status === 'up' ? (
            <CheckCircle2 className="h-6 w-6" />
          ) : health.status === 'down' ? (
            <AlertTriangle className="h-6 w-6" />
          ) : (
            <Server className="h-6 w-6" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg">
            {health.status === 'up'
              ? 'n8n master está respondendo'
              : health.status === 'down'
                ? 'n8n master fora do ar'
                : health.status === 'checking'
                  ? 'Verificando...'
                  : 'Status desconhecido'}
          </h3>
          <p className="text-sm text-zinc-400 truncate font-mono">
            {config.baseUrl ?? '— não configurado —'}
          </p>
          {health.latencyMs != null && (
            <p className="text-xs text-zinc-500 mt-0.5">
              Latência: {health.latencyMs}ms
            </p>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat
          label="Tenants ativos"
          value={health.tenantsAtivos}
          icon={<Zap className="h-4 w-4" />}
          accent="zinc"
        />
        <Stat
          label="Leads 24h"
          value={health.leadsProcessed24h}
          icon={<Webhook className="h-4 w-4" />}
          accent="zinc"
        />
        <Stat
          label="Erros 24h"
          value={health.errors24h}
          icon={<AlertTriangle className="h-4 w-4" />}
          accent={health.errors24h > 0 ? 'red' : 'green'}
        />
        <Stat
          label="Workflow master"
          value={
            health.workflowFound === null
              ? '—'
              : health.workflowFound
                ? 'OK'
                : 'Faltando'
          }
          icon={<Server className="h-4 w-4" />}
          accent={
            health.workflowFound === false
              ? 'red'
              : health.workflowFound
                ? 'green'
                : 'zinc'
          }
        />
      </div>

      {/* Última execução */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-zinc-300 mb-3">
          Última execução
        </h3>
        {health.lastExecution ? (
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                health.lastExecution.status === 'success'
                  ? 'bg-green-400'
                  : health.lastExecution.status === 'error'
                    ? 'bg-red-400'
                    : 'bg-yellow-400',
              )}
            />
            <span className="text-sm font-mono text-zinc-300">
              {new Date(health.lastExecution.at).toLocaleString('pt-BR')}
            </span>
            <span className="text-xs text-zinc-500 uppercase tracking-wider">
              {health.lastExecution.status}
            </span>
          </div>
        ) : (
          <p className="text-sm text-zinc-500 italic">
            Sem dados — workflow ainda não executou ou n8n não tá configurado.
          </p>
        )}
      </div>

      {/* Webhook URLs documentadas */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-zinc-300 mb-3">
          Endpoints documentados
        </h3>
        <div className="space-y-2 text-xs font-mono">
          <Endpoint
            label="n8n → Lead chega (master)"
            method="POST"
            path={`${config.baseUrl ?? '<N8N_BASE_URL>'}${config.workflowPath}`}
          />
          <Endpoint
            label="ImobIA → recebe lead do n8n"
            method="POST"
            path="/api/webhooks/n8n/lead-in"
          />
          <Endpoint
            label="ImobIA → recebe update qualificação"
            method="POST"
            path="/api/webhooks/n8n/lead-update"
          />
        </div>
        <p className="text-[11px] text-zinc-500 mt-3">
          Todos com header <code className="font-mono">x-n8n-signature</code>{' '}
          (HMAC SHA256 do body com{' '}
          <code className="font-mono">N8N_WEBHOOK_SECRET</code>).
        </p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent: 'red' | 'green' | 'zinc';
}) {
  const colors = {
    red: 'border-red-500/30 bg-red-500/5 text-red-400',
    green: 'border-green-500/30 bg-green-500/5 text-green-400',
    zinc: 'border-zinc-800 bg-zinc-900/40 text-zinc-300',
  };
  return (
    <div className={cn('rounded-lg border p-4', colors[accent])}>
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <p className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">
          {label}
        </p>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function Endpoint({
  label,
  method,
  path,
}: {
  label: string;
  method: string;
  path: string;
}) {
  return (
    <div className="flex items-start gap-3 px-3 py-2 rounded bg-zinc-950 border border-zinc-800">
      <span
        className={cn(
          'text-[9px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0',
          method === 'POST'
            ? 'bg-blue-500/20 text-blue-300'
            : 'bg-green-500/20 text-green-300',
        )}
      >
        {method}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-zinc-500 text-[10px] uppercase tracking-wider not-italic font-sans">
          {label}
        </p>
        <p className="text-zinc-300 text-xs break-all">{path}</p>
      </div>
    </div>
  );
}
