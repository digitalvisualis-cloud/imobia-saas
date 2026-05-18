'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  FileText,
  Search,
  Receipt,
  TrendingUp,
  AlertTriangle,
  Calendar as CalendarIcon,
  Upload,
  X,
  Trash2,
  Pencil,
  Loader2,
  ExternalLink,
  MessageCircle,
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

type StatusContrato = 'ATIVO' | 'PENDENTE' | 'ENCERRADO' | 'CANCELADO';
type TipoContrato = 'VENDA' | 'ALUGUEL' | 'ADMINISTRACAO' | 'CAPTACAO';

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
  dataInicio: string;
  dataFim?: string | null;
  pdfUrl?: string | null;
  pdfNome?: string | null;
  observacoes?: string | null;
};

type ImovelLite = { id: string; codigo: string; titulo: string };

type FilterTab = 'todos' | 'ativos' | 'venc_proximo' | 'vencidos' | 'encerrados';

const TIPO_LABELS: Record<TipoContrato, string> = {
  VENDA: 'Venda',
  ALUGUEL: 'Aluguel',
  ADMINISTRACAO: 'Administração',
  CAPTACAO: 'Captação',
};

const TIPO_COR: Record<TipoContrato, string> = {
  VENDA: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  ALUGUEL: 'bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30',
  ADMINISTRACAO: 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-500/30',
  CAPTACAO: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
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
function diasAteVencimento(dataFim: string | null | undefined): number | null {
  if (!dataFim) return null;
  const [y, m, d] = dataFim.split('-').map(Number);
  const fim = new Date(y, m - 1, d);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

export default function ContratosClient({
  contratosIniciais,
  imoveis,
}: {
  contratosIniciais: Contrato[];
  imoveis: ImovelLite[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contrato | null>(null);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('todos');

  const contratos = contratosIniciais;

  // Classificacao por vencimento
  const vencendoProximo = useMemo(
    () =>
      contratos.filter((c) => {
        if (c.status !== 'ATIVO') return false;
        const d = diasAteVencimento(c.dataFim ?? null);
        return d !== null && d >= 0 && d <= 30;
      }),
    [contratos],
  );
  const vencidos = useMemo(
    () =>
      contratos.filter((c) => {
        if (c.status !== 'ATIVO') return false;
        const d = diasAteVencimento(c.dataFim ?? null);
        return d !== null && d < 0;
      }),
    [contratos],
  );

  // KPIs
  const totalAtivos = contratos.filter((c) => c.status === 'ATIVO').length;
  const valorMensalAluguel = contratos
    .filter((c) => c.status === 'ATIVO' && (c.tipo === 'ALUGUEL' || c.tipo === 'ADMINISTRACAO'))
    .reduce((acc, c) => acc + c.valor, 0);
  const comissaoEstimada = contratos
    .filter((c) => c.status === 'ATIVO')
    .reduce((acc, c) => acc + (c.valor * c.comissaoPct) / 100, 0);

  const counts = {
    todos: contratos.length,
    ativos: contratos.filter((c) => c.status === 'ATIVO').length,
    venc_proximo: vencendoProximo.length,
    vencidos: vencidos.length,
    encerrados: contratos.filter((c) => c.status === 'ENCERRADO' || c.status === 'CANCELADO').length,
  };

  const filtered = useMemo(() => {
    let arr = contratos;
    if (filterTab === 'ativos') arr = arr.filter((c) => c.status === 'ATIVO');
    else if (filterTab === 'venc_proximo') arr = vencendoProximo;
    else if (filterTab === 'vencidos') arr = vencidos;
    else if (filterTab === 'encerrados')
      arr = arr.filter((c) => c.status === 'ENCERRADO' || c.status === 'CANCELADO');

    if (filterTipo) arr = arr.filter((c) => c.tipo === filterTipo);

    const q = search.trim().toLowerCase();
    if (q) {
      arr = arr.filter((c) =>
        `${c.cliente} ${c.clienteCpfCnpj ?? ''} ${c.imovelCodigo ?? ''} ${c.imovelTitulo ?? ''}`
          .toLowerCase()
          .includes(q),
      );
    }
    return arr;
  }, [contratos, filterTab, filterTipo, search, vencendoProximo, vencidos]);

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
      toast.error('Erro ao salvar contrato', { description: (e as Error).message });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este contrato? Essa acao nao pode ser desfeita.')) return;
    try {
      const r = await fetch(`/api/contratos/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Erro ao apagar');
      toast.success('Contrato excluído');
      router.refresh();
    } catch (e) {
      toast.error('Erro ao excluir', { description: (e as Error).message });
    }
  }

  async function handleRenovar(c: Contrato) {
    if (!c.dataFim) {
      toast.info('Esse contrato nao tem data de fim — abre o editor pra ajustar');
      setEditing(c);
      setShowForm(true);
      return;
    }
    // Renova por mais 12 meses a partir da dataFim atual
    const [y, m, d] = c.dataFim.split('-').map(Number);
    const novaDataFim = new Date(y, m - 1, d);
    novaDataFim.setFullYear(novaDataFim.getFullYear() + 1);
    const novaIso = novaDataFim.toISOString().slice(0, 10);
    if (!confirm(`Renovar contrato de ${c.cliente} ate ${formatDate(novaIso)}?`)) return;
    try {
      const r = await fetch(`/api/contratos/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataFim: novaIso, eventoVencimentoEmitido: false }),
      });
      if (!r.ok) throw new Error('Erro ao renovar');
      toast.success('Contrato renovado por +12 meses');
      router.refresh();
    } catch (e) {
      toast.error('Erro ao renovar', { description: (e as Error).message });
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

  function whatsappLink(contato: string | null | undefined): string | null {
    if (!contato) return null;
    const digits = contato.replace(/\D/g, '');
    if (digits.length < 10) return null;
    const prefix = digits.startsWith('55') ? '' : '55';
    return `https://wa.me/${prefix}${digits}`;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Negócios"
        icon={FileText}
        title="Contratos"
        description="Locação, venda, captação e administração — com alertas de vencimento"
        actions={
          <Button onClick={abrirNovo}>
            <Plus className="h-4 w-4 mr-2" />
            Novo contrato
          </Button>
        }
      />

      {/* Banner de alerta de vencimento */}
      {(vencidos.length > 0 || vencendoProximo.length > 0) && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="text-sm flex-1">
            <p className="font-medium text-amber-900 dark:text-amber-200">
              {vencidos.length > 0 && `${vencidos.length} contrato(s) já vencido(s)`}
              {vencidos.length > 0 && vencendoProximo.length > 0 && ' • '}
              {vencendoProximo.length > 0 &&
                `${vencendoProximo.length} vence(m) nos próximos 30 dias`}
            </p>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
              Acione renovação ou marque como encerrado. Em breve: lembrete automático por
              WhatsApp/e-mail via n8n.
            </p>
          </div>
          <div className="flex gap-2">
            {vencidos.length > 0 && (
              <button
                onClick={() => setFilterTab('vencidos')}
                className="text-xs font-medium text-amber-900 dark:text-amber-200 hover:underline"
              >
                Ver vencidos
              </button>
            )}
            {vencendoProximo.length > 0 && (
              <button
                onClick={() => setFilterTab('venc_proximo')}
                className="text-xs font-medium text-amber-900 dark:text-amber-200 hover:underline"
              >
                Ver próximos
              </button>
            )}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Contratos ativos" value={String(totalAtivos)} icon={FileText} accent="primary" />
        <KpiCard
          label="Aluguel + Admin /mês"
          value={formatBRL(valorMensalAluguel)}
          icon={TrendingUp}
          accent="green"
        />
        <KpiCard label="Comissão estimada" value={formatBRL(comissaoEstimada)} icon={Receipt} accent="violet" />
        <KpiCard
          label="Vencendo (30d)"
          value={String(vencendoProximo.length)}
          icon={AlertTriangle}
          accent="amber"
        />
      </div>

      {/* Tabs de filtro */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['todos', 'Todos'],
            ['ativos', 'Ativos'],
            ['venc_proximo', 'Vencendo em 30d'],
            ['vencidos', 'Vencidos'],
            ['encerrados', 'Encerrados'],
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

      {/* Busca + tipo */}
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
          className="md:w-[180px]"
        >
          <option value="">Todos os tipos</option>
          <option value="VENDA">Venda</option>
          <option value="ALUGUEL">Aluguel</option>
          <option value="ADMINISTRACAO">Administração</option>
          <option value="CAPTACAO">Captação</option>
        </NativeSelect>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={
            contratos.length === 0
              ? 'Nenhum contrato cadastrado'
              : 'Nenhum contrato nesse filtro'
          }
          description={
            contratos.length === 0
              ? 'Cadastre seu primeiro contrato — locação, venda, captação ou administração.'
              : undefined
          }
          action={
            contratos.length === 0
              ? { label: 'Criar primeiro contrato', icon: Plus, onClick: abrirNovo }
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
                <th className="text-left px-4 py-3 font-medium">Vencimento</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => {
                const dias = diasAteVencimento(c.dataFim ?? null);
                const vencidoFlag = c.status === 'ATIVO' && dias !== null && dias < 0;
                const venceProx = c.status === 'ATIVO' && dias !== null && dias >= 0 && dias <= 30;
                const wpp = whatsappLink(c.clienteContato);
                return (
                  <tr
                    key={c.id}
                    className={cn(
                      'hover:bg-muted/40',
                      vencidoFlag && 'bg-red-500/5',
                      !vencidoFlag && venceProx && 'bg-amber-500/5',
                    )}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{c.cliente}</p>
                      {c.clienteCpfCnpj && (
                        <p className="text-xs text-muted-foreground font-mono">{c.clienteCpfCnpj}</p>
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
                    <td className="px-4 py-3 font-mono text-xs">
                      {c.imovelCodigo ? (
                        <span>
                          {c.imovelCodigo}
                          {c.imovelTitulo && (
                            <span className="block text-[11px] text-muted-foreground font-sans truncate max-w-[180px]">
                              {c.imovelTitulo}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn('text-xs font-normal border', TIPO_COR[c.tipo as TipoContrato])}
                      >
                        {TIPO_LABELS[c.tipo as TipoContrato] ?? c.tipo}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-primary tabular-nums">
                      {formatBRL(c.valor)}
                      {(c.tipo === 'ALUGUEL' || c.tipo === 'ADMINISTRACAO') && (
                        <span className="text-[10px] text-muted-foreground font-normal"> /mês</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {c.comissaoPct}%{' '}
                      <span className="text-xs text-muted-foreground block">
                        {formatBRL((c.valor * c.comissaoPct) / 100)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {c.dataFim ? (
                        <div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <CalendarIcon className="h-3 w-3" />
                            <span>{formatDate(c.dataFim)}</span>
                          </div>
                          {dias !== null && c.status === 'ATIVO' && (
                            <span
                              className={cn(
                                'text-[11px] font-medium',
                                vencidoFlag && 'text-red-600 dark:text-red-400',
                                venceProx && !vencidoFlag && 'text-amber-700 dark:text-amber-400',
                                !venceProx && !vencidoFlag && 'text-muted-foreground',
                              )}
                            >
                              {vencidoFlag
                                ? `Vencido há ${Math.abs(dias)}d`
                                : venceProx
                                  ? `Vence em ${dias}d`
                                  : `Em ${dias}d`}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Sem fim</span>
                      )}
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
                        {(c.tipo === 'ALUGUEL' || c.tipo === 'ADMINISTRACAO') &&
                          c.status === 'ATIVO' &&
                          (vencidoFlag || venceProx) && (
                            <button
                              onClick={() => handleRenovar(c)}
                              className="text-xs font-medium text-primary hover:underline px-2"
                              title="Renovar por +12 meses"
                            >
                              Renovar
                            </button>
                          )}
                        {c.pdfUrl && (
                          <a
                            href={c.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-muted"
                            title="Abrir PDF"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => abrirEdit(c)}
                          className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-muted"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
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
        ℹ️ Em breve (upsell): cron n8n dispara lembrete de vencimento por WhatsApp + e-mail 30 / 15 / 5
        dias antes, com link de renovação direto.
      </div>

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

/* ---------- Modal form ---------- */

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
  const [tipo, setTipo] = useState<TipoContrato>((editing?.tipo as TipoContrato) ?? 'ALUGUEL');
  const [status, setStatus] = useState<StatusContrato>((editing?.status as StatusContrato) ?? 'ATIVO');
  const [valor, setValor] = useState(editing ? String(editing.valor) : '');
  const [comissaoPct, setComissaoPct] = useState(editing ? String(editing.comissaoPct) : '8');
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

  const labelValor =
    tipo === 'ALUGUEL' || tipo === 'ADMINISTRACAO'
      ? 'Valor mensal (R$) *'
      : tipo === 'CAPTACAO'
        ? 'Valor de venda esperado (R$) *'
        : 'Valor total (R$) *';
  const labelDataFim =
    tipo === 'CAPTACAO' ? 'Validade da captação (opcional)' : 'Fim da vigência';

  return (
    <Modal
      open
      onClose={onCancel}
      title={editing ? 'Editar contrato' : 'Novo contrato'}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5">
        {/* Cliente */}
        <FormGroup title="Cliente / parte">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Nome *" required>
              <Input
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Ex: João Silva (locatário) ou Maria (proprietária)"
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
                placeholder="11 99999-9999"
              />
            </Field>
            <Field label="Imóvel">
              <NativeSelect value={imovelId ?? ''} onChange={(e) => setImovelId(e.target.value)}>
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
        <FormGroup title="Tipo e valores">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Tipo *" required>
              <NativeSelect value={tipo} onChange={(e) => setTipo(e.target.value as TipoContrato)}>
                <option value="ALUGUEL">Aluguel (locação)</option>
                <option value="VENDA">Venda</option>
                <option value="ADMINISTRACAO">Administração</option>
                <option value="CAPTACAO">Captação</option>
              </NativeSelect>
            </Field>
            <Field label="Status">
              <NativeSelect value={status} onChange={(e) => setStatus(e.target.value as StatusContrato)}>
                <option value="ATIVO">Ativo</option>
                <option value="PENDENTE">Pendente</option>
                <option value="ENCERRADO">Encerrado</option>
                <option value="CANCELADO">Cancelado</option>
              </NativeSelect>
            </Field>
            <Field label={labelValor} required>
              <Input
                type="text"
                inputMode="decimal"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="2500"
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
            <Field label={labelDataFim}>
              <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </Field>
          </div>
        </FormGroup>

        {/* PDF */}
        <FormGroup title="Documento (opcional)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Link do contrato (PDF)" hint="Cole a URL pública. Upload direto chega em breve.">
              <Input value={pdfUrl ?? ''} onChange={(e) => setPdfUrl(e.target.value)} placeholder="https://..." />
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

        <FormGroup title="Observações">
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            placeholder="Cláusulas, condições, garantias, observações livres..."
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
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
              'Atualizar contrato'
            ) : (
              'Salvar contrato'
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
