import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 });

  const { step_order, delay_days, subject, body, attachment_path, attachment_name } = await request.json();

  const { data, error } = await supabase
    .from('automation_steps')
    .update({
      step_order,
      delay_days,
      subject: subject?.trim(),
      body: body?.trim(),
      attachment_path: attachment_path ?? null,
      attachment_name: attachment_name ?? null,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ step: data });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 });

  await supabase.from('automation_steps').delete().eq('id', id).eq('user_id', user.id);
  return NextResponse.json({ success: true });
}
