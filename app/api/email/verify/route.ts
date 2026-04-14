import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';
import { encryptPassword } from '@/lib/emailCrypto';

export async function POST(request: Request) {
  const { smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password, imap_host, imap_port, imap_secure, display_name, signature } = await request.json();

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 });

  try {
    const transporter = nodemailer.createTransport({
      host: smtp_host,
      port: smtp_port,
      secure: smtp_secure,
      auth: { user: smtp_user, pass: smtp_password },
    });

    await transporter.verify();

    // Uložit do DB — heslo zašifrujeme před zápisem
    await supabase.from('email_settings').upsert({
      user_id: user.id,
      smtp_host, smtp_port, smtp_secure, smtp_user,
      smtp_password: encryptPassword(smtp_password),
      imap_host, imap_port, imap_secure: imap_secure ?? true,
      display_name: display_name || smtp_user,
      signature: signature || null,
      is_verified: true,
    }, { onConflict: 'user_id' });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Nelze se připojit k SMTP serveru';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
