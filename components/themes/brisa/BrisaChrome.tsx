import Link from 'next/link';
import { Phone } from 'lucide-react';
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

// Quando o cliente não mudou o nome da empresa no editor, o config ainda guarda
// "Sua Imobiliária" (o placeholder default). Cai pro nome real do tenant.
function resolveBrandName(config: Customization, tenant: TenantPublic): string {
  const fromConfig = config.header.brandName?.trim();
  if (fromConfig && fromConfig !== 'Sua Imobiliária') return fromConfig;
  return tenant.marca?.nomeEmpresa?.trim() || tenant.nome || fromConfig || 'Sua Imobiliária';
}

interface ChromeProps {
  config: Customization;
  tenant: TenantPublic;
}

export function BrisaHeader({ config, tenant }: ChromeProps) {
  const brandName = resolveBrandName(config, tenant);
  return (
    <header
      className="sticky top-0 z-30 w-full backdrop-blur"
      style={{
        backgroundColor: 'rgb(var(--t-fg-rgb) / 0.02)',
        borderBottom: '1px solid rgb(var(--t-fg-rgb) / 0.08)',
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 sm:py-5">
        <Link href={`/s/${tenant.slug}`} className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full font-bold"
            style={{
              background: 'var(--t-primary)',
              color: 'var(--t-bg)',
              fontFamily: 'var(--t-font-heading)',
            }}
          >
            {brandName.charAt(0)}
          </div>
          <div className="leading-tight">
            <div
              style={{ fontFamily: 'var(--t-font-heading)' }}
              className="text-lg font-semibold"
            >
              {brandName}
            </div>
            {tenant.marca?.endereco && (
              <div className="text-[10px] uppercase tracking-[0.2em] opacity-60">
                {tenant.marca.endereco.split(',')[0]}
              </div>
            )}
          </div>
        </Link>
        <nav className="hidden items-center gap-7 text-sm md:flex">
          {config.header.links.map((l, i) => (
            <Link
              key={i}
              href={resolveTo(tenant.slug, l.to)}
              className="opacity-70 hover:opacity-100"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <a
          href={config.header.ctaHref}
          className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
          style={{ background: 'var(--t-primary)', color: 'var(--t-bg)' }}
        >
          <Phone className="h-3.5 w-3.5" /> {config.header.ctaLabel}
        </a>
      </div>
    </header>
  );
}

export function BrisaFooter({ config, tenant }: ChromeProps) {
  const brandName = resolveBrandName(config, tenant);
  const slug = tenant.slug;
  return (
    <footer
      id="contato"
      className="mt-24 border-t"
      style={{
        borderColor: 'rgb(var(--t-fg-rgb) / 0.1)',
        background: 'rgb(var(--t-fg-rgb) / 0.03)',
      }}
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div>
          <div
            style={{ fontFamily: 'var(--t-font-heading)' }}
            className="text-xl font-semibold"
          >
            {brandName}
          </div>
          {tenant.marca?.endereco && (
            <p className="mt-3 text-sm opacity-70">{tenant.marca.endereco}</p>
          )}
          <SocialRow social={mergeSocial(tenant.marca, config.social)} />
        </div>
        <div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider opacity-60">
            Contato
          </div>
          {tenant.marca?.telefone && (
            <p className="text-sm opacity-80">{tenant.marca.telefone}</p>
          )}
          {tenant.marca?.email && <p className="text-sm opacity-80">{tenant.marca.email}</p>}
        </div>
        <div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider opacity-60">
            Imóveis
          </div>
          <ul className="space-y-1.5 text-sm">
            <li>
              <Link href={`/s/${slug}?op=venda`} className="opacity-80 hover:opacity-100">
                Comprar
              </Link>
            </li>
            <li>
              <Link href={`/s/${slug}?op=aluguel`} className="opacity-80 hover:opacity-100">
                Alugar
              </Link>
            </li>
            <li>
              <Link
                href={`/s/${slug}?op=lancamento`}
                className="opacity-80 hover:opacity-100"
              >
                Lançamentos
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider opacity-60">
            Empresa
          </div>
          <ul className="space-y-1.5 text-sm">
            <li>
              <Link href={`/s/${slug}#sobre`} className="opacity-80 hover:opacity-100">
                Sobre nós
              </Link>
            </li>
            <li className="opacity-50">Política de privacidade</li>
            <li className="opacity-50">Termos de uso</li>
          </ul>
        </div>
      </div>
      <div
        className="border-t py-5 text-xs opacity-60"
        style={{ borderColor: 'rgb(var(--t-fg-rgb) / 0.08)' }}
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 sm:flex-row">
          <span>© {new Date().getFullYear()} {brandName}. Todos os direitos reservados.</span>
          <nav className="flex gap-4">
            <a href={`/s/${slug}/privacidade`} className="hover:underline">Privacidade</a>
            <a href={`/s/${slug}/termos`} className="hover:underline">Termos de Uso</a>
            <a href={`/s/${slug}/cookies`} className="hover:underline">Cookies</a>
          </nav>
        </div>
      </div>
    </footer>
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

/**
 * Merge das redes sociais — fonte primaria eh o que o user salvou em
 * Configuracoes -> Redes Sociais (tenant.marca). Fallback eh o que ele
 * possa ter setado no editor de site (config.social). Sem isso, o user
 * salva em Configuracoes e nada aparece no site (bug antigo).
 */
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
    <div className="mt-4 flex gap-2.5">
      {items.map(({ Icon, val }, idx) => (
        <a
          key={idx}
          href={val.startsWith('http') ? val : `https://${val}`}
          target="_blank"
          rel="noopener"
          className="flex h-9 w-9 items-center justify-center rounded-full border opacity-70 hover:opacity-100"
          style={{ borderColor: 'rgb(var(--t-fg-rgb) / 0.15)' }}
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  );
}
