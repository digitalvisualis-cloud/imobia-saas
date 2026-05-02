'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  FileText,
  Search,
  Wallet,
  Receipt,
  TrendingUp,
  AlertCircle,
  Calendar as CalendarIcon,
  Upload,
  X,
  Trash2,
  Pencil,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { KpiCard } from '@/components/ui/kpi-card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

type StatusContrato = 'ATIVO' | 'PENDENTE' | 'ENCERRADO' | 'CANCELADO';
type TipoContrato = 'VENDA' | 'ALUGUEL' | 'ADMINISTRACAO';

type Contrato = {
  id: string;
  cliente: string;
  clienteCpfCnpj?: string | null;
  clienteContato?: string | null;
  imovelId?: string | null;
  imovelCodigo?: string | null;
  imovelTitulo?: string | null;
  leadId?: string | null;
  leadNome?: string | null;
  tipo: string;
  status: string;
  valor: number;
  comissaoPct: number;
  dataInicio: string; // YYYY-MM-DD
  dataFim?: string | null;
  pdfUrl?: string | null;
  pdfNome?: string | null;
  observacoes?: string | null;
};

type ImovelLite = {
  id: string;
  codigo: string;
  titulo: string;
};

const TIPO_LABELS: Record<TipoContrato, string> = {
  VENDA: 'Venda',
  ALUGUEL: 'Aluguel',
  ADMINISTRACAO: 'Administração',
};

const STATUS_STYLES: Record<StatusContrato, string> = {
  ATIVO: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  PENDENTE: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  ENCERRADO: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-400 border-zinc-500/30',
  CANCELADO: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
};

const STATUS_LABELS: Record<StatusContrato, string> = {
  ATIVO: 'Ativo',
  PENDENTE: 'Pendente',
  ENCERRADO: 'Encerrado',
  CANCELADO: 'Cancelado',
};

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function FinanceiroClient({
  contratosIniciais,
  imoveis,
}: {
  contratosIniciais: Contrato[];
  imoveis: ImovelLite[];
}) {
  const router = useRouter();
  const contratos = contratosIniciais;
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contrato | null>(null);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Métricas
  const totalAtivos = contratos.filter((c) => c.status === 'ATIVO').length;
  const valorTotal = contratos
    .filter((c) => c.status === 'ATIVO')
    .reduce((acc, c) => acc + c.valor, 0);
  const comissaoEstimada = contratos
    .filter((c) => c.status === 'ATIVO')
    .reduce((acc, c) => acc + (c.valor * c.comissaoPct) / 100, 0);
  const pendentes = contratos.filter((c) => c.status === 'PENDENTE').length;

  const filtered = contratos.filter((c) => {
    const q = search.trim().toLowerCase();
    if (q) {
      const hay =
        `${c.cliente} ${c.clienteCpfCnpj ?? ''} ${c.imovelCodigo ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filterTipo && c.tipo !== filterTipo) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    return true;
  });

  async function handleSave(payload: any) {
    const isEdit = !!editing;
    const url = isEdit ? `/api/contratos/${editing!.id}` : '/api/contratos';
    const method = isEdit ? 'PATCH' : 'POST';
    try {
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'Erro ao salvar');
      toast.success(isEdit ? 'Contrato atualizado' : 'Contrato criado');
      setShowForm(false);
      setEditing(null);
      router.refresh();
    } catch (e) {
      toast.error('Erro ao salvar contrato', {
        description: (e as Error).message,
      });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este contrato?')) return;
    try {
      const r = await fetch(`/api/contratos/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Erro ao apagar');
      toast.success('Contrato excluído');
      router.refresh();
    } catch (e) {
      toast.error('Erro ao excluir contrato', {
        description: (e as Error).message,
      });
    }
  }

  function abrirNovo() {
    setEditing(null);
    setShowForm(true);
  }
  function abrirEdit(c: Contrato) {
    setEditing(c);
    setShowForm(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Financeiro"
        icon={Wallet}
        title="Financeiro"
        description="Contratos, comissões e recebimentos da sua imobiliária"
        actions={
          <Button onClick={abrirNovo}>
            <Plus className="h-4 w-4 mr-2" />
            Novo contrato
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Contratos ativos"
          value={String(totalAtivos)}
          icon={FileText}
          accent="primary"
        />
        <KpiCard
          label="Valor em contratos"
          value={formatBRL(valorTotal)}
          icon={TrendingUp}
          accent="green"
        />
        <KpiCard
          label="Comissão estimada"
          value={formatBRL(comissaoEstimada)}
          icon={Receipt}
          accent="violet"
        />
        <KpiCard
          label="Pendentes"
          value={String(pendentes)}
          icon={AlertCircle}
          accent="amber"
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, CPF/CNPJ ou imóvel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <NativeSelect
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className="md:w-[170px]"
        >
          <option value="">Todos os tipos</option>
          <option value="VENDA">Venda</option>
          <option value="ALUGUEL">Aluguel</option>
          <option value="ADMINISTRACAO">Administração</option>
        </NativeSelect>
        <NativeSelect
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="md:w-[170px]"
        >
          <option value="">Todos os status</option>
          <option value="ATIVO">Ativo</option>
          <option value="PENDENTE">Pendente</option>
          <option value="ENCERRADO">Encerrado</option>
          <option value="CANCELADO">Cancelado</option>
        </NativeSelect>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={
            contratos.length === 0
              ? 'Nenhum contrato cadastrado ainda'
              : 'Nenhum contrato encontrado para esse filtro'
          }
          description={
            contratos.length === 0
              ? 'Cadastre clientes e contratos pra acompanhar suas comissões e recebimentos.'
              : undefined
          }
          action={
            contratos.length === 0
              ? {
                  label: 'Cadastrar primeiro contrato',
                  icon: Plus,
                  onClick: abrirNovo,
                }
              : undefined
          }
        />
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-muted-foreground text-[11px] uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 font-medium">Imóvel</th>
                <th className="text-left px-4 py-3 font-medium">Tipo</th>
                <th className="text-right px-4 py-3 font-medium">Valor</th>
                <th className="text-right px-4 py-3 font-medium">Comissão</th>
                <th className="text-left px-4 py-3 font-medium">Vigência</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{c.cliente}</p>
                    {c.clienteCpfCnpj && (
                      <p className="text-xs text-muted-foreground font-mono">
                        {c.clienteCpfCnpj}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {c.imovelCodigo ?? <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs font-normal">
                      {TIPO_LABELS[c.tipo as TipoContrato] ?? c.tipo}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-primary tabular-nums">
                    {formatBRL(c.valor)}
                    {c.tipo === 'ALUGUEL' && (
                      <span className="text-[10px] text-muted-foreground font-normal">
                        {' '}
                        /mês
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {c.comissaoPct}%{' '}
                    <span className="text-xs text-muted-foreground">
                      ({formatBRL((c.valor * c.comissaoPct) / 100)})
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="h-3 w-3" />
                      <span>
                        {formatDate(c.dataInicio)}
                        {c.dataFim ? ` → ${formatDate(c.dataFim)}` : ''}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border',
                        STATUS_STYLES[c.status as StatusContrato] ?? '',
                      )}
                    >
                      {STATUS_LABELS[c.status as StatusContrato] ?? c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => abrirEdit(c)}
                        className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-muted transition-colors"
                        title="Editar"
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-muted-foreground hover:text-destructive p-1.5 rounded hover:bg-destructive/10 transition-colors"
                        title="Excluir"
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Aviso sobre próximas features (PDF upload + Asaas) */}
      <div className="text-xs text-muted-foreground bg-muted/40 border border-border rounded-md px-3 py-2">
        ℹ️ Contratos persistem no banco. Próxima entrega: upload real do
        PDF (Supabase Storage) + integração Asaas para cobrança automática.
      </div>

      {/* Modal cadastro / edição */}
      {showForm && (
        <ContratoFormModal
          editing={editing}
          imoveis={imoveis}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

/* ---------- KPI Card ---------- */

// KpiCard agora vem de @/components/ui/kpi-card

/* ---------- Modal de form (criar / editar) ---------- */

function ContratoFormModal({
  editing,
  imoveis,
  onCancel,
  onSave,
}: {
  editing: Contrato | null;
  imoveis: ImovelLite[];
  onCancel: () => void;
  onSave: (payload: any) => Promise<void>;
}) {
  const [cliente, setCliente] = useState(editing?.cliente ?? '');
  const [clienteCpfCnpj, setClienteCpfCnpj] = useState(editing?.clienteCpfCnpj ?? '');
  const [clienteContato, setClienteContato] = useState(editing?.clienteContato ?? '');
  const [imovelId, setImovelId] = useState(editing?.imovelId ?? '');
  const [tipo, setTipo] = useState<TipoContrato>(
    (editing?.tipo as TipoContrato) ?? 'VENDA',
  );
  const [status, setStatus] = useState<StatusContrato>(
    (editing?.status as StatusContrato) ?? 'ATIVO',
  );
  const [valor, setValor] = useState(editing ? String(editing.valor) : '');
  const [comissaoPct, setComissaoPct] = useState(
    editing ? String(editing.comissaoPct) : '5',
  );
  const [dataInicio, setDataInicio] = useState(
    editing?.dataInicio ?? new Date().toISOString().slice(0, 10),
  );
  const [dataFim, setDataFim] = useState(editing?.dataFim ?? '');
  const [pdfUrl, setPdfUrl] = useState(editing?.pdfUrl ?? '');
  const [pdfNome, setPdfNome] = useState(editing?.pdfNome ?? '');
  const [observacoes, setObservacoes] = useState(editing?.observacoes ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cliente.trim() || !valor) return;
    if (saving) return;
    setSaving(true);
    try {
      await onSave({
        cliente: cliente.trim(),
        clienteCpfCnpj: clienteCpfCnpj?.trim() || null,
        clienteContato: clienteContato?.trim() || null,
        imovelId: imovelId || null,
        tipo,
        status,
        valor: Number(String(valor).replace(/[^\d,.-]/g, '').replace(',', '.')) || 0,
        comissaoPct: Number(comissaoPct) || 0,
        dataInicio,
        dataFim: dataFim || null,
        pdfUrl: pdfUrl?.trim() || null,
        pdfNome: pdfNome?.trim() || null,
        observacoes: observacoes?.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 overflow-y-auto py-8"
      onClick={onCancel}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-card border rounded-lg shadow-xl max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="font-display text-xl font-semibold text-foreground">
              {editing ? 'Editar contrato' : 'Novo contrato'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cliente, imóvel, valores e link do PDF
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground p-1"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Cliente */}
          <FormGroup title="Cliente">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Nome do cliente *" required>
                <Input
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="Ex: João Silva"
                  required
                  autoFocus
                />
              </Field>
              <Field label="CPF / CNPJ">
                <Input
                  value={clienteCpfCnpj ?? ''}
                  onChange={(e) => setClienteCpfCnpj(e.target.value)}
                  placeholder="000.000.000-00"
                />
              </Field>
              <Field label="Contato (WhatsApp / e-mail)">
                <Input
                  value={clienteContato ?? ''}
                  onChange={(e) => setClienteContato(e.target.value)}
                  placeholder="11 99999-9999 ou email@..."
                />
              </Field>
              <Field label="Imóvel relacionado">
                <NativeSelect
                  value={imovelId ?? ''}
                  onChange={(e) => setImovelId(e.target.value)}
                >
                  <option value="">— Nenhum —</option>
                  {imoveis.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.codigo} · {i.titulo}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
          </FormGroup>

          {/* Tipo + valor */}
          <FormGroup title="Contrato">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Tipo">
                <NativeSelect
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoContrato)}
                >
                  <option value="VENDA">Venda</option>
                  <option value="ALUGUEL">Aluguel</option>
                  <option value="ADMINISTRACAO">Administração</option>
                </NativeSelect>
              </Field>
              <Field label="Status">
                <NativeSelect
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusContrato)}
                >
                  <option value="ATIVO">Ativo</option>
                  <option value="PENDENTE">Pendente</option>
                  <option value="ENCERRADO">Encerrado</option>
                  <option value="CANCELADO">Cancelado</option>
                </NativeSelect>
              </Field>
              <Field
                label={
                  tipo === 'ALUGUEL' ? 'Valor mensal (R$) *' : 'Valor total (R$) *'
                }
                required
              >
                <Input
                  type="text"
                  inputMode="decimal"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="500000"
                  required
                />
              </Field>
              <Field label="Comissão (%)">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={comissaoPct}
                  onChange={(e) => setComissaoPct(e.target.value)}
                />
              </Field>
              <Field label="Data de início">
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </Field>
              <Field
                label={
                  tipo === 'ALUGUEL' ? 'Fim da vigência' : 'Data limite (opcional)'
                }
              >
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </Field>
            </div>
          </FormGroup>

          {/* PDF — por enquanto só URL externa, upload real chega na próxima */}
          <FormGroup title="Documento (opcional)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field
                label="Link do contrato (PDF)"
                hint="Cole a URL pública. Upload direto chega em breve."
              >
                <Input
                  value={pdfUrl ?? ''}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  placeholder="https://..."
                />
              </Field>
              <Field label="Nome do arquivo (display)">
                <Input
                  value={pdfNome ?? ''}
                  onChange={(e) => setPdfNome(e.target.value)}
                  placeholder="contrato-joao-silva.pdf"
                />
              </Field>
            </div>
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <Upload className="h-3 w-3" />
                Abrir documento em nova aba
              </a>
            )}
          </FormGroup>

          {/* Obs */}
          <FormGroup title="Observações">
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              placeholder="Cláusulas especiais, comissão dividida com captador, etc."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </FormGroup>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/20">
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
              'Atualizar contrato'
            ) : (
              'Salvar contrato'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function FormGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
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
      {hint && (
        <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>
      )}
    </label>
  );
}
