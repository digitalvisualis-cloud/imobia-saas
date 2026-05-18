// Template 2 — PRICE PROTAGONIST (ref: Disponível Dark / Pablo Imob)
// Ênfase: PREÇO GIGANTE. Foto em cima, painel escuro embaixo dominado pelo valor.
import type { TemplateProps } from '../lib/types';
import { formatPreco } from '../lib/formats';
import { specsFor, pickImage } from './_shared';
import { SpecIcon } from './SpecIcon';
import { BrandMark } from './BrandMark';

export function BoldOffer({ imovel, marca, customizacao, slideIndex = 0 }: TemplateProps) {
  const c = customizacao;
  const specs = specsFor(imovel).slice(0, 4);
  const titulo = (c.headlineOverride ?? imovel.titulo).toUpperCase();

  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#0a0a0e',
      display: 'grid',
      gridTemplateRows: '50% 50%',
      fontFamily: 'var(--font-body)',
      color: '#fff',
      overflow: 'hidden',
    }}>
      {/* FOTO topo */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <img src={pickImage(imovel, slideIndex)} alt="" crossOrigin="anonymous"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {/* Marca pill canto */}
        <div style={{ position: 'absolute', top: 'calc(var(--u)*2.5)', left: 'calc(var(--u)*2.5)' }}>
          <BrandMark marca={marca} variant="circle" size={3.5} nameSize={1.3}
            bg="rgba(255,255,255,.95)" fg="#0a0a0e" />
        </div>
      </div>

      {/* PAINEL escuro embaixo — preço domina */}
      <div style={{
        background: '#0a0a0e',
        padding: 'calc(var(--u)*3.5) calc(var(--u)*3.5) calc(var(--u)*3)',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', gap: 'calc(var(--u)*1.5)',
      }}>
        {/* Título */}
        {c.showTitle && (
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'calc(var(--u)*3.6)',
            fontWeight: 800, lineHeight: .95,
            textAlign: 'center',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden', wordBreak: 'break-word', overflowWrap: 'anywhere',
          }}>
            {titulo}
          </div>
        )}

        {/* Pills de specs */}
        {c.showSpecs && specs.length ? (
          <div style={{
            display: 'flex', justifyContent: 'center',
            gap: 'calc(var(--u)*1.2)',
            flexWrap: 'wrap',
          }}>
            {specs.map((s, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 'calc(var(--u)*.4)',
                border: '1.5px solid rgba(255,255,255,.4)',
                borderRadius: 'calc(var(--u)*2)',
                padding: 'calc(var(--u)*1.6) calc(var(--u)*2.2)',
                minWidth: 'calc(var(--u)*10)',
              }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'calc(var(--u)*3.2)',
                  fontWeight: 800, lineHeight: 1,
                }}>
                  {s.value}
                </div>
                <div style={{
                  fontSize: 'calc(var(--u)*1.5)', opacity: .75, fontWeight: 500,
                }}>
                  {s.unit}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* PREÇO GIGANTE — protagonista */}
        {c.showPrice && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 'calc(var(--u)*1.3)',
              letterSpacing: '0.3em',
              color: c.secondary,
              fontWeight: 700,
              marginBottom: 'calc(var(--u)*.6)',
            }}>
              {imovel.operacao === 'VENDA' ? 'PREÇO' : 'ALUGUEL'}
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'calc(var(--u)*6.5)',
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-0.01em',
              color: '#fff',
              whiteSpace: 'nowrap',
            }}>
              {formatPreco(imovel.preco, imovel.operacao)}
            </div>
          </div>
        )}

        {/* Rodapé */}
        <div style={{
          textAlign: 'center',
          fontSize: 'calc(var(--u)*1.2)',
          opacity: .7,
          letterSpacing: '0.15em',
          fontWeight: 600,
        }}>
          {c.showCTA && c.ctaText ? c.ctaText.toUpperCase() : marca.nome_empresa}
          {marca.whatsapp && <span style={{ marginLeft: 'calc(var(--u)*1)', opacity: .8 }}>· ✆ {marca.whatsapp}</span>}
        </div>
      </div>
    </div>
  );
}
