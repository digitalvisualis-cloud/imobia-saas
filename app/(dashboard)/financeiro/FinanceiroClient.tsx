'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Wallet,
  TrendingUp,
  Receipt,
  AlertCircle,
  ArrowRightLeft,
  FileText,
  Users,
  Award,
  ArrowRight,
} from 'lucide-react';
import { KpiCard } from '@/components/ui/kpi-card';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Contrato = {
  id: string;
  tipo: string;
  status: string;
  valor: number;
  comissaoPct: number;
  dataInicio: string;
  dataFim: string | null;
};

type Split = {
  id: string;
  beneficiario: string;
  papel: string;
  percentual: number | null;
  valorFixo: number | null;
  status: string;
  pagoEm: string | null;
  createdAt: string;
  contratoValor: number;
  contratoComissaoPct: number;
  contratoTipo: string | null;
};

type Repasse = {
  id: string;
  mesReferencia: string;
  valorBruto: number;
  valorLiquido: number;
  outrosDescontos: number;
  status: string;
  pagoEm: string | null;
};

type Cobranca = {
  id: string;
  valorOriginal: number;
  valorPago: number | null;
  status: string;
  vencimento: string;
  pagoEm: string | null;
  multaPct: number | null;
  jurosDiariosPct: number | null;
};

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function formatMes(yyyymm: string) {
  if (!/^\d{4}-\d{2}$/.test(yyyymm)) return yyyymm;
  const [y, m] = yyyymm.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
}
function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function valorSplit(s: Split): number {
  if (s.valorFixo != null) return s.valorFixo;
  if (s.percentual != null && s.contratoValor) {
    const base = (s.contratoValor * s.contratoComissaoPct) / 100;
    return (base * s.percentual) / 100;
  }
  return 0;
}
function valorCobrancaAtual(c: Cobranca): number {
  if (c.status === 'PAGO') return c.valorPago ?? c.valorOriginal;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(c.vencimento);
  venc.setHours(0, 0, 0, 0);
  const dias = Math.max(0, Math.round((hoje.getTime() - venc.getTime()) / 86_400_000));
  if (dias === 0) return c.valorOriginal;
  const multa = c.multaPct != null ? (c.valorOriginal * c.multaPct) / 100 : 0;
  const juros = c.jurosDiariosPct != null ? (c.valorOriginal * c.jurosDiariosPct * dias) / 100 : 0;
  return c.valorOriginal + multa + juros;
}

export default function FinanceiroClient({
  contratos,
  splits,
  repasses,
  cobrancas,
}: {
  contratos: Contrato[];
  splits: Split[];
  repasses: Repasse[];
  cobrancas: Cobranca[];
}) {
  // ─── MRR (Aluguel + Administracao ativos) ──────────────────────
  const mrr = contratos
    .filter((c) => c.status === 'ATIVO' && (c.tipo === 'ALUGUEL' || c.tipo === 'ADMINISTRACAO'))
    .reduce((acc, c) => acc + c.valor, 0);

  // ─── Pipeline de Vendas (ATIVO + PENDENTE em VENDA) ────────────
  const pipelineVendas = contratos
    .filter((c) => (c.status === 'ATIVO' || c.status === 'PENDENTE') && c.tipo === 'VENDA')
    .reduce((acc, c) => acc + c.valor, 0);

  const comissaoEstimadaTotal = contratos
    .filter((c) => c.status === 'ATIVO')
    .reduce((acc, c) => acc + (c.valor * c.comissaoPct) / 100, 0);

  // ─── Comissoes ────────────────────────────────────────────────
  const splitsPendentes = splits.filter((s) => s.status === 'PENDENTE');
  const splitsPagos = splits.filter((s) => s.status === 'PAGO');
  const totalAReceberCom = splitsPendentes.reduce((acc, s) => acc + valorSplit(s), 0);
  const totalPagoCom = splitsPagos.reduce((acc, s) => acc + valorSplit(s), 0);

  // ─── Repasses do mes atual ────────────────────────────────────
  const mesA = mesAtual();
  const repassesMes = repasses.filter((r) => r.mesReferencia === mesA);
  const bruto = repassesMes.reduce((acc, r) => acc + r.valorBruto, 0);
  const aRepassar = repasses.filter((r) => r.status === 'A_REPASSAR').reduce((acc, r) => acc + r.valorLiquido, 0);

  // ─── Inadimplencia ────────────────────────────────────────────
  const cobrancasAbertas = cobrancas.filter((c) => c.status === 'ABERTO');
  const totalAtrasado = cobrancasAbertas
    .filter((c) => {
      const venc = new Date(c.vencimento);
      venc.setHours(0, 0, 0, 0);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      return venc < hoje;
    })
    .reduce((acc, c) => acc + valorCobrancaAtual(c), 0);

  const totalEsperadoMes = mrr;
  const pctInadimplencia = totalEsperadoMes > 0 ? (totalAtrasado / totalEsperadoMes) * 100 : 0;

  // ─── Fluxo de caixa por mes (ultimos 6 meses) ─────────────────
  const fluxoMeses = useMemo(() => {
    const hoje = new Date();
    const meses: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return meses.map((m) => {
      const reps = repasses.filter((r) => r.mesReferencia === m);
      const brutoM = reps.reduce((a, r) => a + r.valorBruto, 0);
      const taxaM = reps.reduce((a, r) => a + (r.valorBruto - r.valorLiquido - r.outrosDescontos), 0);
      const cobrPagasM = cobrancas
        .filter((c) => {
          if (c.status !== 'PAGO' || !c.pagoEm) return false;
          const d = new Date(c.pagoEm);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === m;
        })
        .reduce((a, c) => a + (c.valorPago ?? 0), 0);
      const splitsPagosM = splits
        .filter((s) => {
          if (s.status !== 'PAGO' || !s.pagoEm) return false;
          const d = new Date(s.pagoEm);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === m;
        })
        .reduce((a, s) => a + valorSplit(s), 0);
      // Receita do mes = taxa retida nos repasses (ADM) + cobrancas pagas - comissoes pagas
      const receita = taxaM + cobrPagasM - splitsPagosM;
      return { mes: m, bruto: brutoM, taxa: taxaM, comissoes: splitsPagosM, receita };
    });
  }, [repasses, cobrancas, splits]);

  const maxBarra = Math.max(...fluxoMeses.map((m) => Math.abs(m.receita)), 1);

  // ─── Performance por beneficiario (top 5) ─────────────────────
  const performanceBenef = useMemo(() => {
    const map = new Map<string, { total: number; papel: string; count: number }>();
    splits.forEach((s) => {
      const v = valorSplit(s);
      if (!map.has(s.beneficiario))
        map.set(s.beneficiario, { total: 0, papel: s.papel, count: 0 });
      const entry = map.get(s.beneficiario)!;
      entry.total += v;
      entry.count += 1;
    });
    return Array.from(map.entries())
      .map(([benef, dado]) => ({ beneficiario: benef, ...dado }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [splits]);

  // ─── Contagens por status ─────────────────────────────────────
  const contratosAtivos = contratos.filter((c) => c.status === 'ATIVO').length;
  const cobrancasAtrasadasCount = cobrancasAbertas.filter((c) => {
    const venc = new Date(c.vencimento);
    venc.setHours(0, 0, 0, 0);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return venc < hoje;
  }).length;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Negócios"
        icon={Wallet}
        title="Pipeline financeiro"
        description="Visão agregada — contratos, comissões, repasses e cobranças"
      />

      {/* KPIs principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="MRR (aluguel + adm)" value={formatBRL(mrr)} icon={TrendingUp} accent="green" />
        <KpiCard label="Pipeline vendas" value={formatBRL(pipelineVendas)} icon={FileText} accent="primary" />
        <KpiCard label="Comissão estimada" value={formatBRL(comissaoEstimadaTotal)} icon={Receipt} accent="violet" />
        <KpiCard
          label="Inadimplência"
          value={`${pctInadimplencia.toFixed(1)}%`}
          icon={AlertCircle}
          accent={pctInadimplencia > 10 ? 'amber' : 'primary'}
        />
      </div>

      {/* Fluxo de caixa últimos 6 meses */}
      <section className="rounded-lg border border-border bg-card p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-base font-semibold">Fluxo de caixa — últimos 6 meses</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Receita = taxa de admin retida + cobranças pagas − comissões pagas
            </p>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {fluxoMeses.map((m) => {
            const altura = Math.max(8, Math.round((Math.abs(m.receita) / maxBarra) * 100));
            const positiva = m.receita >= 0;
            return (
              <div key={m.mes} className="flex flex-col items-center">
                <div className="w-full h-32 flex items-end justify-center">
                  <div
                    className={cn(
                      'w-8 rounded-t transition-all',
                      positiva ? 'bg-primary' : 'bg-red-500',
                    )}
                    style={{ height: `${altura}%` }}
                    title={formatBRL(m.receita)}
                  />
                </div>
                <p className="mt-2 text-[10px] font-mono uppercase text-muted-foreground">
                  {formatMes(m.mes)}
                </p>
                <p
                  className={cn(
                    'text-[11px] font-medium tabular-nums',
                    positiva ? 'text-primary' : 'text-red-600 dark:text-red-400',
                  )}
                >
                  {formatBRL(m.receita)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quadro: drill-down em cada feature */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DrillCard
          icon={FileText}
          title="Contratos"
          subtitle={`${contratosAtivos} ativo(s) • ${formatBRL(mrr + pipelineVendas)} sob gestão`}
          href="/contratos"
          accent="primary"
        />
        <DrillCard
          icon={Receipt}
          title="Comissões"
          subtitle={`A receber ${formatBRL(totalAReceberCom)} • Pago ${formatBRL(totalPagoCom)}`}
          href="/comissoes"
          accent="violet"
        />
        <DrillCard
          icon={ArrowRightLeft}
          title="Repasses"
          subtitle={`Bruto mês ${formatBRL(bruto)} • A repassar ${formatBRL(aRepassar)}`}
          href="/repasses"
          accent="teal"
        />
        <DrillCard
          icon={AlertCircle}
          title="Inadimplência"
          subtitle={`${cobrancasAtrasadasCount} atrasada(s) • Total ${formatBRL(totalAtrasado)}`}
          href="/inadimplencia"
          accent={cobrancasAtrasadasCount > 0 ? 'amber' : 'primary'}
        />
        <DrillCard
          icon={Users}
          title="Inquilinos"
          subtitle="Locatários ativos + reajustes anuais"
          href="/inquilinos"
          accent="primary"
        />
      </div>

      {/* Top beneficiários */}
      {performanceBenef.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-4 md:p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-primary" />
            <h3 className="font-display text-base font-semibold">Top 5 — Performance por beneficiário</h3>
          </div>
          <ul className="divide-y divide-border">
            {performanceBenef.map((p, idx) => (
              <li key={p.beneficiario} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs text-muted-foreground w-6 shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{p.beneficiario}</p>
                    <p className="text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px] mr-1 font-normal">
                        {p.papel}
                      </Badge>
                      {p.count} split(s)
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-primary tabular-nums">
                  {formatBRL(p.total)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="text-xs text-muted-foreground bg-muted/40 border border-border rounded-md px-3 py-2">
        ℹ️ Esta página é só leitura. Pra criar/editar contratos, comissões, repasses ou
        cobranças, use os menus dedicados no sidebar.
      </div>
    </div>
  );
}

/* ---------- Drill card ---------- */

function DrillCard({
  icon: Icon,
  title,
  subtitle,
  href,
  accent,
}: {
  icon: any;
  title: string;
  subtitle: string;
  href: string;
  accent: 'primary' | 'amber' | 'violet' | 'teal';
}) {
  const tones: Record<typeof accent, string> = {
    primary: 'border-primary/40 hover:bg-primary/5',
    amber: 'border-amber-500/40 hover:bg-amber-500/5 bg-amber-500/[0.03]',
    violet: 'border-violet-500/40 hover:bg-violet-500/5',
    teal: 'border-teal-500/40 hover:bg-teal-500/5',
  } as any;
  const iconTones: Record<typeof accent, string> = {
    primary: 'text-primary',
    amber: 'text-amber-600 dark:text-amber-400',
    violet: 'text-violet-600 dark:text-violet-400',
    teal: 'text-teal-600 dark:text-teal-400',
  } as any;
  return (
    <Link
      href={href}
      className={cn(
        'rounded-lg border bg-card p-4 transition-colors flex items-center gap-3 group',
        tones[accent],
      )}
    >
      <div className={cn('shrink-0 h-10 w-10 rounded-lg bg-muted/40 grid place-items-center', iconTones[accent])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
    </Link>
  );
}
