// Marca da imobiliária — renderiza logo_url se houver, ou fallback com iniciais.
// Tamanhos em unidades "u" pra escalar com o formato.
import type { MarcaData } from '../lib/types';

interface Props {
  marca: MarcaData;
  size?: number;      // em unidades "u" (altura do badge)
  variant?: 'pill' | 'circle' | 'square' | 'plain';
  bg?: string;
  fg?: string;
  showName?: boolean;
  nameSize?: number;  // tamanho da fonte do nome em "u"
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

export function BrandMark({
  marca, size = 4, variant = 'pill', bg, fg, showName = true, nameSize = 1.5,
}: Props) {
  const hasLogo = !!marca.logo_url;
  const sizePx = `calc(var(--u)*${size})`;
  const baseBg = bg ?? '#ffffff';
  const baseFg = fg ?? '#0d0d0d';

  if (variant === 'circle' || variant === 'square') {
    const radius = variant === 'circle' ? '999px' : 'calc(var(--u)*.8)';
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: `calc(var(--u)*${size * 0.3})`,
      }}>
        <div style={{
          width: sizePx, height: sizePx,
          borderRadius: radius,
          background: baseBg,
          color: baseFg,
          display: 'grid', placeItems: 'center',
          overflow: 'hidden',
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: `calc(var(--u)*${size * 0.45})`,
          letterSpacing: '0.02em',
          flexShrink: 0,
        }}>
          {hasLogo ? (
            <img src={marca.logo_url!} alt="" crossOrigin="anonymous"
              style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
          ) : initials(marca.nome_empresa)}
        </div>
        {showName && marca.nome_empresa ? (
          <div style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: `calc(var(--u)*${nameSize})`,
            letterSpacing: '0.04em',
            color: fg ?? 'inherit',
            lineHeight: 1.05,
          }}>
            {marca.nome_empresa}
          </div>
        ) : null}
      </div>
    );
  }

  if (variant === 'plain') {
    if (hasLogo) {
      return <img src={marca.logo_url!} alt="" crossOrigin="anonymous"
        style={{ height: sizePx, width: 'auto', objectFit: 'contain', display: 'block' }} />;
    }
    return (
      <div style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: `calc(var(--u)*${size * 0.55})`,
        letterSpacing: '0.04em',
        color: fg ?? 'inherit',
        lineHeight: 1,
      }}>
        {marca.nome_empresa}
      </div>
    );
  }

  // pill
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: `calc(var(--u)*${size * 0.25})`,
      background: baseBg, color: baseFg,
      padding: `calc(var(--u)*${size * 0.2}) calc(var(--u)*${size * 0.45})`,
      borderRadius: '999px',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: `calc(var(--u)*${nameSize})`,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      lineHeight: 1,
    }}>
      {hasLogo ? (
        <img src={marca.logo_url!} alt="" crossOrigin="anonymous"
          style={{ height: `calc(var(--u)*${size * 0.7})`, width: 'auto', objectFit: 'contain' }} />
      ) : (
        <span style={{
          width: `calc(var(--u)*${size * 0.7})`,
          height: `calc(var(--u)*${size * 0.7})`,
          borderRadius: '999px',
          background: baseFg, color: baseBg,
          display: 'grid', placeItems: 'center',
          fontSize: `calc(var(--u)*${size * 0.35})`,
        }}>
          {initials(marca.nome_empresa)}
        </span>
      )}
      {showName && <span>{marca.nome_empresa}</span>}
    </div>
  );
}
