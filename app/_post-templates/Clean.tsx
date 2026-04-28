'use client';

import {
  type PostTemplateProps,
  formatPrecoCompleto,
  operacaoLabel,
  FORMATO_DIMENSOES,
} from './types';

/**
 * Template "Clean" — foto cheia + barra inferior com gradient escuro.
 * Logo no canto superior direito (semi-transparente).
 * Cor primária aplicada na borda esquerda do bloco preço.
 */
export function CleanTemplate({ imovel, marca, formato }: PostTemplateProps) {
  const dim = FORMATO_DIMENSOES[formato];
  const isStory = formato === 'STORY';
  const isVertical = formato === 'POST_VERTICAL';
  const tall = isStory || isVertical;

  const specs = [
    imovel.areaM2 ? `${imovel.areaM2} m²` : null,
    imovel.quartos > 0 ? `${imovel.quartos} ${imovel.quartos === 1 ? 'quarto' : 'quartos'}` : null,
    imovel.banheiros > 0
      ? `${imovel.banheiros} ${imovel.banheiros === 1 ? 'banh.' : 'banhs.'}`
      : null,
    imovel.vagas > 0 ? `${imovel.vagas} ${imovel.vagas === 1 ? 'vaga' : 'vagas'}` : null,
  ].filter(Boolean) as string[];

  return (
    <div
      style={{
        width: dim.w,
        height: dim.h,
        position: 'relative',
        overflow: 'hidden',
        background: '#1a1a1a',
        fontFamily: '"Inter", system-ui, sans-serif',
      }}
    >
      {/* Foto cheia de fundo — usa background-image (html2canvas respeita cover) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: imovel.capaUrl
            ? `url("${imovel.capaUrl}")`
            : `linear-gradient(135deg, ${marca.corPrimaria}, ${marca.corSecundaria})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* img invisível pra forçar html2canvas a esperar a imagem carregar */}
      {imovel.capaUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imovel.capaUrl}
          alt=""
          crossOrigin="anonymous"
          style={{ display: 'none' }}
        />
      )}

      {/* Tag operação no topo esquerdo */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 40,
          padding: '12px 24px',
          background: marca.corPrimaria,
          color: '#fff',
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          borderRadius: 6,
        }}
      >
        {operacaoLabel(imovel.operacao)}
      </div>

      {/* Logo / Nome no canto sup direito */}
      {(marca.logoUrl || marca.nomeEmpresa) && (
        <div
          style={{
            position: 'absolute',
            top: 40,
            right: 40,
            padding: '12px 20px',
            background: 'rgba(255,255,255,0.92)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {marca.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={marca.logoUrl}
              alt=""
              crossOrigin="anonymous"
              style={{ height: 36, maxWidth: 140, objectFit: 'contain' }}
            />
          ) : (
            <span
              style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}
            >
              {marca.nomeEmpresa}
            </span>
          )}
        </div>
      )}

      {/* Gradient escuro embaixo */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: tall ? '42%' : '38%',
          background:
            'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 60%, transparent 100%)',
        }}
      />

      {/* Conteúdo embaixo */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: 50,
          color: '#fff',
        }}
      >
        {/* Localização */}
        {(imovel.bairro || imovel.cidade) && (
          <p
            style={{
              fontSize: 24,
              opacity: 0.85,
              marginBottom: 14,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            {[imovel.bairro, imovel.cidade].filter(Boolean).join(' · ')}
          </p>
        )}

        {/* Título */}
        <h1
          style={{
            fontSize: tall ? 60 : 56,
            fontWeight: 800,
            lineHeight: 1.05,
            marginBottom: 28,
            letterSpacing: '-0.5px',
          }}
        >
          {imovel.titulo}
        </h1>

        {/* Specs */}
        {specs.length > 0 && (
          <p
            style={{
              fontSize: 26,
              opacity: 0.9,
              marginBottom: 24,
              fontWeight: 500,
            }}
          >
            {specs.join(' • ')}
          </p>
        )}

        {/* Preço destaque com borda lateral */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            paddingLeft: 16,
            borderLeft: `6px solid ${marca.corPrimaria}`,
          }}
        >
          <span
            style={{
              fontSize: tall ? 54 : 48,
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-1px',
            }}
          >
            {formatPrecoCompleto(imovel.preco)}
          </span>
          {imovel.operacao === 'ALUGUEL' && (
            <span style={{ fontSize: 20, opacity: 0.7, fontWeight: 500 }}>
              /mês
            </span>
          )}
        </div>

        {/* Footer com WhatsApp se tiver */}
        {marca.whatsapp && (
          <p
            style={{
              marginTop: 24,
              fontSize: 18,
              opacity: 0.75,
              fontWeight: 500,
            }}
          >
            📞 Fale conosco · {imovel.codigo}
          </p>
        )}
      </div>
    </div>
  );
}
