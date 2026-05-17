import { redirect } from 'next/navigation';

/**
 * /captacao — atalho pra /leads ja com a aba "Captação" (vendedores) selecionada.
 *
 * Mantemos como rota propria por causa do menu lateral (Negócios > Captação),
 * mas reusa o Kanban de Negócios sob o capô. Na F2 isso pode virar um Kanban
 * proprio com etapas de captacao (Avaliacao → Avaliado → Contrato → Listado).
 */
export default function CaptacaoPage() {
  redirect('/leads?tab=vendedor');
}
