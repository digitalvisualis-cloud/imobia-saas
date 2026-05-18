// Template 6 — MAGAZINE COVER (editorial / Vogue feel)
// Foto full + grande título serifado descendo lateral, masthead topo
import type { TemplateProps } from '../lib/types';
import { formatPreco } from '../lib/formats';
import { specsFor, pickImage } from './_shared';
import { BrandMark } from './BrandMark';

export function MagazineCover({ imovel, marca, customizacao, slideIndex = 0 }: TemplateProps) {
  const c = customizacao;
  const titulo = (c.headlineOverride ?? imovel.titulo).toUpperCase();
  const local = [imovel.bairro, imovel.cidade].filter(Boolean).join(' / ').toUpperCase();
  const specs = specsFor(imovel).slice(0, 3);

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: '#000', color: '#fff', fontFamily: 'var(--font-body)',
    }}>
      <img src={pickImage(imovel, slideIndex)} alt="" crossOrigin="anonymous"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,.55) 0%, transparent 25%, transparent 60%, rgba(0,0,0,.6) 100%)' }} />

      {/* Masthead topo */}
      <div style={{
        position: 'absolute', top: 'calc(var(--u)*3)', left: 'calc(var(--u)*3.5)', right: 'calc(var(--u)*3.5)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '2px solid rgba(255,255,255,.7)',
        paddingBottom: 'calc(var(--u)*1.5)',
      }}>
        <BrandMark marca={marca} variant="plain" size={3} fg="#fff" />
        <div style={{ fontSize: 'calc(var(--u)*1.2)', letterSpacing: '0.3em', fontWeight: 700 }}>
          EDIÇÃO · {imovel.codigo ?? '001'}
        </div>
      </div>

      {/* Título lateral grande */}
      {c.showTitle && (
        <div style={{
          position: 'absolute', left: 'calc(var(--u)*3.5)', bottom: 'calc(var(--u)*16)',
          maxWidth: '75%',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'calc(var(--u)*9)',
            fontWeight: 800, lineHeight: .88, letterSpacing: '-0.02em',
            textShadow: '0 calc(var(--u)*.4) calc(var(--u)*1.5) rgba(0,0,0,.5)',
            wordBreak: 'break-word', overflowWrap: 'anywhere',
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {titulo}
          </div>
        </div>
      )}

      {/* Rodapé tipo capa de revista */}
      <div style={{
        position: 'absolute', bottom: 'calc(var(--u)*3)', left: 'calc(var(--u)*3.5)', right: 'calc(var(--u)*3.5)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 'calc(var(--u)*2)',
      }}>
        <div>
          <div style={{ fontSize: 'calc(var(--u)*1.3)', letterSpacing: '0.25em', opacity: .8, fontWeight: 600 }}>
            {local}
          </div>
          {c.showSpecs && specs.length > 0 && (
            <div style={{ fontSize: 'calc(var(--u)*2.2)', marginTop: 'calc(var(--u)*.8)', fontWeight: 700, letterSpacing: '0.02em' }}>
              {specs.map(s => `${s.value} ${s.unit}`).join('  ·  ')}
            </div>
          )}
        </div>
        {c.showPrice && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 'calc(var(--u)*1.1)', letterSpacing: '0.3em', opacity: .7, fontWeight: 700 }}>
              {imovel.operacao === 'VENDA' ? 'PREÇO' : 'ALUGUEL'}
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'calc(var(--u)*3.4)', fontWeight: 800, lineHeight: 1, whiteSpace: 'nowrap',
            }}>
              {formatPreco(imovel.preco, imovel.operacao)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
