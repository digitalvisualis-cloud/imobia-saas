import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import styles from '../site.module.css';
import Link from 'next/link';

export default async function SiteHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { marca: true },
  });

  if (!tenant) notFound();

  // Busca os imóveis publicados desse tenant (paginação simplificada para a vitrine)
  const imoveis = await prisma.imovel.findMany({
    where: { 
      tenantId: tenant.id,
      publicado: true
    },
    orderBy: [
      { destaque: 'desc' },
      { createdAt: 'desc' }
    ],
    take: 20
  });

  return (
    <>
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          {tenant.marca?.slogan || 'Encontre o imóvel dos seus sonhos'}
        </h1>
        <p className={styles.heroSub}>
          {tenant.marca?.descricao || 'As melhores opções de compra, venda e locação selecionadas para você.'}
        </p>

        <form className={styles.searchBar} action={`/s/${slug}#imoveis`}>
          <input 
            name="q"
            type="text" 
            placeholder="Buscar por cidade, bairro ou código..." 
            className={styles.searchInput}
          />
          <select name="operacao" className={styles.searchSelect}>
            <option value="">Comprar ou Alugar?</option>
            <option value="VENDA">Venda</option>
            <option value="ALUGUEL">Aluguel</option>
          </select>
          <button type="submit" className={styles.searchBtn}>Buscar</button>
        </form>
      </section>

      <section id="imoveis" className={styles.container}>
        <h2 className={styles.sectionTitle}>
          Nossos Imóveis
        </h2>

        {imoveis.length === 0 ? (
          <p style={{ color: '#6b7280' }}>Nenhum imóvel disponível no momento.</p>
        ) : (
          <div className={styles.grid}>
            {imoveis.map((imovel) => (
              <Link 
                href={`/s/${slug}/imovel/${imovel.codigo}`} 
                key={imovel.id} 
                className={styles.card}
              >
                <img 
                  src={imovel.capaUrl || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'} 
                  alt={imovel.titulo} 
                  className={styles.cardImage} 
                />
                <div className={styles.cardBody}>
                  <div className={styles.cardType}>
                    {imovel.operacao} • {imovel.tipo}
                  </div>
                  <h3 className={styles.cardTitle}>{imovel.titulo}</h3>
                  <div className={styles.cardLocation}>
                    📍 {imovel.bairro ? `${imovel.bairro}, ` : ''}{imovel.cidade} - {imovel.estado}
                  </div>
                  
                  <div className={styles.cardFeatures}>
                    {imovel.quartos > 0 && (
                      <div className={styles.cardFeature}>🛏️ {imovel.quartos}</div>
                    )}
                    {imovel.banheiros > 0 && (
                      <div className={styles.cardFeature}>🚿 {imovel.banheiros}</div>
                    )}
                    {imovel.vagas > 0 && (
                      <div className={styles.cardFeature}>🚗 {imovel.vagas}</div>
                    )}
                    {imovel.areaM2 && (
                      <div className={styles.cardFeature}>📐 {Number(imovel.areaM2)}m²</div>
                    )}
                  </div>

                  <div className={styles.cardPrice}>
                    R$ {Number(imovel.preco).toLocaleString('pt-BR')}
                    {imovel.operacao === 'ALUGUEL' ? '/mês' : ''}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
