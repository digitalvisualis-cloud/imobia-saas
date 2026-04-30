'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Receipt,
  Brain,
  Activity,
  KeyRound,
  BookOpen,
  Webhook,
  Shield,
  ArrowLeft,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  soon?: boolean;
};
type NavSection = { label: string; items: NavItem[] };

const SECTIONS: NavSection[] = [
  {
    label: 'Visão Geral',
    items: [
      { name: 'Dashboard', href: '/superadmin', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Plataforma',
    items: [
      { name: 'Tenants', href: '/superadmin/tenants', icon: Building2 },
      { name: 'Planos', href: '/superadmin/planos', icon: Receipt },
    ],
  },
  {
    label: 'IA & API',
    items: [
      { name: 'Logs IA', href: '/superadmin/logs-ia', icon: Brain },
      { name: 'Logs API', href: '/superadmin/logs-api', icon: Activity },
      { name: 'Chaves API', href: '/superadmin/api-keys', icon: KeyRound },
      { name: 'Doc API', href: '/superadmin/api-docs', icon: BookOpen },
      { name: 'Webhooks', href: '/superadmin/webhooks', icon: Webhook, soon: true },
    ],
  },
];

export default function SuperAdminShell({
  children,
  userName,
  userEmail,
}: {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isActive = (href: string) =>
    href === '/superadmin' ? pathname === '/superadmin' : pathname.startsWith(href);

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100">
      <aside
        className={cn(
          'fixed md:sticky top-0 z-50 md:z-auto h-screen w-64 shrink-0 flex flex-col',
          'bg-zinc-900 border-r border-zinc-800',
          'transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* Brand — vermelho cuidadoso pra deixar claro que é modo admin */}
        <div className="px-5 py-5 border-b border-zinc-800 flex items-center justify-between">
          <Link href="/superadmin" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-red-500/15 grid place-items-center text-red-400">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <span className="font-display text-lg font-semibold tracking-tight">
                Super Admin
              </span>
              <p className="text-[10px] uppercase tracking-wider text-red-400/80">
                Plataforma Visualis
              </p>
            </div>
          </Link>
          <button
            className="md:hidden text-zinc-400 hover:text-zinc-100"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
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
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-zinc-600 cursor-not-allowed"
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 truncate">{item.name}</span>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-zinc-800 tracking-wider">
                          em breve
                        </span>
                      </div>
                    );
                  }
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                        active
                          ? 'bg-red-500/15 text-red-300 font-medium'
                          : 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-zinc-800 p-3 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar pro app
          </Link>
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-9 w-9 rounded-full bg-red-500/20 text-red-300 grid place-items-center font-semibold text-sm shrink-0">
              {initials || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-[11px] text-zinc-500 truncate">{userEmail}</p>
            </div>
          </div>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-14 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 flex items-center gap-3 px-4 md:px-6">
          <button
            className="md:hidden text-zinc-300 hover:text-zinc-100"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 text-xs text-red-400">
            <Shield className="h-4 w-4" />
            <span className="font-medium uppercase tracking-wider">
              Modo Plataforma
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
