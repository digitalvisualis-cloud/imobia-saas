'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  MessageCircle,
  Mail,
  Plus,
  X,
  Users,
  AlertCircle,
  Calendar,
  Sparkles,
  Save,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

type Regra = {
  evento: string;
  titulo: string;
  descricao: string;
  origem: string;
  ativo: boolean;
  canais: string[];
  offsetsDias: number[];
  mensagemWpp: string;
  mensagemEmail: string;
};

type Inquilino = {
  id: string;
  nome: string;
  contato: string;
  temWpp: boolean;
  temEmail: boolean;
  imovelCodigo: string | null;
  imovelTitulo: string | null;
  tipo: string;
  valor: number;
  dataFim: string | null;
};

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function offsetLabel(d: number): string {
  if (d === 0) return 'No dia';
  if (d < 0) return `${Math.abs(d)} dia${Math.abs(d) > 1 ? 's' : ''} antes`;
  return `${d} dia${d > 1 ? 's' : ''} depois`;
}

const OFFSETS_SUGERIDOS = [-30, -15, -10, -5, -3, -1, 0, 1, 3, 5, 7, 15, 30];

export default function AutomacoesClient({
  regras: regrasIniciais,
  inquilinos,
}: {
  regras: Regra[];
  inquilinos: Inquilino[];
}) {
  const router = useRouter();
  const [regras, setRegras] = useState<Regra[]>(regrasIniciais);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  // KPIs
  const ativas = regras.filter((r) => r.ativo).length;
  const inquilinosComContato = inquilinos.filter((i) => i.temWpp || i.temEmail).length;
  const inquilinosSemContato = inquilinos.length - inquilinosComContato;

  function patchLocal(evento: string, patch: Partial<Regra>) {
    setRegras((prev) => prev.map((r) => (r.evento === evento ? { ...r, ...patch } : r)));
  }

  async function persist(evento: string) {
    const r = regras.find((x) => x.evento === evento);
    if (!r) return;
    setSaving(evento);
    try {
      const res = await fetch('/api/automacoes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evento: r.evento,
          ativo: r.ativo,
          canais: r.canais,
          offsetsDias: r.offsetsDias,
          mensagemWpp: r.mensagemWpp,
          mensagemEmail: r.mensagemEmail,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Falha');
      }
      toast.success('Configuração salva');
      router.refresh();
    } catch (e) {
      toast.error('Erro ao salvar', { description: (e as Error).message });
    } finally {
      setSaving(null);
    }
  }

  async function toggleAtivo(evento: string, novoAtivo: boolean) {
    patchLocal(evento, { ativo: novoAtivo });
    // Persist imediato pra toggle on/off
    setSaving(evento);
    try {
      const res = await fetch('/api/automacoes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evento, ativo: novoAtivo }),
      });
      if (!res.ok) throw new Error('Falha');
      toast.success(novoAtivo ? 'Régua ativada' : 'Régua desativada');
      router.refresh();
    } catch (e) {
      // Rollback
      patchLocal(evento, { ativo: !novoAtivo });
      toast.error('Erro ao atualizar', { description: (e as Error).message });
    } finally {
      setSaving(null);
    }
  }

  function toggleCanal(evento: string, canal: 'whatsapp' | 'email') {
    const r = regras.find((x) => x.evento === evento);
    if (!r) return;
    const novos = r.canais.includes(canal)
      ? r.canais.filter((c) => c !== canal)
      : [...r.canais, canal];
    patchLocal(evento, { canais: novos });
  }

  function toggleOffset(evento: string, offset: number) {
    const r = regras.find((x) => x.evento === evento);
    if (!r) return;
    const novos = r.offsetsDias.includes(offset)
      ? r.offsetsDias.filter((o) => o !== offset)
      : [...r.offsetsDias, offset].sort((a, b) => a - b);
    patchLocal(evento, { offsetsDias: novos });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Negócios"
        icon={Bell}
        title="Mensagens automáticas"
        description="Configure régua de lembretes pra inquilinos e proprietários — disparos via WhatsApp e e-mail"
      />

      {/* Aviso de upsell + status */}
      <div className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-4 py-3 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
        <div className="text-sm flex-1">
          <p className="font-medium text-violet-900 dark:text-violet-200">
            Régua ativa em modo configuração
          </p>
          <p className="text-xs text-violet-800/80 dark:text-violet-300/80 mt-0.5">
            Quando você ligar o plano com automação, o sistema dispara automaticamente nas datas configuradas.
            Por enquanto fica salvo aqui esperando ativação.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiBox
          icon={Bell}
          label="Réguas ativas"
          value={`${ativas} / ${regras.length}`}
          tone="primary"
        />
        <KpiBox
          icon={Users}
          label="Inquilinos com contato"
          value={`${inquilinosComContato} / ${inquilinos.length}`}
          tone="green"
        />
        {inquilinosSemContato > 0 ? (
          <KpiBox
            icon={AlertCircle}
            label="Sem WhatsApp/e-mail"
            value={String(inquilinosSemContato)}
            tone="amber"
          />
        ) : (
          <KpiBox icon={Check} label="Todos com contato OK" value="✓" tone="green" />
        )}
      </div>

      {/* Listagem de réguas */}
      <section className="space-y-3">
        <h3 className="font-display text-base font-semibold">Eventos disponíveis</h3>
        {regras.map((r) => {
          const isOpen = expanded === r.evento;
          const isSaving = saving === r.evento;
          return (
            <article
              key={r.evento}
              className={cn(
                'rounded-lg border bg-card overflow-hidden',
                r.ativo ? 'border-primary/40' : 'border-border',
              )}
            >
              {/* Header sempre visivel */}
              <div className="flex items-center gap-3 p-4">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : r.evento)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-foreground">{r.titulo}</h4>
                    <Badge variant="outline" className="text-[10px] font-normal">
                      origem: {r.origem}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.descricao}</p>
                  {r.ativo && (
                    <p className="text-[11px] text-primary mt-1 font-medium">
                      Disparos: {r.offsetsDias.map(offsetLabel).join(' · ')}
                      {r.canais.length > 0 && (
                        <span className="text-muted-foreground">
                          {' '}
                          · canais: {r.canais.join(' + ')}
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-muted-foreground">{r.ativo ? 'Ativa' : 'Inativa'}</span>
                  <input
                    type="checkbox"
                    checked={r.ativo}
                    onChange={(e) => toggleAtivo(r.evento, e.target.checked)}
                    disabled={isSaving}
                    className="h-4 w-7 appearance-none rounded-full bg-muted-foreground/30 checked:bg-primary transition-colors cursor-pointer relative after:absolute after:top-0.5 after:left-0.5 after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-transform checked:after:translate-x-3"
                  />
                </label>
              </div>

              {/* Detalhes expandidos */}
              {isOpen && (
                <div className="border-t border-border p-4 space-y-4 bg-muted/20">
                  {/* Canais */}
                  <div>
                    <h5 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Canais
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => toggleCanal(r.evento, 'whatsapp')}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                          r.canais.includes('whatsapp')
                            ? 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400'
                            : 'border-border text-muted-foreground hover:border-green-500/40',
                        )}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                        {r.canais.includes('whatsapp') && <Check className="h-3 w-3" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleCanal(r.evento, 'email')}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                          r.canais.includes('email')
                            ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400'
                            : 'border-border text-muted-foreground hover:border-blue-500/40',
                        )}
                      >
                        <Mail className="h-3.5 w-3.5" />
                        E-mail
                        {r.canais.includes('email') && <Check className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Quando disparar */}
                  <div>
                    <h5 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Quando disparar
                    </h5>
                    <p className="text-[11px] text-muted-foreground mb-2">
                      Selecione quantos dias antes (negativo) ou depois (positivo) do evento.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {OFFSETS_SUGERIDOS.map((o) => (
                        <button
                          key={o}
                          type="button"
                          onClick={() => toggleOffset(r.evento, o)}
                          className={cn(
                            'rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors',
                            r.offsetsDias.includes(o)
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border text-muted-foreground hover:border-primary/40',
                          )}
                        >
                          {offsetLabel(o)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Templates */}
                  {r.canais.includes('whatsapp') && (
                    <div>
                      <h5 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                        <MessageCircle className="h-3 w-3" />
                        Mensagem WhatsApp
                      </h5>
                      <textarea
                        value={r.mensagemWpp}
                        onChange={(e) => patchLocal(r.evento, { mensagemWpp: e.target.value })}
                        rows={6}
                        className="w-full rounded-md border border-input bg-background p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Variáveis disponíveis:{' '}
                        <code className="bg-muted/40 px-1 rounded">{'{nome}'}</code>{' '}
                        <code className="bg-muted/40 px-1 rounded">{'{valor}'}</code>{' '}
                        <code className="bg-muted/40 px-1 rounded">{'{vencimento}'}</code>{' '}
                        <code className="bg-muted/40 px-1 rounded">{'{imovel}'}</code>{' '}
                        <code className="bg-muted/40 px-1 rounded">{'{empresa}'}</code>
                      </p>
                    </div>
                  )}
                  {r.canais.includes('email') && (
                    <div>
                      <h5 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                        <Mail className="h-3 w-3" />
                        Mensagem e-mail
                      </h5>
                      <textarea
                        value={r.mensagemEmail}
                        onChange={(e) => patchLocal(r.evento, { mensagemEmail: e.target.value })}
                        rows={6}
                        className="w-full rounded-md border border-input bg-background p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    <Button onClick={() => persist(r.evento)} disabled={isSaving} size="sm">
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Salvando
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Salvar configuração
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </section>

      {/* Lista de inquilinos */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="font-display text-base font-semibold">Quem vai receber</h3>
          <Link
            href="/inquilinos"
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            Ver todos →
          </Link>
        </div>

        {inquilinos.length === 0 ? (
          <div className="rounded-lg border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhum inquilino ativo. Cadastre um contrato de Aluguel ou Administração em{' '}
            <Link href="/contratos" className="text-primary hover:underline">
              /contratos
            </Link>{' '}
            pra começar.
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-muted-foreground text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Inquilino</th>
                  <th className="text-left px-4 py-2.5 font-medium">Imóvel</th>
                  <th className="text-left px-4 py-2.5 font-medium">Canais</th>
                  <th className="text-right px-4 py-2.5 font-medium">Aluguel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {inquilinos.map((i) => (
                  <tr key={i.id} className="hover:bg-muted/40">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-foreground">{i.nome}</p>
                      {i.contato && (
                        <p className="text-[11px] text-muted-foreground font-mono">{i.contato}</p>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      {i.imovelCodigo && (
                        <span className="font-mono text-foreground">{i.imovelCodigo}</span>
                      )}
                      {i.imovelTitulo && (
                        <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                          {i.imovelTitulo}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {i.temWpp ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30 font-normal"
                          >
                            <MessageCircle className="h-2.5 w-2.5 mr-1" />
                            WhatsApp
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-muted-foreground border-border font-normal"
                          >
                            sem WhatsApp
                          </Badge>
                        )}
                        {i.temEmail && (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 font-normal"
                          >
                            <Mail className="h-2.5 w-2.5 mr-1" />
                            E-mail
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-xs">
                      {formatBRL(i.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function KpiBox({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: string;
  tone: 'primary' | 'green' | 'amber';
}) {
  const tones: Record<typeof tone, string> = {
    primary: 'text-primary bg-primary/10',
    green: 'text-green-700 dark:text-green-400 bg-green-500/10',
    amber: 'text-amber-700 dark:text-amber-400 bg-amber-500/10',
  } as any;
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
      <div className={cn('h-10 w-10 rounded-lg grid place-items-center', tones[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}
