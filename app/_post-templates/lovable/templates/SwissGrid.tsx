// Template 7 — SWISS GRID (minimalismo suíço / Helvetica)
// Grid rígido, linhas finas, números mono, foto contida
import type { TemplateProps } from '../lib/types';
import { formatPreco } from '../lib/formats';
import { specsFor, pickImage } from './_shared';
import { BrandMark } from './BrandMark';

export function SwissGrid({ imovel, marca, customizacao, slideIndex = 0 }: TemplateProps) {
  const c = customizacao;
  const specs = specsFor(imovel).slice(0, 4);
  const local = [imovel.bairro, imovel.cidade].filter(Boolean).join(', ');

  return (
    <div style={{
      width: '100%', height: '100%', background: c.surface, color: c.ink,
      fontFamily: 'var(--font-body)',
      padding: 'calc(var(--u)*3.5)',
      display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 'calc(var(--u)*2)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `1.5px solid ${c.ink}`, paddingBottom: 'calc(var(--u)*1.5)',
      }}>
        <BrandMark marca={marca} variant="plain" size={3.2} fg={c.ink} />
        <div style={{ fontSize: 'calc(var(--u)*1.6)', letterSpacing: '0.25em', fontWeight: 700 }}>
          {imovel.operacao === 'VENDA' ? '— À VENDA' : '— PARA ALUGAR'}
        </div>
      </div>

      {/* Foto + título */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'calc(var(--u)*1.8)', minHeight: 0 }}>
        <div style={{ width: '100%', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <img src={pickImage(imovel, slideIndex)} alt="" crossOrigin="anonymous"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
        {c.showTitle && (
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'calc(var(--u)*4.4)', fontWeight: 800, lineHeight: .98,
            letterSpacing: '-0.01em',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            wordBreak: 'break-word', overflowWrap: 'anywhere',
          }}>
            {(c.headlineOverride ?? imovel.titulo)}
          </div>
        )}
        {local && (
          <div style={{ fontSize: 'calc(var(--u)*1.9)', opacity: .75, fontWeight: 500 }}>
            {local}
          </div>
        )}
      </div>

      {/* Specs + preço grid */}
      <div style={{
        borderTop: `1.5px solid ${c.ink}`, paddingTop: 'calc(var(--u)*1.8)',
        display: 'grid',
        gridTemplateColumns: c.showSpecs && specs.length && c.showPrice ? `repeat(${specs.length}, 1fr) auto` : '1fr',
        gap: 'calc(var(--u)*1.2)', alignItems: 'end',
      }}>
        {c.showSpecs && specs.map((s, i) => (
          <div key={i}>
            <div style={{ fontSize: 'calc(var(--u)*1.2)', letterSpacing: '0.2em', opacity: .55, fontWeight: 700 }}>
              {String(i + 1).padStart(2, '0')}
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'calc(var(--u)*4.2)', fontWeight: 800, lineHeight: 1,
            }}>{s.value}</div>
            <div style={{ fontSize: 'calc(var(--u)*1.5)', opacity: .7, fontWeight: 600 }}>{s.unit}</div>
          </div>
        ))}
        {c.showPrice && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 'calc(var(--u)*1.2)', letterSpacing: '0.2em', opacity: .55, fontWeight: 700 }}>
              PREÇO
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'calc(var(--u)*4)', fontWeight: 800, lineHeight: 1, whiteSpace: 'nowrap',
            }}>{formatPreco(imovel.preco, imovel.operacao)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
