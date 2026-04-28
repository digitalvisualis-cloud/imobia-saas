import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import styles from '../../../site.module.css';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ slug: string, codigo: string }> }) {
  const { slug, codigo } = await params;
  const imovel = await prisma.imovel.findFirst({
    where: { codigo: codigo, tenant: { slug: slug } },
  });

  if (!imovel) return { title: 'Imóvel não encontrado' };

  return {
    title: `${imovel.titulo} - ${imovel.codigo}`,
    description: imovel.descricao?.substring(0, 160) || `Imóvel à ${imovel.operacao.toLowerCase()} em ${imovel.cidade}`,
    openGraph: {
      images: [imovel.capaUrl || ''],
    }
  };
}

export default async function PropertyDetail({ params }: { params: Promise<{ slug: string, codigo: string }> }) {
  const { slug, codigo } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug: slug },
    include: { marca: true, users: true },
  });

  if (!tenant) notFound();

  const imovel = await prisma.imovel.findFirst({
    where: { 
      codigo: codigo,
      tenantId: tenant.id,
      publicado: true
    }
  });

  if (!imovel) notFound();

  // Incrementa as visualizações silenciosamente
  await prisma.imovel.update({
    where: { id: imovel.id },
    data: { visualizacoes: { increment: 1 } }
  });

  const wppMessage = `Olá! Vi o imóvel código ${imovel.codigo} (${imovel.titulo}) no seu site e gostaria de mais informações.`;
  const wppLink = tenant.marca?.whatsapp 
    ? `https://wa.me/${tenant.marca.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(wppMessage)}`
    : null;

  return (
    <div className={styles.container}>
      <div style={{ marginBottom: '24px' }}>
        <Link href={`/s/${slug}`} style={{ color: 'var(--site-primary)', textDecoration: 'none', fontWeight: 500 }}>
          ← Voltar para imóveis
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        
        {/* Galeria Simples */}
        <div>
          <img 
            src={imovel.capaUrl || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'} 
            alt={imovel.titulo}
            style={{ width: '100%', height: '500px', objectFit: 'cover', borderRadius: '16px' }}
          />
          {imovel.imagens && imovel.imagens.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '12px' }}>
              {imovel.imagens.slice(0, 4).map((img, i) => (
                <img key={i} src={img} alt="Foto" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
              ))}
            </div>
          )}
        </div>

        {/* Informações */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
          
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <span style={{ background: 'var(--site-primary)', color: '#fff', padding: '4px 12px', borderRadius: '100px', fontSize: '14px', fontWeight: 600 }}>
                {imovel.operacao}
              </span>
              <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 12px', borderRadius: '100px', fontSize: '14px', fontWeight: 600 }}>
                {imovel.tipo}
              </span>
              <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 12px', borderRadius: '100px', fontSize: '14px', fontWeight: 600 }}>
                Cód: {imovel.codigo}
              </span>
            </div>

            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827', marginBottom: '8px', lineHeight: 1.2 }}>
              {imovel.titulo}
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '32px' }}>
              📍 {imovel.endereco ? `${imovel.endereco}, ` : ''}{imovel.bairro ? `${imovel.bairro}, ` : ''}{imovel.cidade} - {imovel.estado}
            </p>

            <div style={{ display: 'flex', gap: '24px', padding: '24px', background: '#f9fafb', borderRadius: '12px', marginBottom: '32px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem' }}>🛏️</div>
                <div style={{ fontWeight: 700, color: '#111827', marginTop: '4px' }}>{imovel.quartos}</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Quartos</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem' }}>🚿</div>
                <div style={{ fontWeight: 700, color: '#111827', marginTop: '4px' }}>{imovel.banheiros}</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Banheiros</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem' }}>🚗</div>
                <div style={{ fontWeight: 700, color: '#111827', marginTop: '4px' }}>{imovel.vagas}</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Vagas</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem' }}>📐</div>
                <div style={{ fontWeight: 700, color: '#111827', marginTop: '4px' }}>{Number(imovel.areaM2)}</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>m² Área</div>
              </div>
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px', color: '#111827' }}>Descrição</h2>
            <div style={{ color: '#4b5563', lineHeight: 1.8, fontSize: '1.05rem', whiteSpace: 'pre-line', marginBottom: '40px' }}>
              {imovel.descricao || 'Sem descrição detalhada.'}
            </div>

            {imovel.amenidades && imovel.amenidades.length > 0 && (
              <>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px', color: '#111827' }}>O que o imóvel oferece</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {imovel.amenidades.map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563' }}>
                      <span style={{ color: 'var(--site-primary)' }}>✓</span> {item}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sidebar Preço e Contato */}
          <div>
            <div style={{ position: 'sticky', top: '100px', background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6' }}>
              <div style={{ color: '#6b7280', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
                Valor de {imovel.operacao}
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--site-primary)', marginBottom: '24px' }}>
                R$ {Number(imovel.preco).toLocaleString('pt-BR')}
                <span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 500 }}>
                  {imovel.operacao === 'ALUGUEL' ? '/mês' : ''}
                </span>
              </div>

              {wppLink ? (
                <a 
                  href={wppLink} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ display: 'block', width: '100%', padding: '16px', background: '#25D366', color: '#fff', textAlign: 'center', borderRadius: '12px', fontWeight: 600, fontSize: '1.1rem', textDecoration: 'none', transition: 'opacity 0.2s' }}
                >
                  Falar no WhatsApp
                </a>
              ) : (
                <div style={{ padding: '16px', background: '#f3f4f6', color: '#4b5563', textAlign: 'center', borderRadius: '12px', fontWeight: 600 }}>
                  Contato não disponível
                </div>
              )}
              
              <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
                <div style={{ fontWeight: 600, color: '#111827', marginBottom: '4px' }}>{tenant.marca?.nomeEmpresa}</div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>CRECI {tenant.users?.[0]?.creci || 'Não informado'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
