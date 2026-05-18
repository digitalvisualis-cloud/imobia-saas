// Template 14 — SOFT PASTEL (curvas suaves, leveza, lifestyle)
// Foto com cantos arredondados + bolha de preço orgânica
import type { TemplateProps } from '../lib/types';
import { formatPreco } from '../lib/formats';
import { specsFor, pickImage } from './_shared';
import { SpecIcon } from './SpecIcon';
import { BrandMark } from './BrandMark';

export function SoftPastel({ imovel, marca, customizacao, slideIndex = 0 }: TemplateProps) {
  const c = customizacao;
  const specs = specsFor(imovel).slice(0, 4);
  const local = [imovel.bairro, imovel.cidade].filter(Boolean).join(' · ');

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: c.surface, color: c.ink, fontFamily: 'var(--font-body)',
      padding: 'calc(var(--u)*3)',
    }}>
      {/* Blob decorativo */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-15%',
        width: 'calc(var(--u)*40)', height: 'calc(var(--u)*40)',
        background: c.secondary, opacity: .25,
        borderRadius: '50%',
        filter: 'blur(0)',
      }} />

      <div style={{ position: 'relative', height: '100%',
        display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 'calc(var(--u)*2)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <BrandMark marca={marca} variant="pill" size={3} nameSize={1.3} bg={c.primary} fg={c.surface} />
          {local && (
            <div style={{
              fontSize: 'calc(var(--u)*1.3)', fontWeight: 600,
              padding: 'calc(var(--u)*.6) calc(var(--u)*1.2)',
              borderRadius: '999px',
              background: '#fff', color: c.primary,
              boxShadow: '0 calc(var(--u)*.3) calc(var(--u)*.8) rgba(0,0,0,.08)',
            }}>
              📍 {local}
            </div>
          )}
        </div>

        {/* Foto principal arredondada + preço bolha */}
        <div style={{ position: 'relative', minHeight: 0 }}>
          <div style={{
            width: '100%', height: '100%', overflow: 'hidden',
            borderRadius: 'calc(var(--u)*3)',
            boxShadow: '0 calc(var(--u)*1) calc(var(--u)*2.5) rgba(0,0,0,.15)',
          }}>
            <img src={pickImage(imovel, slideIndex)} alt="" crossOrigin="anonymous"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          {c.showPrice && (
            <div style={{
              position: 'absolute', bottom: 'calc(var(--u)*-2)', right: 'calc(var(--u)*-1)',
              background: c.primary, color: c.surface,
              padding: 'calc(var(--u)*2) calc(var(--u)*2.5)',
              borderRadius: 'calc(var(--u)*2.5)',
              boxShadow: '0 calc(var(--u)*.8) calc(var(--u)*2) rgba(0,0,0,.25)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 'calc(var(--u)*1.1)', opacity: .8, letterSpacing: '0.2em', fontWeight: 700 }}>
                {imovel.operacao === 'VENDA' ? 'VENDA' : 'ALUGUEL'}
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'calc(var(--u)*3.2)', fontWeight: 800, lineHeight: 1, whiteSpace: 'nowrap',
                color: c.secondary,
              }}>
                {formatPreco(imovel.preco, imovel.operacao)}
              </div>
            </div>
          )}
        </div>

        {/* Bloco título + specs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--u)*1.5)' }}>
          {c.showTitle && (
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'calc(var(--u)*3)', fontWeight: 800, lineHeight: 1,
              display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {c.headlineOverride ?? imovel.titulo}
            </div>
          )}
          {c.showSpecs && specs.length > 0 && (
            <div style={{
              display: 'grid', gridTemplateColumns: `repeat(${specs.length}, 1fr)`,
              gap: 'calc(var(--u)*1)',
            }}>
              {specs.map((s, i) => (
                <div key={i} style={{
                  background: '#fff',
                  borderRadius: 'calc(var(--u)*1.4)',
                  padding: 'calc(var(--u)*1.4) calc(var(--u)*.6)',
                  textAlign: 'center',
                  boxShadow: '0 calc(var(--u)*.2) calc(var(--u)*.6) rgba(0,0,0,.06)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'calc(var(--u)*.4)' }}>
                    <SpecIcon kind={s.iconKey} size={1.6} />
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'calc(var(--u)*2.4)', fontWeight: 800, lineHeight: 1,
                    color: c.primary,
                  }}>{s.value}</div>
                  <div style={{ fontSize: 'calc(var(--u)*1.05)', opacity: .7, marginTop: 'calc(var(--u)*.2)' }}>
                    {s.unit}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
