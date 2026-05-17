'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  ArrowRightLeft,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Trash2,
  Pencil,
  Loader2,
  MessageCircle,
  ExternalLink,
  XCircle,
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

type StatusRepasse = 'PENDENTE' | 'A_REPASSAR' | 'PAGO' | 'CANCELADO';

type ContratoLite = {
  id: string;
  cliente: string;
  tipo: string;
  valor: number;
  imovelCodigo?: string | null;
  imovelTitulo?: string | null;
};

type Repasse = {
  id: string;
  contratoId: string;
  contrato: ContratoLite | null;
  proprietarioNome: string;
  proprietarioContato: string | null;
  proprietarioConta: string | null;
  mesReferencia: string; // YYYY-MM
  valorBruto: number;
  taxaAdmPct: number | null;
  taxaAdmFixa: number | null;
  outrosDescontos: number;
  descontosNotas: string | null;
  valorLiquido: number;
  status: string;
  pagoEm: string | null;
  comprovanteUrl: string | null;
  observacao: string | null;
};

type FilterTab = 'todos' | 'pendentes' | 'a_repassar' | 'pago' | 'cancelados';

const STATUS_STYLE: Record<StatusRepasse, string> = {
  PENDENTE: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-400 border-zinc-500/30',
  A_REPASSAR: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  PAGO: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  CANCELADO: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
};

const STATUS_LABEL: Record<StatusRepasse, string> = {
  PENDENTE: 'Aguardando aluguel',
  A_REPASSAR: 'A repassar',
  PAGO: 'Repassado',
  CANCELADO: 'Cancelado',
};

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function formatMes(yyyymm: string) {
  if (!/^\d{4}-\d{2}$/.test(yyyymm)) return yyyymm;
  const [y, m] = yyyymm.split('-').map(Number);
  const dt = new Date(y, m - 1, 1);
  return dt.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}
function whatsappLink(contato: string | null | undefined): string | null {
  if (!contato) return null;
  const digits = contato.replace(/\D/g, '');
  if (digits.length < 10) return null;
  const prefix = digits.startsWith('55') ? '' : '55';
  return `https://wa.me/${prefix}${digits}`;
}
function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function RepassesClient({
  initialRepasses,
  contratos,
}: {
  initialRepasses: Repasse[];
  contratos: ContratoLite[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Repasse | null>(null);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('todos');
  const [filterMes, setFilterMes] = useState('');

  const repasses = initialRepasses;

  const totalBrutoMes = useMemo(() => {
    const mes = mesAtual();
    return repasses
      .filter((r) => r.mesReferencia === mes && r.status !== 'CANCELADO')
      .reduce((acc, r) => acc + r.valorBruto, 0);
  }, [repasses]);
  const totalARepassar = repasses
    .filter((r) => r.status === 'A_REPASSAR')
    .reduce((acc, r) => acc + r.valorLiquido, 0);
  const totalRepassadoMes = useMemo(() => {
    const mes = mesAtual();
    return repasses
      .filter((r) => r.mesReferencia === mes && r.status === 'PAGO')
      .reduce((acc, r) => acc + r.valorLiquido, 0);
  }, [repasses]);
  const taxaRetidaMes = useMemo(() => {
    const mes = mesAtual();
    return repasses
      .filter((r) => r.mesReferencia === mes && r.status !== 'CANCELADO')
      .reduce((acc, r) => acc + (r.valorBruto - r.valorLiquido - r.outrosDescontos), 0);
  }, [repasses]);

  const counts = {
    todos: repasses.length,
    pendentes: repasses.filter((r) => r.status === 'PENDENTE').length,
    a_repassar: repasses.filter((r) => r.status === 'A_REPASSAR').length,
    pago: repasses.filter((r) => r.status === 'PAGO').length,
    cancelados: repasses.filter((r) => r.status === 'CANCELADO').length,
  };

  const mesesDisponiveis = useMemo(() => {
    const set = new Set(repasses.map((r) => r.mesReferencia));
    return Array.from(set).sort().reverse();
  }, [repasses]);

  const filtered = useMemo(() => {
    let arr = repasses;
    if (filterTab === 'pendentes') arr = arr.filter((r) => r.status === 'PENDENTE');
    else if (filterTab === 'a_repassar') arr = arr.filter((r) => r.status === 'A_REPASSAR');
    else if (filterTab === 'pago') arr = arr.filter((r) => r.status === 'PAGO');
    else if (filterTab === 'cancelados') arr = arr.filter((r) => r.status === 'CANCELADO');
    if (filterMes) arr = arr.filter((r) => r.mesReferencia === filterMes);
    const q = search.trim().toLowerCase();
    if (q) {
      arr = arr.filter((r) =>
        `${r.proprietarioNome} ${r.contrato?.cliente ?? ''} ${r.contrato?.imovelCodigo ?? ''}`
          .toLowerCase()
          .includes(q),
      );
    }
    return arr;
  }, [repasses, filterTab, filterMes, search]);

  async function handleSave(payload: any) {
    const isEdit = !!editing;
    const url = isEdit ? `/api/repasses?id=${editing!.id}` : '/api/repasses';
    const method = isEdit ? 'PATCH' : 'POST';
    try {
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'Erro ao salvar');
      toast.success(isEdit ? 'Repasse atualizado' : 'Repasse criado');
      setShowForm(false);
      setEditing(null);
      router.refresh();
    } catch (e) {
      toast.error('Erro', { description: (e as Error).message });
    }
  }

  async function handleStatus(r: Repasse, novo: StatusRepasse) {
    const label =
      novo === 'A_REPASSAR'
        ? 'Marcar como "Aluguel recebido" (passa pra A repassar)?'
        : novo === 'PAGO'
          ? `Confirmar repasse de ${formatBRL(r.valorLiquido)} pra ${r.proprietarioNome}?`
          : 'Confirmar?';
    if (!confirm(label)) return;
    try {
      const res = await fetch(`/api/repasses?id=${r.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novo }),
      });
      if (!res.ok) throw new Error('Falhou');
      toast.success('Atualizado');
      router.refresh();
    } catch (e) {
      toast.error('Erro', { description: (e as Error).message });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esse repasse?')) return;
    try {
      const r = await fetch(`/api/repasses?id=${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Falhou');
      toast.success('Excluído');
      router.refresh();
    } catch (e) {
      toast.error('Erro', { description: (e as Error).message });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Negócios"
        icon={ArrowRightLeft}
        title="Repasses"
        description="Locação administrada: bruto recebido → taxa adm → líquido pro proprietário"
        actions={
          <Button onClick={() => { setEditing(null); setShowForm(true); }} disabled={contratos.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            Novo repasse
          </Button>
        }
      />

      {contratos.length === 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          Pra registrar repasses, primeiro crie um contrato de Administração ou Aluguel em{' '}
          <a href="/contratos" className="underline font-medium">/contratos</a>.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label={`Bruto ${formatMes(mesAtual())}`} value={formatBRL(totalBrutoMes)} icon={TrendingUp} accent="primary" />
        <KpiCard label="A repassar" value={formatBRL(totalARepassar)} icon={AlertTriangle} accent="amber" />
        <KpiCard label={`Repassado ${formatMes(mesAtual())}`} value={formatBRL(totalRepassadoMes)} icon={CheckCircle2} accent="green" />
        <KpiCard label={`Taxa retida ${formatMes(mesAtual())}`} value={formatBRL(taxaRetidaMes)} icon={ArrowRightLeft} accent="violet" />
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['todos', 'Todos'],
            ['pendentes', 'Aguardando aluguel'],
            ['a_repassar', 'A repassar'],
            ['pago', 'Repassados'],
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

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por proprietário, inquilino ou imóvel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <NativeSelect
          value={filterMes}
          onChange={(e) => setFilterMes(e.target.value)}
          className="md:w-[180px]"
        >
          <option value="">Todos os meses</option>
          {mesesDisponiveis.map((m) => (
            <option key={m} value={m}>
              {formatMes(m)}
            </option>
          ))}
        </NativeSelect>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ArrowRightLeft}
          title={repasses.length === 0 ? 'Nenhum repasse registrado' : 'Nenhum repasse nesse filtro'}
          description={
            repasses.length === 0
              ? 'Cada mês você registra: bruto recebido do inquilino, taxa de admin, e o app calcula automaticamente o líquido a repassar pro proprietário.'
              : undefined
          }
          action={
            repasses.length === 0 && contratos.length > 0
              ? {
                  label: 'Criar primeiro repasse',
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
                <th className="text-left px-4 py-3 font-medium">Proprietário</th>
                <th className="text-left px-4 py-3 font-medium">Imóvel / Inquilino</th>
                <th className="text-left px-4 py-3 font-medium">Mês</th>
                <th className="text-right px-4 py-3 font-medium">Bruto</th>
                <th className="text-right px-4 py-3 font-medium">Taxa+Desc</th>
                <th className="text-right px-4 py-3 font-medium">Líquido</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => {
                const taxa = r.valorBruto - r.valorLiquido - r.outrosDescontos;
                const wpp = whatsappLink(r.proprietarioContato);
                return (
                  <tr key={r.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{r.proprietarioNome}</p>
                      {r.proprietarioConta && (
                        <p className="text-[11px] text-muted-foreground font-mono truncate max-w-[160px]">
                          {r.proprietarioConta}
                        </p>
                      )}
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
                    <td className="px-4 py-3 text-xs">
                      {r.contrato?.imovelCodigo && (
                        <p className="font-mono text-foreground">{r.contrato.imovelCodigo}</p>
                      )}
                      {r.contrato?.cliente && (
                        <p className="text-muted-foreground truncate max-w-[160px]">
                          Inq: {r.contrato.cliente}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <Badge variant="outline" className="font-mono text-xs font-normal">
                        {formatMes(r.mesReferencia)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatBRL(r.valorBruto)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs">
                      <span className="text-muted-foreground">−{formatBRL(taxa)}</span>
                      {r.outrosDescontos > 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          desc: {formatBRL(r.outrosDescontos)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-primary tabular-nums">
                      {formatBRL(r.valorLiquido)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border',
                          STATUS_STYLE[r.status as StatusRepasse] ?? '',
                        )}
                      >
                        {r.status === 'PAGO' && <CheckCircle2 className="h-3 w-3" />}
                        {r.status === 'A_REPASSAR' && <Clock className="h-3 w-3" />}
                        {r.status === 'CANCELADO' && <XCircle className="h-3 w-3" />}
                        {STATUS_LABEL[r.status as StatusRepasse] ?? r.status}
                      </span>
                      {r.status === 'PAGO' && r.pagoEm && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          em {new Date(r.pagoEm).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        {r.status === 'PENDENTE' && (
                          <button
                            onClick={() => handleStatus(r, 'A_REPASSAR')}
                            className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline px-2"
                            title="Marcar aluguel recebido"
                          >
                            Recebi
                          </button>
                        )}
                        {r.status === 'A_REPASSAR' && (
                          <button
                            onClick={() => handleStatus(r, 'PAGO')}
                            className="text-xs font-medium text-green-700 dark:text-green-400 hover:underline px-2"
                            title="Confirmar repasse feito"
                          >
                            Repassei
                          </button>
                        )}
                        {r.comprovanteUrl && (
                          <a
                            href={r.comprovanteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-muted"
                            title="Abrir comprovante"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => { setEditing(r); setShowForm(true); }}
                          className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-muted"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
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
        ℹ️ Em breve (upsell): n8n gera repasse automaticamente todo mês 1 do contrato + envia
        comprovante por WhatsApp/e-mail no momento que vira PAGO.
      </div>

      {showForm && (
        <RepasseFormModal
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

function RepasseFormModal({
  editing,
  contratos,
  onCancel,
  onSave,
}: {
  editing: Repasse | null;
  contratos: ContratoLite[];
  onCancel: () => void;
  onSave: (payload: any) => Promise<void>;
}) {
  const [contratoId, setContratoId] = useState(editing?.contratoId ?? contratos[0]?.id ?? '');
  const [proprietarioNome, setProprietarioNome] = useState(editing?.proprietarioNome ?? '');
  const [proprietarioContato, setProprietarioContato] = useState(editing?.proprietarioContato ?? '');
  const [proprietarioConta, setProprietarioConta] = useState(editing?.proprietarioConta ?? '');
  const [mesReferencia, setMesReferencia] = useState(editing?.mesReferencia ?? mesAtual());
  const [valorBruto, setValorBruto] = useState(
    editing ? String(editing.valorBruto) : String(contratos.find((c) => c.id === contratoId)?.valor ?? ''),
  );
  const [modoTaxa, setModoTaxa] = useState<'percentual' | 'fixo'>(
    editing?.taxaAdmFixa != null ? 'fixo' : 'percentual',
  );
  const [taxaAdmPct, setTaxaAdmPct] = useState(
    editing?.taxaAdmPct != null ? String(editing.taxaAdmPct) : '10',
  );
  const [taxaAdmFixa, setTaxaAdmFixa] = useState(
    editing?.taxaAdmFixa != null ? String(editing.taxaAdmFixa) : '',
  );
  const [outrosDescontos, setOutrosDescontos] = useState(
    editing?.outrosDescontos ? String(editing.outrosDescontos) : '0',
  );
  const [descontosNotas, setDescontosNotas] = useState(editing?.descontosNotas ?? '');
  const [observacao, setObservacao] = useState(editing?.observacao ?? '');
  const [comprovanteUrl, setComprovanteUrl] = useState(editing?.comprovanteUrl ?? '');
  const [saving, setSaving] = useState(false);

  // Preview do liquido
  const brutoNum = Number(String(valorBruto).replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
  const taxaPctNum = Number(taxaAdmPct) || 0;
  const taxaFixaNum = Number(String(taxaAdmFixa).replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
  const outrosNum = Number(String(outrosDescontos).replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
  const taxa = modoTaxa === 'fixo' ? taxaFixaNum : (brutoNum * taxaPctNum) / 100;
  const liquido = Math.max(0, brutoNum - taxa - outrosNum);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!contratoId || !proprietarioNome.trim() || !mesReferencia || !valorBruto) return;
    setSaving(true);
    try {
      const payload: any = {
        contratoId,
        proprietarioNome: proprietarioNome.trim(),
        proprietarioContato: proprietarioContato?.trim() || null,
        proprietarioConta: proprietarioConta?.trim() || null,
        mesReferencia,
        valorBruto: brutoNum,
        outrosDescontos: outrosNum,
        descontosNotas: descontosNotas?.trim() || null,
        observacao: observacao?.trim() || null,
        comprovanteUrl: comprovanteUrl?.trim() || null,
      };
      if (modoTaxa === 'fixo') {
        payload.taxaAdmFixa = taxaFixaNum;
        payload.taxaAdmPct = null;
      } else {
        payload.taxaAdmPct = taxaPctNum;
        payload.taxaAdmFixa = null;
      }
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onCancel} title={editing ? 'Editar repasse' : 'Novo repasse'} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5">
        <FormGroup title="Contrato + mês">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Contrato *" required>
              <NativeSelect
                value={contratoId}
                onChange={(e) => {
                  setContratoId(e.target.value);
                  const c = contratos.find((x) => x.id === e.target.value);
                  if (c && !editing) setValorBruto(String(c.valor));
                }}
                required
                disabled={!!editing}
              >
                <option value="">— Selecione —</option>
                {contratos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.cliente} · {c.imovelCodigo ?? '—'} · {formatBRL(c.valor)} /mês
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Mês de referência *" required>
              <Input
                type="month"
                value={mesReferencia}
                onChange={(e) => setMesReferencia(e.target.value)}
                required
              />
            </Field>
          </div>
        </FormGroup>

        <FormGroup title="Proprietário">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Nome *" required>
              <Input
                value={proprietarioNome}
                onChange={(e) => setProprietarioNome(e.target.value)}
                placeholder="Ex: Maria dos Santos"
                required
                autoFocus
              />
            </Field>
            <Field label="Contato (WhatsApp / e-mail)">
              <Input
                value={proprietarioContato ?? ''}
                onChange={(e) => setProprietarioContato(e.target.value)}
                placeholder="11 99999-9999"
              />
            </Field>
            <Field label="Conta para depósito (PIX / banco)">
              <Input
                value={proprietarioConta ?? ''}
                onChange={(e) => setProprietarioConta(e.target.value)}
                placeholder="PIX: cpf@..., ou banco/ag/conta"
              />
            </Field>
          </div>
        </FormGroup>

        <FormGroup title="Valores">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Valor bruto recebido (R$) *" required>
              <Input
                type="text"
                inputMode="decimal"
                value={valorBruto}
                onChange={(e) => setValorBruto(e.target.value)}
                placeholder="2500"
                required
              />
            </Field>
            <div>
              <span className="text-xs font-medium block mb-1">Taxa de administração</span>
              <div className="flex gap-1 mb-1">
                <button
                  type="button"
                  onClick={() => setModoTaxa('percentual')}
                  className={cn(
                    'flex-1 px-2 py-1 rounded text-xs font-medium transition-colors border',
                    modoTaxa === 'percentual'
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-border text-muted-foreground',
                  )}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => setModoTaxa('fixo')}
                  className={cn(
                    'flex-1 px-2 py-1 rounded text-xs font-medium transition-colors border',
                    modoTaxa === 'fixo'
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-border text-muted-foreground',
                  )}
                >
                  R$
                </button>
              </div>
              {modoTaxa === 'percentual' ? (
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={taxaAdmPct}
                  onChange={(e) => setTaxaAdmPct(e.target.value)}
                  placeholder="10"
                />
              ) : (
                <Input
                  type="text"
                  inputMode="decimal"
                  value={taxaAdmFixa}
                  onChange={(e) => setTaxaAdmFixa(e.target.value)}
                  placeholder="250"
                />
              )}
            </div>
            <Field label="Outros descontos (R$)" hint="IPTU adiantado, manutenção, etc.">
              <Input
                type="text"
                inputMode="decimal"
                value={outrosDescontos}
                onChange={(e) => setOutrosDescontos(e.target.value)}
                placeholder="0"
              />
            </Field>
            <Field label="Notas dos descontos">
              <Input
                value={descontosNotas ?? ''}
                onChange={(e) => setDescontosNotas(e.target.value)}
                placeholder="Ex: reparo elétrico R$120"
              />
            </Field>
          </div>
          <div className="mt-3 rounded-md bg-primary/5 border border-primary/20 px-3 py-3 text-sm space-y-1">
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>Bruto recebido</span>
              <span className="tabular-nums">{formatBRL(brutoNum)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>− Taxa admin</span>
              <span className="tabular-nums">{formatBRL(taxa)}</span>
            </div>
            {outrosNum > 0 && (
              <div className="flex justify-between text-muted-foreground text-xs">
                <span>− Outros descontos</span>
                <span className="tabular-nums">{formatBRL(outrosNum)}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-primary/20 font-semibold">
              <span>Líquido pro proprietário</span>
              <span className="text-primary tabular-nums">{formatBRL(liquido)}</span>
            </div>
          </div>
        </FormGroup>

        <FormGroup title="Comprovante e observações">
          <Field label="Link do comprovante (URL)">
            <Input
              value={comprovanteUrl ?? ''}
              onChange={(e) => setComprovanteUrl(e.target.value)}
              placeholder="https://..."
            />
          </Field>
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={2}
            placeholder="Observação livre..."
            className="mt-2 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </FormGroup>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando
              </>
            ) : editing ? (
              'Atualizar'
            ) : (
              'Salvar repasse'
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
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
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
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
    </label>
  );
}
