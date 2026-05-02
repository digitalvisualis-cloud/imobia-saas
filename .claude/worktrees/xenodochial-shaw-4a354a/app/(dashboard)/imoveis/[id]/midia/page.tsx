'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import styles from './midia.module.css';

interface ImovelData {
  id: string;
  codigo: string;
  titulo: string;
  preco: number;
  operacao: string;
  cidade: string;
  bairro?: string;
  quartos: number;
  banheiros: number;
  vagas: number;
  areaM2?: number;
  capaUrl?: string;
  amenidades: string[];
}

export default function MidiaGerador({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [imovel, setImovel] = useState<ImovelData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [gerando, setGerando] = useState(false);
  const [formato, setFormato] = useState('INSTAGRAM_FEED');
  const [resultado, setResultado] = useState('');

  useEffect(() => {
    // Busca o imóvel pelo ID - simulando fetch na API (quando estiver pronto, trocar por fetch real)
    fetch(`/api/imoveis?q=${id}`)
      .then(res => res.json())
      .then(data => {
        // Encontra o imóvel específico
        const item = data.data?.find((i: any) => i.id === id || i.codigo === id);
        if (item) setImovel(item);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function gerarPost() {
    if (!imovel) return;
    setGerando(true);
    setResultado('');

    try {
      const res = await fetch('/api/ia/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imovel,
          formato,
          corretorNome: 'Corretor Associado', // Poderia vir do user session
          corretorWhatsapp: '(11) 99999-9999'
        })
      });

      const data = await res.json();
      setResultado(data.conteudo);
    } catch (err) {
      alert('Erro ao gerar post');
    } finally {
      setGerando(false);
    }
  }

  if (loading) return <div className="p-8">Carregando imóvel...</div>;
  if (!imovel) return <div className="p-8">Imóvel não encontrado.</div>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>← Voltar</button>
        <h1 className={styles.title}>Gerador de Mídias (IA)</h1>
      </header>

      <div className={styles.container}>
        <div className={styles.imovelCard}>
          <img 
            src={imovel.capaUrl || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'} 
            className={styles.capa} 
          />
          <div className={styles.info}>
            <span className={styles.badge}>{imovel.codigo}</span>
            <h3 className={styles.imovelTitle}>{imovel.titulo}</h3>
            <p className={styles.imovelLoc}>{imovel.cidade}</p>
            <p className={styles.imovelPrice}>R$ {Number(imovel.preco).toLocaleString('pt-BR')}</p>
          </div>
        </div>

        <div className={styles.mainArea}>
          <div className={styles.sidebar}>
            <h2 className={styles.sectionTitle}>Escolha o formato</h2>
            <div className={styles.formatos}>
              <button 
                className={`${styles.fmtBtn} ${formato === 'INSTAGRAM_FEED' ? styles.fmtActive : ''}`}
                onClick={() => setFormato('INSTAGRAM_FEED')}
              >
                📸 Post Instagram (Legenda Longa)
              </button>
              <button 
                className={`${styles.fmtBtn} ${formato === 'INSTAGRAM_STORIES' ? styles.fmtActive : ''}`}
                onClick={() => setFormato('INSTAGRAM_STORIES')}
              >
                📱 Story Instagram (Texto Curto)
              </button>
              <button 
                className={`${styles.fmtBtn} ${formato === 'WHATSAPP' ? styles.fmtActive : ''}`}
                onClick={() => setFormato('WHATSAPP')}
              >
                💬 Disparo WhatsApp
              </button>
            </div>

            <button 
              className={`btn btn-primary w-full mt-6 ${styles.gerarBtn}`}
              onClick={gerarPost}
              disabled={gerando}
            >
              {gerando ? '✨ Gerando com IA...' : '✨ Gerar Copy'}
            </button>
          </div>

          <div className={styles.resultadoArea}>
            <h2 className={styles.sectionTitle}>Resultado</h2>
            <div className={styles.previewBox}>
              {gerando ? (
                <div className={styles.loadingPulse}>A Inteligência Artificial está escrevendo...</div>
              ) : resultado ? (
                <>
                  <textarea 
                    className={styles.textArea} 
                    value={resultado} 
                    onChange={e => setResultado(e.target.value)} 
                  />
                  <button 
                    className={styles.copyBtn}
                    onClick={() => {
                      navigator.clipboard.writeText(resultado);
                      alert('Copiado para a área de transferência!');
                    }}
                  >
                    📋 Copiar Texto
                  </button>
                </>
              ) : (
                <div className={styles.emptyState}>
                  Selecione o formato e clique em "Gerar Copy" para criar uma legenda profissional instantânea.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
