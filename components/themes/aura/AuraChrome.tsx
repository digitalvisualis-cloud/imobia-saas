import Link from 'next/link';
import { Menu } from 'lucide-react';
import {
  FacebookIcon as Facebook,
  InstagramIcon as Instagram,
  TwitterIcon as Twitter,
  LinkedinIcon as Linkedin,
} from '../_social-icons';
import type { Customization } from '@/types/site-customization';
import type { TenantPublic } from '@/app/_templates/types';

function resolveTo(slug: string, to: string) {
  return `/s/${slug}${to === '/' ? '' : to}`;
}

interface ChromeProps {
  config: Customization;
  tenant: TenantPublic;
}

export function AuraHeader({ config, tenant }: ChromeProps) {
  return (
    <header className="absolute left-0 right-0 top-0 z-30">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-8 py-7">
        <Link href={`/s/${tenant.slug}`} className="text-white">
          <div
            style={{ fontFamily: 'var(--t-font-heading)' }}
            className="text-xl tracking-wide"
          >
            {config.header.brandName.toUpperCase()}
          </div>
          <div className="mt-0.5 text-[9px] tracking-[0.4em] opacity-70">
            REAL ESTATE
          </div>
        </Link>
        <nav className="hidden items-center gap-9 text-[12px] font-medium uppercase tracking-[0.2em] text-white md:flex">
          {config.header.links.map((l, i) => (
            <Link
              key={i}
              href={resolveTo(tenant.slug, l.to)}
              className="opacity-80 hover:opacity-100"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <a
          href={config.header.ctaHref}
          className="hidden items-center gap-2 border border-white/30 px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-white/10 md:inline-flex"
        >
          {config.header.ctaLabel}
        </a>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white md:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

export function AuraFooter({ config, tenant }: ChromeProps) {
  return (
    <footer
      id="contato"
      className="mt-32"
      style={{ background: 'var(--t-primary)', color: 'var(--t-bg)' }}
    >
      <div className="mx-auto grid max-w-[1500px] gap-12 px-8 py-20 md:grid-cols-12">
        <div className="md:col-span-5">
          <div
            style={{ fontFamily: 'var(--t-font-heading)' }}
            className="text-4xl leading-tight"
          >
            {config.header.brandName}.
            <br />
            <span style={{ color: 'var(--t-secondary)' }}>Curated estates.</span>
          </div>
          <p className="mt-6 max-w-sm text-sm opacity-70">
            {tenant.marca?.descricao ??
              'Curadoria de propriedades excepcionais.'}
          </p>
          <SocialRow social={config.social} />
        </div>
        <FCol titulo="Navegação" items={['Coleção', 'Lançamentos', 'Off-market', 'Comercial']} />
        <FCol titulo="Estúdio" items={['Sobre', 'Time', 'Imprensa', 'Carreira']} />
        <div className="md:col-span-3">
          <div className="text-[11px] uppercase tracking-[0.3em] opacity-60">Contato</div>
          {tenant.marca?.endereco && (
            <p className="mt-4 text-sm opacity-90">{tenant.marca.endereco}</p>
          )}
          {tenant.marca?.telefone && (
            <p className="mt-2 text-sm opacity-90">{tenant.marca.telefone}</p>
          )}
          {tenant.marca?.email && (
            <p className="text-sm opacity-90">{tenant.marca.email}</p>
          )}
        </div>
      </div>
      <div
        className="mx-auto max-w-[1500px] border-t px-8 py-7 text-[11px] uppercase tracking-[0.2em] opacity-60"
        style={{ borderColor: 'rgb(255 255 255 / 0.1)' }}
      >
        © {new Date().getFullYear()} {config.header.brandName} · Todos os direitos reservados
      </div>
    </footer>
  );
}

function FCol({ titulo, items }: { titulo: string; items: string[] }) {
  return (
    <div className="md:col-span-2">
      <div className="text-[11px] uppercase tracking-[0.3em] opacity-60">{titulo}</div>
      <ul className="mt-4 space-y-2.5 text-sm opacity-90">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

function SocialRow({ social }: { social: Customization['social'] }) {
  const items = [
    { Icon: Facebook, val: social.facebook },
    { Icon: Instagram, val: social.instagram },
    { Icon: Twitter, val: social.twitter },
    { Icon: Linkedin, val: social.linkedin },
  ].filter((i) => i.val);
  if (items.length === 0) return null;
  return (
    <div className="mt-8 flex gap-3">
      {items.map(({ Icon, val }, idx) => (
        <a
          key={idx}
          href={val.startsWith('http') ? val : `https://${val}`}
          className="flex h-10 w-10 items-center justify-center border opacity-70 hover:opacity-100"
          style={{ borderColor: 'rgb(255 255 255 / 0.2)' }}
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  );
}
