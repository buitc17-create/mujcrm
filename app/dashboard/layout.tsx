import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from './Sidebar';
import OnboardingSync from './OnboardingSync';
import EmailSyncProvider from './components/EmailSyncProvider';
import NotificationSetup from './NotificationSetup';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Uživatel';
  const email = user.email || '';
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Zjisti, jestli je uživatel člen týmu (ne owner)
  const { data: memberRecord } = await supabase
    .from('team_members')
    .select('id')
    .eq('member_user_id', user.id)
    .eq('status', 'aktivni')
    .maybeSingle();

  const isAdmin = !memberRecord;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0a0a0a' }}>
      <Sidebar name={fullName} email={email} initials={initials} isAdmin={isAdmin} />
      <main className="flex-1 lg:ml-60 pt-14 lg:pt-0 overflow-y-auto h-full">
        <OnboardingSync />
        <NotificationSetup />
        <EmailSyncProvider>
          {children}
        </EmailSyncProvider>
      </main>
    </div>
  );
}
