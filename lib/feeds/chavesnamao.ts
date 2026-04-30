/**
 * Gera XML pro portal Chaves na Mão.
 *
 * Formato proprietário, mais simples e antigo. Documentação não-oficial
 * compilada de:
 * - https://ajuda.imobibrasil.com.br/central-ajuda/integracao-com-chaves-na-mao/
 * - https://suporte.praedium.com.br/pt-BR/articles/6233496-integrando-com-o-chaves-na-mao
 *
 * Cliente envia URL desse feed por email pra atendimento@chavesnamao.com.br
 * com nome + CNPJ. Eles processam 4x/dia (07h, 13h, 19h, 01h).
 *
 * Schema básico:
 *   <imoveis>
 *     <imovel>
 *       <referencia>IMV-VLS-101</referencia>
 *       <tipo>Apartamento</tipo>
 *       <subtipo>Padrão</subtipo>
 *       <finalidade>Venda</finalidade>
 *       <valor>1600000.00</valor>
 *       <valor_condominio>1200.00</valor_condominio>
 *       <valor_iptu>3500.00</valor_iptu>
 *       <area_util>120</area_util>
 *       <area_total>140</area_total>
 *       <dormitorios>3</dormitorios>
 *       <suites>1</suites>
 *       <banheiros>2</banheiros>
 *       <vagas>2</vagas>
 *       <descricao><![CDATA[...]]></descricao>
 *       <observacoes><![CDATA[...]]></observacoes>
 *       <cidade>São Paulo</cidade>
 *       <bairro>Pinheiros</bairro>
 *       <estado>SP</estado>
 *       <cep>05422-001</cep>
 *       <endereco>Rua dos Pinheiros, 123</endereco>
 *       <imagens>
 *         <imagem>https://...</imagem>
 *       </imagens>
 *       <caracteristicas>
 *         <caracteristica>Piscina</caracteristica>
 *       </caracteristicas>
 *       <contato>
 *         <nome>...</nome>
 *         <telefone>...</telefone>
 *         <email>...</email>
 *       </contato>
 *     </imovel>
 *   </imoveis>
 */

type Imovel = {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  operacao: string;
  preco: number;
  quartos: number;
  suites: number;
  banheiros: number;
  vagas: number;
  areaM2: number | null;
  areaTotal: number | null;
  estado: string;
  cidade: string;
  bairro: string | null;
  endereco: string | null;
  cep: string | null;
  imagens: string[];
  capaUrl: string | null;
  amenidades: string[];
  agenteNome: string | null;
  agenteTelefone: string | null;
  agenteEmail: string | null;
  updatedAt: Date;
};

type ContextoMarca = {
  nomeEmpresa: string | null;
  email: string | null;
  whatsapp: string | null;
  telefone: string | null;
};

const TIPO_CHAVESNAMAO: Record<string, string> = {
  APARTAMENTO: 'Apartamento',
  CASA: 'Casa',
  COBERTURA: 'Cobertura',
  STUDIO: 'Studio',
  TERRENO: 'Terreno',
  SALA_COMERCIAL: 'Sala Comercial',
  LOJA: 'Loja',
  GALPAO: 'Galpão',
  CHACARA: 'Chácara',
  SITIO: 'Sítio',
  OUTRO: 'Outro',
};

function xml(s: string | number | null | undefined): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function finalidade(operacao: string): string {
  switch (operacao) {
    case 'VENDA':
      return 'Venda';
    case 'ALUGUEL':
      return 'Aluguel';
    case 'AMBOS':
      return 'Venda/Aluguel';
    default:
      return 'Venda';
  }
}

function buildImovel(imovel: Imovel, marca: ContextoMarca): string {
  const tipo = TIPO_CHAVESNAMAO[imovel.tipo] ?? 'Outro';

  const allImages = [
    ...(imovel.capaUrl ? [imovel.capaUrl] : []),
    ...imovel.imagens.filter((i) => i !== imovel.capaUrl),
  ];
  const imagens =
    allImages.length > 0
      ? `      <imagens>\n${allImages
          .map((url) => `        <imagem>${xml(url)}</imagem>`)
          .join('\n')}\n      </imagens>`
      : '';

  const caracteristicas =
    imovel.amenidades && imovel.amenidades.length > 0
      ? `      <caracteristicas>\n${imovel.amenidades
          .map((a) => `        <caracteristica>${xml(a)}</caracteristica>`)
          .join('\n')}\n      </caracteristicas>`
      : '';

  const contactName = imovel.agenteNome || marca.nomeEmpresa || '';
  const contactEmail = imovel.agenteEmail || marca.email || '';
  const contactTel = imovel.agenteTelefone || marca.whatsapp || marca.telefone || '';

  return `    <imovel>
      <referencia>${xml(imovel.codigo)}</referencia>
      <tipo>${xml(tipo)}</tipo>
      <finalidade>${xml(finalidade(imovel.operacao))}</finalidade>
      <valor>${imovel.preco.toFixed(2)}</valor>
      ${imovel.areaM2 != null ? `<area_util>${imovel.areaM2}</area_util>` : ''}
      ${imovel.areaTotal != null ? `<area_total>${imovel.areaTotal}</area_total>` : ''}
      <dormitorios>${imovel.quartos}</dormitorios>
      ${imovel.suites > 0 ? `<suites>${imovel.suites}</suites>` : ''}
      <banheiros>${imovel.banheiros}</banheiros>
      <vagas>${imovel.vagas}</vagas>
      <descricao><![CDATA[${imovel.descricao ?? imovel.titulo}]]></descricao>
      <cidade>${xml(imovel.cidade)}</cidade>
      ${imovel.bairro ? `<bairro>${xml(imovel.bairro)}</bairro>` : ''}
      <estado>${xml(imovel.estado)}</estado>
      ${imovel.cep ? `<cep>${xml(imovel.cep)}</cep>` : ''}
      ${imovel.endereco ? `<endereco>${xml(imovel.endereco)}</endereco>` : ''}
${imagens}
${caracteristicas}
      <contato>
        <nome>${xml(contactName)}</nome>
        ${contactTel ? `<telefone>${xml(contactTel)}</telefone>` : ''}
        ${contactEmail ? `<email>${xml(contactEmail)}</email>` : ''}
      </contato>
      <atualizado_em>${imovel.updatedAt.toISOString()}</atualizado_em>
    </imovel>`;
}

export function buildChavesNaMaoXml(opts: {
  marca: ContextoMarca;
  imoveis: Imovel[];
}): string {
  const { marca, imoveis } = opts;

  const items =
    imoveis.length > 0 ? imoveis.map((i) => buildImovel(i, marca)).join('\n') : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<imoveis>
  <provedor>${xml(marca.nomeEmpresa ?? 'Visualis Imóveis')}</provedor>
  <gerado_em>${new Date().toISOString()}</gerado_em>
${items}
</imoveis>`;
}
