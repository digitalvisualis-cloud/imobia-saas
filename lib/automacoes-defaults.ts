// Defaults da regua de mensagens automaticas.
// Cada evento traz: titulo amigavel, descricao, gatilho de onde vem,
// canais sugeridos, offsets em dias e templates de mensagem (PT-BR)
// com variaveis {nome} {valor} {vencimento} {imovel} {empresa}.

export type EventoAutomacao =
  | 'lembrete_aluguel'
  | 'aviso_vencimento_contrato'
  | 'aviso_reajuste'
  | 'chave_atrasada'
  | 'repasse_pendente';

export interface RegraConfig {
  evento: EventoAutomacao;
  titulo: string;
  descricao: string;
  origem: string; // pagina/feature que gera os destinatarios
  defaultOffsets: number[];
  defaultCanais: string[];
  defaultWpp: string;
  defaultEmail: string;
}

export const REGRAS_DEFAULT: Record<EventoAutomacao, RegraConfig> = {
  lembrete_aluguel: {
    evento: 'lembrete_aluguel',
    titulo: 'Lembrete de aluguel',
    descricao: 'Dispara antes do vencimento (lembrete amigável) e depois (cobrança progressiva).',
    origem: 'Inadimplência + Repasses',
    defaultOffsets: [-5, 0, 3, 7, 15],
    defaultCanais: ['whatsapp'],
    defaultWpp:
      'Olá {nome}! 👋\n\n' +
      'Passando pra lembrar que o aluguel de *{imovel}* vence em *{vencimento}*.\n\n' +
      'Valor: *{valor}*\n\n' +
      'Qualquer dúvida estou à disposição. Abraço,\n{empresa}',
    defaultEmail:
      'Olá {nome},\n\n' +
      'Lembramos que o aluguel do imóvel {imovel} vence em {vencimento}.\n\n' +
      'Valor: {valor}\n\n' +
      'Qualquer dúvida estamos à disposição.\n\n' +
      'Atenciosamente,\n{empresa}',
  },
  aviso_vencimento_contrato: {
    evento: 'aviso_vencimento_contrato',
    titulo: 'Vencimento de contrato',
    descricao:
      'Avisa o inquilino N dias antes do contrato vencer, perguntando se quer renovar.',
    origem: 'Contratos',
    defaultOffsets: [-30, -15, -5],
    defaultCanais: ['whatsapp', 'email'],
    defaultWpp:
      'Olá {nome}! 📅\n\n' +
      'Seu contrato do imóvel *{imovel}* vence em *{vencimento}*.\n\n' +
      'Gostaria de renovar? Se sim, me chama aqui pra alinharmos as condições. ' +
      'Se preferir encerrar, também é só me avisar com antecedência.\n\n' +
      'Abraço,\n{empresa}',
    defaultEmail:
      'Olá {nome},\n\n' +
      'Seu contrato do imóvel {imovel} vence em {vencimento}.\n\n' +
      'Entre em contato conosco caso queira renovar ou encerrar.\n\n' +
      'Atenciosamente,\n{empresa}',
  },
  aviso_reajuste: {
    evento: 'aviso_reajuste',
    titulo: 'Reajuste anual',
    descricao:
      'Avisa o inquilino N dias antes do aniversário do contrato sobre o reajuste anual (IGP-M / IPCA).',
    origem: 'Inquilinos',
    defaultOffsets: [-60, -30],
    defaultCanais: ['email'],
    defaultWpp:
      'Olá {nome},\n\n' +
      'Conforme contrato, o aluguel de *{imovel}* será reajustado em *{vencimento}*.\n\n' +
      'Valor atual: {valor}\n\n' +
      'Em breve envio o valor novo já com o índice aplicado. Abraço,\n{empresa}',
    defaultEmail:
      'Olá {nome},\n\n' +
      'Conforme cláusula contratual, o aluguel do imóvel {imovel} será reajustado em {vencimento}.\n\n' +
      'Valor atual: {valor}\n\n' +
      'Em breve enviaremos o novo valor já com o índice aplicado.\n\n' +
      'Atenciosamente,\n{empresa}',
  },
  chave_atrasada: {
    evento: 'chave_atrasada',
    titulo: 'Devolução de chave',
    descricao:
      'Cobra quem pegou chave do imóvel e passou do prazo de devolução (visita, manutenção, etc).',
    origem: 'Controle de Chaves',
    defaultOffsets: [0, 3, 7],
    defaultCanais: ['whatsapp'],
    defaultWpp:
      'Olá {nome}!\n\n' +
      'Identifiquei aqui que a chave do imóvel *{imovel}* não foi devolvida ' +
      'no prazo combinado ({vencimento}).\n\n' +
      'Pode passar aqui pra devolver, ou agendamos uma retirada? ' +
      'Qualquer dificuldade me avisa.\n\n' +
      'Abraço,\n{empresa}',
    defaultEmail:
      'Olá {nome},\n\n' +
      'A chave do imóvel {imovel} não foi devolvida no prazo combinado ({vencimento}).\n\n' +
      'Por favor, entre em contato para combinarmos a devolução.\n\n' +
      'Atenciosamente,\n{empresa}',
  },
  repasse_pendente: {
    evento: 'repasse_pendente',
    titulo: 'Repasse pendente ao proprietário',
    descricao:
      'Avisa o proprietário quando o aluguel já foi recebido mas o repasse ainda não saiu.',
    origem: 'Repasses',
    defaultOffsets: [3, 5, 7],
    defaultCanais: ['whatsapp', 'email'],
    defaultWpp:
      'Olá {nome}! 💸\n\n' +
      'O aluguel de *{imovel}* já foi recebido e o repasse de *{valor}* está sendo processado.\n\n' +
      'Em breve cai na sua conta. Qualquer dúvida estou à disposição.\n\n' +
      'Abraço,\n{empresa}',
    defaultEmail:
      'Olá {nome},\n\n' +
      'O aluguel do imóvel {imovel} foi recebido e o repasse de {valor} está em processamento.\n\n' +
      'Em breve será efetivado.\n\n' +
      'Atenciosamente,\n{empresa}',
  },
};

export const EVENTOS_LIST: EventoAutomacao[] = [
  'lembrete_aluguel',
  'aviso_vencimento_contrato',
  'aviso_reajuste',
  'chave_atrasada',
  'repasse_pendente',
];
