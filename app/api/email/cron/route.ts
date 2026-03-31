import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: allSettings, error } = await supabase
    .from('email_settings')
    .select('user_id, imap_host, imap_port, imap_secure, smtp_user, smtp_password')
    .eq('is_verified', true);

  if (error || !allSettings) {
    return NextResponse.json({ error: 'Nelze načíst nastavení' }, { status: 500 });
  }

  let totalSynced = 0;

  for (const settings of allSettings) {
    const { user_id, imap_host, imap_port, imap_secure, smtp_user, smtp_password } = settings;
    if (!imap_host || !smtp_user || !smtp_password) continue;

    const client = new ImapFlow({
      host: imap_host,
      port: imap_port ?? 993,
      secure: imap_secure ?? true,
      auth: { user: smtp_user, pass: smtp_password },
      logger: false,
    });

    try {
      await client.connect();
      const lock = await client.getMailboxLock('INBOX');

      try {
        const status = await client.status('INBOX', { messages: true });
        const total = status.messages ?? 0;
        if (total === 0) continue;

        const from = Math.max(1, total - 19);
        const range = `${from}:${total}`;

        for await (const msg of client.fetch(range, { source: true })) {
          if (!msg.source) continue;

          let parsed;
          try {
            parsed = await simpleParser(msg.source);
          } catch {
            continue;
          }

          const fromAddr = parsed.from?.value?.[0]?.address ?? '';
          const toAddr = parsed.to
            ? (Array.isArray(parsed.to) ? parsed.to[0]?.value?.[0]?.address : parsed.to.value?.[0]?.address) ?? smtp_user
            : smtp_user;
          const subject = parsed.subject ?? '(bez předmětu)';
          const sentAt = parsed.date ?? new Date();
          const body = parsed.html || parsed.textAsHtml || parsed.text || '';

          const { data: existing } = await supabase
            .from('emails')
            .select('id')
            .eq('user_id', user_id)
            .eq('from_email', fromAddr)
            .eq('subject', subject)
            .eq('sent_at', sentAt.toISOString())
            .single();

          if (existing) continue;

          const { data: contact } = await supabase
            .from('contacts')
            .select('id')
            .eq('email', fromAddr)
            .eq('user_id', user_id)
            .single();

          await supabase.from('emails').insert({
            user_id,
            direction: 'received',
            from_email: fromAddr,
            to_email: toAddr,
            subject,
            body,
            sent_at: sentAt.toISOString(),
            contact_id: contact?.id ?? null,
          });

          totalSynced++;
        }
      } finally {
        lock.release();
      }

      await client.logout();
    } catch {
      try { await client.logout(); } catch { /* ignore */ }
    }
  }

  return NextResponse.json({ synced: totalSynced, users: allSettings.length });
}
