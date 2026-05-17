// Template 13 — TAPE STRIP (faixa de fotos tipo filme)
// Faixa horizontal com várias fotos em sequência + info card
import type { TemplateProps } from '../lib/types';
import { formatPreco } from '../lib/formats';
import { specsFor } from './_shared';
import { BrandMark } from './BrandMark';

export function TapeStrip({ imovel, marca, customizacao }: TemplateProps) {
  const c = customizacao;
  const specs = specsFor(imovel).slice(0, 4);
  const local = [imovel.bairro, imovel.cidade].filter(Boolean).join(' · ').toUpperCase();
  const photos = imovel.imagens.slice(0, 4);

  return (
    <div style={{
      width: '100%', height: '100%', background: c.primary, color: c.surface,
      fontFamily: 'var(--font-body)', overflow: 'hidden',
      display: 'grid', gridTemplateRows: 'auto auto 1fr auto',
      padding: 'calc(var(--u)*3)',
      gap: 'calc(var(--u)*2),',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 'calc(var(--u)*1.5)',
      }}>
        <BrandMark marca={marca} variant="circle" size={4} nameSize={1.5} bg={c.secondary} fg={c.ink} />
        <div style={{
          fontSize: 'calc(var(--u)*1.2)', letterSpacing: '0.3em', fontWeight: 700,
          color: c.secondary,
        }}>
          {imovel.operacao === 'VENDA' ? 'À VENDA' : 'PARA ALUGAR'}
        </div>
      </div>

      {/* Faixa de fotos */}
      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${photos.length}, 1fr)`,
        gap: 'calc(var(--u)*.5)',
        height: 'calc(var(--u)*32)',
        marginBottom: 'calc(var(--u)*2)',
      }}>
        {photos.map((src, i) => (
          <div key={i} style={{
            overflow: 'hidden',
            border: `2px solid ${c.secondary}`,
          }}>
            <img src={src} alt="" crossOrigin="anonymous"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
      </div>

      {/* Info central */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'calc(var(--u)*1.2)' }}>
        {c.showTitle && (
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'calc(var(--u)*4)', fontWeight: 800, lineHeight: .95,
            textAlign: 'center',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {(c.headlineOverride ?? imovel.titulo).toUpperCase()}
          </div>
        )}
        {local && (
          <div style={{
            textAlign: 'center', fontSize: 'calc(var(--u)*1.5)',
            letterSpacing: '0.25em', color: c.secondary, fontWeight: 600,
          }}>
            📍 {local}
          </div>
        )}
        {c.showSpecs && specs.length > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 'calc(var(--u)*1.5)',
            flexWrap: 'wrap',
            marginTop: 'calc(var(--u)*.8)',
          }}>
            {specs.map((s, i) => (
              <div key={i} style={{
                padding: 'calc(var(--u)*1.4) calc(var(--u)*2.2)',
                border: `2px solid ${c.surface}50`,
                borderRadius: '999px',
                fontSize: 'calc(var(--u)*2.2)', fontWeight: 700, lineHeight: 1,
              }}>
                <span style={{ color: c.secondary, fontWeight: 800 }}>{s.value}</span> <span style={{ fontSize: 'calc(var(--u)*1.6)' }}>{s.unit}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preço */}
      {c.showPrice && (
        <div style={{
          textAlign: 'center',
          borderTop: `1px solid ${c.surface}30`,
          paddingTop: 'calc(var(--u)*1.5)',
          marginTop: 'calc(var(--u)*1.5)',
        }}>
          <div style={{
            fontSize: 'calc(var(--u)*1.1)', letterSpacing: '0.3em',
            color: c.secondary, fontWeight: 700, marginBottom: 'calc(var(--u)*.4)',
          }}>
            {imovel.operacao === 'VENDA' ? 'PREÇO' : 'ALUGUEL'}
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'calc(var(--u)*4.2)', fontWeight: 800, lineHeight: 1, whiteSpace: 'nowrap',
          }}>
            {formatPreco(imovel.preco, imovel.operacao)}
          </div>
        </div>
      )}
    </div>
  );
}
