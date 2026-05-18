'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Bot,
  KeyRound,
  Webhook,
  MessageSquare,
  Save,
  Loader2,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tenant = {
  id: string;
  slug: string;
  plano: string;
  nomeEmpresa: string | null;
  slogan: string | null;
};

type Agente = any;

const PROVIDERS: Array<{ id: 'CLAUDE' | 'OPENAI'; label: string; desc: string }> = [
  {
    id: 'CLAUDE',
    label: 'Claude (Anthropic Haiku)',
    desc: 'Mais natural em português. Padrão recomendado.',
  },
  {
    id: 'OPENAI',
    label: 'OpenAI gpt-4o-mini',
    desc: 'Mais rápido e barato. Bom pra alto volume.',
  },
];

export default function AgenteAdminClient({
  tenant,
  agenteInicial,
}: {
  tenant: Tenant;
  agenteInicial: Agente | null;
}) {
  const router = useRouter();
  const [data, setData] = useState<Agente>(
    agenteInicial ?? {
      tenantId: tenant.id,
      textoProvider: 'CLAUDE',
      usarN8n: true,
      usarChatwoot: false,
    },
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set<K extends string>(key: K, value: any) {
    setData((p: any) => ({ ...p, [key]: value }));
  }

  async function salvar() {
    setSaving(true);
    setSaved(false);
    try {
      const r = await fetch(`/api/admin/tenants/${tenant.id}/agente`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error ?? 'Erro');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    } catch (e) {
      alert(`Erro ao salvar: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link
          href="/superadmin/tenants"
          className="text-xs text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="h-3 w-3" /> Tenants
        </Link>
        <div className="flex items-center gap-2 mb-1">
          <Bot className="h-5 w-5 text-red-400" />
          <h1 className="font-display text-3xl font-bold">
            Agente IA — Configurações Técnicas
          </h1>
        </div>
        <p className="text-sm text-zinc-400">
          Tenant <span className="font-mono text-zinc-300">{tenant.slug}</span>{' '}
          {tenant.nomeEmpresa && `(${tenant.nomeEmpresa})`} · Plano{' '}
          {tenant.plano}
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          Cliente final NÃO vê essa tela. Aqui tu cadastra chaves e integrações
          técnicas. O cliente só edita persona, mensagens e horário em{' '}
          <code className="font-mono bg-zinc-900 px-1 rounded">
            /configuracoes/agente-ia
          </code>
          .
        </p>
      </div>

      {!agenteInicial && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-300">
          <AlertTriangle className="h-4 w-4 inline mr-2" />
          Esse tenant ainda não tem registro em <code>agente_ia</code>. Salvar
          aqui vai criar o registro inicial.
        </div>
      )}

      {/* Provider de IA */}
      <Section
        icon={Bot}
        title="Provider de IA preferido"
        hint="Qual modelo gera as respostas do agente."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PROVIDERS.map((p) => {
            const active = data.textoProvider === p.id;
            return (
              <button
                key={p.id}
                onClick={() => set('textoProvider', p.id)}
                className={cn(
                  'text-left rounded-md border p-4 transition-all',
                  active
                    ? 'border-red-500/40 bg-red-500/5'
                    : 'border-zinc-800 hover:border-zinc-700',
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-zinc-200">
                    {p.label}
                  </span>
                  {active && (
                    <CheckCircle2 className="h-4 w-4 text-red-400 ml-auto" />
                  )}
                </div>
                <p className="text-xs text-zinc-500">{p.desc}</p>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Chaves IA por tenant */}
      <Section
        icon={KeyRound}
        title="Chaves IA próprias do tenant"
        hint="Se vazio, usa as chaves master da Visualis. Cifradas no DB com AES-256."
      >
        <KeyField
          label="OpenAI API Key"
          hint="Pra GPT-4o-mini e gpt-image-1 desse tenant."
          value={data.openaiApiKey ?? ''}
          onChange={(v) => set('openaiApiKey', v)}
        />
        <KeyField
          label="Anthropic API Key (Claude)"
          hint="Pra Claude Haiku desse tenant."
          value={data.anthropicApiKey ?? ''}
          onChange={(v) => set('anthropicApiKey', v)}
        />
        <KeyField
          label="ElevenLabs API Key"
          hint="Pra voz custom (ListaPro vídeo)."
          value={data.elevenLabsApiKey ?? ''}
          onChange={(v) => set('elevenLabsApiKey', v)}
        />
        <Field
          label="ElevenLabs Voice ID"
          hint="ID da voz escolhida no painel ElevenLabs."
        >
          <input
            value={data.elevenLabsVoiceId ?? ''}
            onChange={(e) => set('elevenLabsVoiceId', e.target.value)}
            placeholder="Ex: 21m00Tcm4TlvDq8ikWAM"
            className="w-full font-mono text-xs h-9 px-3 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-200"
          />
        </Field>
        <KeyField
          label="Remotion API Key"
          hint="Futuro: render de vídeo automatizado."
          value={data.remotionApiKey ?? ''}
          onChange={(v) => set('remotionApiKey', v)}
        />
      </Section>

      {/* n8n */}
      <Section icon={Webhook} title="Integração n8n" hint="Workflow de WhatsApp.">
        <Field label="Usar n8n master da Visualis">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!data.usarN8n}
              onChange={(e) => set('usarN8n', e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm text-zinc-300">
              {data.usarN8n
                ? 'Sim — workflow master compartilhado'
                : 'Não — desabilitado pra esse tenant'}
            </span>
          </label>
        </Field>
        <Field
          label="Webhook n8n customizado (override)"
          hint="Se vazio, usa N8N_MASTER_WEBHOOK_PATH global."
        >
          <input
            value={data.webhookUrl ?? ''}
            onChange={(e) => set('webhookUrl', e.target.value)}
            placeholder="https://imobflow-n8n.../webhook/<custom>"
            className="w-full font-mono text-xs h-9 px-3 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-200"
          />
        </Field>
        <KeyField
          label="Webhook secret (HMAC) custom"
          hint="Override do N8N_WEBHOOK_SECRET global. Use só se esse tenant tiver pipeline isolada."
          value={data.webhookSecret ?? ''}
          onChange={(v) => set('webhookSecret', v)}
        />
      </Section>

      {/* ChatWoot */}
      <Section
        icon={MessageSquare}
        title="ChatWoot (opcional)"
        hint="Se o tenant tem instância ChatWoot self-hosted própria."
      >
        <Field label="Usar ChatWoot">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!data.usarChatwoot}
              onChange={(e) => set('usarChatwoot', e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm text-zinc-300">
              {data.usarChatwoot ? 'Ligado' : 'Desligado'}
            </span>
          </label>
        </Field>
        {data.usarChatwoot && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
            <Field label="URL ChatWoot">
              <input
                value={data.chatwootUrl ?? ''}
                onChange={(e) => set('chatwootUrl', e.target.value)}
                placeholder="https://chatwoot.exemplo.com"
                className="w-full font-mono text-xs h-9 px-3 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-200"
              />
            </Field>
            <Field label="Inbox ID">
              <input
                value={data.chatwootInboxId ?? ''}
                onChange={(e) => set('chatwootInboxId', e.target.value)}
                placeholder="123"
                className="w-full font-mono text-xs h-9 px-3 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-200"
              />
            </Field>
            <KeyField
              label="Token ChatWoot"
              value={data.chatwootToken ?? ''}
              onChange={(v) => set('chatwootToken', v)}
              hint=""
            />
          </div>
        )}
      </Section>

      {/* CRM webhook saída */}
      <Section
        icon={Webhook}
        title="Webhook do CRM externo (opcional)"
        hint="Quando agente qualifica um lead, dispara POST pra essa URL."
      >
        <Field
          label="URL do webhook"
          hint="Vazio = só salva no CRM nativo do ImobIA."
        >
          <input
            value={data.webhookSaidaCrm ?? ''}
            onChange={(e) => set('webhookSaidaCrm', e.target.value)}
            placeholder="https://crm-do-cliente.com/webhooks/lead"
            className="w-full font-mono text-xs h-9 px-3 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-200"
          />
        </Field>
      </Section>

      {/* Footer salvar */}
      <div className="sticky bottom-4 z-20">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/95 backdrop-blur p-4 flex items-center gap-3 shadow-lg">
          {saved ? (
            <p className="text-xs text-green-400 flex-1 inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Salvo
            </p>
          ) : (
            <p className="text-xs text-zinc-500 flex-1">
              Mudanças entram em efeito assim que salvar. Chaves cifradas com AES-256.
            </p>
          )}
          <button
            onClick={salvar}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Salvar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: typeof Bot;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-zinc-400" />
        <h3 className="font-semibold text-sm text-zinc-200 uppercase tracking-wider">
          {title}
        </h3>
      </div>
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-zinc-300">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-zinc-500">{hint}</p>}
    </div>
  );
}

function KeyField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  const isMasked = value.startsWith('••');
  return (
    <Field label={label} hint={hint}>
      <div className="flex gap-2">
        <input
          type={show && !isMasked ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isMasked ? '' : 'sk-...'}
          className="flex-1 font-mono text-xs h-9 px-3 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-200"
        />
        {!isMasked && (
          <button
            onClick={() => setShow((v) => !v)}
            className="px-3 rounded-md border border-zinc-800 hover:bg-zinc-800 text-zinc-400"
            type="button"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
        {isMasked && (
          <button
            onClick={() => onChange('')}
            className="px-3 text-xs rounded-md border border-zinc-800 hover:bg-zinc-800 text-zinc-400"
            type="button"
          >
            Alterar
          </button>
        )}
      </div>
    </Field>
  );
}
