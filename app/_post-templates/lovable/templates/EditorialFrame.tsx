// Template 3 — TITLE GIANT (ref: Diagonal Modern Home)
// Ênfase: TÍTULO GIGANTE. Foto fundo + título dominante em diagonal + card preço flutuante.
import type { TemplateProps } from '../lib/types';
import { formatPreco } from '../lib/formats';
import { specsFor, pickImage } from './_shared';
import { BrandMark } from './BrandMark';

function splitTitle(t: string): { big: string; tag: string } {
  // separa primeiras 2 palavras como "big" e o resto como "tag"
  const parts = t.toUpperCase().split(/\s+/).filter(Boolean);
  if (parts.length <= 2) return { big: parts.join(' '), tag: '' };
  return { big: parts.slice(0, 2).join(' '), tag: parts.slice(2).join(' ') };
}

export function EditorialFrame({ imovel, marca, customizacao, slideIndex = 0 }: TemplateProps) {
  const c = customizacao;
  const specs = specsFor(imovel).slice(0, 4);
  const titulo = c.headlineOverride ?? imovel.titulo;
  const { big, tag } = splitTitle(titulo);
  const operacao = imovel.operacao === 'VENDA' ? 'VENDA' : 'LOCAÇÃO';
  const thumbs = imovel.imagens.slice(1, 4);

  return (
    <div style={{
      width: '100%', height: '100%',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font-body)',
      color: '#fff',
      background: '#000',
    }}>
      {/* Foto principal */}
      <img src={pickImage(imovel, slideIndex)} alt="" crossOrigin="anonymous"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />

      {/* Overlay diagonal claro à esquerda */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(110deg, ${c.surface}f5 0%, ${c.surface}cc 38%, transparent 55%)`,
      }} />
      {/* Vinheta direita pra título contrastar */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(270deg, rgba(0,0,0,.55) 0%, transparent 45%)',
      }} />

      {/* Logo topo direito */}
      <div style={{
        position: 'absolute', top: 'calc(var(--u)*3)', right: 'calc(var(--u)*3)',
        zIndex: 2,
      }}>
        <BrandMark marca={marca} variant="circle" size={3.8} nameSize={1.3}
          bg="#fff" fg={c.primary} showName={false} />
      </div>

      {/* Thumbs à esquerda */}
      <div style={{
        position: 'absolute', left: 'calc(var(--u)*3.5)', top: '20%',
        display: 'flex', flexDirection: 'column', gap: 'calc(var(--u)*1.8)',
        zIndex: 2,
      }}>
        {thumbs.map((src, i) => (
          <div key={i} style={{
            width: 'calc(var(--u)*17)', height: 'calc(var(--u)*13)',
            borderRadius: 'calc(var(--u)*1.4)',
            overflow: 'hidden',
            border: '4px solid #fff',
            boxShadow: '0 calc(var(--u)*.6) calc(var(--u)*2) rgba(0,0,0,.35)',
          }}>
            <img src={src} alt="" crossOrigin="anonymous"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
      </div>

      {/* TÍTULO GIGANTE direita */}
      <div style={{
        position: 'absolute', right: 'calc(var(--u)*4)', top: '18%',
        textAlign: 'right', zIndex: 2, maxWidth: '55%',
      }}>
        {c.showTitle && (
          <>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'calc(var(--u)*7.5)',
              fontWeight: 800,
              lineHeight: .88,
              letterSpacing: '-0.01em',
              color: '#fff',
              textShadow: '0 calc(var(--u)*.4) calc(var(--u)*1.5) rgba(0,0,0,.45)',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
            }}>
              {big}
            </div>
            {tag && (
              <div style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'calc(var(--u)*2.2)',
                fontWeight: 500,
                letterSpacing: '0.15em',
                marginTop: 'calc(var(--u)*1.2)',
                opacity: .95,
              }}>
                {tag}
              </div>
            )}
          </>
        )}
        <div style={{
          marginTop: 'calc(var(--u)*1.2)',
          fontSize: 'calc(var(--u)*1.6)',
          letterSpacing: '0.4em',
          fontWeight: 600,
          color: c.secondary,
        }}>
          {operacao}
        </div>
      </div>

      {/* Card preço flutuante meio-baixo */}
      {c.showPrice && (
        <div style={{
          position: 'absolute', right: 'calc(var(--u)*4)', bottom: '22%',
          background: 'rgba(15,15,20,.88)',
          backdropFilter: 'blur(12px)',
          padding: 'calc(var(--u)*1.5) calc(var(--u)*2.5)',
          borderRadius: 'calc(var(--u)*1.6)',
          color: '#fff',
          textAlign: 'right',
          zIndex: 2,
        }}>
          <div style={{
            fontSize: 'calc(var(--u)*1.1)',
            letterSpacing: '0.2em',
            opacity: .7, fontWeight: 600,
          }}>
            PREÇO
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'calc(var(--u)*3.4)',
            fontWeight: 800, lineHeight: 1,
            whiteSpace: 'nowrap',
          }}>
            {formatPreco(imovel.preco, imovel.operacao)}
          </div>
        </div>
      )}

      {/* Barra inferior escura — specs */}
      {c.showSpecs && specs.length ? (
        <div style={{
          position: 'absolute', left: 'calc(var(--u)*3)', right: 'calc(var(--u)*3)', bottom: 'calc(var(--u)*3)',
          background: 'rgba(10,10,12,.92)',
          borderRadius: 'calc(var(--u)*1.4)',
          padding: 'calc(var(--u)*2) calc(var(--u)*2)',
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          zIndex: 2,
        }}>
          {specs.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', flex: 1, minWidth: 0,
            }}>
              {i > 0 && (
                <div style={{
                  width: '1.5px', alignSelf: 'stretch',
                  background: `${c.secondary}66`,
                  marginRight: 'calc(var(--u)*1)',
                }} />
              )}
              <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'calc(var(--u)*4)',
                  fontWeight: 800, lineHeight: 1, color: '#fff',
                }}>
                  {s.value}
                </div>
                <div style={{
                  fontSize: 'calc(var(--u)*1.7)', opacity: .8,
                  fontWeight: 600, marginTop: 'calc(var(--u)*.5)',
                }}>
                  {s.unit}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
