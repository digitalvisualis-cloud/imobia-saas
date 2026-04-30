'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  Save,
  Sparkles,
  Clock,
  MessageSquare,
  CheckCircle2,
  Power,
  Webhook,
  Loader2,
  Phone,
  Wand2,
  ListChecks,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Section } from '@/components/ui/section';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

type Objetivo =
  | 'QUALIFICAR'
  | 'AGENDAR_VISITA'
  | 'TIRAR_DUVIDAS'
  | 'HANDOFF_DIRETO';
type TextoProvider = 'CLAUDE' | 'OPENAI';

type FlowStep = { id: string; active: boolean };

type AgenteData = {
  nome: string;
  personalidade: string;
  apresentacao: string | null;
  objetivo: Objetivo;
  mensagemSaudacao: string | null;
  mensagemForaHorario: string | null;
  horarioInicio: string | null;
  horarioFim: string | null;
  diasSemana: number[];
  etapas: FlowStep[];
  ativo: boolean;
  textoProvider: TextoProvider;
  // Conexões
  usarN8n: boolean;
  webhookUrl: string | null;
  webhookSecret: string | null;
  usarChatwoot: boolean;
  chatwootUrl: string | null;
  chatwootToken: string | null;
  chatwootInboxId: string | null;
  webhookSaidaCrm: string | null;
  // Chaves
  openaiApiKey: string | null;
  anthropicApiKey: string | null;
  elevenLabsApiKey: string | null;
  elevenLabsVoiceId: string | null;
  remotionApiKey: string | null;
};

const PERSONALIDADES: Array<{
  id: string;
  emoji: string;
  label: string;
  desc: string;
  prompt: string; // texto que vai pro system prompt da IA
}> = [
  {
    id: 'consultivo',
    emoji: '🤝',
    label: 'Consultivo',
    desc: 'Próximo e acolhedor — faz perguntas pra entender o cliente antes de oferecer',
    prompt:
      'Consultivo e empático. Faz perguntas abertas pra entender necessidades do lead antes de sugerir imóveis. Tom acolhedor, sem pressão.',
  },
  {
    id: 'direto',
    emoji: '⚡',
    label: 'Direto',
    desc: 'Objetivo e rápido — vai direto ao ponto, ideal pra cliente decidido',
    prompt:
      'Direto e objetivo. Vai rápido ao ponto, sem rodeios. Usa frases curtas, oferece opções claras, prioriza eficiência.',
  },
  {
    id: 'formal',
    emoji: '💼',
    label: 'Formal',
    desc: 'Profissional e elegante — ideal pra alto padrão e clientes corporativos',
    prompt:
      'Formal e elegante. Trata por "senhor/senhora", linguagem refinada e cuidadosa. Apresenta imóveis com sofisticação. Ideal pra alto padrão.',
  },
  {
    id: 'amigavel',
    emoji: '😊',
    label: 'Descontraído',
    desc: 'Leve e acessível — clima de conversa de WhatsApp pra público mais jovem',
    prompt:
      'Descontraído e amigável. Conversa natural de WhatsApp, usa "tu" ou "você" conforme o lead. Pode usar emojis com moderação. Tom de amigo conselheiro.',
  },
];

const ETAPAS_CATALOGO: Array<{
  id: string;
  label: string;
  desc: string;
  icon: string;
}> = [
  {
    id: 'boas_vindas',
    label: 'Apresentação',
    desc: 'O agente se apresenta e pergunta o nome do visitante',
    icon: '👋',
  },
  {
    id: 'consultivo',
    label: 'Entender o que busca',
    desc: 'Descobre tipo de imóvel, bairro e faixa de valor',
    icon: '🔍',
  },
  {
    id: 'apresentar',
    label: 'Mostrar imóveis',
    desc: 'Sugere imóveis do portfólio com base no perfil',
    icon: '🏠',
  },
  {
    id: 'interesse',
    label: 'Medir interesse',
    desc: 'Identifica se o lead está pronto pra próximo passo',
    icon: '🎯',
  },
  {
    id: 'notificar',
    label: 'Avisar você',
    desc: 'Tu recebe mensagem quando um lead está quente',
    icon: '📲',
  },
  {
    id: 'agendar',
    label: 'Propor visita',
    desc: 'O agente oferece agendar uma visita automaticamente',
    icon: '📅',
  },
  {
    id: 'encerrar',
    label: 'Encerrar conversa',
    desc: 'Finaliza com despedida e envia resumo',
    icon: '✅',
  },
];

const DEFAULTS: AgenteData = {
  nome: 'Sofia',
  personalidade: 'Consultivo e empático',
  apresentacao: '',
  objetivo: 'QUALIFICAR',
  mensagemSaudacao:
    'Oi! Vi que tu tá interessado em um dos nossos imóveis. Posso te ajudar?',
  mensagemForaHorario:
    'Recebemos sua mensagem! Nosso atendimento humano volta amanhã às 8h. Enquanto isso, posso adiantar tuas dúvidas? 👋',
  horarioInicio: '08:00',
  horarioFim: '20:00',
  diasSemana: [1, 2, 3, 4, 5],
  etapas: [
    { id: 'boas_vindas', active: true },
    { id: 'consultivo', active: true },
    { id: 'apresentar', active: true },
    { id: 'interesse', active: true },
    { id: 'notificar', active: true },
    { id: 'agendar', active: false },
    { id: 'encerrar', active: true },
  ],
  ativo: false,
  textoProvider: 'CLAUDE',
  usarN8n: true,
  webhookUrl: '',
  webhookSecret: '',
  usarChatwoot: false,
  chatwootUrl: '',
  chatwootToken: '',
  chatwootInboxId: '',
  webhookSaidaCrm: '',
  openaiApiKey: '',
  anthropicApiKey: '',
  elevenLabsApiKey: '',
  elevenLabsVoiceId: '',
  remotionApiKey: '',
};

const OBJETIVOS: Array<{
  id: Objetivo;
  label: string;
  description: string;
  icon: typeof Sparkles;
}> = [
  {
    id: 'QUALIFICAR',
    label: 'Qualificar e devolver pro corretor',
    description:
      'O agente faz triagem (orçamento, urgência, perfil) e passa lead morno pro humano fechar.',
    icon: Sparkles,
  },
  {
    id: 'AGENDAR_VISITA',
    label: 'Qualificar e agendar visita direto',
    description:
      'Faz triagem e já marca dia e hora na sua agenda. Avisa o corretor depois.',
    icon: Clock,
  },
  {
    id: 'TIRAR_DUVIDAS',
    label: 'Tirar dúvidas (FAQ)',
    description:
      'Responde sobre o imóvel (preço, condomínio, fotos, localização). Não qualifica.',
    icon: MessageSquare,
  },
  {
    id: 'HANDOFF_DIRETO',
    label: 'Passar pro corretor sem fazer nada',
    description:
      'Só avisa o corretor que tem lead novo. Útil quando tu prefere atender pessoalmente.',
    icon: Phone,
  },
];

const DIAS = [
  { id: 0, label: 'Dom' },
  { id: 1, label: 'Seg' },
  { id: 2, label: 'Ter' },
  { id: 3, label: 'Qua' },
  { id: 4, label: 'Qui' },
  { id: 5, label: 'Sex' },
  { id: 6, label: 'Sáb' },
];

export default function AgenteIaClient({
  agenteInicial,
}: {
  agenteInicial: any | null;
}) {
  const router = useRouter();
  const [agente, setAgente] = useState<AgenteData>(() => ({
    ...DEFAULTS,
    ...(agenteInicial ?? {}),
    diasSemana: agenteInicial?.diasSemana ?? DEFAULTS.diasSemana,
    etapas:
      Array.isArray(agenteInicial?.etapas) && agenteInicial.etapas.length > 0
        ? // Garante que tem todas as etapas do catálogo (caso adicione alguma nova no código)
          ETAPAS_CATALOGO.map((meta) => {
            const saved = agenteInicial.etapas.find((e: any) => e.id === meta.id);
            return saved
              ? { id: meta.id, active: !!saved.active }
              : { id: meta.id, active: true };
          })
        : DEFAULTS.etapas,
  }));
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  function set<K extends keyof AgenteData>(key: K, value: AgenteData[K]) {
    setAgente((prev) => ({ ...prev, [key]: value }));
  }

  function toggleDia(id: number) {
    const set = new Set(agente.diasSemana);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    setAgente((p) => ({
      ...p,
      diasSemana: Array.from(set).sort((a, b) => a - b),
    }));
  }

  function toggleEtapa(stepId: string) {
    setAgente((p) => ({
      ...p,
      etapas: p.etapas.map((e) =>
        e.id === stepId ? { ...e, active: !e.active } : e,
      ),
    }));
  }

  function moverEtapa(from: number, to: number) {
    if (to < 0 || to >= agente.etapas.length) return;
    setAgente((p) => {
      const next = [...p.etapas];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return { ...p, etapas: next };
    });
  }

  async function salvar() {
    setSaving(true);
    try {
      const r = await fetch('/api/agente', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agente),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao salvar');
      }
      setSavedAt(new Date());
      toast.success('Agente IA atualizado');
      router.refresh();
    } catch (e) {
      toast.error('Erro ao salvar', { description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function testarConexao() {
    setTesting(true);
    try {
      const r = await fetch('/api/agente/teste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: 'Olá, tô interessado num imóvel.' }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro no teste');
      toast.success('Agente respondeu', {
        description: data.resposta?.slice(0, 200) ?? 'OK',
      });
    } catch (e) {
      toast.error('Não consegui testar', {
        description: (e as Error).message,
      });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        kicker="Atendimento"
        icon={Bot}
        title="Atendimento por IA"
        description="Configure o agente que conversa com seus leads no WhatsApp."
        back={{ href: '/configuracoes', label: 'Voltar pra Configurações' }}
        actions={
          <div className="flex items-center gap-2">
            {savedAt && (
              <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Salvo {timeAgo(savedAt)}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                'gap-1.5',
                agente.ativo
                  ? 'border-green-500/40 text-green-700 dark:text-green-400'
                  : 'border-zinc-300 text-zinc-500',
              )}
            >
              <Power className="h-3 w-3" />
              {agente.ativo ? 'Ativo' : 'Desativado'}
            </Badge>
          </div>
        }
      />

      {/* ─── Liga/desliga grande ─── */}
      <div
        className={cn(
          'rounded-lg border p-5 flex items-center gap-4 transition-colors',
          agente.ativo
            ? 'border-green-500/40 bg-green-500/5'
            : 'border-border bg-card',
        )}
      >
        <div
          className={cn(
            'h-12 w-12 rounded-full grid place-items-center shrink-0',
            agente.ativo
              ? 'bg-green-500/20 text-green-600'
              : 'bg-muted text-muted-foreground',
          )}
        >
          <Bot className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold">
            {agente.ativo
              ? `${agente.nome} tá no ar — atendendo seus leads`
              : `${agente.nome} tá pausado — leads chegam direto pra ti`}
          </h3>
          <p className="text-xs text-muted-foreground">
            {agente.ativo
              ? 'Ele responde automaticamente no WhatsApp e cria oportunidades no seu CRM.'
              : 'Liga aqui quando tu tiver tudo configurado.'}
          </p>
        </div>
        <button
          onClick={() => set('ativo', !agente.ativo)}
          className={cn(
            'relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
            agente.ativo ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-700',
          )}
          aria-label={agente.ativo ? 'Desativar' : 'Ativar'}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition',
              agente.ativo ? 'translate-x-5' : 'translate-x-0',
            )}
          />
        </button>
      </div>

      {/* ─── Identidade ─── */}
      <Section
        title="Identidade do agente"
        hint="O nome e o tom de voz que aparecem pro lead."
        icon={Sparkles}
      >
        <Field label="Nome do agente" hint="Como ele se apresenta no WhatsApp.">
          <Input
            value={agente.nome}
            onChange={(e) => set('nome', e.target.value)}
            placeholder="Ex: Lana, Sofia, Marcos"
            maxLength={40}
            className="max-w-md"
          />
        </Field>

        <Field
          label="Tom de voz"
          hint="Define como o agente conversa. Cada estilo monta um prompt diferente pra IA."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PERSONALIDADES.map((p) => {
              const active =
                agente.personalidade === p.prompt ||
                agente.personalidade === p.label ||
                agente.personalidade?.startsWith(
                  p.prompt.slice(0, Math.min(20, p.prompt.length)),
                );
              return (
                <button
                  key={p.id}
                  onClick={() => set('personalidade', p.prompt)}
                  className={cn(
                    'text-left rounded-md border p-4 transition-all hover:border-primary',
                    active
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border bg-card',
                  )}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl" aria-hidden>
                      {p.emoji}
                    </span>
                    <span className="font-medium text-sm">{p.label}</span>
                    {active && (
                      <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {p.desc}
                  </p>
                </button>
              );
            })}
          </div>
          {agente.personalidade &&
            !PERSONALIDADES.some((p) => p.prompt === agente.personalidade) && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 italic mt-2">
                Tom personalizado salvo: "
                {agente.personalidade.slice(0, 60)}
                {agente.personalidade.length > 60 ? '…' : ''}". Escolhe um dos
                4 acima pra simplificar.
              </p>
            )}
        </Field>

        <Field
          label="Apresentação da imobiliária (opcional)"
          hint="Conta pro agente quem é a imobiliária, especialidades, diferenciais. Vai pro contexto da IA."
        >
          <textarea
            value={agente.apresentacao ?? ''}
            onChange={(e) => set('apresentacao', e.target.value)}
            placeholder="Ex: Somos a Visualis Imóveis, especializada em alto padrão na zona sul. Atendemos com discrição e foco em compradores de imóveis acima de R$ 1M..."
            rows={3}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            maxLength={2000}
          />
        </Field>
      </Section>

      {/* ─── Objetivo ─── */}
      <Section
        title="O que ele deve fazer?"
        hint="Define a missão do agente em cada conversa."
        icon={Wand2}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {OBJETIVOS.map((o) => {
            const Icon = o.icon;
            const active = agente.objetivo === o.id;
            return (
              <button
                key={o.id}
                onClick={() => set('objetivo', o.id)}
                className={cn(
                  'text-left rounded-md border p-4 transition-all hover:border-primary',
                  active
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border bg-card',
                )}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      active ? 'text-primary' : 'text-muted-foreground',
                    )}
                  />
                  <span className="font-medium text-sm">{o.label}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {o.description}
                </p>
              </button>
            );
          })}
        </div>
      </Section>

      {/* ─── Fluxo de etapas ─── */}
      <Section
        title="Fluxo do atendimento"
        hint="Define a ordem do que o agente faz em cada conversa. Liga/desliga as etapas que tu quer."
        icon={ListChecks}
      >
        <div className="space-y-2">
          {agente.etapas.map((step, idx) => {
            const meta = ETAPAS_CATALOGO.find((m) => m.id === step.id);
            if (!meta) return null;
            return (
              <div
                key={step.id}
                className={cn(
                  'flex items-center gap-3 rounded-md border p-3 transition-colors',
                  step.active
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border bg-muted/30',
                )}
              >
                <span
                  className={cn(
                    'h-7 w-7 grid place-items-center rounded-md text-xs font-mono shrink-0',
                    step.active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {idx + 1}
                </span>
                <div className="text-2xl shrink-0" aria-hidden>
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      !step.active && 'text-muted-foreground line-through',
                    )}
                  >
                    {meta.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{meta.desc}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => moverEtapa(idx, idx - 1)}
                    disabled={idx === 0}
                    className="text-muted-foreground hover:text-foreground p-1 rounded disabled:opacity-20"
                    aria-label="Subir"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => moverEtapa(idx, idx + 1)}
                    disabled={idx === agente.etapas.length - 1}
                    className="text-muted-foreground hover:text-foreground p-1 rounded disabled:opacity-20"
                    aria-label="Descer"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => toggleEtapa(step.id)}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ml-2',
                      step.active
                        ? 'bg-primary'
                        : 'bg-zinc-300 dark:bg-zinc-700',
                    )}
                    aria-label={step.active ? 'Desativar' : 'Ativar'}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition',
                        step.active ? 'translate-x-5' : 'translate-x-0',
                      )}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground italic mt-3">
          {agente.etapas.filter((e) => e.active).length} de {agente.etapas.length} etapas ativas — n8n usa essa lista pra montar o prompt da IA.
        </p>
      </Section>

      {/* ─── Mensagens ─── */}
      <Section
        title="Mensagens automáticas"
        hint="Textos prontos que o agente usa em momentos específicos."
        icon={MessageSquare}
      >
        <Field
          label="Saudação (1ª mensagem ao lead)"
          hint="Esse é o gancho. Curto, humano, sem parecer robô."
        >
          <textarea
            value={agente.mensagemSaudacao ?? ''}
            onChange={(e) => set('mensagemSaudacao', e.target.value)}
            rows={2}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="Oi! Vi que tu tá interessado em um dos nossos imóveis..."
            maxLength={500}
          />
        </Field>
        <Field
          label="Fora do horário"
          hint="Mensagem quando o lead chega fora do horário do humano."
        >
          <textarea
            value={agente.mensagemForaHorario ?? ''}
            onChange={(e) => set('mensagemForaHorario', e.target.value)}
            rows={2}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="Recebemos sua mensagem!..."
            maxLength={500}
          />
        </Field>
      </Section>

      {/* ─── Horário ─── */}
      <Section
        title="Horário de atendimento humano"
        hint="Fora desse horário, o agente assume e diz que o humano volta logo."
        icon={Clock}
      >
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Início">
            <Input
              type="time"
              value={agente.horarioInicio ?? ''}
              onChange={(e) => set('horarioInicio', e.target.value)}
            />
          </Field>
          <Field label="Fim">
            <Input
              type="time"
              value={agente.horarioFim ?? ''}
              onChange={(e) => set('horarioFim', e.target.value)}
            />
          </Field>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">
            Dias úteis
          </p>
          <div className="flex gap-2 flex-wrap">
            {DIAS.map((d) => {
              const active = agente.diasSemana.includes(d.id);
              return (
                <button
                  key={d.id}
                  onClick={() => toggleDia(d.id)}
                  className={cn(
                    'h-9 w-12 rounded-md border text-xs font-semibold transition-colors',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/40',
                  )}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      {/* Conexões técnicas (chaves IA, n8n, ChatWoot, CRM) ficam no
          super-admin /superadmin/tenants/[id]/agente. Cliente final não vê. */}

      {/* ─── Footer com Salvar + Testar ─── */}
      <div className="sticky bottom-4 z-20">
        <div className="rounded-lg border border-border bg-card/95 backdrop-blur p-4 flex items-center gap-3 shadow-lg">
          <p className="text-xs text-muted-foreground flex-1">
            Mudanças entram em efeito assim que tu salvar.
          </p>
          <Button
            variant="outline"
            onClick={testarConexao}
            disabled={testing || !agente.ativo}
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <Webhook className="h-4 w-4 mr-2" />
                Testar
              </>
            )}
          </Button>
          <Button onClick={salvar} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ───── Helpers ───── */

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
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function timeAgo(d: Date): string {
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
