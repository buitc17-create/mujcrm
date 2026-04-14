import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: memberRecord } = await supabase
    .from('team_members')
    .select('id')
    .eq('member_user_id', user.id)
    .eq('status', 'aktivni')
    .maybeSingle();

  if (memberRecord) redirect('/dashboard');
}
