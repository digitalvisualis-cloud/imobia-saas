/**
 * Serialização de objetos do Prisma pra Client Components.
 *
 * Next.js 16 não permite passar `Decimal` (ou outros objetos de classe) do
 * Server pro Client Component. Esses helpers convertem pra primitivos antes.
 *
 * Uso:
 *   const imovel = await prisma.imovel.findUnique(...);
 *   return <Cliente imovel={serializeImovel(imovel)} />;
 */

import type { Imovel, Lead } from "@prisma/client";

/** Converte Decimal/BigInt/Date pra primitivo JSON-safe. */
function toPlain(v: unknown): unknown {
  if (v == null) return v;
  if (typeof v === "bigint") return Number(v);
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object" && v !== null) {
    // Decimal tem toNumber()
    const obj = v as { toNumber?: () => number };
    if (typeof obj.toNumber === "function") return obj.toNumber();
  }
  return v;
}

export type SerializedImovel = Omit<
  Imovel,
  | "preco"
  | "areaM2"
  | "areaTotal"
  | "areaTerrenoM2"
  | "createdAt"
  | "updatedAt"
  | "geradoAt"
> & {
  preco: number;
  areaM2: number | null;
  areaTotal: number | null;
  areaTerrenoM2: number | null;
  createdAt: string;
  updatedAt: string;
  geradoAt: string | null;
};

export function serializeImovel(imovel: Imovel): SerializedImovel {
  return {
    ...imovel,
    preco: toPlain(imovel.preco) as number,
    areaM2: toPlain(imovel.areaM2) as number | null,
    areaTotal: toPlain(imovel.areaTotal) as number | null,
    areaTerrenoM2: toPlain(imovel.areaTerrenoM2) as number | null,
    createdAt: toPlain(imovel.createdAt) as string,
    updatedAt: toPlain(imovel.updatedAt) as string,
    geradoAt: toPlain(imovel.geradoAt) as string | null,
  };
}

export function serializeImoveis(imoveis: Imovel[]): SerializedImovel[] {
  return imoveis.map(serializeImovel);
}

export type SerializedLead = Omit<
  Lead,
  "orcamento" | "createdAt" | "updatedAt"
> & {
  orcamento: number | null;
  createdAt: string;
  updatedAt: string;
};

export function serializeLead(lead: Lead): SerializedLead {
  return {
    ...lead,
    orcamento: toPlain(lead.orcamento) as number | null,
    createdAt: toPlain(lead.createdAt) as string,
    updatedAt: toPlain(lead.updatedAt) as string,
  };
}
