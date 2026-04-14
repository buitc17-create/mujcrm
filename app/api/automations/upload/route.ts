import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) return NextResponse.json({ error: 'Soubor chybí' }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Soubor je příliš velký (max 10 MB)' }, { status: 400 });

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
  const path = `${user.id}/${randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('automation-attachments')
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from('automation-attachments').getPublicUrl(path);

  return NextResponse.json({ path, publicUrl, name: file.name });
}
