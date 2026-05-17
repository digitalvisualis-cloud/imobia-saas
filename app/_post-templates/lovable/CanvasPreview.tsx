// Wrapper que renderiza o template em tamanho NATIVO (1080×*) e escala via CSS transform
// pra caber no container do editor. O export usa o nó nativo, então não perde qualidade.
import { useEffect, useRef, useState } from 'react';
import type { FormatoConfig, Customizacao, ImovelData, MarcaData } from './lib/types';
import type { PostTemplateMeta } from './lib/types';
import { FONT_PAIRS } from './templates/tokens';

interface Props {
  template: PostTemplateMeta;
  formato: FormatoConfig;
  imovel: ImovelData;
  marca: MarcaData;
  customizacao: Customizacao;
  slideIndex?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export function CanvasPreview({
  template, formato, imovel, marca, customizacao, slideIndex = 0,
  maxWidth = 520, maxHeight = 720,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    const el = wrapRef.current?.parentElement;
    if (!el) return;
    const compute = () => {
      const w = Math.min(el.clientWidth, maxWidth);
      const h = maxHeight;
      const s = Math.min(w / formato.width, h / formato.height);
      setScale(s);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [formato.width, formato.height, maxWidth, maxHeight]);

  const pair = FONT_PAIRS.find(f => f.id === customizacao.fontPairId) ?? FONT_PAIRS[0];
  const Comp = template.Component;

  return (
    <div
      style={{
        width: formato.width * scale,
        height: formato.height * scale,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 12,
        boxShadow: '0 20px 60px rgba(0,0,0,.15)',
      }}
    >
      <div
        ref={wrapRef}
        style={{
          width: formato.width,
          height: formato.height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          // var derivada da altura — todos os templates usam calc(var(--u) * N)
          ['--u' as string]: `${formato.height / 100}px`,
          ['--font-display' as string]: pair.cssDisplay,
          ['--font-body' as string]: pair.cssBody,
        }}
      >
        <Comp
          imovel={imovel}
          marca={marca}
          formato={formato}
          customizacao={customizacao}
          slideIndex={slideIndex}
        />
      </div>
    </div>
  );
}
