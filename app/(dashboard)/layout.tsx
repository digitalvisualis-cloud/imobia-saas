'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  KeyRound,
  Plus,
  TrendingUp,
  Users,
  MessageSquare,
  Calendar,
  Globe,
  Sparkles,
  Send,
  Bot,
  CalendarClock,
  Wallet,
  Camera,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  ExternalLink,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  soon?: boolean;
  external?: boolean;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [siteSlug, setSiteSlug] = useState<string | null>(null);
  const { data: session } = useSession();
  const userName = session?.user?.name || 'Minha conta';
  const userInitials = userName
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const userPlan = (session?.user as { plano?: string } | undefined)?.plano || 'Free';
  const userEmail = session?.user?.email ?? '';

  useEffect(() => {
    fetch('/api/sites')
      .then((r) => r.json())
      .then((d) => {
        if (d.site?.slug) setSiteSlug(d.site.slug);
      })
      .catch(() => {});
  }, []);

  const sections: NavSection[] = [
    {
      label: 'Visão Geral',
      items: [{ name: 'Painel', href: '/dashboard', icon: Home }],
    },
    {
      label: 'Portfólio',
      items: [
        { name: 'Imóveis', href: '/imoveis', icon: KeyRound },
        { name: 'Cadastrar Imóvel', href: '/imoveis/novo', icon: Plus },
      ],
    },
    {
      label: 'CRM',
      items: [
        { name: 'Negócios', href: '/leads', icon: TrendingUp },
        { name: 'Contatos', href: '/contatos', icon: Users },
        { name: 'Leads (chatbot)', href: '/leads-inbox', icon: MessageSquare },
        { name: 'Agenda', href: '/agenda', icon: Calendar },
      ],
    },
    {
      label: 'Marketing',
      items: [
        ...(siteSlug
          ? [
              {
                name: 'Meu Site',
                href: `/s/${siteSlug}`,
                icon: Globe,
                external: true,
              },
            ]
          : [{ name: 'Configurar Site', href: '/sites', icon: Globe }]),
        { name: 'Conteúdo IA', href: '/conteudo', icon: Sparkles },
        {
          name: 'Anunciar em portais',
          href: '/configuracoes/portais',
          icon: Globe,
        },
        {
          name: 'Agendar Posts',
          href: '/conteudo/agenda',
          icon: Send,
          soon: true,
        },
      ],
    },
    {
      label: 'Atendimento IA',
      items: [
        { name: 'Agente IA', href: '/configuracoes/agente-ia', icon: Bot },
      ],
    },
    {
      label: 'Financeiro',
      items: [
        { name: 'Financeiro', href: '/financeiro', icon: Wallet },
      ],
    },
    {
      label: 'Parceria',
      items: [{ name: 'Fotos & Tour 360', href: '/parceria', icon: Camera }],
    },
  ];

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(href);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:sticky top-0 z-50 md:z-auto h-screen w-64 shrink-0 flex flex-col',
          'bg-secondary text-secondary-foreground border-r border-secondary/50',
          'transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/5 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary/15 grid place-items-center text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">
              ImobIA
            </span>
          </Link>
          <button
            className="md:hidden text-secondary-foreground/70 hover:text-secondary-foreground"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
          {sections.map((section) => (
            <div key={section.label}>
              <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-secondary-foreground/40">
                {section.label}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = !item.soon && isActive(item.href);
                  if (item.soon) {
                    return (
                      <div
                        key={item.href}
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-secondary-foreground/40 cursor-not-allowed"
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 truncate">{item.name}</span>
                        <span className="text-[9px] font-medium uppercase px-1.5 py-0.5 rounded bg-white/5 text-secondary-foreground/40 tracking-wider">
                          em breve
                        </span>
                      </div>
                    );
                  }
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      target={item.external ? '_blank' : undefined}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                        active
                          ? 'bg-primary/15 text-primary font-medium'
                          : 'text-secondary-foreground/75 hover:bg-white/5 hover:text-secondary-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{item.name}</span>
                      {item.external && (
                        <ExternalLink className="h-3 w-3 opacity-50" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/5 p-3 space-y-1">
          <Link
            href="/configuracoes"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              isActive('/configuracoes')
                ? 'bg-primary/15 text-primary font-medium'
                : 'text-secondary-foreground/75 hover:bg-white/5 hover:text-secondary-foreground',
            )}
          >
            <Settings className="h-4 w-4" /> Configurações
          </Link>

          {/* Super Admin é acessível só por URL direto: /superadmin
              (sem botão visível pra cliente cadastrado nem pra Pablo) */}

          {/* User card */}
          <div className="mt-2 pt-3 border-t border-white/5 flex items-center gap-3 px-2 py-2">
            <div className="h-9 w-9 shrink-0 rounded-full bg-primary/20 text-primary grid place-items-center font-semibold text-sm">
              {userInitials || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-secondary-foreground">
                {userName.split(' ')[0]}
              </p>
              <p className="text-[11px] text-secondary-foreground/50 truncate">
                Plano {userPlan} · {userEmail}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-secondary-foreground/50 hover:text-destructive transition-colors p-1"
              title="Sair"
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-14 bg-card/95 backdrop-blur border-b border-border flex items-center gap-3 px-4 md:px-6">
          <button
            className="md:hidden text-foreground/70 hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar imóveis, contatos ou negócios..."
              className="h-9 w-full pl-9 pr-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <button
            className="relative text-foreground/70 hover:text-foreground p-2 rounded-md hover:bg-muted transition-colors"
            aria-label="Notificações"
          >
            <Bell className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
        <Toaster />
      </div>
    </div>
  );
}
