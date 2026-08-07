import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import OutreachPanel from './OutreachPanel';

export default async function OutreachPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  if (!superAdminEmail || user.email !== superAdminEmail) redirect('/dashboard');

  return <OutreachPanel />;
}
