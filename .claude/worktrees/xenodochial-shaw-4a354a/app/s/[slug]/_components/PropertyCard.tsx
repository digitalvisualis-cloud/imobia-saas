import Link from 'next/link';
import styles from './property-card.module.css';

const FINALIDADE_LABELS: Record<string, string> = {
  VENDA: 'Venda',
  ALUGUEL: 'Aluguel',
  TEMPORADA: 'Temporada',
};

const TIPO_LABELS: Record<string, string> = {
  CASA: 'Casa',
  APARTAMENTO: 'Apartamento',
  COBERTURA: 'Cobertura',
  STUDIO: 'Studio',
  TERRENO: 'Terreno',
  SALA_COMERCIAL: 'Sala Comercial',
  LOJA: 'Loja',
  GALPAO: 'Galpão',
  CHACARA: 'Chácara',
  SITIO: 'Sítio',
};

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

export type PropertyCardData = {
  id: string;
  codigo: string;
  titulo: string;
  tipo: string;
  operacao: string;
  preco: number;
  bairro?: string | null;
  cidade?: string | null;
  quartos?: number | null;
  vagas?: number | null;
  areaM2?: number | null;
  capaUrl?: string | null;
  destaque?: boolean | null;
};

export function PropertyCard({
  imovel,
  slug,
}: {
  imovel: PropertyCardData;
  slug: string;
}) {
  const finalidadeLabel = FINALIDADE_LABELS[imovel.operacao] ?? imovel.operacao;
  const tipoLabel = TIPO_LABELS[imovel.tipo] ?? imovel.tipo;
  const isAluguel = imovel.operacao === 'ALUGUEL';

  return (
    <Link href={`/s/${slug}/imovel/${imovel.codigo}`} className={styles.card}>
      <div className={styles.imgWrapper}>
        {imovel.capaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imovel.capaUrl}
            alt={imovel.titulo}
            className={styles.img}
            loading="lazy"
          />
        ) : (
          <div className={styles.imgPlaceholder}>
            <span>🏠</span>
          </div>
        )}

        <div className={styles.badgesTop}>
          <span className={`${styles.badge} ${styles.badgePrimary}`}>{finalidadeLabel}</span>
          {imovel.destaque && (
            <span className={`${styles.badge} ${styles.badgeForest}`}>Destaque</span>
          )}
        </div>

        <span className={styles.badgeTipo}>{tipoLabel}</span>
      </div>

      <div className={styles.body}>
        <h3 className={styles.titulo}>{imovel.titulo}</h3>

        {(imovel.bairro || imovel.cidade) && (
          <p className={styles.localizacao}>
            <span aria-hidden>📍</span>
            {[imovel.bairro, imovel.cidade].filter(Boolean).join(', ')}
          </p>
        )}

        <p className={styles.preco}>
          {formatBRL(imovel.preco)}
          {isAluguel && <span className={styles.precoSufixo}>/mês</span>}
        </p>

        <div className={styles.specs}>
          {imovel.quartos != null && imovel.quartos > 0 && (
            <span className={styles.spec}>
              <span aria-hidden>🛏️</span> {imovel.quartos}
            </span>
          )}
          {imovel.vagas != null && imovel.vagas > 0 && (
            <span className={styles.spec}>
              <span aria-hidden>🚗</span> {imovel.vagas}
            </span>
          )}
          {imovel.areaM2 != null && imovel.areaM2 > 0 && (
            <span className={styles.spec}>
              <span aria-hidden>📐</span> {imovel.areaM2} m²
            </span>
          )}
        </div>

        <p className={styles.codigo}>
          Código: <span className={styles.codigoValue}>{imovel.codigo}</span>
        </p>
      </div>
    </Link>
  );
}
