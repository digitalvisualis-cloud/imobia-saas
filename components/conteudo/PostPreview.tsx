'use client';

import { Bed, Bath, Car, Maximize2, MapPin } from 'lucide-react';
import type { ImovelLite, TemplateVariant, Customizacao } from './types';
import { TIPO_LABEL } from './types';
import { getTemplate } from '@/app/_post-templates/registry';
import type {
  PostFormato,
  ImovelParaPost,
  MarcaParaPost,
} from '@/app/_post-templates/types';

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=80';

interface CustomResolvido {
  principal: string;
  texto: string;
  fonte: string;
  logoUrl: string | null;
}

export function PostPreview({
  imovel,
  variant,
  scale = 1,
  custom,
  ratio = '1/1',
}: {
  imovel: ImovelLite;
  variant: TemplateVariant;
  scale?: number;
  custom?: Partial<Customizacao>;
  ratio?: '1/1' | '4/5' | '9/16';
}) {
  // Se o variant eh um template do lab (p1..p20 ou legados clean/borda/
  // premium do registry), renderiza via PostShell. Caso contrario usa o
  // template inline antigo (retrocompat com 'ia', 'minimal', etc).
  const labTemplate = getTemplate(variant);
  if (labTemplate) {
    return (
      <LabTemplateWrapper
        Template={labTemplate.Component}
        imovel={imovel}
        scale={scale}
        custom={custom}
        ratio={ratio}
      />
    );
  }

  // Dimensoes base ja em proporcoes corretas:
  // 1:1   = quadrado IG/FB (1080x1080) → 360x360
  // 4:5   = retrato IG (1080x1350)     → 360x450
  // 9:16  = story (1080x1920)          → 360x640
  const w = 360;
  const h = ratio === '9/16' ? 640 : ratio === '4/5' ? 450 : 360;
  const c: CustomResolvido = {
    principal: custom?.corPrincipal ?? '#3b6cf5',
    texto: custom?.corTexto ?? '#0F172A',
    fonte: custom?.fonte ?? 'Inter',
    logoUrl: custom?.logoUrl ?? null,
  };

  return (
    <div
      className="relative overflow-hidden rounded-lg shadow-xl"
      style={{
        width: w * scale,
        height: h * scale,
        fontFamily: `"${c.fonte}", system-ui, sans-serif`,
        color: c.texto,
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: w,
          height: h,
          fontFamily: `"${c.fonte}", system-ui, sans-serif`,
          color: c.texto,
        }}
      >
        <TemplateBody imovel={imovel} variant={variant} c={c} />
      </div>
    </div>
  );
}

/**
 * Adapta o template do lab (PostShell-based) pro mesmo contrato de
 * scale + preview pequeno do PostPreview. Os templates do lab renderizam
 * em dim nativa (1080x1350 etc.) e a gente escala pra o preview.
 */
function LabTemplateWrapper({
  Template,
  imovel,
  scale,
  custom,
  ratio,
}: {
  Template: React.ComponentType<{
    imovel: ImovelParaPost;
    marca: MarcaParaPost;
    formato: PostFormato;
  }>;
  imovel: ImovelLite;
  scale: number;
  custom?: Partial<Customizacao>;
  ratio: '1/1' | '4/5' | '9/16';
}) {
  // ratio -> PostFormato
  const formato: PostFormato =
    ratio === '9/16' ? 'STORY' : ratio === '1/1' ? 'POST_QUADRADO' : 'POST_VERTICAL';

  // Dim nativa do template (escolhida pelo formato)
  const nativeW = 1080;
  const nativeH = ratio === '9/16' ? 1920 : ratio === '1/1' ? 1080 : 1350;

  // Preview dim — mesma escala do PostPreview legado
  const baseW = 360;
  const baseH = ratio === '9/16' ? 640 : ratio === '4/5' ? 450 : 360;
  const innerScale = baseW / nativeW; // ~0.333

  // Adapta ImovelLite -> ImovelParaPost
  const imovelAdapt: ImovelParaPost = {
    id: imovel.id,
    codigo: imovel.codigo,
    titulo: imovel.titulo,
    tipo: imovel.tipo,
    operacao: imovel.operacao,
    preco: imovel.preco,
    bairro: imovel.bairro,
    cidade: imovel.cidade,
    estado: imovel.estado,
    capaUrl: imovel.capaUrl,
    imagens: imovel.imagens,
    areaM2: imovel.areaM2,
    quartos: imovel.quartos,
    banheiros: imovel.banheiros,
    vagas: imovel.vagas,
    amenidades: [],
  };

  // Customizacao -> MarcaParaPost (com defaults razoaveis)
  const marca: MarcaParaPost = {
    nomeEmpresa: null,
    logoUrl: custom?.logoUrl ?? null,
    corPrimaria: custom?.corPrincipal ?? '#187a57',
    corSecundaria: '#d7ae5e', // gold do lab — usado em CTAs travados
    whatsapp: null,
    instagram: null,
  };

  return (
    <div
      className="relative overflow-hidden rounded-lg shadow-xl"
      style={{ width: baseW * scale, height: baseH * scale }}
    >
      <div
        style={{
          transform: `scale(${innerScale * scale})`,
          transformOrigin: 'top left',
          width: nativeW,
          height: nativeH,
        }}
      >
        <Template imovel={imovelAdapt} marca={marca} formato={formato} />
      </div>
    </div>
  );
}

function TemplateBody({
  imovel,
  variant,
  c,
}: {
  imovel: ImovelLite;
  variant: TemplateVariant;
  c: CustomResolvido;
}) {
  const img = imovel.capaUrl || FALLBACK_IMG;
  const tipoLabel = TIPO_LABEL[imovel.tipo] ?? imovel.tipo;
  const isAluguel = imovel.operacao?.toUpperCase() === 'ALUGUEL';
  const preco = imovel.preco.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
  const labelPreco = isAluguel ? 'Aluguel' : 'A partir de';
  const sufixoPreco = isAluguel ? '/mês' : '';
  const localUF = `${imovel.cidade}${imovel.estado ? `/${imovel.estado}` : ''}`;
  const bairroOuTitulo = imovel.bairro || imovel.titulo;

  // eslint-disable-next-line @next/next/no-img-element
  const Logo = () =>
    c.logoUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={c.logoUrl} alt="logo" className="h-6 w-auto object-contain" />
    ) : null;

  const Stats = () => (
    <div className="flex items-center gap-3">
      {imovel.areaM2 > 0 && <Specs icon={<Maximize2 className="h-3.5 w-3.5" />} value={`${imovel.areaM2}m²`} />}
      {imovel.quartos > 0 && <Specs icon={<Bed className="h-3.5 w-3.5" />} value={String(imovel.quartos)} />}
      {imovel.banheiros > 0 && <Specs icon={<Bath className="h-3.5 w-3.5" />} value={String(imovel.banheiros)} />}
      {imovel.vagas > 0 && <Specs icon={<Car className="h-3.5 w-3.5" />} value={String(imovel.vagas)} />}
    </div>
  );

  // 1. IA — gradiente principal sobre foto
  if (variant === 'ia') {
    return (
      <div className="relative h-full w-full" style={{ color: c.texto }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(180deg, transparent 30%, ${c.principal})` }}
        />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="mb-2 text-[10px] uppercase tracking-widest opacity-90">{tipoLabel}</div>
          <div className="text-lg font-bold leading-tight">{bairroOuTitulo}</div>
          <div className="mb-3 text-xs opacity-90">{localUF}</div>
          <div className="flex items-end justify-between">
            <Stats />
            <div className="text-right">
              <div className="text-[9px] uppercase opacity-80">{labelPreco}</div>
              <div className="text-base font-bold">
                {preco}
                <span className="text-[10px] font-normal">{sufixoPreco}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Clean — card principal embaixo
  if (variant === 'clean') {
    return (
      <div className="relative h-full w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute right-3 top-3"><Logo /></div>
        <div
          className="absolute inset-x-3 bottom-3 rounded-md p-3 shadow-lg"
          style={{ backgroundColor: c.principal, color: c.texto }}
        >
          <div className="flex items-center justify-between">
            <Stats />
            <div className="text-right">
              <div className="text-[9px] uppercase opacity-60">{labelPreco}</div>
              <div className="text-base font-bold">
                {preco}
                <span className="text-[10px]">{sufixoPreco}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Borda — moldura principal
  if (variant === 'borda') {
    return (
      <div className="relative h-full w-full" style={{ backgroundColor: c.principal, color: c.texto }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt="" className="absolute inset-3 h-[calc(100%-24px)] w-[calc(100%-24px)] object-cover" />
        <div
          className="absolute inset-x-3 bottom-3 px-4 py-3"
          style={{ backgroundColor: c.principal, color: c.texto }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[9px] uppercase tracking-widest opacity-80">{bairroOuTitulo}</div>
              <div className="text-sm font-bold">{labelPreco}</div>
              <div className="text-lg font-bold">{preco}</div>
            </div>
            <Stats />
          </div>
        </div>
      </div>
    );
  }

  // 4. Premium — overlay escuro + accent principal
  if (variant === 'premium') {
    return (
      <div className="relative h-full w-full" style={{ color: c.texto }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="absolute right-4 top-4"><Logo /></div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div
            className="mb-1 inline-block border-l-2 pl-2 text-[10px] uppercase tracking-[0.2em]"
            style={{ borderColor: c.principal, color: c.principal }}
          >
            Exclusivo
          </div>
          <div className="text-xl font-bold leading-tight" style={{ color: 'white' }}>{imovel.titulo}</div>
          <div className="mb-3 text-xs opacity-80" style={{ color: 'white' }}>
            <MapPin className="mr-1 inline h-3 w-3" />
            {imovel.bairro || imovel.cidade}, {imovel.cidade}
          </div>
          <div className="flex items-end justify-between" style={{ color: 'white' }}>
            <Stats />
            <div className="text-base font-bold" style={{ color: c.principal }}>
              {preco}
              <span className="text-[10px]" style={{ color: 'white' }}>{sufixoPreco}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. Minimal — fundo principal + foto top
  if (variant === 'minimal') {
    return (
      <div className="relative h-full w-full" style={{ backgroundColor: c.principal, color: c.texto }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt="" className="absolute inset-0 h-3/4 w-full object-cover" />
        <div
          className="absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold"
          style={{ backgroundColor: c.principal, color: c.texto }}
        >
          {preco}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1/4 px-4 py-3">
          <div className="text-base font-bold leading-tight">{imovel.titulo}</div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs opacity-70">{bairroOuTitulo} · {imovel.cidade}</span>
            <Stats />
          </div>
        </div>
      </div>
    );
  }

  // 6. Magazine — fundo principal, estilo editorial
  if (variant === 'magazine') {
    return (
      <div className="relative h-full w-full" style={{ backgroundColor: c.principal, color: c.texto }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt="" className="absolute inset-x-0 top-0 h-3/5 w-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 h-2/5 p-4">
          <div className="text-[10px] uppercase tracking-[0.3em]">Destaque da semana</div>
          <div className="mt-1 text-2xl font-bold italic leading-tight">{bairroOuTitulo}</div>
          <div className="my-2 h-px w-12" style={{ backgroundColor: c.texto, opacity: 0.3 }} />
          <Stats />
          <div className="mt-2 text-lg font-bold">
            {preco}
            <span className="text-xs">{sufixoPreco}</span>
          </div>
        </div>
      </div>
    );
  }

  // 7. Split — metade foto, metade cor
  if (variant === 'split') {
    return (
      <div className="relative grid h-full w-full grid-cols-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt="" className="h-full w-full object-cover" />
        <div className="flex flex-col justify-between p-4" style={{ backgroundColor: c.principal, color: c.texto }}>
          <div>
            <Logo />
            <div className="mt-3 text-[10px] uppercase tracking-widest opacity-80">{tipoLabel}</div>
            <div className="text-xl font-bold leading-tight">{bairroOuTitulo}</div>
            <div className="text-[11px] opacity-90">{localUF}</div>
          </div>
          <div>
            <Stats />
            <div className="mt-3 border-t pt-2" style={{ borderColor: c.texto, opacity: 0.6 }}>
              <div className="text-[9px] uppercase opacity-80">{labelPreco}</div>
              <div className="text-lg font-bold">
                {preco}
                <span className="text-[10px]">{sufixoPreco}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 8. Dark — fundo principal escuro
  if (variant === 'dark') {
    return (
      <div className="relative h-full w-full p-4" style={{ backgroundColor: c.principal, color: c.texto }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt="" className="h-2/3 w-full rounded-md object-cover" />
        <div className="mt-3 flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest opacity-80">Novo · {tipoLabel}</div>
            <div className="text-base font-bold">{bairroOuTitulo}</div>
            <div className="mt-2"><Stats /></div>
          </div>
          <div className="text-right">
            <div className="text-[9px] uppercase opacity-70">{labelPreco}</div>
            <div className="text-lg font-bold">{preco}</div>
          </div>
        </div>
      </div>
    );
  }

  // 9. Tag — etiqueta diagonal
  if (variant === 'tag') {
    return (
      <div className="relative h-full w-full" style={{ color: c.texto }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div
          className="absolute -left-12 top-6 w-48 rotate-[-35deg] py-1.5 text-center text-xs font-bold shadow-lg"
          style={{ backgroundColor: c.principal, color: c.texto }}
        >
          {isAluguel ? 'PARA ALUGAR' : 'À VENDA'}
        </div>
        <div
          className="absolute inset-x-0 bottom-0 p-4"
          style={{ background: `linear-gradient(to top, ${c.principal}, transparent)`, color: c.texto }}
        >
          <div className="text-lg font-bold">{imovel.titulo}</div>
          <div className="text-xs opacity-80">{bairroOuTitulo} · {imovel.cidade}</div>
          <div className="mt-2 flex items-end justify-between">
            <Stats />
            <div className="text-lg font-bold">{preco}</div>
          </div>
        </div>
      </div>
    );
  }

  // 11. Listing — card translucido bottom (estilo Rimberio): NEW LISTING + endereco + price box + specs grid
  if (variant === 'listing') {
    return (
      <div className="relative h-full w-full overflow-hidden bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20" />

        {/* Card translucido bottom */}
        <div className="absolute inset-x-3 bottom-3 rounded-xl border border-white/30 bg-white/85 p-3 backdrop-blur-md">
          <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-black/10 pb-2">
            <div>
              <div className="text-[15px] font-bold leading-tight" style={{ fontFamily: 'Georgia, serif', color: c.texto }}>
                NEW LISTING
              </div>
              <div className="mt-0.5 text-[10px] opacity-70" style={{ color: c.texto }}>
                {bairroOuTitulo}, {localUF}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-wide opacity-60" style={{ color: c.texto }}>
                {labelPreco}
              </div>
              <div className="text-[15px] font-bold leading-tight" style={{ fontFamily: 'Georgia, serif', color: c.texto }}>
                {preco}
                <span className="text-[9px] font-normal">{sufixoPreco}</span>
              </div>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]" style={{ color: c.texto }}>
            {imovel.quartos > 0 && (
              <span className="inline-flex items-center gap-1"><Bed className="h-3 w-3" /> {imovel.quartos} BED</span>
            )}
            {imovel.banheiros > 0 && (
              <span className="inline-flex items-center gap-1"><Bath className="h-3 w-3" /> {imovel.banheiros} BATH</span>
            )}
            {imovel.vagas > 0 && (
              <span className="inline-flex items-center gap-1"><Car className="h-3 w-3" /> {imovel.vagas} VAGAS</span>
            )}
            {imovel.areaM2 > 0 && (
              <span className="inline-flex items-center gap-1"><Maximize2 className="h-3 w-3" /> {imovel.areaM2}m²</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 12. Luxe Gold — card escuro a direita + selo NEW LISTING dourado
  if (variant === 'luxegold') {
    return (
      <div className="relative h-full w-full overflow-hidden bg-neutral-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-black/30 to-black/60" />

        {/* Selo NEW LISTING — pill dourado canto sup */}
        <div
          className="absolute right-3 top-3 rounded-l-full rounded-tr-full px-4 py-1.5 text-[12px] font-semibold tracking-wider"
          style={{ backgroundColor: c.principal, color: '#0F172A', fontFamily: 'Georgia, serif' }}
        >
          NEW LISTING
        </div>

        {/* Card escuro principal */}
        <div className="absolute inset-x-3 bottom-3 rounded-lg border border-white/10 bg-black/75 p-3 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-[9px] uppercase tracking-[0.3em] text-white/60">{labelPreco}</div>
            <div
              className="my-1 rounded border border-white/30 px-2 py-1 text-[20px] font-bold text-white"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {preco}
            </div>
            <div className="text-[10px] text-white/80">
              <MapPin className="mr-0.5 inline h-3 w-3" />
              {bairroOuTitulo}, {imovel.cidade}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-around border-t border-white/10 pt-2 text-[9px] text-white/80">
            {imovel.quartos > 0 && <span className="inline-flex items-center gap-1"><Bed className="h-3 w-3" />{imovel.quartos}</span>}
            {imovel.banheiros > 0 && <span className="inline-flex items-center gap-1"><Bath className="h-3 w-3" />{imovel.banheiros}</span>}
            {imovel.vagas > 0 && <span className="inline-flex items-center gap-1"><Car className="h-3 w-3" />{imovel.vagas}</span>}
            {imovel.areaM2 > 0 && <span className="inline-flex items-center gap-1"><Maximize2 className="h-3 w-3" />{imovel.areaM2}m²</span>}
          </div>
        </div>
      </div>
    );
  }

  // 13. Showcase — card branco bottom estilo flyer (THE HAYNES): brand + stats inline + price right
  if (variant === 'showcase') {
    return (
      <div className="relative h-full w-full overflow-hidden bg-white">
        {/* Foto cobre top 70% */}
        <div className="relative h-[70%] w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" />
          {/* Badge marca */}
          <div
            className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/85 px-3 py-1 text-[10px] font-semibold tracking-wider text-white"
          >
            <span style={{ color: c.principal }}>●</span> TELEMARKETING
          </div>
        </div>

        {/* Card branco bottom 30% */}
        <div className="absolute inset-x-0 bottom-0 h-[30%] bg-white px-4 py-3" style={{ color: c.texto }}>
          <div className="flex h-full items-center justify-between gap-3">
            {/* Esquerda: brand */}
            <div className="min-w-0 flex-shrink-0">
              {c.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.logoUrl} alt="logo" className="h-6 w-auto object-contain" />
              ) : (
                <div
                  className="text-[11px] font-bold leading-tight"
                  style={{ fontFamily: 'Georgia, serif', color: c.principal }}
                >
                  {(imovel.titulo || bairroOuTitulo).slice(0, 20).toUpperCase()}
                </div>
              )}
              <div className="mt-0.5 text-[8px] uppercase tracking-wider opacity-50">
                {tipoLabel}
              </div>
            </div>

            {/* Centro: stats inline */}
            <div className="flex flex-1 items-center justify-center gap-2 text-center text-[9px]">
              {imovel.areaM2 > 0 && (
                <div>
                  <div className="text-base font-bold leading-none" style={{ color: c.principal }}>{imovel.areaM2}<span className="text-[8px]">m²</span></div>
                  <div className="opacity-50">Área</div>
                </div>
              )}
              {imovel.quartos > 0 && (
                <div>
                  <Bed className="mx-auto h-3 w-3" style={{ color: c.principal }} />
                  <div>{imovel.quartos}</div>
                </div>
              )}
              {imovel.banheiros > 0 && (
                <div>
                  <Bath className="mx-auto h-3 w-3" style={{ color: c.principal }} />
                  <div>{imovel.banheiros}</div>
                </div>
              )}
              {imovel.vagas > 0 && (
                <div>
                  <Car className="mx-auto h-3 w-3" style={{ color: c.principal }} />
                  <div>{imovel.vagas}</div>
                </div>
              )}
            </div>

            {/* Direita: preco */}
            <div className="flex-shrink-0 text-right">
              <div className="text-[8px] uppercase opacity-50">{labelPreco}</div>
              <div className="text-[15px] font-bold leading-tight" style={{ color: c.principal }}>
                {preco}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 10. Polaroid
  if (variant === 'polaroid') {
    return (
      <div className="relative h-full w-full p-5 pb-12" style={{ backgroundColor: c.principal, color: c.texto }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt="" className="h-[70%] w-full object-cover shadow-md" />
        <div className="absolute inset-x-5 bottom-3">
          <div className="text-base font-bold leading-tight">{bairroOuTitulo}</div>
          <div className="text-[10px] opacity-70">{localUF} · {imovel.areaM2}m²</div>
          <div className="mt-1 flex items-center justify-between">
            <Stats />
            <div className="text-sm font-bold">{preco}</div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function Specs({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold">
      {icon}
      {value}
    </span>
  );
}
