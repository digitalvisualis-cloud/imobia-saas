// Template 4 — GALLERY LUXURY (ref: Bolhas Luxury Tour)
// Ênfase: galeria de fotos em thumbs CIRCULARES à esquerda + badge TOUR + CTA dourada.
import type { TemplateProps } from '../lib/types';
import { formatPreco } from '../lib/formats';
import { specsFor, pickImage } from './_shared';
import { BrandMark } from './BrandMark';

export function GlassPremium({ imovel, marca, customizacao, slideIndex = 0 }: TemplateProps) {
  const c = customizacao;
  const specs = specsFor(imovel).slice(0, 4);
  const local = [imovel.bairro, imovel.cidade].filter(Boolean).join(' · ');
  const thumbs = imovel.imagens.slice(0, 3);

  return (
    <div style={{
      width: '100%', height: '100%',
      position: 'relative', overflow: 'hidden',
      background: '#000', color: '#fff',
      fontFamily: 'var(--font-body)',
    }}>
      {/* Foto principal */}
      <img src={pickImage(imovel, slideIndex)} alt="" crossOrigin="anonymous"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,.45) 0%, rgba(0,0,0,.1) 30%, rgba(0,0,0,.55) 100%)',
      }} />

      {/* Header marca topo esquerdo */}
      <div style={{ position: 'absolute', top: 'calc(var(--u)*3)', left: 'calc(var(--u)*3)', zIndex: 3 }}>
        <BrandMark marca={marca} variant="circle" size={4.5} nameSize={1.5}
          bg={c.secondary} fg={c.ink} />
      </div>

      {/* Thumbs circulares à esquerda meio */}
      <div style={{
        position: 'absolute', left: 'calc(var(--u)*3.5)', top: '28%',
        display: 'flex', flexDirection: 'column', gap: 'calc(var(--u)*2)',
        zIndex: 2,
      }}>
        {thumbs.map((src, i) => (
          <div key={i} style={{
            width: 'calc(var(--u)*16)', height: 'calc(var(--u)*16)',
            borderRadius: '999px',
            overflow: 'hidden',
            border: `5px solid ${c.secondary}`,
            boxShadow: '0 calc(var(--u)*.6) calc(var(--u)*2) rgba(0,0,0,.45)',
          }}>
            <img src={src} alt="" crossOrigin="anonymous"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
      </div>

      {/* Local lateral direita meio */}
      {local && (
        <div style={{
          position: 'absolute', right: 'calc(var(--u)*3.5)', top: '32%',
          maxWidth: '55%',
          fontSize: 'calc(var(--u)*1.4)',
          letterSpacing: '0.18em',
          fontWeight: 700,
          opacity: .95,
          textTransform: 'uppercase',
          textAlign: 'right',
          lineHeight: 1.25,
          textShadow: '0 calc(var(--u)*.3) calc(var(--u)*1) rgba(0,0,0,.6)',
          zIndex: 2,
        }}>
          📍 {local}
        </div>
      )}

      {/* Card preço direita meio-baixo */}
      {c.showPrice && (
        <div style={{
          position: 'absolute', right: 'calc(var(--u)*3.5)', top: '45%',
          background: 'rgba(15,15,20,.92)',
          padding: 'calc(var(--u)*1.6) calc(var(--u)*2.4)',
          borderRadius: 'calc(var(--u)*1.4)',
          color: '#fff',
          minWidth: 'calc(var(--u)*30)',
          textAlign: 'right',
          boxShadow: '0 calc(var(--u)*.6) calc(var(--u)*1.6) rgba(0,0,0,.5)',
          zIndex: 2,
        }}>
          <div style={{
            fontSize: 'calc(var(--u)*1.15)',
            letterSpacing: '0.2em',
            opacity: .7, fontWeight: 600,
          }}>
            {imovel.operacao === 'VENDA' ? 'A PARTIR DE' : 'POR APENAS'}
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'calc(var(--u)*3.6)',
            fontWeight: 800, lineHeight: 1,
            whiteSpace: 'nowrap',
            marginTop: 'calc(var(--u)*.3)',
          }}>
            {formatPreco(imovel.preco, imovel.operacao)}
          </div>
        </div>
      )}

      {/* CTA dourada direita um pouco mais embaixo */}
      {c.showCTA && c.ctaText && (
        <div style={{
          position: 'absolute', right: 'calc(var(--u)*3.5)', top: '60%',
          background: c.secondary,
          color: c.ink,
          padding: 'calc(var(--u)*1.4) calc(var(--u)*2.6)',
          borderRadius: '999px',
          fontFamily: 'var(--font-display)',
          fontSize: 'calc(var(--u)*1.6)',
          fontWeight: 800,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          boxShadow: '0 calc(var(--u)*.5) calc(var(--u)*1.4) rgba(0,0,0,.35)',
          zIndex: 2,
        }}>
          ✆ {c.ctaText}
        </div>
      )}

      {/* Barra inferior escura de specs */}
      {c.showSpecs && specs.length ? (
        <div style={{
          position: 'absolute', left: 'calc(var(--u)*3)', right: 'calc(var(--u)*3)', bottom: 'calc(var(--u)*3)',
          background: 'rgba(10,10,12,.9)',
          borderRadius: 'calc(var(--u)*1.2)',
          padding: 'calc(var(--u)*1.5) calc(var(--u)*1.8)',
          display: 'flex', justifyContent: 'space-around',
          zIndex: 2,
        }}>
          {specs.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', flex: 1 }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'calc(var(--u)*3.2)',
                fontWeight: 800, color: '#fff', lineHeight: 1,
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: 'calc(var(--u)*1.45)', opacity: .75, marginTop: 'calc(var(--u)*.4)' }}>
                {s.unit}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
