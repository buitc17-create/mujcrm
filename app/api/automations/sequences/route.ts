import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 });

  const { data: sequences } = await supabase
    .from('automation_sequences')
    .select('*, automation_steps(id, step_order, delay_days, subject, attachment_name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ sequences: sequences ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 });

  const { name, description } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Název je povinný' }, { status: 400 });

  const { data, error } = await supabase
    .from('automation_sequences')
    .insert({ user_id: user.id, name: name.trim(), description: description?.trim() || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sequence: data });
}
