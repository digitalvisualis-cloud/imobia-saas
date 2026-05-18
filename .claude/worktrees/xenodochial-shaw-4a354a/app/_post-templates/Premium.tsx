'use client';

import {
  type PostTemplateProps,
  formatPrecoCompacto,
  operacaoLabel,
  FORMATO_DIMENSOES,
} from './types';

/**
 * Template "Premium" — header colorido com cor da marca + foto + bloco escuro
 * com texto destaque + preço gigante. Estilo "Pronto Novo / Lançamento".
 */
export function PremiumTemplate({ imovel, marca, formato }: PostTemplateProps) {
  const dim = FORMATO_DIMENSOES[formato];
  const isStory = formato === 'STORY';
  const isVertical = formato === 'POST_VERTICAL';
  const tall = isStory || isVertical;

  return (
    <div
      style={{
        width: dim.w,
        height: dim.h,
        position: 'relative',
        background: marca.corSecundaria,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Inter", system-ui, sans-serif',
      }}
    >
      {/* Header colorido com cor da marca */}
      <div
        style={{
          background: marca.corPrimaria,
          padding: '32px 50px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <p
            style={{
              fontSize: 16,
              color: '#fff',
              opacity: 0.85,
              letterSpacing: '4px',
              textTransform: 'uppercase',
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            {operacaoLabel(imovel.operacao)} · {imovel.tipo.toLowerCase()}
          </p>
          <h2
            style={{
              fontSize: 28,
              color: '#fff',
              fontWeight: 800,
              margin: 0,
              letterSpacing: '-0.5px',
            }}
          >
            {imovel.bairro ?? imovel.cidade}
          </h2>
        </div>

        {/* Logo / Nome no canto direito */}
        <div
          style={{
            background: 'rgba(255,255,255,0.95)',
            padding: '10px 18px',
            borderRadius: 6,
          }}
        >
          {marca.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={marca.logoUrl}
              alt=""
              crossOrigin="anonymous"
              style={{ height: 36, maxWidth: 160, objectFit: 'contain' }}
            />
          ) : (
            <span
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: marca.corSecundaria,
              }}
            >
              {marca.nomeEmpresa ?? '—'}
            </span>
          )}
        </div>
      </div>

      {/* Foto principal */}
      <div
        style={{
          flex: tall ? 1.2 : 1,
          backgroundImage: imovel.capaUrl
            ? `url("${imovel.capaUrl}")`
            : `linear-gradient(135deg, ${marca.corPrimaria}, ${marca.corSecundaria})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: 0,
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

      {/* Bloco escuro embaixo com texto + preço */}
      <div
        style={{
          background: marca.corSecundaria,
          color: '#fff',
          padding: 50,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Tagline */}
        <p
          style={{
            fontSize: 18,
            color: marca.corPrimaria,
            letterSpacing: '4px',
            textTransform: 'uppercase',
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          ✨ Oportunidade Exclusiva
        </p>

        {/* Título do imóvel */}
        <h1
          style={{
            fontSize: tall ? 48 : 38,
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: 24,
            letterSpacing: '-0.5px',
          }}
        >
          {imovel.titulo}
        </h1>

        {/* Linha com specs + preço */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 24,
          }}
        >
          {/* Specs em colunas */}
          <div style={{ display: 'flex', gap: 32 }}>
            {imovel.areaM2 ? (
              <Spec label="Área" value={`${imovel.areaM2}m²`} />
            ) : null}
            {imovel.quartos > 0 ? (
              <Spec
                label={imovel.quartos === 1 ? 'Quarto' : 'Quartos'}
                value={imovel.quartos}
              />
            ) : null}
            {imovel.banheiros > 0 ? (
              <Spec
                label={imovel.banheiros === 1 ? 'Banh.' : 'Banhs.'}
                value={imovel.banheiros}
              />
            ) : null}
            {imovel.vagas > 0 ? (
              <Spec
                label={imovel.vagas === 1 ? 'Vaga' : 'Vagas'}
                value={imovel.vagas}
              />
            ) : null}
          </div>

          {/* Preço grandão */}
          <div style={{ textAlign: 'right' }}>
            <p
              style={{
                fontSize: 14,
                opacity: 0.6,
                letterSpacing: '3px',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              A partir de
            </p>
            <p
              style={{
                fontSize: tall ? 56 : 44,
                fontWeight: 800,
                color: marca.corPrimaria,
                letterSpacing: '-1px',
                lineHeight: 1,
              }}
            >
              {formatPrecoCompacto(imovel.preco)}
            </p>
          </div>
        </div>

        {/* Linha base com código + WhatsApp */}
        <div
          style={{
            marginTop: 28,
            paddingTop: 20,
            borderTop: '1px solid rgba(255,255,255,0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 14,
            opacity: 0.75,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          <span>Cód. {imovel.codigo}</span>
          {marca.whatsapp ? (
            <span>📞 Fale conosco no WhatsApp</span>
          ) : (
            <span>{marca.nomeEmpresa ?? ''}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p
        style={{
          fontSize: 32,
          fontWeight: 800,
          margin: 0,
          letterSpacing: '-0.5px',
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontSize: 12,
          opacity: 0.6,
          marginTop: 6,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}
      >
        {label}
      </p>
    </div>
  );
}
