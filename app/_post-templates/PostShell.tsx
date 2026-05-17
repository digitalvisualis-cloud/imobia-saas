'use client';

import './lab-posts.css';
import {
  type PostTemplateProps,
  FORMATO_DIMENSOES,
  FORMATO_CLASS,
  formatPrecoCompleto,
  operacaoLabel,
  shortTitle,
  specsArray,
} from './types';

/**
 * Variant ID dos 20 templates do CATALOGO_TEMPLATES_POSTS.md.
 * Cada variant aplica regras CSS especificas do lab-posts.css.
 */
export type PostVariant =
  | 'p1' | 'p2' | 'p3' | 'p4' | 'p5'
  | 'p6' | 'p7' | 'p8' | 'p9' | 'p10'
  | 'p11' | 'p12' | 'p13' | 'p14' | 'p15'
  | 'p16' | 'p17' | 'p18' | 'p19' | 'p20';

interface PostShellProps extends PostTemplateProps {
  variant: PostVariant;
}

/**
 * Componente base que renderiza o HTML do visual-lab (slots: post-bg,
 * soft-fade, top-logo, location, headline, price-box, spec-strip,
 * glass-panel, thumb-stack, contact-pill, cta-pill, footer-brand, diagonal).
 *
 * Cada slot eh sempre renderizado; as regras CSS .pN do lab-posts.css
 * decidem o que mostra/esconde/estiliza por template. format-{vertical,
 * square, story, carousel} aplica overrides de tipografia/posicao.
 *
 * Brand colors:
 * - --post-accent: cor primaria do tenant (marca.corPrimaria)
 * - --post-secondary: cor secundaria (marca.corSecundaria) — usada
 *   raramente, alguns templates tem cores travadas (gold p4, orange p7).
 */
export function PostShell({ imovel, marca, formato, variant }: PostShellProps) {
  const dim = FORMATO_DIMENSOES[formato];
  const formatClass = FORMATO_CLASS[formato];
  const isStory = formato === 'STORY';
  const isSquare = formato === 'POST_QUADRADO';

  // Titulo: completo no vertical, curto no square, ultra-curto no story
  const titleFull = imovel.titulo;
  const title = isStory
    ? shortTitle(titleFull, 'ultra')
    : isSquare
      ? shortTitle(titleFull, 'short')
      : titleFull;

  const tipoLabel = imovel.tipo
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
  const location = [imovel.bairro, imovel.cidade].filter(Boolean).join(' · ');
  const opLabel = operacaoLabel(imovel.operacao);
  const preco = formatPrecoCompleto(imovel.preco);
  const specs = specsArray(imovel);

  // Thumbs: ate 3 fotos extras (alem da capa) pra galerias laterais (p3, p4, p10)
  const thumbs = imovel.imagens.slice(1, 4);

  const brandLetter =
    (marca.nomeEmpresa ?? 'P').trim().charAt(0).toUpperCase() || 'P';
  const phone = marca.whatsapp ?? '';

  return (
    <div
      className={`${formatClass} imobia-lab-post-root`}
      style={{
        width: dim.w,
        height: dim.h,
        // Vars do template (defaults do lab, brand-aware)
        ['--post-accent' as string]: marca.corPrimaria,
        ['--post-secondary' as string]: marca.corSecundaria,
      }}
    >
      <article className={`post-artboard ref-post ${variant}`}>
        {/* Foto de fundo */}
        <div className="post-bg">
          {imovel.capaUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imovel.capaUrl} alt="" crossOrigin="anonymous" />
          )}
        </div>

        {/* Camadas decorativas */}
        <div className="soft-fade" />
        <div className="diagonal" />

        {/* Top logo (brand pill) */}
        <div className="top-logo">
          <span>{brandLetter}</span>
          {marca.nomeEmpresa ?? 'Imobiliária'}
        </div>

        {/* Localizacao */}
        {location && <div className="location">{location}</div>}

        {/* Headline */}
        <div className="headline">
          <strong>{title}</strong>
          <em>{opLabel}</em>
        </div>

        {/* Price box */}
        <div className="price-box">
          <small>{imovel.operacao === 'VENDA' ? 'A partir de' : 'Aluguel'}</small>
          <b>{preco}</b>
        </div>

        {/* Spec strip */}
        <div className="spec-strip">
          {specs.map((s, i) => (
            <span key={i}>
              <b>{s.value}</b>
              <small>{s.unit}</small>
            </span>
          ))}
        </div>

        {/* Glass panel (usado pelo p2, p12) */}
        <div className="glass-panel">
          <div>
            <h4>{variant === 'p2' || variant === 'p12' ? 'New Listing' : 'Imóvel disponível'}</h4>
            <p>{location}</p>
          </div>
          <strong>{preco}</strong>
        </div>

        {/* Thumb stack (galeria lateral pra p3, p4, p10) */}
        <div className="thumb-stack">
          {thumbs.map((src, i) => (
            <span key={i} className={`thumb t${i + 1}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" crossOrigin="anonymous" />
            </span>
          ))}
        </div>

        {/* Contact pill (p1, p6) */}
        <div className="contact-pill">
          <span>Telemarketing</span>
          <b>{phone || marca.nomeEmpresa || 'Fale conosco'}</b>
        </div>

        {/* CTA pill (p4, p6) */}
        <div className="cta-pill">
          {variant === 'p4' || variant === 'p14'
            ? 'DM to schedule tour'
            : variant === 'p6' || variant === 'p16'
              ? 'Entre em contato'
              : 'Mais informações'}
        </div>

        {/* Footer brand */}
        <div className="footer-brand">
          {marca.nomeEmpresa ?? 'Imobiliária'} · {imovel.codigo}
        </div>
      </article>
    </div>
  );
}
