// Renderiza os slides em tamanho NATIVO fora da tela, prontos pra exportar.
// Slide 0: template completo. Slides 1..N-1 (carrossel): PhotoSlide com fotos do imóvel.
import { forwardRef, useImperativeHandle, useRef } from 'react';
import type {
  Customizacao, FormatoConfig, ImovelData, MarcaData, PostTemplateMeta,
} from './lib/types';
import { FONT_PAIRS } from './templates/tokens';
import { PhotoSlide } from './templates/PhotoSlide';

interface Props {
  template: PostTemplateMeta;
  formato: FormatoConfig;
  imovel: ImovelData;
  marca: MarcaData;
  customizacao: Customizacao;
}

export interface ExportStageHandle {
  getSlideNodes: () => HTMLElement[];
}

export const ExportStage = forwardRef<ExportStageHandle, Props>(function ExportStage(
  { template, formato, imovel, marca, customizacao }, ref,
) {
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pair = FONT_PAIRS.find(f => f.id === customizacao.fontPairId) ?? FONT_PAIRS[0];
  const Comp = template.Component;
  const slides = Math.max(1, formato.slides);

  useImperativeHandle(ref, () => ({
    getSlideNodes: () => slideRefs.current.filter((n): n is HTMLDivElement => !!n),
  }), []);

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        left: '-99999px',
        top: 0,
        pointerEvents: 'none',
      }}
    >
      {Array.from({ length: slides }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { slideRefs.current[i] = el; }}
          style={{
            width: formato.width,
            height: formato.height,
            overflow: 'hidden',
            ['--u' as string]: `${formato.height / 100}px`,
            ['--font-display' as string]: pair.cssDisplay,
            ['--font-body' as string]: pair.cssBody,
          }}
        >
          {i === 0 ? (
            <Comp
              imovel={imovel}
              marca={marca}
              formato={formato}
              customizacao={customizacao}
              slideIndex={0}
            />
          ) : (
            <PhotoSlide
              imovel={imovel}
              marca={marca}
              formato={formato}
              customizacao={customizacao}
              slideIndex={i}
            />
          )}
        </div>
      ))}
    </div>
  );
});
