/**
 * Layout do site público do tenant.
 * Aplica o brand kit (cores e logo) via CSS variables inline,
 * sobrescrevendo as variables globais só dentro desse layout.
 */
import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { WhatsAppButton } from './WhatsAppButton';
import styles from './public-layout.module.css';

export type BrandKit = {
  nomeEmpresa: string | null;
  slogan: string | null;
  descricao: string | null;
  logoUrl: string | null;
  corPrimaria: string | null;
  corSecundaria: string | null;
  whatsapp: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  linkedin: string | null;
  tiktok: string | null;
};

export type TenantContext = {
  slug: string;
  nome: string;
  marca: BrandKit | null;
};

export function PublicLayout({
  tenant,
  children,
}: {
  tenant: TenantContext;
  children: ReactNode;
}) {
  // Override de CSS vars do globals.css com as cores do tenant
  // (se vazias, mantém o tema dourado/floresta padrão do Lovable)
  const themeStyle: React.CSSProperties = {};
  if (tenant.marca?.corPrimaria) {
    // override da cor de destaque (preço, badges, links)
    (themeStyle as Record<string, string>)['--accent'] = tenant.marca.corPrimaria;
    (themeStyle as Record<string, string>)['--accent-light'] = tenant.marca.corPrimaria;
    (themeStyle as Record<string, string>)['--accent-glow'] = `${tenant.marca.corPrimaria}33`;
  }
  if (tenant.marca?.corSecundaria) {
    (themeStyle as Record<string, string>)['--forest'] = tenant.marca.corSecundaria;
  }

  return (
    <div className={styles.layout} style={themeStyle}>
      <Header tenant={tenant} />
      <main className={styles.main}>{children}</main>
      <Footer tenant={tenant} />
      <WhatsAppButton tenant={tenant} />
    </div>
  );
}
