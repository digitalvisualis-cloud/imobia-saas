// Slide secundário de carrossel — foto cadastrada do imóvel ocupando full-bleed,
// com brand mark discreto no canto.
import type { TemplateProps } from '../lib/types';
import { pickImage } from './_shared';
import { BrandMark } from './BrandMark';

export function PhotoSlide({ imovel, marca, customizacao, slideIndex = 0 }: TemplateProps) {
  const c = customizacao;
  const src = pickImage(imovel, slideIndex);

  return (
    <div style={{
      width: '100%', height: '100%',
      position: 'relative',
      background: '#000',
      overflow: 'hidden',
      fontFamily: 'var(--font-body)',
    }}>
      <img src={src} alt="" crossOrigin="anonymous"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      {/* Gradient sutil no rodapé pra contraste */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '22%',
        background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,.55) 100%)',
      }} />
      {/* Brand mark canto inferior esquerdo */}
      {c.showLogo && (
        <div style={{ position: 'absolute', bottom: 'calc(var(--u)*2.5)', left: 'calc(var(--u)*2.5)' }}>
          <BrandMark marca={marca} variant="circle" size={3.5} nameSize={1.3}
            bg="rgba(255,255,255,.95)" fg={c.primary} />
        </div>
      )}
    </div>
  );
}
