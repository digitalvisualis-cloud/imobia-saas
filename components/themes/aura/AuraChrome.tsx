import Link from 'next/link';
import { Menu } from 'lucide-react';
import {
  FacebookIcon as Facebook,
  InstagramIcon as Instagram,
  TwitterIcon as Twitter,
  LinkedinIcon as Linkedin,
  YoutubeIcon as Youtube,
  TiktokIcon as Tiktok,
} from '../_social-icons';
import type { Customization } from '@/types/site-customization';
import type { TenantPublic } from '@/app/_templates/types';

// Mapeia paths legados (de configs salvos antes) pro formato atual com filtros.
const LEGACY_PATH_REWRITE: Record<string, string> = {
  '/comprar': '/?op=venda',
  '/alugar': '/?op=aluguel',
  '/sobre': '/#sobre',
};

function resolveTo(slug: string, to: string) {
  const rewritten = LEGACY_PATH_REWRITE[to] ?? to;
  return `/s/${slug}${rewritten === '/' ? '' : rewritten}`;
}

function resolveBrandName(config: Customization, tenant: TenantPublic): string {
  const fromConfig = config.header.brandName?.trim();
  if (fromConfig && fromConfig !== 'Sua Imobiliária') return fromConfig;
  return tenant.marca?.nomeEmpresa?.trim() || tenant.nome || fromConfig || 'Sua Imobiliária';
}

interface ChromeProps {
  config: Customization;
  tenant: TenantPublic;
  /** true = header transparente sobre hero escuro (home). false = header solido com texto escuro (paginas internas). */
  transparent?: boolean;
}

export function AuraHeader({ config, tenant, transparent = true }: ChromeProps) {
  const brandName = resolveBrandName(config, tenant);
  // Cores variam conforme o contexto:
  // - Sobre hero escuro (home) → texto branco, bordas claras translucidas
  // - Sobre fundo claro (paginas internas) → texto escuro, bordas escuras translucidas
  const wrapClass = transparent
    ? 'absolute left-0 right-0 top-0 z-30'
    : 'sticky top-0 z-30 border-b border-black/10 bg-white/95 backdrop-blur';
  const linkColor = transparent ? 'text-white' : 'text-slate-900';
  const navColor = transparent ? 'text-white' : 'text-slate-900';
  const ctaBorder = transparent ? 'border-white/30 text-white hover:bg-white/10' : 'border-black/20 text-slate-900 hover:bg-black/5';
  const menuBorder = transparent ? 'border-white/30 text-white' : 'border-black/20 text-slate-900';

  return (
    <header className={wrapClass}>
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4 sm:px-8 sm:py-5">
        <Link href={`/s/${tenant.slug}`} className={linkColor}>
          <div
            style={{ fontFamily: 'var(--t-font-heading)' }}
            className="text-base tracking-wide sm:text-xl"
          >
            {brandName.toUpperCase()}
          </div>
          <div className="mt-0.5 text-[8px] tracking-[0.3em] opacity-70 sm:text-[9px] sm:tracking-[0.4em]">
            REAL ESTATE
          </div>
        </Link>
        <nav className={`hidden items-center gap-9 text-[12px] font-medium uppercase tracking-[0.2em] md:flex ${navColor}`}>
          {/* Menu fixo: nao depende de config (evita link orfao apontando pra pagina inexistente) */}
          <Link href={`/s/${tenant.slug}`} className="opacity-80 hover:opacity-100">Início</Link>
          <Link href={`/s/${tenant.slug}?op=venda`} className="opacity-80 hover:opacity-100">Comprar</Link>
          <Link href={`/s/${tenant.slug}?op=aluguel`} className="opacity-80 hover:opacity-100">Alugar</Link>
          <Link href={`/s/${tenant.slug}#anuncie`} className="opacity-80 hover:opacity-100">Anuncie</Link>
          <Link href={`/s/${tenant.slug}/blog`} className="opacity-80 hover:opacity-100">Blog</Link>
          <Link href={`/s/${tenant.slug}#sobre`} className="opacity-80 hover:opacity-100">Sobre</Link>
        </nav>
        <a
          href={config.header.ctaHref}
          className={`hidden items-center gap-2 border px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors md:inline-flex ${ctaBorder}`}
        >
          {config.header.ctaLabel}
        </a>
        <button
          type="button"
          className={`flex h-10 w-10 items-center justify-center rounded-full border md:hidden ${menuBorder}`}
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

export function AuraFooter({ config, tenant }: ChromeProps) {
  const brandName = resolveBrandName(config, tenant);
  const slug = tenant.slug;
  return (
    <footer
      id="contato"
      className="mt-32"
      style={{ background: 'var(--t-primary)', color: 'var(--t-bg)' }}
    >
      <div className="mx-auto grid max-w-[1500px] gap-8 px-4 py-12 sm:gap-12 sm:px-8 sm:py-20 md:grid-cols-12">
        <div className="md:col-span-5">
          <div
            style={{ fontFamily: 'var(--t-font-heading)' }}
            className="text-2xl leading-tight sm:text-4xl"
          >
            {brandName}.
            <br />
            <span style={{ color: 'var(--t-secondary)' }}>Curated estates.</span>
          </div>
          <p className="mt-6 max-w-sm text-sm opacity-70">
            {tenant.marca?.descricao ??
              'Curadoria de propriedades excepcionais.'}
          </p>
          <SocialRow social={mergeSocial(tenant.marca, config.social)} />
        </div>
        <FCol
          titulo="Navegação"
          items={[
            { label: 'Coleção', href: `/s/${slug}` },
            { label: 'Lançamentos', href: `/s/${slug}?op=lancamento` },
            { label: 'À venda', href: `/s/${slug}?op=venda` },
            { label: 'Aluguel', href: `/s/${slug}?op=aluguel` },
          ]}
        />
        <FCol titulo="Estúdio" items={[{ label: 'Sobre', href: `/s/${slug}#sobre` }]} />
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
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <span>© {new Date().getFullYear()} {brandName} · Todos os direitos reservados</span>
          <nav className="flex gap-5 normal-case tracking-normal">
            <a href={`/s/${tenant.slug}/privacidade`} className="hover:opacity-100">Privacidade</a>
            <a href={`/s/${tenant.slug}/termos`} className="hover:opacity-100">Termos</a>
            <a href={`/s/${tenant.slug}/cookies`} className="hover:opacity-100">Cookies</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

function FCol({ titulo, items }: { titulo: string; items: Array<{ label: string; href: string }> }) {
  return (
    <div className="md:col-span-2">
      <div className="text-[11px] uppercase tracking-[0.3em] opacity-60">{titulo}</div>
      <ul className="mt-4 space-y-2.5 text-sm">
        {items.map((i) => (
          <li key={i.label}>
            <Link href={i.href} className="opacity-90 hover:opacity-100">
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

type SocialMerged = {
  instagram: string;
  facebook: string;
  twitter: string;
  linkedin: string;
  youtube: string;
  tiktok: string;
};

function mergeSocial(
  marca: TenantPublic['marca'],
  configSocial: Customization['social'],
): SocialMerged {
  return {
    instagram: marca?.instagram || configSocial.instagram || '',
    facebook: marca?.facebook || configSocial.facebook || '',
    linkedin: marca?.linkedin || configSocial.linkedin || '',
    youtube: marca?.youtube || '',
    tiktok: marca?.tiktok || '',
    twitter: configSocial.twitter || '',
  };
}

function SocialRow({ social }: { social: SocialMerged }) {
  const items = [
    { Icon: Facebook, val: social.facebook },
    { Icon: Instagram, val: social.instagram },
    { Icon: Twitter, val: social.twitter },
    { Icon: Linkedin, val: social.linkedin },
    { Icon: Youtube, val: social.youtube },
    { Icon: Tiktok, val: social.tiktok },
  ].filter((i) => i.val);
  if (items.length === 0) return null;
  return (
    <div className="mt-8 flex gap-3">
      {items.map(({ Icon, val }, idx) => (
        <a
          key={idx}
          href={val.startsWith('http') ? val : `https://${val}`}
          target="_blank"
          rel="noopener"
          className="flex h-10 w-10 items-center justify-center border opacity-70 hover:opacity-100"
          style={{ borderColor: 'rgb(255 255 255 / 0.2)' }}
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  );
}
