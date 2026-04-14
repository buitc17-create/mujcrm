import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { decryptPassword } from '@/lib/emailCrypto';

function isSentFolder(path: string): boolean {
  return /sent|odeslané|odeslan/i.test(path);
}

export async function POST(request: Request) {
  let folder = 'INBOX';
  try {
    const body = await request.json();
    folder = body?.folder ?? 'INBOX';
  } catch { /* no body is OK */ }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: settings, error: settingsError } = await supabase
    .from('email_settings')
    .select('imap_host, imap_port, imap_secure, smtp_user, smtp_password, is_verified')
    .eq('user_id', user.id)
    .single();

  if (settingsError || !settings?.is_verified) {
    return NextResponse.json({ error: 'Email není nastaven nebo ověřen' }, { status: 400 });
  }

  const { imap_host, imap_port, imap_secure, smtp_user, smtp_password } = settings;
  if (!imap_host || !smtp_user || !smtp_password) {
    return NextResponse.json({ error: 'Chybí IMAP nastavení' }, { status: 400 });
  }

  const direction = isSentFolder(folder) ? 'sent' : 'received';

  const client = new ImapFlow({
    host: imap_host,
    port: imap_port ?? (imap_secure ? 993 : 143),
    secure: imap_secure ?? true,
    auth: { user: smtp_user, pass: decryptPassword(smtp_password) },
    logger: false,
  });

  let synced = 0;

  try {
    await client.connect();
    const lock = await client.getMailboxLock(folder);

    try {
      const status = await client.status(folder, { messages: true, unseen: true });
      const total = status.messages ?? 0;
      if (total === 0) {
        lock.release();
        await client.logout();
        return NextResponse.json({ synced: 0 });
      }

      const from = Math.max(1, total - 49);
      const range = `${from}:${total}`;

      for await (const msg of client.fetch(range, { source: true, flags: true })) {
        if (!msg.source) continue;

        let parsed;
        try {
          parsed = await simpleParser(msg.source);
        } catch {
          continue;
        }

        const messageId = parsed.messageId ?? null;
        const fromAddr = parsed.from?.value?.[0]?.address ?? '';
        const toAddr = parsed.to
          ? (Array.isArray(parsed.to) ? parsed.to[0]?.value?.[0]?.address : parsed.to.value?.[0]?.address) ?? smtp_user
          : smtp_user;
        const subject = parsed.subject ?? '(bez předmětu)';
        const sentAt = parsed.date ?? new Date();
        const body = parsed.html || parsed.textAsHtml || parsed.text || '';
        const isRead = msg.flags?.has('\\Seen') ?? false;

        // Deduplicate by message_id if available, else by from+subject+date
        if (messageId) {
          const { data: existing } = await supabase
            .from('emails')
            .select('id')
            .eq('user_id', user.id)
            .eq('message_id', messageId)
            .eq('folder', folder)
            .single();
          if (existing) continue;
        } else {
          const { data: existing } = await supabase
            .from('emails')
            .select('id')
            .eq('user_id', user.id)
            .eq('from_email', fromAddr)
            .eq('subject', subject)
            .eq('sent_at', sentAt.toISOString())
            .eq('folder', folder)
            .single();
          if (existing) continue;
        }

        const { data: contact } = await supabase
          .from('contacts')
          .select('id')
          .eq('email', direction === 'sent' ? toAddr : fromAddr)
          .eq('user_id', user.id)
          .single();

        await supabase.from('emails').insert({
          user_id: user.id,
          direction,
          from_email: fromAddr,
          to_email: toAddr,
          subject,
          body,
          sent_at: sentAt.toISOString(),
          contact_id: contact?.id ?? null,
          folder,
          is_read: isRead,
          message_id: messageId,
        });

        synced++;
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'IMAP chyba';
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ synced });
}
