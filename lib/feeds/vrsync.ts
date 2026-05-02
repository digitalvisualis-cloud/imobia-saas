/**
 * Gera XML VRSync (OpenImoveis) — formato padrão de fato do mercado
 * imobiliário BR. Aceito por ZAP, Viva Real, OLX, Imovelweb, Imob Brasil,
 * 99imoveis, Praedium, e a maioria dos portais.
 *
 * Spec oficial: https://developers.grupozap.com/feeds/vrsync/elements/listing.html
 *
 * Schema básico:
 *   <ListingDataFeed xmlns="http://www.vivareal.com/schemas/1.0/VRSync.xsd">
 *     <Header>
 *       <Provider>...nome da imobiliária...</Provider>
 *       <Email>...</Email>
 *       <PublishDate>2026-04-29T18:00:00Z</PublishDate>
 *     </Header>
 *     <Listings>
 *       <Listing>
 *         <ListingID>IMV-VLS-101</ListingID>
 *         <Title>Apartamento 120m² em Pinheiros</Title>
 *         <TransactionType>For Sale</TransactionType>
 *         <ListPrice currency="BRL">1600000</ListPrice>
 *         <Details>
 *           <Description>...</Description>
 *           <LivingArea unit="square metres">120</LivingArea>
 *           <Bedrooms>3</Bedrooms>
 *           <Bathrooms>2</Bathrooms>
 *           <Garage>2</Garage>
 *           <YearlyTax>3500</YearlyTax>
 *           <PropertyAdministrationFee>1200</PropertyAdministrationFee>
 *           <Features>
 *             <Feature>Piscina</Feature>
 *             <Feature>Academia</Feature>
 *           </Features>
 *         </Details>
 *         <Location displayAddress="Street">
 *           <Country abbreviation="BR">Brasil</Country>
 *           <State abbreviation="SP">São Paulo</State>
 *           <City>São Paulo</City>
 *           <Neighborhood>Pinheiros</Neighborhood>
 *           <Address>Rua dos Pinheiros, 123</Address>
 *           <PostalCode>05422-001</PostalCode>
 *         </Location>
 *         <Media>
 *           <Item medium="image" caption="Sala">https://...</Item>
 *         </Media>
 *         <ContactInfo>
 *           <Name>...</Name>
 *           <Email>...</Email>
 *           <Telephone>...</Telephone>
 *         </ContactInfo>
 *       </Listing>
 *     </Listings>
 *   </ListingDataFeed>
 */

type Imovel = {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string | null;
  tipo: string; // TipoImovel: APARTAMENTO, CASA, COBERTURA, STUDIO, etc
  operacao: string; // Operacao: VENDA, ALUGUEL, AMBOS
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
  videoUrl: string | null;
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
  cidade?: string | null;
};

const TIPO_VRSYNC: Record<string, string> = {
  APARTAMENTO: 'Apartment',
  CASA: 'Home',
  COBERTURA: 'Penthouse',
  STUDIO: 'Apartment',
  TERRENO: 'Allotment Land',
  SALA_COMERCIAL: 'Office',
  LOJA: 'Business',
  GALPAO: 'Industrial Building',
  CHACARA: 'Country House',
  SITIO: 'Country House',
  OUTRO: 'Home',
};

/**
 * Escape XML — atributos e text content.
 */
function xml(s: string | number | null | undefined): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function transactionType(operacao: string): string {
  switch (operacao) {
    case 'VENDA':
      return 'For Sale';
    case 'ALUGUEL':
      return 'For Rent';
    case 'AMBOS':
      return 'For Sale/Rent';
    default:
      return 'For Sale';
  }
}

function buildListing(imovel: Imovel, marca: ContextoMarca): string {
  const propertyType = TIPO_VRSYNC[imovel.tipo] ?? 'Home';
  const trans = transactionType(imovel.operacao);

  const features =
    imovel.amenidades && imovel.amenidades.length > 0
      ? `        <Features>\n${imovel.amenidades
          .map((a) => `          <Feature>${xml(a)}</Feature>`)
          .join('\n')}\n        </Features>`
      : '';

  const allImages = [
    ...(imovel.capaUrl ? [imovel.capaUrl] : []),
    ...imovel.imagens.filter((i) => i !== imovel.capaUrl),
  ];
  const media =
    allImages.length > 0
      ? `      <Media>\n${allImages
          .map(
            (url, idx) =>
              `        <Item medium="image" caption="${xml(`Foto ${idx + 1}`)}">${xml(url)}</Item>`,
          )
          .join('\n')}${
          imovel.videoUrl
            ? `\n        <Item medium="video">${xml(imovel.videoUrl)}</Item>`
            : ''
        }\n      </Media>`
      : '';

  const contactName = imovel.agenteNome || marca.nomeEmpresa || '';
  const contactEmail = imovel.agenteEmail || marca.email || '';
  const contactTel = imovel.agenteTelefone || marca.whatsapp || marca.telefone || '';

  return `    <Listing>
      <ListingID>${xml(imovel.codigo)}</ListingID>
      <Title>${xml(imovel.titulo)}</Title>
      <TransactionType>${xml(trans)}</TransactionType>
      <ListPrice currency="BRL">${imovel.preco.toFixed(2)}</ListPrice>
      <PublicationDate>${imovel.updatedAt.toISOString()}</PublicationDate>
      <Details>
        <Description><![CDATA[${imovel.descricao ?? imovel.titulo}]]></Description>
        <PropertyType>${xml(propertyType)}</PropertyType>
        ${imovel.areaM2 != null ? `<LivingArea unit="square metres">${imovel.areaM2}</LivingArea>` : ''}
        ${imovel.areaTotal != null ? `<LotArea unit="square metres">${imovel.areaTotal}</LotArea>` : ''}
        <Bedrooms>${imovel.quartos}</Bedrooms>
        <Bathrooms>${imovel.banheiros}</Bathrooms>
        ${imovel.suites > 0 ? `<Suites>${imovel.suites}</Suites>` : ''}
        <Garage>${imovel.vagas}</Garage>
${features}
      </Details>
      <Location displayAddress="Neighborhood">
        <Country abbreviation="BR">Brasil</Country>
        <State abbreviation="${xml(imovel.estado)}">${xml(imovel.estado)}</State>
        <City>${xml(imovel.cidade)}</City>
        ${imovel.bairro ? `<Neighborhood>${xml(imovel.bairro)}</Neighborhood>` : ''}
        ${imovel.endereco ? `<Address>${xml(imovel.endereco)}</Address>` : ''}
        ${imovel.cep ? `<PostalCode>${xml(imovel.cep)}</PostalCode>` : ''}
      </Location>
${media}
      <ContactInfo>
        <Name>${xml(contactName)}</Name>
        ${contactEmail ? `<Email>${xml(contactEmail)}</Email>` : ''}
        ${contactTel ? `<Telephone>${xml(contactTel)}</Telephone>` : ''}
      </ContactInfo>
    </Listing>`;
}

export function buildVrsyncXml(opts: {
  marca: ContextoMarca;
  imoveis: Imovel[];
  publishDate?: Date;
}): string {
  const { marca, imoveis, publishDate = new Date() } = opts;

  const header = `  <Header>
    <Provider>${xml(marca.nomeEmpresa ?? 'Visualis Imóveis')}</Provider>
    ${marca.email ? `<Email>${xml(marca.email)}</Email>` : ''}
    <PublishDate>${publishDate.toISOString()}</PublishDate>
  </Header>`;

  const listings =
    imoveis.length > 0
      ? `  <Listings>\n${imoveis.map((i) => buildListing(i, marca)).join('\n')}\n  </Listings>`
      : '  <Listings></Listings>';

  return `<?xml version="1.0" encoding="UTF-8"?>
<ListingDataFeed xmlns="http://www.vivareal.com/schemas/1.0/VRSync.xsd">
${header}
${listings}
</ListingDataFeed>`;
}
