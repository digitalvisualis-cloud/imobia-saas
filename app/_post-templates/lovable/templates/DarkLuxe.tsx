// Template 11 — DARK LUXE (full dark, ornamentos dourados, alta luxúria)
import type { TemplateProps } from '../lib/types';
import { formatPreco } from '../lib/formats';
import { specsFor, pickImage } from './_shared';
import { BrandMark } from './BrandMark';

export function DarkLuxe({ imovel, marca, customizacao, slideIndex = 0 }: TemplateProps) {
  const c = customizacao;
  const specs = specsFor(imovel).slice(0, 4);
  const local = [imovel.bairro, imovel.cidade].filter(Boolean).join(' · ').toUpperCase();

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: '#0a0a0e', color: '#fff', fontFamily: 'var(--font-body)',
      padding: 'calc(var(--u)*3)',
    }}>
      {/* Moldura fina dourada */}
      <div style={{
        position: 'absolute', inset: 'calc(var(--u)*1.5)',
        border: `1.5px solid ${c.secondary}`,
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', height: '100%',
        display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 'calc(var(--u)*2)' }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: 'calc(var(--u)*1)',
        }}>
          <BrandMark marca={marca} variant="plain" size={2.5} fg={c.secondary} />
          <div style={{
            fontSize: 'calc(var(--u)*1.1)', letterSpacing: '0.35em',
            color: c.secondary, fontWeight: 700,
          }}>
            EXCLUSIVO · {imovel.codigo ?? '—'}
          </div>
        </div>

        {/* Foto + título */}
        <div style={{ display: 'grid', gridTemplateRows: '1fr auto', gap: 'calc(var(--u)*1.8)', minHeight: 0 }}>
          <div style={{ overflow: 'hidden', minHeight: 0, position: 'relative' }}>
            <img src={pickImage(imovel, slideIndex)} alt="" crossOrigin="anonymous"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{
              position: 'absolute', inset: 0,
              boxShadow: `inset 0 0 0 1px ${c.secondary}50`,
            }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            {c.showTitle && (
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'calc(var(--u)*3.8)', fontWeight: 800, lineHeight: 1,
                letterSpacing: '0.02em',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {(c.headlineOverride ?? imovel.titulo).toUpperCase()}
              </div>
            )}
            {local && (
              <div style={{
                fontSize: 'calc(var(--u)*1.3)', letterSpacing: '0.3em',
                color: c.secondary, fontWeight: 600, marginTop: 'calc(var(--u)*.8)',
              }}>
                — {local} —
              </div>
            )}
          </div>
        </div>

        {/* Rodapé: specs + preço */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--u)*1.5)' }}>
          {c.showSpecs && specs.length > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'center', gap: 'calc(var(--u)*2.5)',
              borderTop: `1px solid ${c.secondary}40`, borderBottom: `1px solid ${c.secondary}40`,
              padding: 'calc(var(--u)*1.2) 0',
            }}>
              {specs.map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'calc(var(--u)*2.8)', fontWeight: 800, lineHeight: 1,
                    color: c.secondary,
                  }}>{s.value}</div>
                  <div style={{ fontSize: 'calc(var(--u)*1.1)', opacity: .7, marginTop: 'calc(var(--u)*.3)' }}>
                    {s.unit}
                  </div>
                </div>
              ))}
            </div>
          )}
          {c.showPrice && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 'calc(var(--u)*1.1)', letterSpacing: '0.4em',
                color: c.secondary, fontWeight: 700, marginBottom: 'calc(var(--u)*.4)',
              }}>
                {imovel.operacao === 'VENDA' ? 'INVESTIMENTO' : 'LOCAÇÃO'}
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'calc(var(--u)*4)', fontWeight: 800, lineHeight: 1, whiteSpace: 'nowrap',
              }}>
                {formatPreco(imovel.preco, imovel.operacao)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
