// Template 9 — POLAROID STACK (playful / retrô)
// Cluster denso de polaroids preenchendo todo o canvas
import type { TemplateProps } from '../lib/types';
import { formatPreco } from '../lib/formats';
import { specsFor } from './_shared';
import { BrandMark } from './BrandMark';

export function PolaroidStack({ imovel, marca, customizacao }: TemplateProps) {
  const c = customizacao;
  const specs = specsFor(imovel).slice(0, 3);
  const local = [imovel.bairro, imovel.cidade].filter(Boolean).join(' · ');
  const photos = imovel.imagens.slice(0, 4);
  const main = photos[0] ?? '';
  const extras = photos.slice(1, 4);

  // Posições das polaroids extras — preenche os cantos vazios
  const extraPositions = [
    { top: '8%',  right: '4%',  width: 26, rot: 8 },
    { top: '38%', right: '2%',  width: 22, rot: -6 },
    { top: '62%', right: '6%',  width: 24, rot: 4 },
  ];

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: c.surface, color: c.ink, fontFamily: 'var(--font-body)',
    }}>
      {/* Logo topo */}
      <div style={{ position: 'absolute', top: 'calc(var(--u)*3)', left: 'calc(var(--u)*3)', zIndex: 5 }}>
        <BrandMark marca={marca} variant="plain" size={3} fg={c.ink} />
      </div>

      {/* Polaroids extras espalhadas — preenchem o lado direito */}
      {extras.map((src, i) => {
        const pos = extraPositions[i];
        return (
          <div key={i} style={{
            position: 'absolute',
            top: pos.top,
            right: pos.right,
            width: `calc(var(--u)*${pos.width})`,
            background: '#fff',
            padding: 'calc(var(--u)*.9) calc(var(--u)*.9) calc(var(--u)*2.8)',
            boxShadow: '0 calc(var(--u)*1) calc(var(--u)*2.5) rgba(0,0,0,.28)',
            transform: `rotate(${pos.rot}deg)`,
            zIndex: 2,
          }}>
            <div style={{ width: '100%', aspectRatio: '1', overflow: 'hidden' }}>
              <img src={src} alt="" crossOrigin="anonymous"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        );
      })}

      {/* Polaroid principal — grande, central-esquerda */}
      <div style={{
        position: 'absolute', top: '12%', left: 'calc(var(--u)*3.5)',
        width: 'calc(var(--u)*55)',
        background: '#fff',
        padding: 'calc(var(--u)*1.4) calc(var(--u)*1.4) calc(var(--u)*4)',
        boxShadow: '0 calc(var(--u)*1.2) calc(var(--u)*3) rgba(0,0,0,.35)',
        transform: 'rotate(-3deg)',
        zIndex: 3,
      }}>
        <div style={{ width: '100%', aspectRatio: '1', overflow: 'hidden' }}>
          <img src={main} alt="" crossOrigin="anonymous"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        {local && (
          <div style={{
            marginTop: 'calc(var(--u)*1.2)',
            fontFamily: 'var(--font-display)',
            fontSize: 'calc(var(--u)*1.9)', fontWeight: 700,
            color: c.ink, textAlign: 'center',
            fontStyle: 'italic',
          }}>
            📍 {local}
          </div>
        )}
      </div>

      {/* Bloco inferior — fita colada por cima */}
      <div style={{
        position: 'absolute', left: 'calc(var(--u)*3)', right: 'calc(var(--u)*3)', bottom: 'calc(var(--u)*3)',
        background: c.primary, color: c.surface,
        padding: 'calc(var(--u)*2.2) calc(var(--u)*2.8)',
        borderRadius: 'calc(var(--u)*1.4)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'calc(var(--u)*1.5)',
        zIndex: 4,
        boxShadow: '0 calc(var(--u)*-.8) calc(var(--u)*2) rgba(0,0,0,.15)',
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          {c.showTitle && (
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'calc(var(--u)*2.8)', fontWeight: 800, lineHeight: 1,
              display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {(c.headlineOverride ?? imovel.titulo).toUpperCase()}
            </div>
          )}
          {c.showSpecs && specs.length > 0 && (
            <div style={{ fontSize: 'calc(var(--u)*1.9)', opacity: .9, marginTop: 'calc(var(--u)*.6)', fontWeight: 600 }}>
              {specs.map(s => `${s.value} ${s.unit}`).join(' · ')}
            </div>
          )}
        </div>
        {c.showPrice && (
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'calc(var(--u)*3.2)', fontWeight: 800, lineHeight: 1,
            color: c.secondary, whiteSpace: 'nowrap',
          }}>
            {formatPreco(imovel.preco, imovel.operacao)}
          </div>
        )}
      </div>
    </div>
  );
}
