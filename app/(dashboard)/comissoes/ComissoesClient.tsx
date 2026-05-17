'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Trash2,
  Pencil,
  Loader2,
  MessageCircle,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { KpiCard } from '@/components/ui/kpi-card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Modal } from '@/components/ui/modal';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

type Papel = 'VENDEDOR' | 'CAPTADOR' | 'IMOBILIARIA' | 'PARCEIRO' | 'OUTRO';
type StatusComissao = 'PENDENTE' | 'PAGO' | 'CANCELADO';

type ContratoLite = {
  id: string;
  cliente: string;
  tipo: string;
  valor: number;
  comissaoPct: number;
  imovelCodigo?: string | null;
  imovelTitulo?: string | null;
};

type Split = {
  id: string;
  contratoId: string;
  contrato: ContratoLite | null;
  beneficiario: string;
  beneficiarioContato: string | null;
  papel: string;
  percentual: number | null;
  valorFixo: number | null;
  status: string;
  pagoEm: string | null;
  observacao: string | null;
  createdAt: string;
};

type FilterTab = 'todos' | 'pendentes' | 'pagos' | 'cancelados';

const PAPEL_LABEL: Record<Papel, string> = {
  VENDEDOR: 'Vendedor',
  CAPTADOR: 'Captador',
  IMOBILIARIA: 'Imobiliária',
  PARCEIRO: 'Parceiro',
  OUTRO: 'Outro',
};

const PAPEL_COR: Record<Papel, string> = {
  VENDEDOR: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  CAPTADOR: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  IMOBILIARIA: 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-500/30',
  PARCEIRO: 'bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30',
  OUTRO: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-400 border-zinc-500/30',
};

const STATUS_STYLE: Record<StatusComissao, string> = {
  PENDENTE: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  PAGO: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  CANCELADO: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
};

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function comissaoBase(contrato: ContratoLite | null): number {
  if (!contrato) return 0;
  return (contrato.valor * contrato.comissaoPct) / 100;
}

function valorSplit(s: Split): number {
  if (s.valorFixo != null) return s.valorFixo;
  if (s.percentual != null) {
    const base = comissaoBase(s.contrato);
    return (base * s.percentual) / 100;
  }
  return 0;
}

function whatsappLink(contato: string | null | undefined): string | null {
  if (!contato) return null;
  const digits = contato.replace(/\D/g, '');
  if (digits.length < 10) return null;
  const prefix = digits.startsWith('55') ? '' : '55';
  return `https://wa.me/${prefix}${digits}`;
}

export default function ComissoesClient({
  initialSplits,
  contratos,
}: {
  initialSplits: Split[];
  contratos: ContratoLite[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Split | null>(null);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('todos');
  const [filterPapel, setFilterPapel] = useState('');

  const splits = initialSplits;

  // KPIs
  const aReceber = useMemo(
    () =>
      splits.filter((s) => s.status === 'PENDENTE').reduce((acc, s) => acc + valorSplit(s), 0),
    [splits],
  );
  const pago = useMemo(
    () => splits.filter((s) => s.status === 'PAGO').reduce((acc, s) => acc + valorSplit(s), 0),
    [splits],
  );
  const contagemPendentes = splits.filter((s) => s.status === 'PENDENTE').length;
  const contratosUnicos = useMemo(
    () => new Set(splits.map((s) => s.contratoId)).size,
    [splits],
  );

  const counts = {
    todos: splits.length,
    pendentes: splits.filter((s) => s.status === 'PENDENTE').length,
    pagos: splits.filter((s) => s.status === 'PAGO').length,
    cancelados: splits.filter((s) => s.status === 'CANCELADO').length,
  };

  const filtered = useMemo(() => {
    let arr = splits;
    if (filterTab === 'pendentes') arr = arr.filter((s) => s.status === 'PENDENTE');
    else if (filterTab === 'pagos') arr = arr.filter((s) => s.status === 'PAGO');
    else if (filterTab === 'cancelados') arr = arr.filter((s) => s.status === 'CANCELADO');
    if (filterPapel) arr = arr.filter((s) => s.papel === filterPapel);
    const q = search.trim().toLowerCase();
    if (q) {
      arr = arr.filter((s) =>
        `${s.beneficiario} ${s.contrato?.cliente ?? ''} ${s.contrato?.imovelCodigo ?? ''}`
          .toLowerCase()
          .includes(q),
      );
    }
    return arr;
  }, [splits, filterTab, filterPapel, search]);

  async function handleSave(payload: any) {
    const isEdit = !!editing;
    const url = isEdit ? `/api/comissoes?id=${editing!.id}` : '/api/comissoes';
    const method = isEdit ? 'PATCH' : 'POST';
    try {
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'Erro ao salvar');
      toast.success(isEdit ? 'Split atualizado' : 'Split de comissão criado');
      setShowForm(false);
      setEditing(null);
      router.refresh();
    } catch (e) {
      toast.error('Erro ao salvar', { description: (e as Error).message });
    }
  }

  async function handleMarcarPago(s: Split) {
    if (!confirm(`Marcar comissão de ${s.beneficiario} como PAGA?`)) return;
    try {
      const r = await fetch(`/api/comissoes?id=${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAGO' }),
      });
      if (!r.ok) throw new Error('Falhou');
      toast.success('Marcado como pago');
      router.refresh();
    } catch (e) {
      toast.error('Erro', { description: (e as Error).message });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esse split? Não pode ser desfeito.')) return;
    try {
      const r = await fetch(`/api/comissoes?id=${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Falhou');
      toast.success('Split excluído');
      router.refresh();
    } catch (e) {
      toast.error('Erro', { description: (e as Error).message });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Negócios"
        icon={Receipt}
        title="Comissões"
        description="Split de comissão por contrato — vendedor, captador, imobiliária, parceiros"
        actions={
          <Button onClick={() => { setEditing(null); setShowForm(true); }} disabled={contratos.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            Novo split
          </Button>
        }
      />

      {contratos.length === 0 && splits.length === 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          Pra cadastrar splits de comissão, primeiro crie um contrato em{' '}
          <a href="/contratos" className="underline font-medium">/contratos</a>.
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="A receber" value={formatBRL(aReceber)} icon={Wallet} accent="amber" />
        <KpiCard label="Pago" value={formatBRL(pago)} icon={CheckCircle2} accent="green" />
        <KpiCard label="Splits pendentes" value={String(contagemPendentes)} icon={Clock} accent="primary" />
        <KpiCard label="Contratos com split" value={String(contratosUnicos)} icon={TrendingUp} accent="violet" />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['todos', 'Todos'],
            ['pendentes', 'Pendentes'],
            ['pagos', 'Pagos'],
            ['cancelados', 'Cancelados'],
          ] as Array<[FilterTab, string]>
        ).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={cn(
              'px-3 py-1.5 rounded-full border text-xs font-medium transition-colors',
              filterTab === tab
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:border-primary/50',
            )}
          >
            {label} <span className="opacity-60">({counts[tab]})</span>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por beneficiário, cliente ou imóvel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <NativeSelect
          value={filterPapel}
          onChange={(e) => setFilterPapel(e.target.value)}
          className="md:w-[180px]"
        >
          <option value="">Todos os papéis</option>
          <option value="VENDEDOR">Vendedor</option>
          <option value="CAPTADOR">Captador</option>
          <option value="IMOBILIARIA">Imobiliária</option>
          <option value="PARCEIRO">Parceiro</option>
          <option value="OUTRO">Outro</option>
        </NativeSelect>
      </div>

      {/* Tabela */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={
            splits.length === 0
              ? 'Nenhum split de comissão registrado'
              : 'Nenhum split nesse filtro'
          }
          description={
            splits.length === 0
              ? 'Pra cada contrato você pode quebrar a comissão entre vendedor, captador, imobiliária e parceiros.'
              : undefined
          }
          action={
            splits.length === 0 && contratos.length > 0
              ? {
                  label: 'Cadastrar primeiro split',
                  icon: Plus,
                  onClick: () => { setEditing(null); setShowForm(true); },
                }
              : undefined
          }
        />
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-muted-foreground text-[11px] uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Beneficiário</th>
                <th className="text-left px-4 py-3 font-medium">Papel</th>
                <th className="text-left px-4 py-3 font-medium">Contrato</th>
                <th className="text-right px-4 py-3 font-medium">% / Fixo</th>
                <th className="text-right px-4 py-3 font-medium">Valor</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => {
                const valor = valorSplit(s);
                const wpp = whatsappLink(s.beneficiarioContato);
                return (
                  <tr key={s.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{s.beneficiario}</p>
                      {wpp && (
                        <a
                          href={wpp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-[11px] text-green-700 dark:text-green-400 hover:underline"
                        >
                          <MessageCircle className="h-3 w-3" />
                          WhatsApp
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn('text-xs font-normal border', PAPEL_COR[s.papel as Papel])}
                      >
                        {PAPEL_LABEL[s.papel as Papel] ?? s.papel}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <p className="font-medium text-foreground truncate max-w-[180px]">
                        {s.contrato?.cliente ?? '—'}
                      </p>
                      {s.contrato?.imovelCodigo && (
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {s.contrato.imovelCodigo}
                        </p>
                      )}
                      {s.contrato && (
                        <p className="text-[11px] text-muted-foreground">
                          Base: {formatBRL(comissaoBase(s.contrato))}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-xs">
                      {s.valorFixo != null ? (
                        <span className="font-mono">Fixo</span>
                      ) : s.percentual != null ? (
                        <span className="font-mono">{s.percentual}%</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-primary tabular-nums">
                      {formatBRL(valor)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border',
                          STATUS_STYLE[s.status as StatusComissao] ?? '',
                        )}
                      >
                        {s.status === 'PAGO' && <CheckCircle2 className="h-3 w-3" />}
                        {s.status === 'PENDENTE' && <Clock className="h-3 w-3" />}
                        {s.status === 'CANCELADO' && <XCircle className="h-3 w-3" />}
                        {s.status}
                      </span>
                      {s.status === 'PAGO' && s.pagoEm && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          em {new Date(s.pagoEm).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        {s.status === 'PENDENTE' && (
                          <button
                            onClick={() => handleMarcarPago(s)}
                            className="text-xs font-medium text-green-700 dark:text-green-400 hover:underline px-2"
                            title="Marcar como pago"
                          >
                            Pagar
                          </button>
                        )}
                        <button
                          onClick={() => { setEditing(s); setShowForm(true); }}
                          className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-muted"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="text-muted-foreground hover:text-destructive p-1.5 rounded hover:bg-destructive/10"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-xs text-muted-foreground bg-muted/40 border border-border rounded-md px-3 py-2">
        ℹ️ Em breve (upsell): no dia D do pagamento o n8n dispara comprovante por WhatsApp/e-mail
        pro beneficiário. Splits PAGO viram linha do extrato no Pipeline (F7).
      </div>

      {showForm && (
        <SplitFormModal
          editing={editing}
          contratos={contratos}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

/* ---------- Modal ---------- */

function SplitFormModal({
  editing,
  contratos,
  onCancel,
  onSave,
}: {
  editing: Split | null;
  contratos: ContratoLite[];
  onCancel: () => void;
  onSave: (payload: any) => Promise<void>;
}) {
  const [contratoId, setContratoId] = useState(editing?.contratoId ?? contratos[0]?.id ?? '');
  const [beneficiario, setBeneficiario] = useState(editing?.beneficiario ?? '');
  const [beneficiarioContato, setBeneficiarioContato] = useState(editing?.beneficiarioContato ?? '');
  const [papel, setPapel] = useState<Papel>((editing?.papel as Papel) ?? 'VENDEDOR');
  const [modoValor, setModoValor] = useState<'percentual' | 'fixo'>(
    editing?.valorFixo != null ? 'fixo' : 'percentual',
  );
  const [percentual, setPercentual] = useState(editing?.percentual != null ? String(editing.percentual) : '50');
  const [valorFixo, setValorFixo] = useState(editing?.valorFixo != null ? String(editing.valorFixo) : '');
  const [status, setStatus] = useState<StatusComissao>((editing?.status as StatusComissao) ?? 'PENDENTE');
  const [observacao, setObservacao] = useState(editing?.observacao ?? '');
  const [saving, setSaving] = useState(false);

  const contratoSel = contratos.find((c) => c.id === contratoId) ?? editing?.contrato ?? null;
  const base = comissaoBase(contratoSel);
  const previewValor =
    modoValor === 'fixo'
      ? Number(valorFixo) || 0
      : ((Number(percentual) || 0) * base) / 100;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!beneficiario.trim() || !contratoId) return;
    if (saving) return;
    setSaving(true);
    try {
      const payload: any = {
        contratoId,
        beneficiario: beneficiario.trim(),
        beneficiarioContato: beneficiarioContato.trim() || null,
        papel,
        observacao: observacao.trim() || null,
      };
      if (modoValor === 'fixo') {
        payload.valorFixo = Number(valorFixo) || 0;
        payload.percentual = null;
      } else {
        payload.percentual = Number(percentual) || 0;
        payload.valorFixo = null;
      }
      if (editing) payload.status = status;
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onCancel} title={editing ? 'Editar split' : 'Novo split de comissão'} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5">
        <FormGroup title="Contrato">
          <NativeSelect
            value={contratoId}
            onChange={(e) => setContratoId(e.target.value)}
            required
            disabled={!!editing}
          >
            <option value="">— Selecione —</option>
            {contratos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.cliente} · {c.tipo} · {formatBRL(c.valor)} ({c.comissaoPct}% =
                {' '}
                {formatBRL((c.valor * c.comissaoPct) / 100)})
              </option>
            ))}
          </NativeSelect>
          {contratoSel && (
            <p className="text-xs text-muted-foreground mt-2">
              Comissão base do contrato:{' '}
              <strong className="text-foreground">{formatBRL(base)}</strong>
              {contratoSel.imovelCodigo && (
                <span> · Imóvel {contratoSel.imovelCodigo}</span>
              )}
            </p>
          )}
        </FormGroup>

        <FormGroup title="Beneficiário">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Nome *" required>
              <Input
                value={beneficiario}
                onChange={(e) => setBeneficiario(e.target.value)}
                placeholder="Ex: Carlos Silva (corretor)"
                required
                autoFocus
              />
            </Field>
            <Field label="Papel">
              <NativeSelect value={papel} onChange={(e) => setPapel(e.target.value as Papel)}>
                <option value="VENDEDOR">Vendedor (quem fechou)</option>
                <option value="CAPTADOR">Captador</option>
                <option value="IMOBILIARIA">Imobiliária (a casa)</option>
                <option value="PARCEIRO">Parceiro</option>
                <option value="OUTRO">Outro</option>
              </NativeSelect>
            </Field>
            <Field label="Contato (WhatsApp / e-mail)">
              <Input
                value={beneficiarioContato ?? ''}
                onChange={(e) => setBeneficiarioContato(e.target.value)}
                placeholder="11 99999-9999"
              />
            </Field>
            {editing && (
              <Field label="Status">
                <NativeSelect value={status} onChange={(e) => setStatus(e.target.value as StatusComissao)}>
                  <option value="PENDENTE">Pendente</option>
                  <option value="PAGO">Pago</option>
                  <option value="CANCELADO">Cancelado</option>
                </NativeSelect>
              </Field>
            )}
          </div>
        </FormGroup>

        <FormGroup title="Valor do split">
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setModoValor('percentual')}
              className={cn(
                'flex-1 px-3 py-2 rounded-md border text-sm font-medium transition-colors',
                modoValor === 'percentual'
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50',
              )}
            >
              % da comissão
            </button>
            <button
              type="button"
              onClick={() => setModoValor('fixo')}
              className={cn(
                'flex-1 px-3 py-2 rounded-md border text-sm font-medium transition-colors',
                modoValor === 'fixo'
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50',
              )}
            >
              Valor fixo (R$)
            </button>
          </div>
          {modoValor === 'percentual' ? (
            <Field label="Percentual da comissão base (%)">
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={percentual}
                onChange={(e) => setPercentual(e.target.value)}
                placeholder="50"
              />
            </Field>
          ) : (
            <Field label="Valor fixo (R$)">
              <Input
                type="text"
                inputMode="decimal"
                value={valorFixo}
                onChange={(e) => setValorFixo(e.target.value)}
                placeholder="1500"
              />
            </Field>
          )}
          <div className="mt-3 rounded-md bg-primary/5 border border-primary/20 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Beneficiário receberá: </span>
            <strong className="text-primary tabular-nums">{formatBRL(previewValor)}</strong>
          </div>
        </FormGroup>

        <FormGroup title="Observação (opcional)">
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={2}
            placeholder="Ex: pago em parcelas, condicional a..."
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </FormGroup>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving || !contratoId || !beneficiario.trim()}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando
              </>
            ) : editing ? (
              'Atualizar'
            ) : (
              'Salvar split'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function FormGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {title}
      </h4>
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span
        className={cn(
          'text-xs font-medium block mb-1',
          required ? 'text-foreground' : 'text-foreground/80',
        )}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
