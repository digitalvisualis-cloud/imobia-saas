import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import styles from './dashboard.module.css';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const tenantId = (session.user as any).tenantId as string;
  const userName = (session.user as any).name || 'Corretor';

  // Busca dados reais em paralelo
  const [imoveisCount, leadsRaw, site, postsCount] = await Promise.all([
    prisma.imovel.count({ where: { tenantId, publicado: true } }),
    prisma.lead.groupBy({ by: ['etapa'], where: { tenantId }, _count: { id: true } }),
    prisma.site.findUnique({ where: { tenantId } }),
    prisma.postGerado.count({ where: { tenantId } }),
  ]);

  const totalLeads = leadsRaw.reduce((s, r) => s + r._count.id, 0);

  const leadsMap: Record<string, number> = {};
  for (const r of leadsRaw) leadsMap[r.etapa] = r._count.id;

  const kanbanPreview = [
    { stage: 'Novos', id: 'NOVO', color: '#3b82f6' },
    { stage: 'Contato', id: 'CONTATO', color: '#8b5cf6' },
    { stage: 'Visita', id: 'VISITA_AGENDADA', color: '#eab308' },
    { stage: 'Proposta', id: 'PROPOSTA', color: '#f97316' },
    { stage: 'Fechado', id: 'FECHADO', color: '#22c55e' },
  ];

  // Atividade recente: últimos imóveis e leads
  const [recentImoveis, recentLeads] = await Promise.all([
    prisma.imovel.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 3, select: { titulo: true, createdAt: true } }),
    prisma.lead.findMany({ where: { tenantId }, orderBy: { updatedAt: 'desc' }, take: 3, select: { nome: true, etapa: true, updatedAt: true } }),
  ]);

  const etapaLabel: Record<string, string> = {
    NOVO: 'Novo Lead', CONTATO: 'Em Contato', VISITA_AGENDADA: 'Visita Marcada',
    PROPOSTA: 'Proposta', FECHADO: 'Fechado',
  };

  function timeAgo(d: Date) {
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 3600) return Math.floor(diff / 60) + 'min atrás';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h atrás';
    return Math.floor(diff / 86400) + 'd atrás';
  }

  const activity = [
    ...recentImoveis.map(i => ({ text: `Imóvel "${i.titulo}" cadastrado`, time: timeAgo(i.createdAt), icon: '🏠' })),
    ...recentLeads.map(l => ({ text: `Lead "${l.nome}" — ${etapaLabel[l.etapa] ?? l.etapa}`, time: timeAgo(l.updatedAt), icon: '📊' })),
  ].sort((a, b) => 0); // mantém ordem natural (já ordenados por data)

  const stats = [
    { label: 'Imóveis Ativos', value: String(imoveisCount), icon: '🏠', sub: imoveisCount === 0 ? 'Nenhum ainda' : `${imoveisCount} publicado${imoveisCount > 1 ? 's' : ''}` },
    { label: 'Leads no Pipeline', value: String(totalLeads), icon: '📊', sub: totalLeads === 0 ? 'Nenhum ainda' : `${leadsMap['FECHADO'] ?? 0} fechado${(leadsMap['FECHADO'] ?? 0) !== 1 ? 's' : ''}` },
    { label: 'Posts Gerados', value: String(postsCount), icon: '✍️', sub: postsCount === 0 ? 'Nenhum ainda' : 'com IA' },
    { label: 'Site', value: site?.publicado ? 'Ativo' : 'Inativo', icon: '🌐', sub: site?.slug ? `/s/${site.slug}` : 'Não configurado' },
  ];

  const quickActions = [
    { href: '/imoveis/novo', icon: '🏠', label: 'Novo Imóvel', desc: 'Cadastrar imóvel', color: '#7c3aed' },
    { href: '/leads', icon: '📊', label: 'Ver Leads', desc: 'Pipeline Kanban', color: '#eab308' },
    { href: '/sites', icon: '🌐', label: 'Meu Site', desc: 'Gerenciar site público', color: '#f97316' },
  ];

  const firstName = userName.split(' ')[0];

  return (
    <div className="fade-in">
      <div className={styles.header}>
        <div>
          <h1>Olá, {firstName}! 👋</h1>
          <p className="text-muted">Aqui está o resumo do seu negócio hoje</p>
        </div>
        <Link href="/imoveis/novo" className="btn btn-primary">+ Novo Imóvel</Link>
      </div>

      {/* STATS */}
      <div className="grid-4 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-label">{s.label}</span>
              <span style={{ fontSize: '1.4rem' }}>{s.icon}</span>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-change">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        {/* LEFT */}
        <div className={styles.left}>
          <div className="card mb-6">
            <h3 className="mb-4">Ações Rápidas</h3>
            <div className={styles.actionsGrid}>
              {quickActions.map((a, i) => (
                <Link key={i} href={a.href} className={styles.actionCard}>
                  <div className={styles.actionIcon} style={{ background: a.color + '22', color: a.color }}>{a.icon}</div>
                  <div>
                    <p className="font-medium text-sm">{a.label}</p>
                    <p className="text-xs text-muted">{a.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* KANBAN PREVIEW */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3>Pipeline de Leads</h3>
              <Link href="/leads" className="btn btn-ghost btn-sm">Ver tudo →</Link>
            </div>
            {totalLeads === 0 ? (
              <div className="empty-state" style={{ padding: '2rem 0' }}>
                <div className="empty-icon">📊</div>
                <p className="text-muted text-sm mt-2">Seus leads aparecerão aqui</p>
                <p className="text-xs text-muted mt-1">Eles chegam pelo seu site ou WhatsApp</p>
              </div>
            ) : (
              <div className={styles.kanbanPreview}>
                {kanbanPreview.map((k, i) => (
                  <div key={i} className={styles.kanbanCol}>
                    <div className={styles.kanbanColHeader} style={{ background: k.color + '22', borderColor: k.color + '44' }}>
                      <span style={{ color: k.color, fontSize: 11, fontWeight: 700 }}>{k.stage.toUpperCase()}</span>
                    </div>
                    <div className={styles.kanbanCount} style={{ color: k.color }}>{leadsMap[k.id] ?? 0}</div>
                    <span className="text-xs text-muted">leads</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className={styles.right}>
          {/* Atividade recente */}
          <div className="card">
            <h3 className="mb-4">Atividade Recente</h3>
            {activity.length === 0 ? (
              <p className="text-muted text-sm">Nenhuma atividade ainda. Comece cadastrando um imóvel!</p>
            ) : (
              <div className={styles.activityList}>
                {activity.map((a, i) => (
                  <div key={i} className={styles.activityItem}>
                    <span className={styles.activityIcon}>{a.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p className="text-sm">{a.text}</p>
                      <p className="text-xs text-muted">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick tip se conta nova */}
          {imoveisCount === 0 && (
            <div className="card mt-4" style={{ borderColor: 'var(--accent)', background: 'var(--accent-glow, rgba(212,175,55,0.06))' }}>
              <h4 className="mb-2">🚀 Comece por aqui</h4>
              <p className="text-sm text-muted mb-3">Cadastre seu primeiro imóvel para ativar as ferramentas de IA, gerar posts e criar seu site.</p>
              <Link href="/imoveis/novo" className="btn btn-primary btn-sm">Cadastrar primeiro imóvel</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
