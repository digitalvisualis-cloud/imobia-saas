'use client';

import { Bed, Bath, Car, Maximize2, MapPin } from 'lucide-react';
import type { ImovelLite, TemplateVariant, Customizacao } from './types';
import { TIPO_LABEL } from './types';

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
  ratio?: '1/1' | '9/16';
}) {
  // Dimensões base — quadrado 1080 ou story 9:16
  const w = 360;
  const h = ratio === '9/16' ? 640 : 450;
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
        fontFamily: c.fonte,
        color: c.texto,
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: w,
          height: h,
          fontFamily: c.fonte,
          color: c.texto,
        }}
      >
        <TemplateBody imovel={imovel} variant={variant} c={c} />
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
