import Link from 'next/link';
import { BedDouble, Car, Maximize, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  formatBRL,
  TIPO_LABELS,
  FINALIDADE_LABELS,
  type ImovelPublic,
} from '../types';

export function PropertyCard({
  imovel,
  slug,
}: {
  imovel: ImovelPublic;
  slug: string;
}) {
  const isAluguel = imovel.operacao === 'ALUGUEL';

  return (
    <Link href={`/s/${slug}/imovel/${imovel.codigo}`}>
      <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-border/50 bg-card cursor-pointer">
        <div className="relative aspect-[16/10] overflow-hidden">
          {imovel.capaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imovel.capaUrl}
              alt={imovel.titulo}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-4xl opacity-30">🏠</span>
            </div>
          )}

          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className="bg-primary text-primary-foreground text-xs font-body">
              {FINALIDADE_LABELS[imovel.operacao] ?? imovel.operacao}
            </Badge>
            {imovel.destaque && (
              <Badge className="bg-secondary text-secondary-foreground text-xs font-body">
                Destaque
              </Badge>
            )}
          </div>

          <div className="absolute bottom-3 right-3">
            <Badge
              variant="outline"
              className="bg-card/85 backdrop-blur text-xs font-body border-0"
            >
              {TIPO_LABELS[imovel.tipo] ?? imovel.tipo}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-display text-xl font-semibold text-card-foreground line-clamp-1">
              {imovel.titulo}
            </h3>
            {(imovel.bairro || imovel.cidade) && (
              <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>
                  {[imovel.bairro, imovel.cidade].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
          </div>

          <p className="font-display text-2xl font-bold text-primary">
            {formatBRL(imovel.preco)}
            {isAluguel && (
              <span className="text-sm font-body font-normal text-muted-foreground">
                /mês
              </span>
            )}
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground border-t border-border pt-3">
            {imovel.quartos > 0 && (
              <div className="flex items-center gap-1">
                <BedDouble className="h-4 w-4" />
                <span>{imovel.quartos}</span>
              </div>
            )}
            {imovel.vagas > 0 && (
              <div className="flex items-center gap-1">
                <Car className="h-4 w-4" />
                <span>{imovel.vagas}</span>
              </div>
            )}
            {imovel.areaM2 != null && imovel.areaM2 > 0 && (
              <div className="flex items-center gap-1">
                <Maximize className="h-4 w-4" />
                <span>{imovel.areaM2} m²</span>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground font-body">
            Código:{' '}
            <span className="font-medium text-primary">{imovel.codigo}</span>
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
