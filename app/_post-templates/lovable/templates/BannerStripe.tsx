// Template 8 — BANNER STRIPE (faixa diagonal de operação)
// Foto + faixa diagonal colorida atravessando com operação, preço destaque embaixo
import type { TemplateProps } from '../lib/types';
import { formatPreco } from '../lib/formats';
import { specsFor, pickImage } from './_shared';
import { BrandMark } from './BrandMark';

export function BannerStripe({ imovel, marca, customizacao, slideIndex = 0 }: TemplateProps) {
  const c = customizacao;
  const specs = specsFor(imovel).slice(0, 4);
  const operacao = imovel.operacao === 'VENDA' ? 'À VENDA' : 'PARA ALUGAR';

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: '#000', color: '#fff', fontFamily: 'var(--font-body)',
    }}>
      <img src={pickImage(imovel, slideIndex)} alt="" crossOrigin="anonymous"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,.3) 0%, transparent 30%, rgba(0,0,0,.75) 100%)' }} />

      {/* Faixa diagonal */}
      <div style={{
        position: 'absolute', top: '18%', left: '-15%', width: '130%',
        transform: 'rotate(-7deg)', transformOrigin: 'center',
        background: c.secondary, color: c.ink,
        padding: 'calc(var(--u)*1.8) 0',
        textAlign: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: 'calc(var(--u)*4.5)',
        fontWeight: 800, letterSpacing: '0.05em',
        boxShadow: '0 calc(var(--u)*.8) calc(var(--u)*2) rgba(0,0,0,.4)',
      }}>
        {operacao}
      </div>

      {/* Logo topo */}
      <div style={{ position: 'absolute', top: 'calc(var(--u)*3)', left: 'calc(var(--u)*3)', zIndex: 2 }}>
        <BrandMark marca={marca} variant="circle" size={4} nameSize={1.4}
          bg="#fff" fg={c.primary} />
      </div>

      {/* Bloco inferior */}
      <div style={{
        position: 'absolute', left: 'calc(var(--u)*3)', right: 'calc(var(--u)*3)', bottom: 'calc(var(--u)*3)',
        display: 'flex', flexDirection: 'column', gap: 'calc(var(--u)*1.5)',
      }}>
        {c.showTitle && (
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'calc(var(--u)*3.2)', fontWeight: 800, lineHeight: .95,
            textShadow: '0 calc(var(--u)*.3) calc(var(--u)*1) rgba(0,0,0,.6)',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {(c.headlineOverride ?? imovel.titulo).toUpperCase()}
          </div>
        )}

        {c.showSpecs && specs.length > 0 && (
          <div style={{ display: 'flex', gap: 'calc(var(--u)*3)', flexWrap: 'wrap', alignItems: 'baseline' }}>
            {specs.map((s, i) => (
              <div key={i}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'calc(var(--u)*4)', fontWeight: 800,
                  color: c.secondary,
                  textShadow: '0 calc(var(--u)*.3) calc(var(--u)*.8) rgba(0,0,0,.5)',
                }}>{s.value}</span>
                <span style={{ fontSize: 'calc(var(--u)*1.9)', marginLeft: 'calc(var(--u)*.5)', opacity: .95, fontWeight: 600 }}>
                  {s.unit}
                </span>
              </div>
            ))}
          </div>
        )}

        {c.showPrice && (
          <div style={{
            display: 'inline-flex', alignSelf: 'flex-start',
            background: c.secondary, color: c.ink,
            padding: 'calc(var(--u)*1.2) calc(var(--u)*2.2)',
            borderRadius: 'calc(var(--u)*.6)',
            fontFamily: 'var(--font-display)',
            fontSize: 'calc(var(--u)*3.4)', fontWeight: 800, lineHeight: 1, whiteSpace: 'nowrap',
          }}>
            {formatPreco(imovel.preco, imovel.operacao)}
          </div>
        )}
      </div>
    </div>
  );
}
