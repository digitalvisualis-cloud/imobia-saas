import Link from 'next/link';
import type { TenantContext } from './PublicLayout';
import styles from './footer.module.css';

export function Footer({ tenant }: { tenant: TenantContext }) {
  const home = `/s/${tenant.slug}`;
  const nome = tenant.marca?.nomeEmpresa || tenant.nome;
  const m = tenant.marca;
  const ano = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Brand + contato */}
          <div className={styles.col}>
            <h3 className={styles.colTitle}>{nome}</h3>
            {m?.descricao && <p className={styles.about}>{m.descricao}</p>}
            <ul className={styles.contactList}>
              {m?.endereco && (
                <li>
                  <span className={styles.icon}>📍</span>
                  {m.endereco}
                </li>
              )}
              {m?.whatsapp && (
                <li>
                  <span className={styles.icon}>📱</span>
                  {m.whatsapp}
                </li>
              )}
              {m?.telefone && (
                <li>
                  <span className={styles.icon}>☎️</span>
                  {m.telefone}
                </li>
              )}
              {m?.email && (
                <li>
                  <span className={styles.icon}>✉️</span>
                  {m.email}
                </li>
              )}
            </ul>
          </div>

          {/* Links */}
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Links</h4>
            <ul className={styles.linkList}>
              <li>
                <Link href={home}>Início</Link>
              </li>
              <li>
                <Link href={`${home}#imoveis`}>Imóveis</Link>
              </li>
              <li>
                <Link href={`${home}#contato`}>Contato</Link>
              </li>
            </ul>
          </div>

          {/* Redes sociais */}
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Redes sociais</h4>
            <ul className={styles.socials}>
              {m?.instagram && (
                <li>
                  <a href={m.instagram} target="_blank" rel="noopener noreferrer">
                    Instagram
                  </a>
                </li>
              )}
              {m?.facebook && (
                <li>
                  <a href={m.facebook} target="_blank" rel="noopener noreferrer">
                    Facebook
                  </a>
                </li>
              )}
              {m?.youtube && (
                <li>
                  <a href={m.youtube} target="_blank" rel="noopener noreferrer">
                    YouTube
                  </a>
                </li>
              )}
              {m?.linkedin && (
                <li>
                  <a href={m.linkedin} target="_blank" rel="noopener noreferrer">
                    LinkedIn
                  </a>
                </li>
              )}
              {m?.tiktok && (
                <li>
                  <a href={m.tiktok} target="_blank" rel="noopener noreferrer">
                    TikTok
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className={styles.copyright}>
          © {ano} {nome}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
