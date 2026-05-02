import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { isSuperAdminEmail } from '@/lib/super-admin';
import N8nClient from './N8nClient';

export const dynamic = 'force-dynamic';

export default async function N8nPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (!isSuperAdminEmail(session.user.email)) redirect('/dashboard');

  return (
    <N8nClient
      hasApiKey={!!process.env.N8N_API_KEY}
      baseUrl={process.env.N8N_BASE_URL ?? null}
    />
  );
}
