// Template 5 — SPECS HERO (mistura Diagonal + Disponível Dark)
// Ênfase: SPECS GRANDES em pills. Split foto/painel + logo bem visível.
import type { TemplateProps } from '../lib/types';
import { formatPreco } from '../lib/formats';
import { specsFor, pickImage } from './_shared';
import { BrandMark } from './BrandMark';

export function VerticalSplit({ imovel, marca, formato, customizacao, slideIndex = 0 }: TemplateProps) {
  const c = customizacao;
  const specs = specsFor(imovel).slice(0, 4);
  const titulo = (c.headlineOverride ?? imovel.titulo).toUpperCase();
  const local = [imovel.bairro, imovel.cidade].filter(Boolean).join(' · ');
  const isTall = formato.height / formato.width >= 1.2;

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'grid',
      gridTemplateColumns: isTall ? '1fr' : '55% 45%',
      gridTemplateRows: isTall ? '50% 50%' : '1fr',
      background: c.primary,
      color: c.surface,
      fontFamily: 'var(--font-body)',
    }}>
      {/* Foto com marca topo */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <img src={pickImage(imovel, slideIndex)} alt="" crossOrigin="anonymous"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{
          position: 'absolute', top: 'calc(var(--u)*2.5)', left: 'calc(var(--u)*2.5)',
        }}>
          <BrandMark marca={marca} variant="circle" size={4} nameSize={1.5}
            bg="#fff" fg={c.primary} />
        </div>
        {local && (
          <div style={{
            position: 'absolute', bottom: 'calc(var(--u)*2.5)', left: 'calc(var(--u)*2.5)',
            background: 'rgba(10,10,12,.85)',
            padding: 'calc(var(--u)*.8) calc(var(--u)*1.4)',
            borderRadius: 'calc(var(--u)*.6)',
            color: '#fff',
            fontSize: 'calc(var(--u)*1.3)',
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}>
            📍 {local}
          </div>
        )}
      </div>

      {/* Painel infos */}
      <div style={{
        padding: 'calc(var(--u)*3.5) calc(var(--u)*3)',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 'calc(var(--u)*2),',
        background: c.primary, color: c.surface,
      }}>
        {/* Operação tag + título */}
        <div>
          <div style={{
            display: 'inline-block',
            background: c.secondary, color: c.ink,
            padding: 'calc(var(--u)*.6) calc(var(--u)*1.2)',
            borderRadius: 'calc(var(--u)*.5)',
            fontSize: 'calc(var(--u)*1.2)',
            fontWeight: 800,
            letterSpacing: '0.2em',
            marginBottom: 'calc(var(--u)*1.5)',
          }}>
            {imovel.operacao === 'VENDA' ? 'À VENDA' : 'PARA ALUGAR'}
          </div>
          {c.showTitle && (
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: `calc(var(--u)*${isTall ? 4.2 : 3.4})`,
              fontWeight: 800, lineHeight: .95,
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
              overflow: 'hidden', wordBreak: 'break-word', overflowWrap: 'anywhere',
            }}>
              {titulo}
            </div>
          )}
        </div>

        {/* SPECS — pills enormes em grid 2x2 */}
        {c.showSpecs && specs.length ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'calc(var(--u)*1.2)',
          }}>
            {specs.map((s, i) => (
              <div key={i} style={{
                border: `2px solid ${c.surface}55`,
                borderRadius: 'calc(var(--u)*1.4)',
                padding: 'calc(var(--u)*2) calc(var(--u)*1.2)',
                textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'calc(var(--u)*3.8)',
                  fontWeight: 800, lineHeight: 1,
                  color: c.secondary,
                }}>
                  {s.value}
                </div>
                <div style={{
                  fontSize: 'calc(var(--u)*1.5)',
                  opacity: .85, fontWeight: 500,
                  marginTop: 'calc(var(--u)*.5)',
                  textTransform: 'lowercase',
                }}>
                  {s.unit}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Preço + CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--u)*1.2)' }}>
          {c.showPrice && (
            <div style={{
              borderTop: `1px solid ${c.surface}30`,
              paddingTop: 'calc(var(--u)*1.5)',
            }}>
              <div style={{
                fontSize: 'calc(var(--u)*1.1)',
                letterSpacing: '0.22em',
                color: c.secondary, fontWeight: 700,
                marginBottom: 'calc(var(--u)*.4)',
              }}>
                {imovel.operacao === 'VENDA' ? 'INVESTIMENTO' : 'ALUGUEL'}
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'calc(var(--u)*3)',
                fontWeight: 800, lineHeight: 1,
                color: c.surface, whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {formatPreco(imovel.preco, imovel.operacao)}
              </div>
            </div>
          )}

          {c.showCTA && c.ctaText && (
            <div style={{
              background: c.secondary, color: c.ink,
              padding: 'calc(var(--u)*1.3) calc(var(--u)*1.8)',
              borderRadius: 'calc(var(--u)*1)',
              fontWeight: 800, fontSize: 'calc(var(--u)*1.3)',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              textAlign: 'center',
            }}>
              ✆ {marca.whatsapp ?? c.ctaText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
