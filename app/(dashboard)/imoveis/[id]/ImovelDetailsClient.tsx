'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ListaProTrigger from './ListaProTrigger';

export default function ImovelDetailsClient({ imovel, siteSlug }: { imovel: any; siteSlug?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'info' | 'listapro'>(searchParams.get('tab') === 'ia' ? 'listapro' : 'info');

  return (
    <div className="fade-in max-w-4xl">
      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/imoveis" className="text-muted hover:text-primary">← Voltar</Link>
            <span className="text-muted">/</span>
            <span className="text-xs font-mono bg-secondary p-1 rounded">{imovel.codigo}</span>
          </div>
          <h1 style={{ fontSize: '2rem' }}>{imovel.titulo}</h1>
        </div>
        <div className="flex gap-2">
          {siteSlug && (
            <Link href={`/s/${siteSlug}/imovel/${imovel.codigo}`} target="_blank" className="btn btn-secondary">
              👁️ Ver no Site
            </Link>
          )}
          <button className="btn btn-primary" onClick={() => setTab('listapro')}>
            ✨ Gerar Conteúdo
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        <button 
          onClick={() => setTab('info')} 
          style={{ padding: '8px 16px', background: 'transparent', border: 'none', borderBottom: tab === 'info' ? '2px solid var(--accent)' : '2px solid transparent', color: tab === 'info' ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer' }}
        >
          Informações
        </button>
        <button 
          onClick={() => setTab('listapro')} 
          style={{ padding: '8px 16px', background: 'transparent', border: 'none', borderBottom: tab === 'listapro' ? '2px solid var(--accent)' : '2px solid transparent', color: tab === 'listapro' ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer' }}
        >
          IA & Conteúdo
        </button>
      </div>

      {tab === 'info' && (
        <div className="grid-2 gap-6" style={{ gridTemplateColumns: '1fr 300px' }}>
          <div className="flex flex-col gap-6">
            <div className="card">
              <h3 className="mb-4">Detalhes Principais</h3>
              <div className="grid-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted">Tipo</p>
                  <p className="font-semibold">{imovel.tipo}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Operação</p>
                  <p className="font-semibold">{imovel.operacao}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Valor</p>
                  <p className="font-semibold text-green">R$ {Number(imovel.preco).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Status</p>
                  <p className="font-semibold">{imovel.status}</p>
                </div>
              </div>
              <p className="text-xs text-muted">Localização</p>
              <p className="font-medium">{imovel.endereco ? `${imovel.endereco}, ` : ''}{imovel.bairro ? `${imovel.bairro}, ` : ''}{imovel.cidade} - {imovel.estado}</p>
            </div>

            <div className="card">
              <h3 className="mb-4">Descrição</h3>
              <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{imovel.descricao || 'Sem descrição.'}</p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="card p-4">
              {imovel.capaUrl ? (
                <img src={imovel.capaUrl} alt="Capa" style={{ width: '100%', borderRadius: 'var(--radius)', aspectRatio: '4/3', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', aspectRatio: '4/3', background: 'var(--bg-hover)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 40 }}>🏠</span>
                </div>
              )}
            </div>
            
            <div className="card p-4">
              <h4 className="mb-3">Características</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li className="flex justify-between"><span className="text-muted">Área:</span> <span>{imovel.areaM2 ? `${Number(imovel.areaM2)}m²` : '-'}</span></li>
                <li className="flex justify-between"><span className="text-muted">Quartos:</span> <span>{imovel.quartos}</span></li>
                <li className="flex justify-between"><span className="text-muted">Banheiros:</span> <span>{imovel.banheiros}</span></li>
                <li className="flex justify-between"><span className="text-muted">Vagas:</span> <span>{imovel.vagas}</span></li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {tab === 'listapro' && (
        <ListaProTrigger imovel={imovel} />
      )}
    </div>
  );
}
