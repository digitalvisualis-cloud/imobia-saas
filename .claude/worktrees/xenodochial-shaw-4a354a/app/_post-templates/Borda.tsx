'use client';

import {
  type PostTemplateProps,
  formatPrecoCompleto,
  operacaoLabel,
  FORMATO_DIMENSOES,
} from './types';

/**
 * Template "Borda" — fundo branco/cream com borda colorida da marca.
 * Estilo boutique. Foto centralizada, dados organizados em torno.
 */
export function BordaTemplate({ imovel, marca, formato }: PostTemplateProps) {
  const dim = FORMATO_DIMENSOES[formato];
  const isStory = formato === 'STORY';
  const isVertical = formato === 'POST_VERTICAL';
  const tall = isStory || isVertical;
  const borderWidth = 24;

  return (
    <div
      style={{
        width: dim.w,
        height: dim.h,
        position: 'relative',
        background: '#faf8f3',
        padding: borderWidth,
        boxSizing: 'border-box',
        fontFamily: '"Inter", system-ui, sans-serif',
        border: `${borderWidth}px solid ${marca.corPrimaria}`,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          padding: 40,
          boxSizing: 'border-box',
        }}
      >
        {/* Header: Logo + tag operação */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 30,
          }}
        >
          {/* Logo / Nome */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {marca.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={marca.logoUrl}
                alt=""
                crossOrigin="anonymous"
                style={{ height: 50, maxWidth: 200, objectFit: 'contain' }}
              />
            ) : (
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: marca.corSecundaria,
                  letterSpacing: '-0.3px',
                }}
              >
                {marca.nomeEmpresa ?? '—'}
              </span>
            )}
          </div>

          <div
            style={{
              padding: '10px 22px',
              background: marca.corPrimaria,
              color: '#fff',
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              borderRadius: 4,
            }}
          >
            {operacaoLabel(imovel.operacao)}
          </div>
        </div>

        {/* Bairro */}
        {imovel.bairro && (
          <p
            style={{
              fontSize: 20,
              color: marca.corPrimaria,
              fontWeight: 700,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            📍 {imovel.bairro}
            {imovel.cidade && ` · ${imovel.cidade}`}
          </p>
        )}

        {/* Título */}
        <h1
          style={{
            fontSize: tall ? 52 : 44,
            fontWeight: 800,
            color: marca.corSecundaria,
            textAlign: 'center',
            lineHeight: 1.1,
            margin: '6px 0 20px',
            letterSpacing: '-0.5px',
          }}
        >
          {imovel.titulo}
        </h1>

        {/* Foto */}
        <div
          style={{
            flex: 1,
            background: '#eee',
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 24,
            minHeight: 0,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: imovel.capaUrl
                ? `url("${imovel.capaUrl}")`
                : `linear-gradient(135deg, ${marca.corPrimaria}, ${marca.corSecundaria})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
          {imovel.capaUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imovel.capaUrl}
              alt=""
              crossOrigin="anonymous"
              style={{ display: 'none' }}
            />
          )}
        </div>

        {/* Dados em grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${[
              imovel.areaM2,
              imovel.quartos,
              imovel.banheiros,
              imovel.vagas,
            ].filter((v) => (v ?? 0) > 0).length || 1}, 1fr)`,
            gap: 12,
            marginBottom: 18,
          }}
        >
          {imovel.areaM2 ? (
            <SpecBox label="Área" value={`${imovel.areaM2} m²`} cor={marca.corPrimaria} />
          ) : null}
          {imovel.quartos > 0 ? (
            <SpecBox
              label={imovel.quartos === 1 ? 'Quarto' : 'Quartos'}
              value={imovel.quartos}
              cor={marca.corPrimaria}
            />
          ) : null}
          {imovel.banheiros > 0 ? (
            <SpecBox
              label={imovel.banheiros === 1 ? 'Banheiro' : 'Banhs.'}
              value={imovel.banheiros}
              cor={marca.corPrimaria}
            />
          ) : null}
          {imovel.vagas > 0 ? (
            <SpecBox
              label={imovel.vagas === 1 ? 'Vaga' : 'Vagas'}
              value={imovel.vagas}
              cor={marca.corPrimaria}
            />
          ) : null}
        </div>

        {/* Preço grande */}
        <div
          style={{
            background: marca.corSecundaria,
            color: '#fff',
            padding: '20px 28px',
            borderRadius: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: 14,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              opacity: 0.7,
            }}
          >
            A partir de
          </span>
          <span
            style={{
              fontSize: tall ? 38 : 34,
              fontWeight: 800,
              letterSpacing: '-0.5px',
            }}
          >
            {formatPrecoCompleto(imovel.preco)}
          </span>
        </div>

        {/* Código */}
        <p
          style={{
            marginTop: 14,
            fontSize: 14,
            color: '#999',
            textAlign: 'center',
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}
        >
          Cód. {imovel.codigo}
        </p>
      </div>
    </div>
  );
}

function SpecBox({
  label,
  value,
  cor,
}: {
  label: string;
  value: string | number;
  cor: string;
}) {
  return (
    <div
      style={{
        background: '#faf8f3',
        border: `2px solid ${cor}20`,
        borderRadius: 8,
        padding: '14px 8px',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: cor,
          margin: 0,
          letterSpacing: '-0.5px',
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontSize: 11,
          color: '#666',
          marginTop: 6,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}
      >
        {label}
      </p>
    </div>
  );
}
