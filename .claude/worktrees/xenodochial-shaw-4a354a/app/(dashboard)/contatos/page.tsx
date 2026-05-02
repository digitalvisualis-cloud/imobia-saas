import { redirect } from 'next/navigation';

// Contatos = Leads — redireciona para o kanban
export default function ContatosPage() {
  redirect('/leads');
}
