'use client';
import Link from 'next/link';
import type { SerializedImovel } from '@/lib/serialize';

export default function ImovelDetailsClient({
  imovel,
  siteSlug,
}: {
  imovel: SerializedImovel;
  siteSlug?: string;
}) {
  const fotosCount = imovel.imagens?.length ?? 0;

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
          <Link href={`/imoveis/${imovel.id}/editar`} className="btn btn-primary">
            ✏️ Editar
          </Link>
          <Link href={`/imoveis/${imovel.id}/fotos`} className="btn btn-secondary">
            📸 Fotos {fotosCount > 0 ? `(${fotosCount})` : ''}
          </Link>
          {siteSlug && (
            <Link href={`/s/${siteSlug}/imovel/${imovel.codigo}`} target="_blank" className="btn btn-secondary">
              👁️ Ver no Site
            </Link>
          )}
        </div>
      </div>

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
            <p className="font-medium">
              {imovel.endereco ? `${imovel.endereco}, ` : ''}
              {imovel.bairro ? `${imovel.bairro}, ` : ''}
              {imovel.cidade} - {imovel.estado}
            </p>
          </div>

          {imovel.descricao && (
            <div className="card">
              <h3 className="mb-4">Descrição</h3>
              <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{imovel.descricao}</p>
            </div>
          )}

          {imovel.amenidades && imovel.amenidades.length > 0 && (
            <div className="card">
              <h3 className="mb-4">Características e diferenciais</h3>
              <div className="flex" style={{ flexWrap: 'wrap', gap: 8 }}>
                {imovel.amenidades.map((a) => (
                  <span key={a} className="badge badge-gray">{a}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="card p-4">
            {imovel.capaUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imovel.capaUrl}
                alt="Capa"
                style={{ width: '100%', borderRadius: 'var(--radius)', aspectRatio: '4/3', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  aspectRatio: '4/3',
                  background: 'var(--bg-hover)',
                  borderRadius: 'var(--radius)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: 40 }}>🏠</span>
              </div>
            )}
            <Link
              href={`/imoveis/${imovel.id}/fotos`}
              className="btn btn-secondary btn-sm w-full mt-3"
            >
              {fotosCount > 0 ? 'Gerenciar fotos' : 'Adicionar fotos'}
            </Link>
          </div>

          <div className="card p-4">
            <h4 className="mb-3">Especificações</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li className="flex justify-between">
                <span className="text-muted">Quartos:</span>
                <span>{imovel.quartos}</span>
              </li>
              {imovel.suites > 0 && (
                <li className="flex justify-between">
                  <span className="text-muted">Suítes:</span>
                  <span>{imovel.suites}</span>
                </li>
              )}
              <li className="flex justify-between">
                <span className="text-muted">Banheiros:</span>
                <span>{imovel.banheiros}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted">Vagas:</span>
                <span>{imovel.vagas}</span>
              </li>
              {imovel.areaM2 != null && (
                <li className="flex justify-between">
                  <span className="text-muted">Área útil:</span>
                  <span>{Number(imovel.areaM2)} m²</span>
                </li>
              )}
              {imovel.areaTerrenoM2 != null && (
                <li className="flex justify-between">
                  <span className="text-muted">Área terreno:</span>
                  <span>{Number(imovel.areaTerrenoM2)} m²</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* "Marketing & Conteúdo IA" — virá em breve, na frente F3 do roadmap */}
    </div>
  );
}
