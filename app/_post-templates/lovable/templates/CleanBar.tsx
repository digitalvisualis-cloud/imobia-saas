// Template 1 — LOCATION HERO (ref: IDBrokers / Victor Montoya)
// Ênfase: LOCALIZAÇÃO grande com pin. Logo da marca no topo centralizado.
import type { TemplateProps } from '../lib/types';
import { formatPreco } from '../lib/formats';
import { specsFor, pickImage } from './_shared';
import { SpecIcon } from './SpecIcon';
import { BrandMark } from './BrandMark';

export function CleanBar({ imovel, marca, customizacao, slideIndex = 0 }: TemplateProps) {
  const c = customizacao;
  const specs = specsFor(imovel).slice(0, 3);
  const operacao = imovel.operacao === 'VENDA' ? 'CASA À VENDA' : 'CASA PARA LOCAÇÃO';
  const local = [imovel.bairro, imovel.cidade].filter(Boolean).join(' · ').toUpperCase();

  return (
    <div style={{
      width: '100%', height: '100%',
      position: 'relative',
      background: c.primary,
      color: '#fff',
      fontFamily: 'var(--font-body)',
      overflow: 'hidden',
    }}>
      {/* FOTO full */}
      <img src={pickImage(imovel, slideIndex)} alt="" crossOrigin="anonymous"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      {/* Overlays: topo gradient + bottom sólido */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(180deg, ${c.primary}cc 0%, transparent 22%, transparent 55%, ${c.primary}f5 100%)`,
      }} />

      {/* HEADER — logo + nome marca */}
      <div style={{
        position: 'absolute', top: 'calc(var(--u)*3)', left: 0, right: 0,
        display: 'flex', justifyContent: 'center',
      }}>
        <BrandMark marca={marca} variant="circle" size={4.5} nameSize={1.8}
          bg="#fff" fg={c.primary} />
      </div>

      {/* BLOCO INFERIOR */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: 'calc(var(--u)*4) calc(var(--u)*3.5) calc(var(--u)*3)',
        display: 'flex', flexDirection: 'column', gap: 'calc(var(--u)*1.8)',
      }}>
        {/* Título da operação */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'calc(var(--u)*5.2)',
          fontWeight: 800,
          lineHeight: .95,
          letterSpacing: '0.005em',
          textAlign: 'center',
          textShadow: '0 calc(var(--u)*.3) calc(var(--u)*1.5) rgba(0,0,0,.6)',
        }}>
          {operacao}
        </div>

        {/* PIN + LOCAL — protagonista */}
        {local && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 'calc(var(--u)*.8)',
            fontSize: 'calc(var(--u)*1.7)',
            letterSpacing: '0.2em',
            fontWeight: 600,
            color: c.secondary,
          }}>
            <span style={{ fontSize: 'calc(var(--u)*2.2)' }}>📍</span>
            <span>{local}</span>
          </div>
        )}

        {/* Card de specs + preço — sempre stack vertical pra nunca colidir */}
        <div style={{
          marginTop: 'calc(var(--u)*1)',
          border: `calc(var(--u)*.18) solid ${c.secondary}`,
          borderRadius: 'calc(var(--u)*1.6)',
          padding: 'calc(var(--u)*1.8) calc(var(--u)*2)',
          background: `${c.primary}aa`,
          backdropFilter: 'blur(6px)',
          display: 'flex', flexDirection: 'column',
          gap: 'calc(var(--u)*1.6)',
        }}>
          {c.showSpecs && specs.length ? (
            <div style={{ display: 'flex', justifyContent: 'space-around', gap: 'calc(var(--u)*1.5)' }}>
              {specs.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 'calc(var(--u)*.6)', flex: 1, minWidth: 0,
                }}>
                  <SpecIcon kind={s.iconKey} size={1.8} />
                  <div style={{
                    fontSize: 'calc(var(--u)*1.9)', fontWeight: 700, textAlign: 'center', lineHeight: 1.1,
                  }}>
                    {s.value} {s.unit}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {c.showPrice && (
            <div style={{
              borderTop: c.showSpecs && specs.length ? `1px solid ${c.secondary}50` : 'none',
              paddingTop: c.showSpecs && specs.length ? 'calc(var(--u)*1.4)' : 0,
              display: 'flex', alignItems: 'baseline', justifyContent: 'center',
              gap: 'calc(var(--u)*1.2)', flexWrap: 'wrap',
            }}>
              <div style={{
                fontSize: 'calc(var(--u)*1.2)', letterSpacing: '0.25em',
                color: c.secondary, fontWeight: 700,
              }}>
                {imovel.operacao === 'VENDA' ? 'VENDE' : 'ALUGA'}
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'calc(var(--u)*3.2)',
                fontWeight: 800, lineHeight: 1, whiteSpace: 'nowrap',
              }}>
                {formatPreco(imovel.preco, imovel.operacao)}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé: contato */}
        {(c.showCTA || c.showContact) && (
          <div style={{
            marginTop: 'calc(var(--u)*.5)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            gap: 'calc(var(--u)*1.2)',
            fontSize: 'calc(var(--u)*1.4)',
            letterSpacing: '0.15em',
            fontWeight: 600,
            opacity: .9,
          }}>
            {marca.whatsapp && <span>✆ {marca.whatsapp}</span>}
            {c.ctaText && marca.whatsapp && <span style={{ opacity: .5 }}>·</span>}
            {c.ctaText && <span style={{ textTransform: 'uppercase' }}>{c.ctaText}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
