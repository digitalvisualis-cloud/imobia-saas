'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './imoveis.module.css';

export default function ImoveisClient({ imoveis }: { imoveis: any[] }) {
  const router = useRouter();
  const [view, setView] = useState<'grid'|'table'>('grid');
  const [filter, setFilter] = useState('');
  const [tipo, setTipo] = useState('');

  const filtered = imoveis.filter(i => {
    const searchString = `${i.titulo} ${i.endereco} ${i.cidade} ${i.codigo}`.toLowerCase();
    const matchSearch = searchString.includes(filter.toLowerCase());
    const matchTipo = !tipo || i.tipo.toLowerCase() === tipo.toLowerCase();
    return matchSearch && matchTipo;
  });

  const statusColor: Record<string,string> = {
    'DISPONIVEL': 'badge-green',
    'RESERVADO': 'badge-yellow',
    'VENDIDO': 'badge-gray',
    'ALUGADO': 'badge-blue',
    'INATIVO': 'badge-red',
  };

  const iaStatusLabel: Record<string, { label: string; color: string }> = {
    'GERANDO': { label: '⏳ Gerando IA...', color: 'badge-yellow' },
    'PRONTO': { label: '✨ IA Pronto', color: 'badge-green' },
    'ERRO': { label: '❌ Erro IA', color: 'badge-red' },
  };

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6" style={{ flexWrap:'wrap', gap:12 }}>
        <div>
          <h1>Imóveis</h1>
          <p className="text-muted">Gerencie seu portfólio completo</p>
        </div>
        <Link href="/imoveis/novo" className="btn btn-primary">+ Cadastrar Imóvel</Link>
      </div>

      {/* FILTERS */}
      <div className="flex gap-2 mb-6" style={{ flexWrap:'wrap' }}>
        <input className="input" style={{ width:260 }} placeholder="🔍 Buscar imóvel ou endereço..." value={filter} onChange={e=>setFilter(e.target.value)} />
        <select className="input" style={{ width:160 }} value={tipo} onChange={e=>setTipo(e.target.value)}>
          <option value="">Todos os tipos</option>
          <option value="apartamento">Apartamento</option>
          <option value="casa">Casa</option>
          <option value="cobertura">Cobertura</option>
          <option value="studio">Studio</option>
          <option value="terreno">Terreno</option>
          <option value="comercial">Comercial</option>
        </select>
        <div className="flex gap-1 ml-auto">
          <button className={`btn btn-sm ${view==='grid'?'btn-primary':'btn-secondary'}`} onClick={()=>setView('grid')}>⊞ Grid</button>
          <button className={`btn btn-sm ${view==='table'?'btn-primary':'btn-secondary'}`} onClick={()=>setView('table')}>≡ Tabela</button>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="card text-center p-6">
          <p className="text-muted">Nenhum imóvel encontrado.</p>
        </div>
      )}

      {/* GRID VIEW */}
      {view === 'grid' && (
        <div className={styles.grid}>
          {filtered.map(im => (
            <div key={im.id} className={styles.imovelCard} onClick={() => router.push(`/imoveis/${im.id}`)} style={{cursor:'pointer'}}>
              <div className={styles.imovelPhoto}>
                {im.capaUrl ? (
                  <img src={im.capaUrl} alt={im.titulo} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                ) : (
                  <span className={styles.imovelPhotoIcon}>🏠</span>
                )}
                <span className={`badge ${statusColor[im.status]} ${styles.statusBadge}`}>{im.status}</span>
                {im.imagens?.length > 0 && <span className={styles.fotoCount}>📷 {im.imagens.length}</span>}
              </div>
              <div className={styles.imovelInfo}>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="badge badge-purple">{im.tipo}</span>
                  <span className="badge badge-gray">{im.operacao}</span>
                  {im.statusGeracao && iaStatusLabel[im.statusGeracao] && (
                    <span className={`badge ${iaStatusLabel[im.statusGeracao].color}`}>
                      {iaStatusLabel[im.statusGeracao].label}
                    </span>
                  )}
                </div>
                <h4 className={styles.imovelTitle}>{im.titulo}</h4>
                <p className="text-xs text-muted mt-1">📍 {im.bairro ? `${im.bairro}, ` : ''}{im.cidade}</p>
                <p className={styles.imovelValor}>
                  R$ {Number(im.preco).toLocaleString('pt-BR')}
                </p>
                <div className={styles.imovelSpecs}>
                  {im.quartos > 0 && <span>🛏 {im.quartos}q</span>}
                  {im.banheiros > 0 && <span>🚿 {im.banheiros}b</span>}
                  {im.vagas > 0 && <span>🚗 {im.vagas}v</span>}
                  {im.areaM2 > 0 && <span>📐 {Number(im.areaM2)}m²</span>}
                </div>
                <div className={styles.imovelActions} style={{ marginTop: 'auto', paddingTop: 12 }}>
                  <Link href={`/imoveis/${im.id}?tab=ia`} className="btn btn-secondary btn-sm" style={{flex: 1}} onClick={e=>e.stopPropagation()}>✨ Gerar Conteúdo</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TABLE VIEW */}
      {view === 'table' && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Imóvel</th><th>Tipo</th><th>Valor</th><th>Área</th><th>Quartos</th><th>Status</th><th>Conteúdo IA</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(im => (
                <tr key={im.id}>
                  <td>
                    <p className="font-medium">{im.titulo}</p>
                    <p className="text-xs text-muted">{im.codigo} • {im.cidade}</p>
                  </td>
                  <td><span className="badge badge-purple">{im.tipo}</span></td>
                  <td className="font-semibold text-green">R$ {Number(im.preco).toLocaleString('pt-BR')}</td>
                  <td>{im.areaM2 ? `${Number(im.areaM2)}m²` : '-'}</td>
                  <td>{im.quartos || '-'}</td>
                  <td><span className={`badge ${statusColor[im.status]}`}>{im.status}</span></td>
                  <td>
                    {im.statusGeracao && iaStatusLabel[im.statusGeracao]
                      ? <span className={`badge ${iaStatusLabel[im.statusGeracao].color}`}>{iaStatusLabel[im.statusGeracao].label}</span>
                      : <span className="text-muted text-xs">—</span>}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <Link href={`/imoveis/${im.id}`} className="btn btn-secondary btn-sm">Abrir</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
