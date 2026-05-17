'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Search,
  AlertTriangle,
  TrendingUp,
  Calendar as CalendarIcon,
  Home as HomeIcon,
  RefreshCcw,
  MessageCircle,
  Phone,
  Loader2,
  FileText,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { KpiCard } from '@/components/ui/kpi-card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

type Imovel = {
  id: string;
  codigo: string;
  titulo: string;
  bairro: string | null;
  cidade: string;
};

type Contrato = {
  id: string;
  cliente: string;
  clienteCpfCnpj: string | null;
  clienteContato: string | null;
  tipo: string;
  status: string;
  valor: number;
  dataInicio: string;
  dataFim: string | null;
  ultimoReajusteEm: string | null;
  indexadorReajuste: string | null;
  imovel: Imovel | null;
};

type FilterTab = 'todos' | 'reajuste_proximo' | 'reajuste_atrasado' | 'venc_proximo';

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
function daysDiff(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round((dt.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}
/** Proximo aniversario de reajuste (1 ano apos ultimoReajusteEm OU dataInicio). */
function proximoReajuste(c: Contrato): string {
  const base = c.ultimoReajusteEm ?? c.dataInicio;
  const [y, m, d] = base.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setFullYear(dt.getFullYear() + 1);
  return dt.toISOString().slice(0, 10);
}
function whatsappLink(contato: string | null | undefined): string | null {
  if (!contato) return null;
  const digits = contato.replace(/\D/g, '');
  if (digits.length < 10) return null;
  const prefix = digits.startsWith('55') ? '' : '55';
  return `https://wa.me/${prefix}${digits}`;
}

export default function InquilinosClient({ contratos }: { contratos: Contrato[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('todos');
  const [reajusteFor, setReajusteFor] = useState<Contrato | null>(null);

  const enriched = useMemo(
    () =>
      contratos.map((c) => {
        const proxReaj = proximoReajuste(c);
        const diasReaj = daysDiff(proxReaj);
        const diasVenc = c.dataFim ? daysDiff(c.dataFim) : null;
        return {
          ...c,
          proximoReajusteEm: proxReaj,
          diasParaReajuste: diasReaj,
          diasParaVencimento: diasVenc,
          reajusteAtrasado: diasReaj < 0,
          reajusteProximo: diasReaj >= 0 && diasReaj <= 60,
          vencimentoProximo: diasVenc !== null && diasVenc >= 0 && diasVenc <= 90,
          vencimentoAtrasado: diasVenc !== null && diasVenc < 0,
        };
      }),
    [contratos],
  );

  const aluguelMensalTotal = enriched.reduce((acc, c) => acc + c.valor, 0);
  const reajustesAtrasados = enriched.filter((c) => c.reajusteAtrasado).length;
  const reajustesProximos = enriched.filter((c) => !c.reajusteAtrasado && c.reajusteProximo).length;
  const venceEmBreve = enriched.filter((c) => c.vencimentoProximo || c.vencimentoAtrasado).length;

  const counts = {
    todos: enriched.length,
    reajuste_proximo: enriched.filter((c) => c.reajusteProximo && !c.reajusteAtrasado).length,
    reajuste_atrasado: reajustesAtrasados,
    venc_proximo: venceEmBreve,
  };

  const filtered = useMemo(() => {
    let arr = enriched;
    if (filterTab === 'reajuste_proximo')
      arr = arr.filter((c) => c.reajusteProximo && !c.reajusteAtrasado);
    else if (filterTab === 'reajuste_atrasado') arr = arr.filter((c) => c.reajusteAtrasado);
    else if (filterTab === 'venc_proximo')
      arr = arr.filter((c) => c.vencimentoProximo || c.vencimentoAtrasado);
    if (filterTipo) arr = arr.filter((c) => c.tipo === filterTipo);
    const q = search.trim().toLowerCase();
    if (q) {
      arr = arr.filter((c) =>
        `${c.cliente} ${c.clienteCpfCnpj ?? ''} ${c.imovel?.codigo ?? ''} ${c.imovel?.titulo ?? ''}`
          .toLowerCase()
          .includes(q),
      );
    }
    return arr;
  }, [enriched, filterTab, filterTipo, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Negócios"
        icon={Users}
        title="Inquilinos ativos"
        description="Locatários atuais — reajuste anual, renovação, contato direto"
      />

      {(reajustesAtrasados > 0 || venceEmBreve > 0) && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="text-sm flex-1">
            <p className="font-medium text-amber-900 dark:text-amber-200">
              {reajustesAtrasados > 0 &&
                `${reajustesAtrasados} contrato(s) com reajuste atrasado`}
              {reajustesAtrasados > 0 && venceEmBreve > 0 && ' • '}
              {venceEmBreve > 0 && `${venceEmBreve} vence(m) nos próximos 90 dias`}
            </p>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
              Em breve: lembrete automático por WhatsApp/e-mail via n8n (30 / 15 / 5 dias antes).
            </p>
          </div>
          {reajustesAtrasados > 0 && (
            <button
              onClick={() => setFilterTab('reajuste_atrasado')}
              className="text-xs font-medium text-amber-900 dark:text-amber-200 hover:underline"
            >
              Ver atrasados
            </button>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Inquilinos ativos" value={String(enriched.length)} icon={Users} accent="primary" />
        <KpiCard label="Aluguel /mês" value={formatBRL(aluguelMensalTotal)} icon={TrendingUp} accent="green" />
        <KpiCard
          label="Reajustes atrasados"
          value={String(reajustesAtrasados)}
          icon={AlertTriangle}
          accent="amber"
        />
        <KpiCard
          label="Vence em 90d"
          value={String(venceEmBreve)}
          icon={CalendarIcon}
          accent="violet"
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['todos', 'Todos'],
            ['reajuste_proximo', 'Reajuste em 60d'],
            ['reajuste_atrasado', 'Reajuste atrasado'],
            ['venc_proximo', 'Vencendo em 90d'],
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
            placeholder="Buscar por inquilino, CPF ou imóvel..."
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
          <option value="ALUGUEL">Aluguel</option>
          <option value="ADMINISTRACAO">Administração</option>
        </NativeSelect>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            enriched.length === 0
              ? 'Nenhum inquilino ativo'
              : 'Nenhum inquilino nesse filtro'
          }
          description={
            enriched.length === 0
              ? 'Inquilinos aparecem aqui automaticamente quando você cria um contrato de Aluguel ou Administração em /contratos.'
              : undefined
          }
          action={
            enriched.length === 0
              ? {
                  label: 'Ir para Contratos',
                  icon: FileText,
                  onClick: () => router.push('/contratos'),
                }
              : undefined
          }
        />
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-muted-foreground text-[11px] uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Inquilino</th>
                <th className="text-left px-4 py-3 font-medium">Imóvel</th>
                <th className="text-right px-4 py-3 font-medium">Aluguel /mês</th>
                <th className="text-left px-4 py-3 font-medium">Próximo reajuste</th>
                <th className="text-left px-4 py-3 font-medium">Vencimento contrato</th>
                <th className="text-right px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => {
                const wpp = whatsappLink(c.clienteContato);
                return (
                  <tr
                    key={c.id}
                    className={cn(
                      'hover:bg-muted/40',
                      c.reajusteAtrasado && 'bg-red-500/5',
                      !c.reajusteAtrasado && c.reajusteProximo && 'bg-amber-500/5',
                    )}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{c.cliente}</p>
                      {c.clienteCpfCnpj && (
                        <p className="text-xs text-muted-foreground font-mono">{c.clienteCpfCnpj}</p>
                      )}
                      <Badge variant="outline" className="text-[10px] mt-1 font-normal">
                        {c.tipo === 'ALUGUEL' ? 'Locação' : 'Administração'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {c.imovel ? (
                        <Link
                          href={`/imoveis/${c.imovel.id}`}
                          className="hover:underline"
                        >
                          <p className="font-mono text-foreground">{c.imovel.codigo}</p>
                          <p className="text-muted-foreground truncate max-w-[200px]">
                            {c.imovel.titulo}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {[c.imovel.bairro, c.imovel.cidade].filter(Boolean).join(' · ')}
                          </p>
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-primary tabular-nums">
                      {formatBRL(c.valor)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <RefreshCcw className="h-3 w-3" />
                        <span>{formatDate(c.proximoReajusteEm)}</span>
                      </div>
                      <span
                        className={cn(
                          'text-[11px] font-medium',
                          c.reajusteAtrasado && 'text-red-600 dark:text-red-400',
                          c.reajusteProximo && !c.reajusteAtrasado && 'text-amber-700 dark:text-amber-400',
                          !c.reajusteAtrasado && !c.reajusteProximo && 'text-muted-foreground',
                        )}
                      >
                        {c.reajusteAtrasado
                          ? `Atrasado ${Math.abs(c.diasParaReajuste)}d`
                          : `em ${c.diasParaReajuste}d`}
                      </span>
                      {c.indexadorReajuste && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          índice: {c.indexadorReajuste}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {c.dataFim ? (
                        <div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <CalendarIcon className="h-3 w-3" />
                            <span>{formatDate(c.dataFim)}</span>
                          </div>
                          {c.diasParaVencimento !== null && (
                            <span
                              className={cn(
                                'text-[11px] font-medium',
                                c.vencimentoAtrasado && 'text-red-600 dark:text-red-400',
                                c.vencimentoProximo &&
                                  !c.vencimentoAtrasado &&
                                  'text-amber-700 dark:text-amber-400',
                                !c.vencimentoProximo &&
                                  !c.vencimentoAtrasado &&
                                  'text-muted-foreground',
                              )}
                            >
                              {c.vencimentoAtrasado
                                ? `Vencido ${Math.abs(c.diasParaVencimento)}d`
                                : `em ${c.diasParaVencimento}d`}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Sem fim</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        {wpp && (
                          <a
                            href={wpp}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-green-700 dark:hover:text-green-400 p-1.5 rounded hover:bg-muted"
                            title="WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </a>
                        )}
                        {c.clienteContato && (
                          <a
                            href={`tel:${c.clienteContato.replace(/\D/g, '')}`}
                            className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-muted"
                            title="Ligar"
                          >
                            <Phone className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => setReajusteFor(c)}
                          className="text-xs font-medium text-primary hover:underline px-2"
                          title="Registrar reajuste anual"
                        >
                          Reajuste
                        </button>
                        <Link
                          href="/contratos"
                          className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-muted"
                          title="Ver contrato"
                        >
                          <FileText className="h-4 w-4" />
                        </Link>
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
        ℹ️ Inquilinos = contratos ALUGUEL ou ADMINISTRAÇÃO ativos. Em breve (upsell): cron n8n
        envia carta de reajuste anual e lembrete de renovação por WhatsApp + e-mail.
      </div>

      {reajusteFor && (
        <ReajusteModal
          contrato={reajusteFor}
          onClose={() => setReajusteFor(null)}
          onSaved={() => {
            setReajusteFor(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

/* ---------- Modal de reajuste ---------- */

function ReajusteModal({
  contrato,
  onClose,
  onSaved,
}: {
  contrato: Contrato;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [dataReajuste, setDataReajuste] = useState(new Date().toISOString().slice(0, 10));
  const [indexador, setIndexador] = useState(contrato.indexadorReajuste ?? 'IGPM');
  const [novoValor, setNovoValor] = useState(String(contrato.valor));
  const [saving, setSaving] = useState(false);

  const valorAtual = contrato.valor;
  const valorNum = Number(String(novoValor).replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
  const pctAumento = valorAtual > 0 ? ((valorNum - valorAtual) / valorAtual) * 100 : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/contratos/${contrato.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ultimoReajusteEm: dataReajuste,
          indexadorReajuste: indexador,
          valor: valorNum,
        }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => null);
        throw new Error(data?.error || 'Falhou');
      }
      toast.success('Reajuste registrado');
      onSaved();
    } catch (e) {
      toast.error('Erro', { description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Registrar reajuste anual" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
        <div className="rounded-md bg-muted/40 border border-border px-3 py-2 text-sm">
          <p className="font-medium text-foreground">{contrato.cliente}</p>
          {contrato.imovel && (
            <p className="text-xs text-muted-foreground font-mono">
              {contrato.imovel.codigo} · {contrato.imovel.titulo}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Valor atual: <strong className="text-foreground">{formatBRL(valorAtual)}</strong>
          </p>
        </div>

        <label className="block">
          <span className="text-xs font-medium block mb-1">Data do reajuste</span>
          <Input type="date" value={dataReajuste} onChange={(e) => setDataReajuste(e.target.value)} />
        </label>

        <label className="block">
          <span className="text-xs font-medium block mb-1">Índice utilizado</span>
          <NativeSelect value={indexador} onChange={(e) => setIndexador(e.target.value)}>
            <option value="IGPM">IGP-M (FGV)</option>
            <option value="IPCA">IPCA (IBGE)</option>
            <option value="IPC">IPC (FIPE)</option>
            <option value="LIVRE">Reajuste livre</option>
          </NativeSelect>
        </label>

        <label className="block">
          <span className="text-xs font-medium block mb-1">Novo valor mensal (R$)</span>
          <Input
            type="text"
            inputMode="decimal"
            value={novoValor}
            onChange={(e) => setNovoValor(e.target.value)}
            placeholder={String(valorAtual)}
          />
          {valorNum > 0 && valorNum !== valorAtual && (
            <p
              className={cn(
                'text-[11px] mt-1',
                pctAumento >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400',
              )}
            >
              {pctAumento >= 0 ? '+' : ''}
              {pctAumento.toFixed(2)}% em relação ao atual
            </p>
          )}
        </label>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando
              </>
            ) : (
              'Confirmar reajuste'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
