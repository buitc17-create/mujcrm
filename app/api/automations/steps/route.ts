import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 });

  const { sequence_id, step_order, delay_days, subject, body, attachment_path, attachment_name } = await request.json();

  if (!sequence_id || !subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'Chybí povinné údaje' }, { status: 400 });
  }

  const { data: seq } = await supabase
    .from('automation_sequences')
    .select('id')
    .eq('id', sequence_id)
    .eq('user_id', user.id)
    .single();

  if (!seq) return NextResponse.json({ error: 'Sekvence nenalezena' }, { status: 404 });

  const { data, error } = await supabase
    .from('automation_steps')
    .insert({
      sequence_id,
      user_id: user.id,
      step_order: step_order ?? 1,
      delay_days: delay_days ?? 0,
      subject: subject.trim(),
      body: body.trim(),
      attachment_path: attachment_path || null,
      attachment_name: attachment_name || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ step: data });
}
