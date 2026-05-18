'use client';

/**
 * Wrapper de <img> que sobrepoe a marca d'agua do tenant em cima da foto
 * quando `marca.marcaDaguaAtiva = true`. Usado APENAS no site publico —
 * NAO no Criador de Posts (templates ja tem BrandMark proprio).
 *
 * Implementacao via CSS overlay (proteção visual, não criptografica).
 * Se o usuario salvar a imagem original via "Salvar como", pega sem marca.
 * Pra protecao real precisaria gerar PNG composto no server (TODO futuro).
 */
import type { BrandKit } from '@/app/_templates/types';

interface Props {
  src: string;
  alt?: string;
  className?: string;
  marca: BrandKit | null;
  /**
   * Quando false, ignora a config do tenant e nao mostra marca d'agua.
   * Usar em thumbs/avatars/contextos onde marca atrapalha.
   */
  aplicarMarca?: boolean;
}

const TAMANHO_PCT: Record<string, number> = {
  pequeno: 12,
  medio: 20,
  grande: 30,
};

function getPosicaoStyle(posicao: string): React.CSSProperties {
  switch (posicao) {
    case 'inferior-direita':
      return { right: '4%', bottom: '4%', transform: 'none', left: 'auto', top: 'auto' };
    case 'inferior-esquerda':
      return { left: '4%', bottom: '4%', transform: 'none', right: 'auto', top: 'auto' };
    case 'inferior-centro':
      return { left: '50%', bottom: '4%', transform: 'translateX(-50%)', top: 'auto', right: 'auto' };
    case 'tile':
      // No tile a logo se repete; trata em outro branch
      return {};
    case 'centro':
    default:
      return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)', right: 'auto', bottom: 'auto' };
  }
}

export function ImagemComMarca({ src, alt = '', className, marca, aplicarMarca = true }: Props) {
  const ativa = aplicarMarca && marca?.marcaDaguaAtiva && marca?.logoUrl;

  // Se nao tem marca ativa ou nao tem logo cadastrado, renderiza img puro
  if (!ativa) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} />;
  }

  const tamanhoPct = TAMANHO_PCT[marca!.marcaDaguaTamanho] ?? 20;
  const opacidade = Math.max(10, Math.min(80, marca!.marcaDaguaOpacidade)) / 100;
  const posicao = marca!.marcaDaguaPosicao || 'centro';
  const isTile = posicao === 'tile';

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-full w-full object-cover" />
      {isTile ? (
        // Padrao repetido em diagonal
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `url(${marca!.logoUrl})`,
            backgroundRepeat: 'repeat',
            backgroundSize: `${tamanhoPct * 1.5}% auto`,
            backgroundPosition: 'center',
            opacity: opacidade,
            mixBlendMode: 'overlay',
            transform: 'rotate(-25deg) scale(1.4)',
            transformOrigin: 'center',
          }}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={marca!.logoUrl!}
          alt=""
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            width: `${tamanhoPct}%`,
            height: 'auto',
            opacity: opacidade,
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))',
            ...getPosicaoStyle(posicao),
          }}
        />
      )}
    </div>
  );
}
