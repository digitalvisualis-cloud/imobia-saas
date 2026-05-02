import AgendaClient from './AgendaClient';

export const dynamic = 'force-dynamic';

export default function AgendaPage() {
  // Por enquanto, eventos mock. Próxima entrega: tabela `agenda_eventos`
  // + integração Google Calendar (botão "Conectar Google" abaixo).
  const today = new Date();
  const mkEvent = (
    daysFromNow: number,
    hour: number,
    minute: number,
    durationMin: number,
    title: string,
    type: 'visita' | 'retorno' | 'reuniao' | 'tarefa',
    place?: string,
  ) => {
    const start = new Date(today);
    start.setDate(start.getDate() + daysFromNow);
    start.setHours(hour, minute, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + durationMin);
    return {
      id: `${daysFromNow}-${hour}-${minute}-${title}`,
      title,
      type,
      place,
      start: start.toISOString(),
      end: end.toISOString(),
    };
  };

  const eventos = [
    mkEvent(0, 10, 0, 60, 'Visita: Cobertura Maristela', 'visita', 'IMV-9450'),
    mkEvent(0, 14, 30, 30, 'Retorno: João Silva', 'retorno'),
    mkEvent(1, 9, 0, 90, 'Visita: Apartamento Pinheiros', 'visita', 'IMV-6626'),
    mkEvent(1, 16, 0, 45, 'Reunião com Pedro (corretor)', 'reuniao'),
    mkEvent(2, 11, 0, 60, 'Visita: Casa Itaim', 'visita', 'IMV-CAS001'),
    mkEvent(3, 15, 30, 30, 'Retorno: Marina Costa', 'retorno'),
    mkEvent(4, 10, 30, 60, 'Visita: Cobertura Vila Olímpia', 'visita', 'IMV-APT007'),
    mkEvent(5, 14, 0, 30, 'Tarefa: Revisar contrato Apt 3401', 'tarefa'),
  ];

  return <AgendaClient eventos={eventos} />;
}
