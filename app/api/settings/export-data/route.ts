import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 });

  const [contacts, deals, leads, activities, tasks, settings] = await Promise.all([
    supabase.from('contacts').select('*'),
    supabase.from('deals').select('*'),
    supabase.from('leads').select('*'),
    supabase.from('activities').select('*'),
    supabase.from('tasks').select('*'),
    supabase.from('company_settings').select('*').maybeSingle(),
  ]);

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name ?? '',
      createdAt: user.created_at,
    },
    companySettings: settings.data ?? null,
    data: {
      contacts: contacts.data ?? [],
      deals: deals.data ?? [],
      leads: leads.data ?? [],
      activities: activities.data ?? [],
      tasks: tasks.data ?? [],
    },
  });
}
