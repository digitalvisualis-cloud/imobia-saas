import type { Imovel, Tenant, ConfigMarca } from '@prisma/client';
import type { ImovelPublic, TenantPublic } from '@/app/_templates/types';

function titleCase(slug: string) {
  return slug
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

export function buildTenantPublic(
  tenant: Tenant & { marca: ConfigMarca | null },
): TenantPublic {
  return {
    slug: tenant.slug,
    nome: tenant.marca?.nomeEmpresa || titleCase(tenant.slug),
    marca: tenant.marca
      ? {
          nomeEmpresa: tenant.marca.nomeEmpresa,
          slogan: tenant.marca.slogan,
          descricao: tenant.marca.descricao,
          logoUrl: tenant.marca.logoUrl,
          faviconUrl: tenant.marca.faviconUrl,
          corPrimaria: tenant.marca.corPrimaria,
          corSecundaria: tenant.marca.corSecundaria,
          whatsapp: tenant.marca.whatsapp,
          email: tenant.marca.email,
          telefone: tenant.marca.telefone,
          endereco: tenant.marca.endereco,
          instagram: tenant.marca.instagram,
          facebook: tenant.marca.facebook,
          youtube: tenant.marca.youtube,
          linkedin: tenant.marca.linkedin,
          tiktok: tenant.marca.tiktok,
        }
      : null,
  };
}

export function buildImoveisPublic(imoveis: Imovel[]): ImovelPublic[] {
  return imoveis.map((i) => ({
    id: i.id,
    codigo: i.codigo,
    titulo: i.titulo,
    descricao: i.descricao,
    tipo: i.tipo as unknown as string,
    operacao: i.operacao as unknown as string,
    preco: Number(i.preco),
    bairro: i.bairro,
    cidade: i.cidade,
    estado: i.estado,
    endereco: i.endereco,
    quartos: i.quartos,
    suites: i.suites,
    banheiros: i.banheiros,
    vagas: i.vagas,
    areaM2: i.areaM2 != null ? Number(i.areaM2) : null,
    areaTotal: i.areaTotal != null ? Number(i.areaTotal) : null,
    imagens: i.imagens ?? [],
    capaUrl: i.capaUrl,
    videoUrl: i.videoUrl,
    amenidades: i.amenidades ?? [],
    destaque: i.destaque,
  }));
}
