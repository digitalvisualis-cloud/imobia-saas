// Template 12 — COLOR BLOCK (bauhaus / mondrian)
// Foto + grandes blocos de cor com info dentro
import type { TemplateProps } from '../lib/types';
import { formatPreco } from '../lib/formats';
import { specsFor, pickImage } from './_shared';
import { BrandMark } from './BrandMark';

export function ColorBlock({ imovel, marca, customizacao, slideIndex = 0 }: TemplateProps) {
  const c = customizacao;
  const specs = specsFor(imovel).slice(0, 3);
  const local = [imovel.bairro, imovel.cidade].filter(Boolean).join(' · ');

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: c.surface, color: c.ink, fontFamily: 'var(--font-body)',
      display: 'grid',
      gridTemplateColumns: '60% 40%',
      gridTemplateRows: '55% 45%',
      gap: 'calc(var(--u)*.6)',
      padding: 'calc(var(--u)*.6)',
    }}>
      {/* Foto grande topo esquerda */}
      <div style={{ position: 'relative', overflow: 'hidden', gridRow: 'span 1' }}>
        <img src={pickImage(imovel, slideIndex)} alt="" crossOrigin="anonymous"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', top: 'calc(var(--u)*2)', left: 'calc(var(--u)*2)' }}>
          <BrandMark marca={marca} variant="circle" size={3.5} nameSize={1.3} bg="#fff" fg={c.primary} showName={false} />
        </div>
      </div>

      {/* Bloco primary topo direita — operação */}
      <div style={{
        background: c.primary, color: c.surface,
        padding: 'calc(var(--u)*2)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: 'calc(var(--u)*1.2)', letterSpacing: '0.3em', fontWeight: 700, opacity: .8 }}>
          {imovel.codigo ?? 'IMÓVEL'}
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'calc(var(--u)*5)', fontWeight: 800, lineHeight: .9,
        }}>
          {imovel.operacao === 'VENDA' ? 'À\nVENDA' : 'PARA\nALUGAR'.split('\n').join('\n')}
        </div>
      </div>

      {/* Bloco branco — título + local */}
      <div style={{
        background: c.surface, color: c.ink,
        padding: 'calc(var(--u)*2)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        border: `2px solid ${c.ink}`,
      }}>
        {c.showTitle && (
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'calc(var(--u)*3.2)', fontWeight: 800, lineHeight: .95,
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            wordBreak: 'break-word', overflowWrap: 'anywhere',
          }}>
            {(c.headlineOverride ?? imovel.titulo).toUpperCase()}
          </div>
        )}
        {local && (
          <div style={{
            fontSize: 'calc(var(--u)*1.3)', letterSpacing: '0.2em',
            fontWeight: 700, opacity: .7,
          }}>
            📍 {local.toUpperCase()}
          </div>
        )}
      </div>

      {/* Bloco secondary — specs em lista numerada + preço destacado */}
      <div style={{
        background: c.secondary, color: c.ink,
        padding: 'calc(var(--u)*2)',
        display: 'flex', flexDirection: 'column',
        gap: 'calc(var(--u)*1.2)',
        position: 'relative',
      }}>
        {c.showSpecs && specs.length > 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            gap: 'calc(var(--u)*.8)',
            flex: 1,
          }}>
            {specs.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 'calc(var(--u)*1)',
                borderBottom: i < specs.length - 1 ? `1px solid ${c.ink}33` : 'none',
                paddingBottom: 'calc(var(--u)*.7)',
                lineHeight: 1,
              }}>
                <div style={{
                  fontSize: 'calc(var(--u)*1.3)', fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  opacity: .75,
                }}>
                  {String(i + 1).padStart(2, '0')} · {s.unit}
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'calc(var(--u)*3.8)', fontWeight: 800, lineHeight: 1,
                }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}
        {c.showPrice && (
          <div style={{
            background: c.ink, color: c.surface,
            margin: 'calc(var(--u)*-2) calc(var(--u)*-2) calc(var(--u)*-2)',
            marginTop: 'auto',
            padding: 'calc(var(--u)*1.4) calc(var(--u)*2)',
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            gap: 'calc(var(--u)*.8)',
          }}>
            <div style={{
              fontSize: 'calc(var(--u)*1.1)', letterSpacing: '0.3em',
              fontWeight: 700, opacity: .7,
            }}>
              {imovel.operacao === 'VENDA' ? 'PREÇO' : 'ALUGUEL'}
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'calc(var(--u)*2.6)', fontWeight: 800, lineHeight: 1,
              whiteSpace: 'nowrap',
            }}>
              {formatPreco(imovel.preco, imovel.operacao)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
