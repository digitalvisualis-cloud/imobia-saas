'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  AlertCircle,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Pencil,
  Loader2,
  MessageCircle,
  Phone,
  Send,
  History,
  XCircle,
  TrendingDown,
  Calendar as CalendarIcon,
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

type StatusCobranca = 'ABERTO' | 'PAGO' | 'NEGOCIADO' | 'CANCELADO';

type HistoricoItem = {
  data: string;
  canal: string;
  status: string;
  conteudo: string | null;
};

type ContratoLite = {
  id: string;
  cliente: string;
  clienteContato: string | null;
  clienteCpfCnpj: string | null;
  valor: number;
  tipo: string;
  imovelCodigo: string | null;
  imovelTitulo: string | null;
};

type Cobranca = {
  id: string;
  contratoId: string | null;
  repasseId: string | null;
  contratoCliente: string | null;
  devedorNome: string;
  devedorContato: string | null;
  devedorCpfCnpj: string | null;
  descricao: string;
  valorOriginal: number;
  multaPct: number | null;
  jurosDiariosPct: number | null;
  vencimento: string;
  status: string;
  pagoEm: string | null;
  valorPago: number | null;
  formaPagamento: string | null;
  historicoCobranca: HistoricoItem[];
  observacao: string | null;
  ultimaCobrancaEm: string | null;
  valorAtualizado: number;
  diasAtraso: number;
};

type FilterTab = 'todas' | 'no_prazo' | 'atrasadas' | 'pagas' | 'negociadas';

const STATUS_STYLE: Record<StatusCobranca, string> = {
  ABERTO: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  PAGO: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  NEGOCIADO: 'bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30',
  CANCELADO: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
};

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}
function whatsappLink(contato: string | null | undefined): string | null {
  if (!contato) return null;
  const digits = contato.replace(/\D/g, '');
  if (digits.length < 10) return null;
  const prefix = digits.startsWith('55') ? '' : '55';
  return `https://wa.me/${prefix}${digits}`;
}

function mensagemCobrancaPadrao(c: Cobranca) {
  const valorTxt = formatBRL(c.valorAtualizado);
  const venc = formatDate(c.vencimento);
  if (c.diasAtraso > 0) {
    return (
      `Olá ${c.devedorNome},%0A%0A` +
      `Identifiquei que ${c.descricao} venceu em ${venc} e está com ${c.diasAtraso} dia(s) de atraso.%0A%0A` +
      `Valor atualizado: *${valorTxt}*%0A%0A` +
      `Consegue regularizar hoje? Qualquer dificuldade me avisa pra alinharmos.`
    );
  }
  return (
    `Olá ${c.devedorNome},%0A%0A` +
    `Lembrete: ${c.descricao} vence em ${venc}.%0A%0A` +
    `Valor: *${valorTxt}*%0A%0A` +
    `Qualquer dúvida estou à disposição.`
  );
}

export default function InadimplenciaClient({
  initialCobrancas,
  contratos,
}: {
  initialCobrancas: Cobranca[];
  contratos: ContratoLite[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Cobranca | null>(null);
  const [historicoFor, setHistoricoFor] = useState<Cobranca | null>(null);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('todas');

  const cobrancas = initialCobrancas;

  const atrasadas = cobrancas.filter((c) => c.status === 'ABERTO' && c.diasAtraso > 0);
  const totalAtrasado = atrasadas.reduce((acc, c) => acc + c.valorAtualizado, 0);
  const totalAReceberAberto = cobrancas
    .filter((c) => c.status === 'ABERTO')
    .reduce((acc, c) => acc + c.valorAtualizado, 0);
  const totalRecebidoMes = useMemo(() => {
    const hoje = new Date();
    const mes = hoje.getMonth();
    const ano = hoje.getFullYear();
    return cobrancas
      .filter((c) => {
        if (c.status !== 'PAGO' || !c.pagoEm) return false;
        const d = new Date(c.pagoEm);
        return d.getMonth() === mes && d.getFullYear() === ano;
      })
      .reduce((acc, c) => acc + (c.valorPago ?? 0), 0);
  }, [cobrancas]);

  const counts = {
    todas: cobrancas.length,
    no_prazo: cobrancas.filter((c) => c.status === 'ABERTO' && c.diasAtraso === 0).length,
    atrasadas: atrasadas.length,
    pagas: cobrancas.filter((c) => c.status === 'PAGO').length,
    negociadas: cobrancas.filter((c) => c.status === 'NEGOCIADO').length,
  };

  const filtered = useMemo(() => {
    let arr = cobrancas;
    if (filterTab === 'no_prazo')
      arr = arr.filter((c) => c.status === 'ABERTO' && c.diasAtraso === 0);
    else if (filterTab === 'atrasadas')
      arr = arr.filter((c) => c.status === 'ABERTO' && c.diasAtraso > 0);
    else if (filterTab === 'pagas') arr = arr.filter((c) => c.status === 'PAGO');
    else if (filterTab === 'negociadas') arr = arr.filter((c) => c.status === 'NEGOCIADO');
    const q = search.trim().toLowerCase();
    if (q) {
      arr = arr.filter((c) =>
        `${c.devedorNome} ${c.descricao} ${c.devedorCpfCnpj ?? ''}`.toLowerCase().includes(q),
      );
    }
    return arr;
  }, [cobrancas, filterTab, search]);

  async function handleSave(payload: any) {
    const isEdit = !!editing;
    const url = isEdit ? `/api/cobrancas?id=${editing!.id}` : '/api/cobrancas';
    const method = isEdit ? 'PATCH' : 'POST';
    try {
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'Erro ao salvar');
      toast.success(isEdit ? 'Cobrança atualizada' : 'Cobrança criada');
      setShowForm(false);
      setEditing(null);
      router.refresh();
    } catch (e) {
      toast.error('Erro', { description: (e as Error).message });
    }
  }

  async function handleMarcarPago(c: Cobranca) {
    const valorSugerido = c.valorAtualizado;
    const informado = prompt(
      `Confirma pagamento de ${c.devedorNome}?\nValor atualizado: ${formatBRL(valorSugerido)}\nDigite o valor recebido:`,
      String(valorSugerido.toFixed(2)),
    );
    if (informado == null) return;
    const valorPago =
      Number(String(informado).replace(/[^\d,.-]/g, '').replace(',', '.')) || valorSugerido;
    try {
      const r = await fetch(`/api/cobrancas?id=${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAGO', valorPago }),
      });
      if (!r.ok) throw new Error('Falhou');
      toast.success('Marcado como pago');
      router.refresh();
    } catch (e) {
      toast.error('Erro', { description: (e as Error).message });
    }
  }

  async function handleRegistrarCobranca(c: Cobranca, canal: 'whatsapp' | 'email' | 'telefone') {
    try {
      const r = await fetch(`/api/cobrancas?id=${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adicionarHistorico: {
            canal,
            status: 'enviado',
            conteudo: `Cobrança via ${canal}`,
          },
        }),
      });
      if (!r.ok) throw new Error('Falhou');
      toast.success(`Cobrança registrada (${canal})`);
      router.refresh();
    } catch (e) {
      toast.error('Erro', { description: (e as Error).message });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir essa cobrança?')) return;
    try {
      const r = await fetch(`/api/cobrancas?id=${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Falhou');
      toast.success('Excluída');
      router.refresh();
    } catch (e) {
      toast.error('Erro', { description: (e as Error).message });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Negócios"
        icon={AlertCircle}
        title="Inadimplência"
        description="Cobranças em aberto, atrasadas e histórico de tentativas"
        actions={
          <Button onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nova cobrança
          </Button>
        }
      />

      {atrasadas.length > 0 && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
          <div className="text-sm flex-1">
            <p className="font-medium text-red-900 dark:text-red-200">
              {atrasadas.length} cobrança(s) atrasada(s) — total atualizado:{' '}
              <strong>{formatBRL(totalAtrasado)}</strong>
            </p>
            <p className="text-xs text-red-800/80 dark:text-red-300/80 mt-0.5">
              Em breve: n8n dispara lembrete automático por WhatsApp 1, 3, 7 dias após o vencimento
              (escala progressiva).
            </p>
          </div>
          <button
            onClick={() => setFilterTab('atrasadas')}
            className="text-xs font-medium text-red-900 dark:text-red-200 hover:underline"
          >
            Ver atrasadas
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Total em aberto"
          value={formatBRL(totalAReceberAberto)}
          icon={Clock}
          accent="amber"
        />
        <KpiCard
          label="Atrasado (atualizado)"
          value={formatBRL(totalAtrasado)}
          icon={TrendingDown}
          accent="primary"
        />
        <KpiCard label="Cobranças atrasadas" value={String(atrasadas.length)} icon={AlertCircle} accent="violet" />
        <KpiCard label="Recebido este mês" value={formatBRL(totalRecebidoMes)} icon={CheckCircle2} accent="green" />
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['todas', 'Todas'],
            ['no_prazo', 'No prazo'],
            ['atrasadas', 'Atrasadas'],
            ['pagas', 'Pagas'],
            ['negociadas', 'Negociadas'],
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por devedor ou descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title={
            cobrancas.length === 0
              ? 'Nenhuma cobrança registrada'
              : 'Nenhuma cobrança nesse filtro'
          }
          description={
            cobrancas.length === 0
              ? 'Registre cobranças de aluguel atrasado, multas, IPTU rateado ou qualquer taxa avulsa em aberto.'
              : undefined
          }
          action={
            cobrancas.length === 0
              ? { label: 'Nova cobrança', icon: Plus, onClick: () => { setEditing(null); setShowForm(true); } }
              : undefined
          }
        />
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-muted-foreground text-[11px] uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Devedor / Descrição</th>
                <th className="text-left px-4 py-3 font-medium">Vencimento</th>
                <th className="text-right px-4 py-3 font-medium">Original</th>
                <th className="text-right px-4 py-3 font-medium">Atualizado</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => {
                const atrasada = c.status === 'ABERTO' && c.diasAtraso > 0;
                const wpp = whatsappLink(c.devedorContato);
                return (
                  <tr
                    key={c.id}
                    className={cn(
                      'hover:bg-muted/40',
                      atrasada && c.diasAtraso > 7 && 'bg-red-500/5',
                      atrasada && c.diasAtraso > 0 && c.diasAtraso <= 7 && 'bg-amber-500/5',
                    )}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{c.devedorNome}</p>
                      <p className="text-xs text-muted-foreground">{c.descricao}</p>
                      {c.contratoCliente && c.contratoCliente !== c.devedorNome && (
                        <p className="text-[10px] text-muted-foreground italic">
                          contrato: {c.contratoCliente}
                        </p>
                      )}
                      {c.historicoCobranca.length > 0 && (
                        <button
                          onClick={() => setHistoricoFor(c)}
                          className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                        >
                          <History className="h-3 w-3" />
                          {c.historicoCobranca.length} tentativa(s)
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <CalendarIcon className="h-3 w-3" />
                        <span>{formatDate(c.vencimento)}</span>
                      </div>
                      {c.status === 'ABERTO' && (
                        <span
                          className={cn(
                            'text-[11px] font-medium',
                            atrasada && c.diasAtraso > 7 && 'text-red-600 dark:text-red-400',
                            atrasada && c.diasAtraso <= 7 && 'text-amber-700 dark:text-amber-400',
                            !atrasada && 'text-muted-foreground',
                          )}
                        >
                          {atrasada ? `${c.diasAtraso}d atraso` : 'No prazo'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatBRL(c.valorOriginal)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-primary">
                      {formatBRL(c.status === 'PAGO' ? (c.valorPago ?? c.valorOriginal) : c.valorAtualizado)}
                      {atrasada && c.valorAtualizado > c.valorOriginal && (
                        <p className="text-[10px] text-muted-foreground font-normal">
                          +{formatBRL(c.valorAtualizado - c.valorOriginal)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border',
                          STATUS_STYLE[c.status as StatusCobranca] ?? '',
                        )}
                      >
                        {c.status === 'PAGO' && <CheckCircle2 className="h-3 w-3" />}
                        {c.status === 'ABERTO' && atrasada && <AlertCircle className="h-3 w-3" />}
                        {c.status === 'ABERTO' && !atrasada && <Clock className="h-3 w-3" />}
                        {c.status === 'CANCELADO' && <XCircle className="h-3 w-3" />}
                        {c.status === 'ABERTO' ? (atrasada ? 'Atrasado' : 'No prazo') : c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        {c.status === 'ABERTO' && (
                          <>
                            {wpp && (
                              <a
                                href={`${wpp}?text=${mensagemCobrancaPadrao(c)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => handleRegistrarCobranca(c, 'whatsapp')}
                                className="text-muted-foreground hover:text-green-700 dark:hover:text-green-400 p-1.5 rounded hover:bg-muted"
                                title="Cobrar via WhatsApp (registra histórico)"
                              >
                                <Send className="h-4 w-4" />
                              </a>
                            )}
                            {c.devedorContato && (
                              <a
                                href={`tel:${c.devedorContato.replace(/\D/g, '')}`}
                                onClick={() => handleRegistrarCobranca(c, 'telefone')}
                                className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-muted"
                                title="Ligar (registra histórico)"
                              >
                                <Phone className="h-4 w-4" />
                              </a>
                            )}
                            <button
                              onClick={() => handleMarcarPago(c)}
                              className="text-xs font-medium text-green-700 dark:text-green-400 hover:underline px-2"
                              title="Marcar como pago"
                            >
                              Pago
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => { setEditing(c); setShowForm(true); }}
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
        ℹ️ Em breve (upsell): n8n dispara régua automática de cobrança por WhatsApp + e-mail
        (D+1, D+3, D+7, D+15) com mensagem progressiva e link de pagamento.
      </div>

      {showForm && (
        <CobrancaFormModal
          editing={editing}
          contratos={contratos}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}

      {historicoFor && (
        <HistoricoModal cobranca={historicoFor} onClose={() => setHistoricoFor(null)} />
      )}
    </div>
  );
}

/* ---------- Modal de histórico ---------- */

function HistoricoModal({ cobranca, onClose }: { cobranca: Cobranca; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title={`Histórico — ${cobranca.devedorNome}`} maxWidth="max-w-lg">
      <div className="px-5 py-5 space-y-3">
        <p className="text-xs text-muted-foreground">{cobranca.descricao}</p>
        {cobranca.historicoCobranca.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Nenhuma tentativa registrada ainda.</p>
        ) : (
          <ul className="space-y-2">
            {cobranca.historicoCobranca
              .slice()
              .reverse()
              .map((h, idx) => (
                <li
                  key={idx}
                  className="rounded border border-border bg-muted/30 px-3 py-2 text-sm"
                >
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-[10px] font-normal">
                      {h.canal}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(h.data).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  {h.conteudo && <p className="mt-1 text-xs text-foreground">{h.conteudo}</p>}
                  <p className="mt-0.5 text-[11px] text-muted-foreground">status: {h.status}</p>
                </li>
              ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

/* ---------- Modal de form ---------- */

function CobrancaFormModal({
  editing,
  contratos,
  onCancel,
  onSave,
}: {
  editing: Cobranca | null;
  contratos: ContratoLite[];
  onCancel: () => void;
  onSave: (payload: any) => Promise<void>;
}) {
  const [contratoId, setContratoId] = useState(editing?.contratoId ?? '');
  const [devedorNome, setDevedorNome] = useState(editing?.devedorNome ?? '');
  const [devedorContato, setDevedorContato] = useState(editing?.devedorContato ?? '');
  const [devedorCpfCnpj, setDevedorCpfCnpj] = useState(editing?.devedorCpfCnpj ?? '');
  const [descricao, setDescricao] = useState(editing?.descricao ?? '');
  const [valorOriginal, setValorOriginal] = useState(
    editing ? String(editing.valorOriginal) : '',
  );
  const [multaPct, setMultaPct] = useState(
    editing?.multaPct != null ? String(editing.multaPct) : '2',
  );
  const [jurosDiariosPct, setJurosDiariosPct] = useState(
    editing?.jurosDiariosPct != null ? String(editing.jurosDiariosPct) : '0.033',
  );
  const [vencimento, setVencimento] = useState(
    editing?.vencimento ?? new Date().toISOString().slice(0, 10),
  );
  const [status, setStatus] = useState<StatusCobranca>(
    (editing?.status as StatusCobranca) ?? 'ABERTO',
  );
  const [observacao, setObservacao] = useState(editing?.observacao ?? '');
  const [saving, setSaving] = useState(false);

  function autoFillFromContrato(id: string) {
    const c = contratos.find((x) => x.id === id);
    if (!c) return;
    if (!devedorNome) setDevedorNome(c.cliente);
    if (!devedorContato && c.clienteContato) setDevedorContato(c.clienteContato);
    if (!devedorCpfCnpj && c.clienteCpfCnpj) setDevedorCpfCnpj(c.clienteCpfCnpj);
    if (!valorOriginal) setValorOriginal(String(c.valor));
    if (!descricao) {
      const d = new Date();
      const ms = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      setDescricao(`Aluguel ${ms}`);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!devedorNome.trim() || !descricao.trim() || !valorOriginal || !vencimento) return;
    setSaving(true);
    try {
      const payload: any = {
        contratoId: contratoId || null,
        devedorNome: devedorNome.trim(),
        devedorContato: devedorContato.trim() || null,
        devedorCpfCnpj: devedorCpfCnpj.trim() || null,
        descricao: descricao.trim(),
        valorOriginal:
          Number(String(valorOriginal).replace(/[^\d,.-]/g, '').replace(',', '.')) || 0,
        multaPct: multaPct ? Number(multaPct) : null,
        jurosDiariosPct: jurosDiariosPct ? Number(jurosDiariosPct) : null,
        vencimento,
        observacao: observacao?.trim() || null,
      };
      if (editing) payload.status = status;
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onCancel} title={editing ? 'Editar cobrança' : 'Nova cobrança'} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5">
        <FormGroup title="Origem (opcional)">
          <Field label="Vincular a contrato">
            <NativeSelect
              value={contratoId}
              onChange={(e) => {
                setContratoId(e.target.value);
                if (e.target.value && !editing) autoFillFromContrato(e.target.value);
              }}
            >
              <option value="">— Sem vínculo (cobrança avulsa) —</option>
              {contratos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.cliente} · {c.imovelCodigo ?? '—'} · {formatBRL(c.valor)}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </FormGroup>

        <FormGroup title="Devedor">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Nome *" required>
              <Input
                value={devedorNome}
                onChange={(e) => setDevedorNome(e.target.value)}
                placeholder="Ex: João Silva"
                required
                autoFocus
              />
            </Field>
            <Field label="CPF / CNPJ">
              <Input
                value={devedorCpfCnpj ?? ''}
                onChange={(e) => setDevedorCpfCnpj(e.target.value)}
                placeholder="000.000.000-00"
              />
            </Field>
            <Field label="Contato (WhatsApp / e-mail)">
              <Input
                value={devedorContato ?? ''}
                onChange={(e) => setDevedorContato(e.target.value)}
                placeholder="11 99999-9999"
              />
            </Field>
            {editing && (
              <Field label="Status">
                <NativeSelect value={status} onChange={(e) => setStatus(e.target.value as StatusCobranca)}>
                  <option value="ABERTO">Em aberto</option>
                  <option value="PAGO">Pago</option>
                  <option value="NEGOCIADO">Negociado/parcelado</option>
                  <option value="CANCELADO">Cancelado</option>
                </NativeSelect>
              </Field>
            )}
          </div>
        </FormGroup>

        <FormGroup title="Cobrança">
          <Field label="Descrição *" required>
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Aluguel mai/26, Multa por atraso, IPTU rateado"
              required
            />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <Field label="Valor original (R$) *" required>
              <Input
                type="text"
                inputMode="decimal"
                value={valorOriginal}
                onChange={(e) => setValorOriginal(e.target.value)}
                placeholder="2500"
                required
              />
            </Field>
            <Field label="Vencimento *" required>
              <Input
                type="date"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
                required
              />
            </Field>
            <Field label="Multa por atraso (%)" hint="Padrão Lei do Inquilinato: 2%">
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={multaPct}
                onChange={(e) => setMultaPct(e.target.value)}
              />
            </Field>
            <Field label="Juros (% ao dia)" hint="1% ao mês = ~0.033%/dia">
              <Input
                type="number"
                step="0.001"
                min="0"
                max="100"
                value={jurosDiariosPct}
                onChange={(e) => setJurosDiariosPct(e.target.value)}
              />
            </Field>
          </div>
        </FormGroup>

        <FormGroup title="Observação">
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={2}
            placeholder="Notas internas sobre a cobrança..."
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
              'Atualizar'
            ) : (
              'Salvar cobrança'
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
