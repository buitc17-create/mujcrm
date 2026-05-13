import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminPanel from './AdminPanel';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  if (!superAdminEmail || user.email !== superAdminEmail) redirect('/dashboard');

  return <AdminPanel />;
}
