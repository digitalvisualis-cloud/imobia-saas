'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './layout.module.css';

type NavItem = {
  name: string;
  href: string;
  icon: string;
  soon?: boolean;
  external?: boolean;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [siteSlug, setSiteSlug] = useState<string | null>(null);
  const { data: session } = useSession();
  const userName = session?.user?.name || 'Minha conta';
  const userInitials = userName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  const userPlan = (session?.user as any)?.plano || 'Free';

  useEffect(() => {
    fetch('/api/sites').then(r => r.json()).then(d => {
      if (d.site?.slug) setSiteSlug(d.site.slug);
    }).catch(() => {});
  }, []);

  const sections: NavSection[] = [
    {
      label: 'Visão Geral',
      items: [
        { name: 'Painel', href: '/dashboard', icon: '🏠' },
      ],
    },
    {
      label: 'Portfólio',
      items: [
        { name: 'Meus Imóveis', href: '/imoveis', icon: '🔑' },
        { name: 'Cadastrar Imóvel', href: '/imoveis/novo', icon: '➕' },
        { name: 'Negócios', href: '/leads', icon: '📊' },
        { name: 'Contatos', href: '/contatos', icon: '👥' },
      ],
    },
    {
      label: 'Marketing',
      items: [
        ...(siteSlug
          ? [{ name: 'Meu Site', href: `/s/${siteSlug}`, icon: '🌐', external: true }]
          : [{ name: 'Configurar Site', href: '/sites', icon: '🌐' }]
        ),
        { name: 'Conteúdo IA', href: '/conteudo', icon: '✨' },
        { name: 'Agendar Posts', href: '/conteudo/agenda', icon: '📅', soon: true },
      ],
    },
    {
      label: 'Atendimento IA',
      items: [
        { name: 'Assistente Virtual', href: '/atendimento', icon: '💬' },
        { name: 'Agenda', href: '/atendimento/agenda', icon: '🗓️', soon: true },
        { name: 'Financeiro', href: '/atendimento/financeiro', icon: '💰', soon: true },
      ],
    },
    {
      label: 'Parceria',
      items: [
        { name: 'Fotos & Tour 360', href: '/parceria', icon: '📸' },
      ],
    },
  ];

  return (
    <div className={styles.layout}>
      {/* SIDEBAR */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.brand}>
          <span style={{ marginRight: 8 }}>✦</span> ImobIA
        </div>

        <nav className={styles.nav}>
          {sections.map((section) => (
            <div key={section.label}>
              <div className={styles.navSection}>{section.label}</div>
              {section.items.map((item) => {
                const isActive = !item.soon && (
                  item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(item.href)
                );
                if (item.soon) {
                  return (
                    <div key={item.href} className={`${styles.navLink} ${styles.navSoon}`}>
                      <span>{item.icon}</span>
                      <span style={{ flex: 1 }}>{item.name}</span>
                      <span className={styles.soonBadge}>Em breve</span>
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                    className={`${styles.navLink} ${isActive ? styles.navActive : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span>{item.icon}</span> {item.name}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/configuracoes" className={`${styles.navLink} ${pathname.startsWith('/configuracoes') ? styles.navActive : ''}`} onClick={() => setSidebarOpen(false)}>
            <span>⚙️</span> Configurações
          </Link>
          <div className={styles.userMenu}>
            <div className={styles.avatar}>{userInitials || '?'}</div>
            <div className={styles.userInfo}>
              <h4>{userName.split(' ')[0]}</h4>
              <p>Plano {userPlan}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* OVERLAY MOBILE */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 45 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* MAIN CONTENT */}
      <main className={styles.main}>
        <header className={styles.topbar}>
          <button className={styles.mobileMenuBtn} onClick={() => setSidebarOpen(true)}>
            ☰
          </button>

          <div className={styles.searchBar}>
            <span>🔍</span>
            <input type="text" placeholder="Buscar imóveis ou leads..." />
          </div>

          <div className={styles.topActions}>
            <button className={styles.iconBtn}>🔔</button>
          </div>
        </header>

        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
