import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 });

  const { data: sequence } = await supabase
    .from('automation_sequences')
    .select('*, automation_steps(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!sequence) return NextResponse.json({ error: 'Sekvence nenalezena' }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sequence.automation_steps?.sort((a: any, b: any) => a.step_order - b.step_order);

  return NextResponse.json({ sequence });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 });

  const { name, description, je_narozeninova } = await request.json();

  const { data, error } = await supabase
    .from('automation_sequences')
    .update({ name: name?.trim(), description: description?.trim() || null, ...(je_narozeninova !== undefined ? { je_narozeninova } : {}) })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sequence: data });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 });

  await supabase.from('automation_sequences').delete().eq('id', id).eq('user_id', user.id);
  return NextResponse.json({ success: true });
}
