import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from './Sidebar';
import OnboardingSync from './OnboardingSync';
import EmailSyncProvider from './components/EmailSyncProvider';

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

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0a0a0a' }}>
      <Sidebar name={fullName} email={email} initials={initials} />
      <main className="flex-1 lg:ml-60 pt-14 lg:pt-0 overflow-y-auto h-full">
        <OnboardingSync />
        <EmailSyncProvider>
          {children}
        </EmailSyncProvider>
      </main>
    </div>
  );
}
