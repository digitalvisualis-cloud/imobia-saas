'use client';

import { useState } from 'react';
import {
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type StatusItem = {
  key: string;
  label: string;
  grupo: string;
  critica: boolean;
  present: boolean;
  preview: string | null;
};

export function CredenciaisClient({
  status,
  total,
  setadas,
  criticasFaltando,
}: {
  status: StatusItem[];
  total: number;
  setadas: number;
  criticasFaltando: number;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function copiar(key: string) {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  }

  // Agrupa por categoria
  const grupos = status.reduce<Record<string, StatusItem[]>>((acc, item) => {
    if (!acc[item.grupo]) acc[item.grupo] = [];
    acc[item.grupo].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="h-5 w-5 text-red-400" />
          <h1 className="font-display text-3xl font-bold">Chaves & Credenciais</h1>
        </div>
        <p className="text-sm text-zinc-400">
          Estado das variáveis de ambiente da plataforma. Read-only — edição via
          CLI Vercel ou painel da hospedagem.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat
          label="Total"
          value={total}
          accent="zinc"
          icon={<KeyRound className="h-4 w-4" />}
        />
        <Stat
          label="Configuradas"
          value={`${setadas}/${total}`}
          accent="green"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <Stat
          label="Críticas faltando"
          value={criticasFaltando}
          accent={criticasFaltando > 0 ? 'red' : 'green'}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      {criticasFaltando > 0 && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">
              {criticasFaltando}{' '}
              {criticasFaltando === 1 ? 'chave crítica faltando' : 'chaves críticas faltando'}
            </p>
            <p className="text-red-300/80">
              A plataforma vai falhar em features que dependem dessas chaves.
              Defina elas no Vercel (Settings → Environment Variables) ou no
              painel da Hostinger antes de subir pra produção.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          Valores mascarados pra segurança. Mostra prefixo + últimos 4 dígitos.
        </p>
        <button
          onClick={() => setShowPreview((v) => !v)}
          className="text-xs text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1"
        >
          {showPreview ? (
            <>
              <EyeOff className="h-3 w-3" /> Esconder previews
            </>
          ) : (
            <>
              <Eye className="h-3 w-3" /> Mostrar previews
            </>
          )}
        </button>
      </div>

      {/* Por grupo */}
      {Object.entries(grupos).map(([grupo, items]) => (
        <div key={grupo} className="rounded-lg border border-zinc-800 bg-zinc-900/40">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-zinc-300">
              {grupo}
            </h3>
            <span className="text-[10px] text-zinc-500">
              {items.filter((i) => i.present).length}/{items.length}
            </span>
          </div>
          <div className="divide-y divide-zinc-800">
            {items.map((item) => (
              <div
                key={item.key}
                className="px-4 py-3 flex items-center gap-3 hover:bg-zinc-900/60"
              >
                <div
                  className={cn(
                    'h-7 w-7 rounded-full grid place-items-center shrink-0',
                    item.present
                      ? 'bg-green-500/15 text-green-400'
                      : item.critica
                        ? 'bg-red-500/15 text-red-400'
                        : 'bg-zinc-800 text-zinc-500',
                  )}
                >
                  {item.present ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : item.critica ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="font-mono text-xs text-zinc-300">
                      {item.key}
                    </code>
                    {item.critica && (
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-bold">
                        crítica
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">{item.label}</p>
                  {showPreview && item.preview && (
                    <p className="text-[11px] font-mono text-zinc-400 mt-1">
                      {item.preview}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => copiar(item.key)}
                  className="text-zinc-500 hover:text-zinc-200 p-1.5 rounded hover:bg-zinc-800"
                  title="Copiar nome da var"
                  aria-label="Copiar"
                >
                  {copiedKey === item.key ? (
                    <Check className="h-3.5 w-3.5 text-green-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="rounded-md border border-zinc-800 bg-zinc-900/30 p-4 text-xs text-zinc-400 space-y-2">
        <p className="font-semibold text-zinc-300">Como definir essas vars</p>
        <p>
          • <strong>Local (Mac):</strong> editar <code className="font-mono">.env.local</code> e
          reiniciar <code className="font-mono">npm run dev</code>
        </p>
        <p>
          • <strong>Vercel produção:</strong> Settings → Environment Variables → Add. Faça redeploy depois.
        </p>
        <p>
          • <strong>Hostinger / VPS:</strong> editar arquivo de config do PM2 ou docker-compose.
        </p>
        <p className="pt-2 border-t border-zinc-800 mt-2">
          ⚠️ <strong>NUNCA</strong> commitar essas chaves no git. <code className="font-mono">.env.local</code> tá no <code className="font-mono">.gitignore</code>.
        </p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string | number;
  accent: 'red' | 'green' | 'zinc';
  icon: React.ReactNode;
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
        <p className="text-xs uppercase tracking-wider opacity-80 font-semibold">
          {label}
        </p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
