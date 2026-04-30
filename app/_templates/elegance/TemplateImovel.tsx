'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, BedDouble, Bath, Car, Maximize, MessageCircle, Copy, Check, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  formatBRL,
  TIPO_LABELS,
  FINALIDADE_LABELS,
  buildWhatsAppLink,
  type TenantPublic,
  type ImovelPublic,
} from '../types';

export function TemplateImovel({
  tenant,
  imovel,
}: {
  tenant: TenantPublic;
  imovel: ImovelPublic;
}) {
  const [copied, setCopied] = useState(false);
  const [activePhoto, setActivePhoto] = useState(imovel.capaUrl ?? imovel.imagens[0] ?? null);
  const isAluguel = imovel.operacao === 'ALUGUEL';
  const home = `/s/${tenant.slug}`;
  const wa = tenant.marca?.whatsapp;

  function copyCodigo() {
    navigator.clipboard.writeText(imovel.codigo);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href={home}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm">Voltar</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        {/* Galeria */}
        <div>
          <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted">
            {activePhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activePhoto}
                alt={imovel.titulo}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">
                🏠
              </div>
            )}
          </div>

          {imovel.imagens.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-3">
              {imovel.imagens.map((url, i) => (
                <button
                  key={url}
                  onClick={() => setActivePhoto(url)}
                  className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${
                    url === activePhoto
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                  type="button"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Foto ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar info */}
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-primary text-primary-foreground">
              {FINALIDADE_LABELS[imovel.operacao] ?? imovel.operacao}
            </Badge>
            <Badge variant="outline">{TIPO_LABELS[imovel.tipo] ?? imovel.tipo}</Badge>
            {imovel.destaque && (
              <Badge className="bg-secondary text-secondary-foreground">
                Destaque
              </Badge>
            )}
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-semibold leading-tight text-foreground">
            {imovel.titulo}
          </h1>

          {(imovel.bairro || imovel.cidade) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm">
                {[imovel.bairro, imovel.cidade, imovel.estado]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>
          )}

          <p className="font-display text-4xl md:text-5xl font-bold text-primary leading-none">
            {formatBRL(imovel.preco)}
            {isAluguel && (
              <span className="font-body text-base font-normal text-muted-foreground ml-2">
                /mês
              </span>
            )}
          </p>

          {/* Specs grid 4 cards */}
          <div className="grid grid-cols-2 gap-2">
            {imovel.quartos > 0 && (
              <SpecCard icon={<BedDouble className="h-5 w-5" />} valor={imovel.quartos} label="Quartos" />
            )}
            {imovel.banheiros > 0 && (
              <SpecCard icon={<Bath className="h-5 w-5" />} valor={imovel.banheiros} label="Banheiros" />
            )}
            {imovel.vagas > 0 && (
              <SpecCard icon={<Car className="h-5 w-5" />} valor={imovel.vagas} label="Vagas" />
            )}
            {imovel.areaM2 != null && imovel.areaM2 > 0 && (
              <SpecCard
                icon={<Maximize className="h-5 w-5" />}
                valor={`${imovel.areaM2} m²`}
                label="Área"
              />
            )}
          </div>

          {/* Código com copy */}
          <div className="bg-muted/50 rounded-md p-3 flex items-center justify-between">
            <span className="text-sm">
              Código:{' '}
              <span className="font-mono font-semibold text-primary">
                {imovel.codigo}
              </span>
            </span>
            <button
              onClick={copyCodigo}
              className="text-muted-foreground hover:text-primary transition-colors"
              type="button"
              title="Copiar código"
              aria-label="Copiar código"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* CTA WhatsApp */}
          {wa ? (
            <Button
              asChild
              size="lg"
              className="w-full bg-green-500 hover:bg-green-600 text-white"
            >
              <a
                href={buildWhatsAppLink(wa, '', {
                  codigo: imovel.codigo,
                  titulo: imovel.titulo,
                  bairro: imovel.bairro,
                  cidade: imovel.cidade,
                })}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Tenho interesse neste imóvel
              </a>
            </Button>
          ) : (
            <Button size="lg" disabled className="w-full">
              Contato não disponível
            </Button>
          )}
        </div>
      </div>

      {/* Descrição */}
      {imovel.descricao && (
        <section className="mt-12 max-w-3xl">
          <h2 className="font-display text-3xl mb-4 text-foreground">Descrição</h2>
          <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
            {imovel.descricao}
          </p>
        </section>
      )}

      {/* Características */}
      {imovel.amenidades.length > 0 && (
        <section className="mt-10 max-w-3xl">
          <h2 className="font-display text-3xl mb-4 text-foreground">
            O que o imóvel oferece
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {imovel.amenidades.map((a) => (
              <div key={a} className="flex items-center gap-2 text-sm text-foreground/80">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>{a}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SpecCard({
  icon,
  valor,
  label,
}: {
  icon: React.ReactNode;
  valor: string | number;
  label: string;
}) {
  return (
    <div className="bg-muted/50 rounded-md p-4 flex items-center gap-3">
      <div className="text-primary">{icon}</div>
      <div>
        <p className="font-semibold text-foreground">{valor}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
