import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') || '';

  let to = '', subject = '', body = '', bcc = '', contactId = '', leadId = '';
  type Attachment = { filename: string; content: Buffer; contentType: string };
  const attachments: Attachment[] = [];

  if (contentType.includes('multipart/form-data')) {
    const fd = await request.formData();
    to         = (fd.get('to')        as string) ?? '';
    subject    = (fd.get('subject')   as string) ?? '';
    body       = (fd.get('body')      as string) ?? '';
    bcc        = (fd.get('bcc')       as string) ?? '';
    contactId  = (fd.get('contactId') as string) ?? '';
    leadId     = (fd.get('leadId')    as string) ?? '';
    const files = fd.getAll('attachments') as File[];
    for (const file of files) {
      attachments.push({
        filename: file.name,
        content: Buffer.from(await file.arrayBuffer()),
        contentType: file.type || 'application/octet-stream',
      });
    }
  } else {
    const json = await request.json();
    ({ to, subject, body, bcc = '', contactId = '', leadId = '' } = json);
  }

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

  const [{ data: settings }, { data: sentFolderRow }] = await Promise.all([
    supabase.from('email_settings').select('*').eq('user_id', user.id).single(),
    supabase.from('email_folders').select('path').eq('user_id', user.id).eq('type', 'sent').single(),
  ]);
  const sentFolder = sentFolderRow?.path ?? 'Sent';

  if (!settings) return NextResponse.json({ error: 'Email není nastaven' }, { status: 400 });

  try {
    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port,
      secure: settings.smtp_secure,
      auth: { user: settings.smtp_user, pass: settings.smtp_password },
    });

    await transporter.sendMail({
      from: `"${settings.display_name || settings.smtp_user}" <${settings.smtp_user}>`,
      to,
      bcc: bcc || undefined,
      subject,
      html: body + (settings.signature ? `<br><br><hr style="border:none;border-top:1px solid #ddd;margin:16px 0"><div>${settings.signature}</div>` : ''),
      attachments: attachments.map(a => ({ filename: a.filename, content: a.content, contentType: a.contentType })),
    });

    await supabase.from('emails').insert({
      user_id: user.id,
      contact_id: contactId || null,
      lead_id: leadId || null,
      direction: 'sent',
      from_email: settings.smtp_user,
      to_email: to,
      subject,
      body,
      folder: sentFolder,
      is_read: true,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Chyba při odesílání';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
