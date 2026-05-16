'use client';

import Link from 'next/link';
import { Phone, MessageCircle, Heart, User, Menu } from 'lucide-react';
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

function formatPhone(raw: string): string {
  const d = (raw ?? '').replace(/\D/g, '');
  if (!d) return '';
  // BR mobile: +55 DDD 9XXXX-XXXX
  if (d.startsWith('55') && d.length === 13) {
    return `(${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  }
  // BR fixo: +55 DDD XXXX-XXXX
  if (d.startsWith('55') && d.length === 12) {
    return `(${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`;
  }
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return raw;
}

/**
 * Header compacto preto, fixo no topo. Logo + telefones inline + favoritos +
 * área do cliente + menu hamburguer. Densidade alta — inspirado em sites
 * de imobiliária boutique tipo Douglas Navarro.
 */
export function OnyxHeader({ config, tenant }: ChromeProps) {
  const brandName = resolveBrandName(config, tenant);
  const slug = tenant.slug;
  const logoUrl = tenant.marca?.logoUrl;
  const telefone = tenant.marca?.telefone ?? '';
  const whatsapp = tenant.marca?.whatsapp ?? '';

  const links = [
    { label: 'Início', href: `/s/${slug}` },
    { label: 'Comprar', href: `/s/${slug}?op=venda` },
    { label: 'Alugar', href: `/s/${slug}?op=aluguel` },
    { label: 'Sobre', href: `/s/${slug}#sobre` },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/95 text-white backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6">
        {/* Logo + telefones */}
        <div className="flex items-center gap-4 min-w-0">
          <Link href={`/s/${slug}`} className="flex items-center gap-2 shrink-0">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={brandName} className="h-7 max-w-[120px] object-contain" />
            ) : (
              <span
                className="font-display text-base font-bold tracking-wider"
                style={{ fontFamily: 'var(--t-font-heading)' }}
              >
                {brandName.toUpperCase()}
              </span>
            )}
          </Link>

          <div className="hidden md:flex items-center gap-3 text-[11px] text-white/70 border-l border-white/10 pl-4">
            {telefone && (
              <a href={`tel:${telefone}`} className="inline-flex items-center gap-1 hover:text-white">
                <Phone className="h-3 w-3" />
                {formatPhone(telefone)} <span className="text-white/40">Fixo</span>
              </a>
            )}
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 hover:text-white"
              >
                <MessageCircle className="h-3 w-3" />
                {formatPhone(whatsapp)} <span className="text-white/40">WhatsApp</span>
              </a>
            )}
          </div>
        </div>

        {/* Nav central + ações */}
        <div className="hidden lg:flex items-center gap-6 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-white/80 hover:text-white">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            className="hidden md:inline-flex items-center gap-1 text-white/70 hover:text-white"
            aria-label="Favoritos"
          >
            <Heart className="h-3.5 w-3.5" /> Favoritos
          </button>
          <button
            type="button"
            className="hidden md:inline-flex items-center gap-1 text-white/70 hover:text-white"
            aria-label="Área do cliente"
          >
            <User className="h-3.5 w-3.5" /> Área do Cliente
          </button>
          <button type="button" className="lg:hidden p-1.5" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

/**
 * Footer 4 colunas, fundo preto, header da seção em destaque (cor primária).
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
      {/* Faixa CTA */}
      <div
        className="border-y border-white/10 py-3 text-center text-sm font-medium"
        style={{ background: 'var(--t-primary)', color: '#0A0A0A' }}
      >
        <a href={`/s/${slug}#contato`} className="inline-flex items-center gap-2">
          <User className="h-4 w-4" /> Área do Cliente
        </a>
      </div>

      <div className="mx-auto max-w-[1500px] grid grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
        <FCol
          titulo="Quero Alugar"
          items={[
            { label: 'Residencial', href: `/s/${slug}?op=aluguel&tipo=CASA,APARTAMENTO` },
            { label: 'Comercial', href: `/s/${slug}?op=aluguel&tipo=SALA_COMERCIAL,LOJA` },
            { label: 'Anunciar meu Imóvel', href: `/s/${slug}#contato` },
            { label: 'Cadastrar Locação', href: `/s/${slug}#contato` },
          ]}
        />
        <FCol
          titulo="Quero Comprar"
          items={[
            { label: 'Residencial', href: `/s/${slug}?op=venda&tipo=CASA,APARTAMENTO` },
            { label: 'Comercial', href: `/s/${slug}?op=venda&tipo=SALA_COMERCIAL,LOJA` },
            { label: 'Anunciar meu Imóvel', href: `/s/${slug}#contato` },
            { label: 'Simular Financiamento', href: `/s/${slug}#contato` },
          ]}
        />
        <FCol
          titulo="Proprietários"
          items={[
            { label: 'Anunciar Imóvel', href: `/s/${slug}#contato` },
            { label: 'Extrato Proprietário', href: `/s/${slug}#contato` },
            { label: 'Prestação de Contas', href: `/s/${slug}#contato` },
          ]}
        />
        <FCol
          titulo="Inquilinos"
          items={[
            { label: 'Desocupação do Imóvel', href: `/s/${slug}#contato` },
            { label: 'Rateio e Reserva', href: `/s/${slug}#contato` },
            { label: '2ª via de Boleto', href: `/s/${slug}#contato` },
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
      <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-white/90 mb-3">
        {titulo}
      </h4>
      <ul className="space-y-1.5 text-sm">
        {items.map((it) => (
          <li key={it.href + it.label}>
            <a href={it.href} className="text-white/60 hover:text-white">
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
