'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { TenantContext } from './PublicLayout';
import styles from './header.module.css';

export function Header({ tenant }: { tenant: TenantContext }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const home = `/s/${tenant.slug}`;
  const nome = tenant.marca?.nomeEmpresa || tenant.nome;
  // Inicial pra logo placeholder (ex: "Pablo Medina" → "P")
  const inicial = nome.charAt(0).toUpperCase();
  // Subtitle: usa nome do dono ou tagline curto
  const subtitle = (tenant.marca as any)?.subtitle || 'IMÓVEIS';

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href={home} className={styles.brand}>
          {tenant.marca?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.marca.logoUrl} alt={nome} className={styles.logo} />
          ) : (
            // Logo placeholder hexagonal estilo Lovable
            <svg
              className={styles.logoFallback}
              viewBox="0 0 60 60"
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
          <span className={styles.brandText}>
            <span className={styles.brandName}>{nome}</span>
            <span className={styles.brandSubtitle}>{subtitle}</span>
          </span>
        </Link>

        <nav className={styles.nav}>
          <Link href={home} className={styles.navLink}>
            Início
          </Link>
          <Link href={`${home}#imoveis`} className={styles.navLink}>
            Imóveis
          </Link>
          <Link href={`${home}#contato`} className={styles.navLink}>
            Contato
          </Link>
        </nav>

        <button
          className={styles.menuBtn}
          onClick={() => setMobileOpen((p) => !p)}
          aria-label="Menu"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {mobileOpen && (
        <div className={styles.mobileMenu}>
          <Link href={home} onClick={() => setMobileOpen(false)} className={styles.mobileLink}>
            Início
          </Link>
          <Link
            href={`${home}#imoveis`}
            onClick={() => setMobileOpen(false)}
            className={styles.mobileLink}
          >
            Imóveis
          </Link>
          <Link
            href={`${home}#contato`}
            onClick={() => setMobileOpen(false)}
            className={styles.mobileLink}
          >
            Contato
          </Link>
        </div>
      )}
    </header>
  );
}
