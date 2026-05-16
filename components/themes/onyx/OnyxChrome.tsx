'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import {
  FacebookIcon as Facebook,
  InstagramIcon as Instagram,
  LinkedinIcon as Linkedin,
  YoutubeIcon as Youtube,
  TiktokIcon as Tiktok,
} from '../_social-icons';
import type { Customization } from '@/types/site-customization';
import type { TenantPublic } from '@/app/_templates/types';

interface ChromeProps {
  config: Customization;
  tenant: TenantPublic;
}

function resolveBrandName(config: Customization, tenant: TenantPublic) {
  return (
    tenant.marca?.nomeEmpresa?.trim() ||
    config.header?.brandName?.trim() ||
    tenant.nome
  );
}

/**
 * Header compacto (h-12) preto. Logo esquerda + nav central + CTA direita.
 * Sem telefones inline — eles aparecem no rodape e na pagina do imovel.
 */
export function OnyxHeader({ config, tenant }: ChromeProps) {
  const brandName = resolveBrandName(config, tenant);
  const slug = tenant.slug;
  const logoUrl = tenant.marca?.logoUrl;
  const whatsapp = tenant.marca?.whatsapp?.replace(/\D/g, '') ?? '';
  const ctaHref = whatsapp ? `https://wa.me/${whatsapp}` : `/s/${slug}#contato`;

  const links = [
    { label: 'Início', href: `/s/${slug}` },
    { label: 'Comprar', href: `/s/${slug}?op=venda` },
    { label: 'Alugar', href: `/s/${slug}?op=aluguel` },
    { label: 'Sobre', href: `/s/${slug}#sobre` },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/95 text-white backdrop-blur">
      <div className="mx-auto flex h-12 max-w-[1500px] items-center justify-between gap-6 px-4 sm:px-6">
        {/* Logo */}
        <Link href={`/s/${slug}`} className="flex items-center gap-2 shrink-0">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={brandName} className="h-7 max-w-[140px] object-contain" />
          ) : (
            <span
              className="text-sm font-bold tracking-wider"
              style={{ fontFamily: 'var(--t-font-heading)' }}
            >
              {brandName.toUpperCase()}
            </span>
          )}
        </Link>

        {/* Nav central — escondido no mobile */}
        <nav className="hidden lg:flex items-center gap-6 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-white/80 hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>

        {/* CTA direita */}
        <div className="flex items-center gap-2">
          <a
            href={ctaHref}
            target={whatsapp ? '_blank' : undefined}
            rel="noopener"
            className="hidden sm:inline-flex items-center rounded-md px-4 py-1.5 text-sm font-semibold text-black hover:opacity-90"
            style={{ background: 'var(--t-primary)' }}
          >
            Entre em contato
          </a>
          <button type="button" className="lg:hidden p-1.5" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

/**
 * Footer 4 colunas, fundo preto, header em cor primaria.
 */
export function OnyxFooter({ config, tenant }: ChromeProps) {
  const brandName = resolveBrandName(config, tenant);
  const slug = tenant.slug;
  const marca = tenant.marca;

  const social = {
    instagram: marca?.instagram || config.social.instagram || '',
    facebook: marca?.facebook || config.social.facebook || '',
    linkedin: marca?.linkedin || config.social.linkedin || '',
    youtube: marca?.youtube || '',
    tiktok: marca?.tiktok || '',
  };
  const socialItems = [
    { Icon: Facebook, val: social.facebook },
    { Icon: Instagram, val: social.instagram },
    { Icon: Linkedin, val: social.linkedin },
    { Icon: Youtube, val: social.youtube },
    { Icon: Tiktok, val: social.tiktok },
  ].filter((i) => i.val);

  return (
    <footer className="mt-12 bg-black text-white">
      <div className="mx-auto max-w-[1500px] grid grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
        <FCol
          titulo="Quero Alugar"
          items={[
            { label: 'Residencial', href: `/s/${slug}?op=aluguel&tipo=CASA,APARTAMENTO` },
            { label: 'Comercial', href: `/s/${slug}?op=aluguel&tipo=SALA_COMERCIAL,LOJA` },
            { label: 'Anunciar meu Imóvel', href: `/s/${slug}#contato` },
          ]}
        />
        <FCol
          titulo="Quero Comprar"
          items={[
            { label: 'Residencial', href: `/s/${slug}?op=venda&tipo=CASA,APARTAMENTO` },
            { label: 'Comercial', href: `/s/${slug}?op=venda&tipo=SALA_COMERCIAL,LOJA` },
            { label: 'Anunciar meu Imóvel', href: `/s/${slug}#contato` },
          ]}
        />
        <FCol
          titulo="Proprietários"
          items={[
            { label: 'Anunciar Imóvel', href: `/s/${slug}#contato` },
            { label: 'Prestação de Contas', href: `/s/${slug}#contato` },
          ]}
        />
        <FCol
          titulo="Contato"
          items={[
            ...(marca?.whatsapp
              ? [{ label: 'WhatsApp', href: `https://wa.me/${marca.whatsapp.replace(/\D/g, '')}` }]
              : []),
            ...(marca?.telefone ? [{ label: marca.telefone, href: `tel:${marca.telefone}` }] : []),
            ...(marca?.email ? [{ label: marca.email, href: `mailto:${marca.email}` }] : []),
          ]}
        />
      </div>

      {(marca?.endereco || socialItems.length > 0) && (
        <div className="mx-auto max-w-[1500px] border-t border-white/10 px-6 py-8 grid gap-6 md:grid-cols-2 items-center">
          {marca?.endereco && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/50">Unidade Principal</p>
              <p className="text-sm mt-1 text-white/90">{marca.endereco}</p>
            </div>
          )}
          {socialItems.length > 0 && (
            <div className="flex gap-3 md:justify-end">
              {socialItems.map(({ Icon, val }, i) => (
                <a
                  key={i}
                  href={val.startsWith('http') ? val : `https://${val}`}
                  target="_blank"
                  rel="noopener"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 hover:border-white/40 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-white/10 py-5 text-center text-[11px] text-white/40">
        <div className="mx-auto flex max-w-[1500px] flex-col items-center justify-between gap-2 px-6 sm:flex-row">
          <span>© {new Date().getFullYear()} {brandName}. Todos os direitos reservados.</span>
          <nav className="flex gap-4">
            <a href={`/s/${slug}/privacidade`} className="hover:text-white">Privacidade</a>
            <a href={`/s/${slug}/termos`} className="hover:text-white">Termos</a>
            <a href={`/s/${slug}/cookies`} className="hover:text-white">Cookies</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

function FCol({
  titulo,
  items,
}: {
  titulo: string;
  items: Array<{ label: string; href: string }>;
}) {
  return (
    <div>
      <h4
        className="font-display text-sm font-bold uppercase tracking-wider mb-3"
        style={{ color: 'var(--t-primary)' }}
      >
        {titulo}
      </h4>
      <ul className="space-y-1.5 text-sm">
        {items.map((it) => (
          <li key={it.href + it.label}>
            <a href={it.href} className="text-white/70 hover:text-white">
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
