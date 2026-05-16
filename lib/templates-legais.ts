/**
 * Templates de paginas legais LGPD-compliant pro site publico do tenant.
 * Substituicao de placeholders: {{nome_empresa}}, {{email}}, {{cidade}}.
 *
 * NAO sao parecer juridico — sao templates baseline. O tenant deveria
 * revisar com advogado antes de publicar.
 */

export type DadosTenantParaTemplate = {
  nomeEmpresa: string;
  email: string;
  cidade: string;
};

function interp(template: string, dados: DadosTenantParaTemplate): string {
  return template
    .replaceAll('{{nome_empresa}}', dados.nomeEmpresa || 'esta imobiliária')
    .replaceAll('{{email}}', dados.email || 'contato@imobiliaria.com.br')
    .replaceAll('{{cidade}}', dados.cidade || 'Brasil');
}

const PRIVACIDADE = `# Política de Privacidade

Esta Política descreve como **{{nome_empresa}}** coleta, usa e protege dados pessoais dos visitantes do site, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).

## 1. Quem somos e quem coleta os dados

A controladora dos dados é **{{nome_empresa}}**, com sede em {{cidade}}. Contato: {{email}}.

## 2. Quais dados coletamos

Coletamos as informações que você nos fornece voluntariamente ao:

- Enviar mensagem pelo formulário de contato (nome, e-mail, telefone, mensagem)
- Solicitar visita ou informações sobre um imóvel
- Interagir via WhatsApp por meio dos botões do site

Coletamos também, automaticamente, dados de navegação (endereço IP, tipo de navegador, páginas visitadas) por meio de cookies — ver Política de Cookies.

## 3. Para que usamos seus dados

- Responder seu contato e enviar informações sobre imóveis
- Agendar visitas e proposta comercial
- Melhorar a experiência no site
- Cumprir obrigações legais

## 4. Por quanto tempo guardamos

Mantemos seus dados pelo tempo necessário pra cumprir as finalidades acima, ou até você solicitar a exclusão. Dados de leads inativos podem ser arquivados após 24 meses.

## 5. Com quem compartilhamos

Não vendemos seus dados. Compartilhamos apenas com:

- Corretores parceiros, quando necessário pra atender sua solicitação
- Plataformas de e-mail, CRM e atendimento (sob contrato de confidencialidade)
- Autoridades legais, quando exigido por lei

## 6. Seus direitos como titular (LGPD)

Você pode, a qualquer momento:

- Confirmar se tratamos seus dados
- Acessar, corrigir ou excluir os dados
- Pedir a portabilidade
- Revogar o consentimento

Solicite por: **{{email}}**.

## 7. Segurança

Adotamos medidas técnicas e administrativas pra proteger seus dados contra acesso não autorizado, perda ou alteração.

## 8. Alterações nesta Política

Podemos atualizar este texto periodicamente. A versão mais recente fica sempre nesta página.

---

*Texto baseado em práticas de mercado e LGPD. Recomendamos revisão por advogado antes de publicar.*`;

const TERMOS = `# Termos de Uso

Bem-vindo ao site de **{{nome_empresa}}**. Ao acessar e usar este site, você concorda com os termos abaixo.

## 1. Objeto do site

Este site apresenta imóveis comercializados por **{{nome_empresa}}** com fins de venda e/ou locação. As informações têm caráter meramente informativo — valores, disponibilidade e características podem mudar sem aviso prévio.

## 2. Cadastro e contato

Ao enviar dados pelo formulário ou botão de WhatsApp, você autoriza **{{nome_empresa}}** a entrar em contato sobre o imóvel de interesse. Os dados serão tratados conforme nossa Política de Privacidade.

## 3. Conteúdo do site

Fotos, descrições, plantas e demais conteúdos são de propriedade de **{{nome_empresa}}** ou de terceiros licenciados. Fica vedada a reprodução, total ou parcial, sem autorização prévia por escrito.

## 4. Limitação de responsabilidade

**{{nome_empresa}}** se esforça pra manter as informações atualizadas, mas não garante:

- Disponibilidade contínua do site
- Ausência de erros, imprecisões ou desatualizações
- Resultado de qualquer negociação iniciada via site

A formalização de compra, venda ou locação depende de contrato específico assinado pelas partes.

## 5. Links externos

Este site pode conter links pra portais imobiliários (ZAP, Viva Real, OLX), redes sociais e outros recursos. Não nos responsabilizamos pelo conteúdo desses sites externos.

## 6. Foro

Fica eleito o foro da comarca de {{cidade}} pra dirimir qualquer questão decorrente destes Termos.

## 7. Dúvidas

Em caso de dúvida sobre estes Termos, fale com a gente em **{{email}}**.

---

*Texto baseado em práticas de mercado. Recomendamos revisão por advogado antes de publicar.*`;

const COOKIES = `# Política de Cookies

Este site usa cookies pra melhorar sua experiência de navegação. Esta política explica o que são, quais usamos e como você pode gerenciar.

## 1. O que são cookies

Cookies são pequenos arquivos que ficam armazenados no seu navegador quando você visita um site. Eles ajudam o site a funcionar e a entender como você o usa.

## 2. Quais cookies usamos

**Essenciais** — sem eles o site não funciona corretamente:
- Sessão do usuário (mantém você logado, lembra preferências)
- Aceite desta política de cookies

**Analíticos** (se ativados) — pra entender como o site é usado:
- Páginas visitadas, tempo de permanência
- Imóveis mais clicados
- Origem do tráfego (Google, redes sociais, indicação)

Não usamos cookies de publicidade direcionada por terceiros sem seu consentimento.

## 3. Como gerenciar

Você pode:

- **Aceitar** todos os cookies no banner que aparece ao entrar no site
- **Recusar** os não-essenciais (o site continua funcionando)
- **Apagar** os cookies a qualquer momento nas configurações do seu navegador

A maioria dos navegadores permite gerenciar cookies em: *Configurações → Privacidade*.

## 4. Cookies de terceiros

Quando você compartilha um imóvel ou clica em um link pra rede social, o site externo pode usar seus próprios cookies — sob as políticas dele.

## 5. Atualizações

Esta política pode ser atualizada. A versão atual fica sempre disponível nesta página.

## 6. Dúvidas

Fale com a gente em **{{email}}**.

---

*Texto baseado em LGPD e práticas de mercado. Recomendamos revisão por advogado antes de publicar.*`;

export function templatePoliticaPrivacidade(d: DadosTenantParaTemplate) {
  return interp(PRIVACIDADE, d);
}
export function templateTermosUso(d: DadosTenantParaTemplate) {
  return interp(TERMOS, d);
}
export function templatePoliticaCookies(d: DadosTenantParaTemplate) {
  return interp(COOKIES, d);
}
