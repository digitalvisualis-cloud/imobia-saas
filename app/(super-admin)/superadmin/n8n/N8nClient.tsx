'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Webhook,
  Workflow,
  KeyRound,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ExternalLink,
  Power,
  Eye,
  Plus,
  ChevronRight,
  Sparkles,
  PlugZap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'workflows' | 'credentials' | 'variables' | 'executions';

type Workflow = {
  id: string;
  name: string;
  active: boolean;
  tags?: { id: string; name: string }[];
  createdAt: string;
  updatedAt: string;
};

type Credential = {
  id: string;
  name: string;
  type: string;
  createdAt: string;
};

type Variable = {
  id: string;
  key: string;
  value: string;
};

type Execution = {
  id: string;
  workflowId: string;
  status?: string;
  finished: boolean;
  startedAt: string;
  stoppedAt?: string;
  durationMs?: number | null;
  mode: string;
};

export default function N8nClient({
  hasApiKey,
  baseUrl,
}: {
  hasApiKey: boolean;
  baseUrl: string | null;
}) {
  const [tab, setTab] = useState<Tab>('workflows');

  if (!hasApiKey) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Header baseUrl={baseUrl} />
        <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 p-5 text-sm text-yellow-300 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-base">N8N_API_KEY não configurada</p>
              <p className="text-yellow-300/80 mt-1">
                Sem ela, o ImobIA não consegue ler nem gerenciar teus workflows. Pra ativar:
              </p>
            </div>
          </div>
          <ol className="space-y-2 ml-8 text-yellow-200/90 list-decimal">
            <li>
              Abre{' '}
              <a
                href={baseUrl ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="underline inline-flex items-center gap-1"
              >
                {baseUrl ?? 'teu n8n'} <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>Vai em <strong>Settings → API</strong></li>
            <li>Clica em <strong>"Create API Key"</strong></li>
            <li>Copia a key gerada</li>
            <li>
              Adiciona no <code className="font-mono bg-zinc-900 px-1 rounded">.env.local</code>:
              <pre className="mt-1 bg-zinc-900 p-3 rounded text-xs">
N8N_API_KEY=cole-a-key-aqui
              </pre>
            </li>
            <li>Reinicia <code className="font-mono">npm run dev</code> e recarrega essa página</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <Header baseUrl={baseUrl} />

      <div className="border-b border-zinc-800">
        <nav className="flex gap-1 overflow-x-auto">
          <TabButton id="workflows" current={tab} onClick={setTab} icon={Workflow}>
            Workflows
          </TabButton>
          <TabButton
            id="credentials"
            current={tab}
            onClick={setTab}
            icon={KeyRound}
          >
            Credentials
          </TabButton>
          <TabButton id="variables" current={tab} onClick={setTab} icon={PlugZap}>
            Variables
          </TabButton>
          <TabButton
            id="executions"
            current={tab}
            onClick={setTab}
            icon={Activity}
          >
            Executions
          </TabButton>
        </nav>
      </div>

      {tab === 'workflows' && <WorkflowsTab baseUrl={baseUrl} />}
      {tab === 'credentials' && <CredentialsTab />}
      {tab === 'variables' && <VariablesTab />}
      {tab === 'executions' && <ExecutionsTab />}
    </div>
  );
}

function Header({ baseUrl }: { baseUrl: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Webhook className="h-5 w-5 text-red-400" />
          <h1 className="font-display text-3xl font-bold">n8n — Gerenciamento</h1>
        </div>
        <p className="text-sm text-zinc-400">
          Acesso direto via API REST aos teus workflows existentes. Sem criar
          duplicatas — só ler, ativar/desativar, monitorar.
        </p>
      </div>
      {baseUrl && (
        <a
          href={baseUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1 px-3 py-2 rounded-md border border-zinc-800 hover:bg-zinc-900"
        >
          <ExternalLink className="h-3 w-3" /> Abrir n8n
        </a>
      )}
    </div>
  );
}

function TabButton({
  id,
  current,
  onClick,
  icon: Icon,
  children,
}: {
  id: Tab;
  current: Tab;
  onClick: (t: Tab) => void;
  icon: typeof Workflow;
  children: React.ReactNode;
}) {
  const active = current === id;
  return (
    <button
      onClick={() => onClick(id)}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
        active
          ? 'border-red-500 text-red-300'
          : 'border-transparent text-zinc-400 hover:text-zinc-200',
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

/* ─────────── Workflows tab ─────────── */

function WorkflowsTab({ baseUrl }: { baseUrl: string | null }) {
  const [data, setData] = useState<{
    total: number;
    ativos: number;
    inativos: number;
    workflows: Workflow[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/admin/n8n/workflows');
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? 'Erro');
      setData(d);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleAtivo(wf: Workflow) {
    setActing(wf.id);
    try {
      const r = await fetch(`/api/admin/n8n/workflows/${wf.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: wf.active ? 'deactivate' : 'activate',
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? 'Erro');
      await load();
    } catch (e) {
      alert(`Erro: ${(e as Error).message}`);
    } finally {
      setActing(null);
    }
  }

  const filtrados =
    data?.workflows.filter((w) =>
      busca ? w.name.toLowerCase().includes(busca.toLowerCase()) : true,
    ) ?? [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Total" value={data?.total ?? '—'} accent="zinc" />
        <Stat label="Ativos" value={data?.ativos ?? '—'} accent="green" />
        <Stat label="Inativos" value={data?.inativos ?? '—'} accent="zinc" />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Buscar workflow por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="flex-1 min-w-[260px] h-9 px-3 rounded-md border border-zinc-800 bg-zinc-900 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
        />
        <button
          onClick={load}
          disabled={loading}
          className="text-xs inline-flex items-center gap-1 px-3 py-2 rounded-md bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Atualizar
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          <strong>Erro ao listar workflows:</strong> {error}
        </div>
      )}

      {loading && !data && (
        <div className="text-center py-12 text-zinc-500 text-sm">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          Carregando workflows do n8n...
        </div>
      )}

      {data && filtrados.length === 0 && (
        <div className="text-center py-12 text-zinc-500 text-sm">
          {data.total === 0
            ? 'Nenhum workflow no n8n.'
            : 'Nenhum match pra essa busca.'}
        </div>
      )}

      {filtrados.length > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 divide-y divide-zinc-800">
          {filtrados.map((wf) => (
            <div
              key={wf.id}
              className="px-4 py-3 flex items-center gap-3 hover:bg-zinc-900/60"
            >
              <div
                className={cn(
                  'h-7 w-7 rounded-full grid place-items-center shrink-0',
                  wf.active
                    ? 'bg-green-500/15 text-green-400'
                    : 'bg-zinc-800 text-zinc-500',
                )}
              >
                <Workflow className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{wf.name}</p>
                  {wf.tags?.map((t) => (
                    <span
                      key={t.id}
                      className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-500 font-mono">{wf.id}</p>
              </div>
              <button
                onClick={() => toggleAtivo(wf)}
                disabled={acting === wf.id}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] uppercase tracking-wider font-bold border',
                  wf.active
                    ? 'border-green-500/40 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700',
                  acting === wf.id && 'opacity-50',
                )}
              >
                {acting === wf.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Power className="h-3 w-3" />
                )}
                {wf.active ? 'Ativo' : 'Inativo'}
              </button>
              {baseUrl && (
                <a
                  href={`${baseUrl}/workflow/${wf.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded hover:bg-zinc-800"
                  title="Abrir no n8n"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────── Credentials tab ─────────── */

function CredentialsTab() {
  const [data, setData] = useState<{
    total: number;
    credentials: Credential[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ensuring, setEnsuring] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/admin/n8n/credentials');
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? 'Erro');
      setData(d);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function ensureMaster() {
    if (!confirm('Cria as credentials master Anthropic + OpenAI no n8n usando as keys do teu .env? (idempotente — não duplica)')) return;
    setEnsuring(true);
    try {
      const r = await fetch('/api/admin/n8n/credentials/ensure-master', {
        method: 'POST',
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? 'Erro');
      alert(
        `Criadas: ${d.created.length || 0}\nJá existiam: ${d.existed.length || 0}\nErros: ${d.errors.join(', ') || 'nenhum'}`,
      );
      await load();
    } catch (e) {
      alert(`Erro: ${(e as Error).message}`);
    } finally {
      setEnsuring(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Stat label="Credentials" value={data?.total ?? '—'} accent="zinc" />
        <button
          onClick={ensureMaster}
          disabled={ensuring}
          className="ml-auto text-xs inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/30 disabled:opacity-50"
        >
          {ensuring ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          Garantir credentials master Visualis
        </button>
        <button
          onClick={load}
          disabled={loading}
          className="text-xs inline-flex items-center gap-1 px-3 py-2 rounded-md bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {data && data.credentials.length > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 divide-y divide-zinc-800">
          {data.credentials.map((c) => (
            <div key={c.id} className="px-4 py-3 flex items-center gap-3">
              <KeyRound className="h-4 w-4 text-zinc-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{c.name}</p>
                <p className="text-[10px] text-zinc-500 font-mono">
                  {c.type} · {c.id}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.credentials.length === 0 && !loading && (
        <div className="text-center py-12 text-zinc-500 text-sm">
          Nenhuma credential no n8n. Clica em "Garantir credentials master" pra
          criar Anthropic + OpenAI usando as keys do teu .env.local.
        </div>
      )}

      <p className="text-[11px] text-zinc-500 italic">
        Por segurança, as chaves não são exibidas — só nome e tipo. Pra ver/editar
        valor, abre no n8n direto.
      </p>
    </div>
  );
}

/* ─────────── Variables tab ─────────── */

function VariablesTab() {
  const [data, setData] = useState<{ total: number; variables: Variable[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ensuring, setEnsuring] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/n8n/variables');
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? 'Erro');
      setData(d);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function ensureImobia() {
    if (!confirm('Cria/atualiza no n8n as 3 vars: IMOBIA_BASE_URL, IMOBIA_INTERNAL_TOKEN, N8N_WEBHOOK_SECRET (lê do teu .env)?')) return;
    setEnsuring(true);
    try {
      const r = await fetch('/api/admin/n8n/variables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ensure-imobia' }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? 'Erro');
      alert(`Atualizadas: ${d.upserted.join(', ') || 'nenhuma'}\nErros: ${d.errors.join(', ') || 'nenhum'}`);
      await load();
    } catch (e) {
      alert(`Erro: ${(e as Error).message}`);
    } finally {
      setEnsuring(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Stat label="Variables" value={data?.total ?? '—'} accent="zinc" />
        <button
          onClick={ensureImobia}
          disabled={ensuring}
          className="ml-auto text-xs inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/30 disabled:opacity-50"
        >
          {ensuring ? <Loader2 className="h-3 w-3 animate-spin" /> : <PlugZap className="h-3 w-3" />}
          Sincronizar vars do ImobIA
        </button>
        <button onClick={load} className="text-xs inline-flex items-center gap-1 px-3 py-2 rounded-md bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30">
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {data && data.variables.length > 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 divide-y divide-zinc-800">
          {data.variables.map((v) => (
            <div key={v.id} className="px-4 py-3 grid grid-cols-[200px_1fr] gap-4">
              <code className="font-mono text-xs text-zinc-300 truncate">{v.key}</code>
              <code className="font-mono text-xs text-zinc-500 truncate">
                {v.key.toUpperCase().includes('SECRET') ||
                v.key.toUpperCase().includes('TOKEN') ||
                v.key.toUpperCase().includes('KEY')
                  ? `${v.value.slice(0, 4)}••••${v.value.slice(-4)}`
                  : v.value}
              </code>
            </div>
          ))}
        </div>
      ) : (
        !loading && (
          <p className="text-center py-12 text-zinc-500 text-sm">
            Nenhuma variable no n8n.
          </p>
        )
      )}
    </div>
  );
}

/* ─────────── Executions tab ─────────── */

function ExecutionsTab() {
  const [data, setData] = useState<{ total: number; executions: Execution[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/n8n/executions?limit=50');
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? 'Erro');
      setData(d);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Stat label="Últimas 50" value={data?.total ?? '—'} accent="zinc" />
        <button
          onClick={load}
          disabled={loading}
          className="ml-auto text-xs inline-flex items-center gap-1 px-3 py-2 rounded-md bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {data && data.executions.length > 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-zinc-900 text-zinc-400">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Status</th>
                <th className="text-left px-3 py-2 font-semibold">Workflow ID</th>
                <th className="text-left px-3 py-2 font-semibold">Mode</th>
                <th className="text-left px-3 py-2 font-semibold">Started</th>
                <th className="text-right px-3 py-2 font-semibold">Duração</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {data.executions.map((e) => (
                <tr key={e.id} className="hover:bg-zinc-900/60">
                  <td className="px-3 py-2">
                    <StatusBadge status={e.status ?? (e.finished ? 'success' : 'running')} />
                  </td>
                  <td className="px-3 py-2 font-mono text-zinc-400 truncate max-w-[180px]">
                    {e.workflowId}
                  </td>
                  <td className="px-3 py-2 text-zinc-500 uppercase tracking-wider text-[10px]">
                    {e.mode}
                  </td>
                  <td className="px-3 py-2 text-zinc-400 font-mono">
                    {new Date(e.startedAt).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-zinc-500">
                    {e.durationMs ? `${e.durationMs}ms` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && (
          <p className="text-center py-12 text-zinc-500 text-sm">
            Nenhuma execução nos últimos dias. Workflow precisa rodar pra aparecer.
          </p>
        )
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
    success: { color: 'bg-green-500/15 text-green-400 border-green-500/30', icon: CheckCircle2 },
    error: { color: 'bg-red-500/15 text-red-400 border-red-500/30', icon: XCircle },
    crashed: { color: 'bg-red-500/15 text-red-400 border-red-500/30', icon: XCircle },
    running: { color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: Loader2 },
    waiting: { color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: AlertTriangle },
    canceled: { color: 'bg-zinc-700 text-zinc-400 border-zinc-600', icon: XCircle },
  };
  const { color, icon: Icon } = map[status] ?? map.canceled;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold border',
        color,
      )}
    >
      <Icon className={cn('h-2.5 w-2.5', status === 'running' && 'animate-spin')} />
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
  accent: 'zinc' | 'green' | 'red';
}) {
  const colors = {
    zinc: 'border-zinc-800 bg-zinc-900/40 text-zinc-300',
    green: 'border-green-500/30 bg-green-500/5 text-green-400',
    red: 'border-red-500/30 bg-red-500/5 text-red-400',
  };
  return (
    <div className={cn('rounded-lg border px-4 py-3 inline-block', colors[accent])}>
      <p className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">
        {label}
      </p>
      <p className="text-2xl font-bold leading-tight">{value}</p>
    </div>
  );
}
