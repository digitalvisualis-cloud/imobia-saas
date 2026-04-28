import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import styles from '../site.module.css';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { marca: true },
  });

  if (!tenant) return { title: 'Página não encontrada' };

  return {
    title: tenant.marca?.nomeEmpresa || 'Catálogo de Imóveis',
    description: tenant.marca?.slogan || 'Encontre seu imóvel ideal.',
    icons: {
      icon: tenant.marca?.faviconUrl || '/favicon.ico',
    },
  };
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { marca: true },
  });

  if (!tenant) {
    notFound();
  }

  const marca = tenant.marca;
  const corPrimaria = marca?.corPrimaria || '#7c3aed';
  
  // O layout wrapper injeta as variáveis CSS para o tenant
  return (
    <div 
      className={styles.siteLayout}
      style={{
        '--site-primary': corPrimaria,
      } as React.CSSProperties}
    >
      <header className={styles.header}>
        <Link href={`/s/${slug}`} className={styles.logo}>
          {marca?.logoUrl ? (
            <img src={marca.logoUrl} alt={marca.nomeEmpresa || 'Logo'} />
          ) : (
            marca?.nomeEmpresa || 'Sua Logo'
          )}
        </Link>
        
        <nav className={styles.nav}>
          <Link href={`/s/${slug}`} className={styles.navLink}>Início</Link>
          <a href="#imoveis" className={styles.navLink}>Imóveis</a>
          {marca?.whatsapp && (
            <a 
              href={`https://wa.me/${marca.whatsapp.replace(/\D/g, '')}`} 
              target="_blank" 
              rel="noreferrer"
              className={styles.contactBtn}
            >
              Falar no WhatsApp
            </a>
          )}
        </nav>
      </header>

      <main className={styles.main}>
        {children}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>{marca?.nomeEmpresa || 'Catálogo de Imóveis'}</div>
            <p className={styles.footerDesc}>{marca?.slogan || 'Encontre o imóvel dos seus sonhos conosco.'}</p>
            
            <div className={styles.socialLinks}>
              {marca?.instagram && <a href={marca.instagram} target="_blank" rel="noreferrer" className={styles.socialIcon}>IG</a>}
              {marca?.facebook && <a href={marca.facebook} target="_blank" rel="noreferrer" className={styles.socialIcon}>FB</a>}
            </div>
          </div>
          
          <div className={styles.footerLinks}>
            <h3>Contato</h3>
            <ul>
              {marca?.whatsapp && <li>WhatsApp: {marca.whatsapp}</li>}
              {marca?.email && <li>Email: {marca.email}</li>}
              {marca?.endereco && <li>{marca.endereco}</li>}
            </ul>
          </div>
        </div>
        <div className={styles.footerBottom}>
          © {new Date().getFullYear()} {marca?.nomeEmpresa}. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
