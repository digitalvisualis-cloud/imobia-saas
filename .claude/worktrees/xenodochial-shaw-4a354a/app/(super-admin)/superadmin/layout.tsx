import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { isSuperAdminEmail } from '@/lib/super-admin';
import SuperAdminShell from './SuperAdminShell';

export const dynamic = 'force-dynamic';

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login?next=/superadmin');
  }

  if (!isSuperAdminEmail(session.user.email)) {
    // Não é da equipe Visualis — manda pro dashboard normal
    redirect('/dashboard');
  }

  return (
    <SuperAdminShell
      userName={session.user.name ?? 'Super Admin'}
      userEmail={session.user.email ?? ''}
    >
      {children}
    </SuperAdminShell>
  );
}
