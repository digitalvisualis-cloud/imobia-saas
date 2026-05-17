// Template 15 — STAMP SEAL (estampa / selo de venda exclusiva)
// Foto + grande carimbo circular sobreposto
import type { TemplateProps } from '../lib/types';
import { formatPreco } from '../lib/formats';
import { specsFor, pickImage } from './_shared';
import { BrandMark } from './BrandMark';

export function StampSeal({ imovel, marca, customizacao, slideIndex = 0 }: TemplateProps) {
  const c = customizacao;
  const specs = specsFor(imovel).slice(0, 4);
  const local = [imovel.bairro, imovel.cidade].filter(Boolean).join(' · ').toUpperCase();

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: '#000', color: '#fff', fontFamily: 'var(--font-body)',
    }}>
      <img src={pickImage(imovel, slideIndex)} alt="" crossOrigin="anonymous"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,.5) 0%, transparent 30%, transparent 55%, rgba(0,0,0,.85) 100%)' }} />

      {/* Header */}
      <div style={{
        position: 'absolute', top: 'calc(var(--u)*3)', left: 'calc(var(--u)*3)', right: 'calc(var(--u)*3)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 3,
      }}>
        <BrandMark marca={marca} variant="circle" size={4} nameSize={1.4} bg="#fff" fg={c.primary} />
      </div>

      {/* CARIMBO circular sobreposto */}
      <div style={{
        position: 'absolute', top: '25%', right: 'calc(var(--u)*4)',
        width: 'calc(var(--u)*22)', height: 'calc(var(--u)*22)',
        borderRadius: '50%',
        border: `calc(var(--u)*.4) solid ${c.secondary}`,
        background: 'rgba(0,0,0,.55)',
        backdropFilter: 'blur(8px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        transform: 'rotate(-8deg)',
        boxShadow: `0 0 0 calc(var(--u)*.6) rgba(0,0,0,.4), inset 0 0 0 calc(var(--u)*.15) ${c.secondary}`,
        zIndex: 4,
      }}>
        <div style={{
          fontSize: 'calc(var(--u)*1)', letterSpacing: '0.3em',
          color: c.secondary, fontWeight: 800, marginBottom: 'calc(var(--u)*.3)',
        }}>
          ★ {imovel.operacao === 'VENDA' ? 'À VENDA' : 'ALUGUEL'} ★
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'calc(var(--u)*2.4)', fontWeight: 800, lineHeight: 1,
          color: '#fff', textAlign: 'center', whiteSpace: 'nowrap',
        }}>
          {c.showPrice ? formatPreco(imovel.preco, imovel.operacao) : (imovel.codigo ?? 'EXCLUSIVO')}
        </div>
        <div style={{
          fontSize: 'calc(var(--u)*.9)', letterSpacing: '0.3em',
          opacity: .7, marginTop: 'calc(var(--u)*.4)', fontWeight: 700,
        }}>
          EXCLUSIVO
        </div>
      </div>

      {/* Bloco inferior */}
      <div style={{
        position: 'absolute', left: 'calc(var(--u)*3)', right: 'calc(var(--u)*3)', bottom: 'calc(var(--u)*3)',
        display: 'flex', flexDirection: 'column', gap: 'calc(var(--u)*1.2)', zIndex: 3,
      }}>
        {local && (
          <div style={{
            fontSize: 'calc(var(--u)*1.4)', letterSpacing: '0.3em', fontWeight: 700,
            color: c.secondary,
          }}>
            📍 {local}
          </div>
        )}
        {c.showTitle && (
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'calc(var(--u)*4)', fontWeight: 800, lineHeight: .95,
            textShadow: '0 calc(var(--u)*.3) calc(var(--u)*1) rgba(0,0,0,.6)',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {(c.headlineOverride ?? imovel.titulo).toUpperCase()}
          </div>
        )}
        {c.showSpecs && specs.length > 0 && (
          <div style={{
            display: 'flex', gap: 'calc(var(--u)*3)', flexWrap: 'wrap', alignItems: 'baseline',
            paddingTop: 'calc(var(--u)*1.2)',
            borderTop: `1px solid ${c.secondary}50`,
          }}>
            {specs.map((s, i) => (
              <div key={i}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'calc(var(--u)*4)', fontWeight: 800, color: c.secondary,
                }}>{s.value}</span>
                <span style={{ fontSize: 'calc(var(--u)*1.8)', marginLeft: 'calc(var(--u)*.5)', fontWeight: 600 }}>
                  {s.unit}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
