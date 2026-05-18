'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusContrato = 'ATIVO' | 'PENDENTE' | 'ENCERRADO' | 'CANCELADO';
type TipoContrato = 'VENDA' | 'ALUGUEL' | 'ADMINISTRACAO';

type Contrato = {
  id: string;
  cliente: string;
  clienteCpfCnpj?: string;
  clienteContato?: string;
  imovelCodigo?: string;
  tipo: TipoContrato;
  status: StatusContrato;
  valor: number;
  comissaoPct: number;
  dataInicio: string; // YYYY-MM-DD
  dataFim?: string;
  pdfNome?: string;
  observacoes?: string;
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

export default function FinanceiroClient() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Métricas (cálculo simples por enquanto)
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
      const hay = `${c.cliente} ${c.clienteCpfCnpj ?? ''} ${c.imovelCodigo ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filterTipo && c.tipo !== filterTipo) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    return true;
  });

  function handleCreate(c: Contrato) {
    setContratos((prev) => [c, ...prev]);
    setShowForm(false);
  }

  function handleDelete(id: string) {
    if (!confirm('Excluir este contrato?')) return;
    setContratos((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Financeiro
          </h1>
          <p className="text-sm text-muted-foreground">
            Contratos, comissões e recebimentos da sua imobiliária
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo contrato
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Contratos ativos"
          value={String(totalAtivos)}
          Icon={FileText}
          accent="primary"
        />
        <KpiCard
          label="Valor em contratos"
          value={formatBRL(valorTotal)}
          Icon={TrendingUp}
          accent="green"
        />
        <KpiCard
          label="Comissão estimada"
          value={formatBRL(comissaoEstimada)}
          Icon={Receipt}
          accent="violet"
        />
        <KpiCard
          label="Pendentes"
          value={String(pendentes)}
          Icon={AlertCircle}
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
        <div className="text-center py-16 bg-card border border-border rounded-lg">
          <Wallet className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground mb-1">
            {contratos.length === 0
              ? 'Nenhum contrato cadastrado ainda.'
              : 'Nenhum contrato encontrado para esse filtro.'}
          </p>
          {contratos.length === 0 && (
            <>
              <p className="text-xs text-muted-foreground/70 mb-4">
                Cadastre clientes e contratos pra acompanhar suas comissões e
                recebimentos.
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar primeiro contrato
              </Button>
            </>
          )}
        </div>
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
                      {TIPO_LABELS[c.tipo]}
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
                        STATUS_STYLES[c.status],
                      )}
                    >
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-muted-foreground hover:text-destructive p-1.5 rounded hover:bg-destructive/10 transition-colors"
                      title="Excluir"
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Aviso temporário */}
      <div className="text-xs text-muted-foreground bg-muted/40 border border-border rounded-md px-3 py-2">
        ⚠️ Versão de pré-visualização — contratos cadastrados aqui ainda não
        ficam salvos no banco. Próxima entrega: persistência + upload real do
        PDF + Asaas para cobrança automática.
      </div>

      {/* Modal cadastro */}
      {showForm && (
        <NovoContratoModal
          onCancel={() => setShowForm(false)}
          onSave={handleCreate}
        />
      )}
    </div>
  );
}

/* ---------- KPI Card ---------- */

function KpiCard({
  label,
  value,
  Icon,
  accent,
}: {
  label: string;
  value: string;
  Icon: typeof FileText;
  accent: 'primary' | 'green' | 'violet' | 'amber';
}) {
  const colors: Record<typeof accent, string> = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  };
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className={cn('h-7 w-7 rounded-md grid place-items-center', colors[accent])}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

/* ---------- Modal de novo contrato ---------- */

function NovoContratoModal({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (c: Contrato) => void;
}) {
  const [cliente, setCliente] = useState('');
  const [clienteCpfCnpj, setClienteCpfCnpj] = useState('');
  const [clienteContato, setClienteContato] = useState('');
  const [imovelCodigo, setImovelCodigo] = useState('');
  const [tipo, setTipo] = useState<TipoContrato>('VENDA');
  const [status, setStatus] = useState<StatusContrato>('ATIVO');
  const [valor, setValor] = useState('');
  const [comissaoPct, setComissaoPct] = useState('5');
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [dataFim, setDataFim] = useState('');
  const [pdfNome, setPdfNome] = useState<string | undefined>();
  const [observacoes, setObservacoes] = useState('');

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setPdfNome(f.name);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cliente.trim() || !valor) return;
    onSave({
      id: crypto.randomUUID(),
      cliente: cliente.trim(),
      clienteCpfCnpj: clienteCpfCnpj.trim() || undefined,
      clienteContato: clienteContato.trim() || undefined,
      imovelCodigo: imovelCodigo.trim() || undefined,
      tipo,
      status,
      valor: Number(valor.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0,
      comissaoPct: Number(comissaoPct) || 0,
      dataInicio,
      dataFim: dataFim || undefined,
      pdfNome,
      observacoes: observacoes.trim() || undefined,
    });
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
              Novo contrato
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cadastre cliente, imóvel, valores e suba o PDF do contrato
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
          <Section title="Cliente">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Nome do cliente *" required>
                <Input
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="Ex: João Silva"
                  required
                />
              </Field>
              <Field label="CPF / CNPJ">
                <Input
                  value={clienteCpfCnpj}
                  onChange={(e) => setClienteCpfCnpj(e.target.value)}
                  placeholder="000.000.000-00"
                />
              </Field>
              <Field label="Contato (WhatsApp / e-mail)">
                <Input
                  value={clienteContato}
                  onChange={(e) => setClienteContato(e.target.value)}
                  placeholder="11 99999-9999 ou email@..."
                />
              </Field>
              <Field label="Código do imóvel">
                <Input
                  value={imovelCodigo}
                  onChange={(e) => setImovelCodigo(e.target.value)}
                  placeholder="IMV-1234"
                  className="font-mono"
                />
              </Field>
            </div>
          </Section>

          {/* Tipo + valor */}
          <Section title="Contrato">
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
          </Section>

          {/* PDF */}
          <Section title="Documento">
            <label
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-md border-2 border-dashed cursor-pointer transition-colors',
                pdfNome
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-input hover:border-primary/40 hover:bg-muted/40',
              )}
            >
              <Upload
                className={cn(
                  'h-5 w-5 shrink-0',
                  pdfNome ? 'text-primary' : 'text-muted-foreground',
                )}
              />
              <div className="flex-1 min-w-0">
                {pdfNome ? (
                  <p className="text-sm font-medium truncate">{pdfNome}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Clique para enviar o PDF do contrato
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground/70">
                  PDF, DOCX ou imagem · até 10 MB
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,image/*"
                onChange={handleFile}
              />
            </label>
          </Section>

          {/* Obs */}
          <Section title="Observações">
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              placeholder="Cláusulas especiais, comissão dividida com captador, etc."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </Section>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/20">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">Salvar contrato</Button>
        </div>
      </form>
    </div>
  );
}

function Section({
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
