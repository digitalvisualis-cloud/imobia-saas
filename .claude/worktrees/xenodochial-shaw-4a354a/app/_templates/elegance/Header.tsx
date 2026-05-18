'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { TenantPublic } from '../types';

export function Header({ tenant }: { tenant: TenantPublic }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const home = `/s/${tenant.slug}`;
  const nome = tenant.marca?.nomeEmpresa || tenant.nome;
  const inicial = nome.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 bg-secondary/95 backdrop-blur-md border-b border-primary/10">
      <div className="container mx-auto px-4 flex items-center justify-between h-16 md:h-20">
        <Link href={home} className="flex items-center gap-3">
          {tenant.marca?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.marca.logoUrl}
              alt={nome}
              className="h-10 md:h-12 w-auto"
            />
          ) : (
            <svg
              viewBox="0 0 60 60"
              className="h-10 md:h-12 w-10 md:w-12 text-primary shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <polygon
                points="30,4 54,18 54,42 30,56 6,42 6,18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <text
                x="30"
                y="38"
                textAnchor="middle"
                fontFamily="Cormorant Garamond, serif"
                fontSize="22"
                fontWeight="600"
                fill="currentColor"
              >
                {inicial}
              </text>
            </svg>
          )}
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="font-display text-lg md:text-xl font-semibold text-primary tracking-wide">
              {nome}
            </span>
            <span className="font-body text-[0.6rem] tracking-[0.32em] text-secondary-foreground/55 mt-0.5">
              IMÓVEIS
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            href={home}
            className="text-sm font-body text-secondary-foreground/80 hover:text-primary transition-colors"
          >
            Início
          </Link>
          <Link
            href={`${home}#imoveis`}
            className="text-sm font-body text-secondary-foreground/80 hover:text-primary transition-colors"
          >
            Imóveis
          </Link>
          <Link
            href={`${home}#contato`}
            className="text-sm font-body text-secondary-foreground/80 hover:text-primary transition-colors"
          >
            Contato
          </Link>
        </nav>

        <button
          className="md:hidden text-secondary-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-secondary border-t border-primary/10 px-4 py-4 space-y-3">
          <Link
            href={home}
            onClick={() => setMobileOpen(false)}
            className="block text-sm text-secondary-foreground/80 hover:text-primary"
          >
            Início
          </Link>
          <Link
            href={`${home}#imoveis`}
            onClick={() => setMobileOpen(false)}
            className="block text-sm text-secondary-foreground/80 hover:text-primary"
          >
            Imóveis
          </Link>
          <Link
            href={`${home}#contato`}
            onClick={() => setMobileOpen(false)}
            className="block text-sm text-secondary-foreground/80 hover:text-primary"
          >
            Contato
          </Link>
        </div>
      )}
    </header>
  );
}
