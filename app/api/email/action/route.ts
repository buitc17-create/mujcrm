import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { ImapFlow } from 'imapflow';

type Action = 'mark_read' | 'mark_unread' | 'flag' | 'unflag' | 'move_trash' | 'move_folder';

export async function POST(request: Request) {
  const body = await request.json() as { action: Action; emailId: string; targetFolder?: string };
  const { action, emailId, targetFolder } = body;

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
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: email } = await supabase
    .from('emails')
    .select('message_id, folder')
    .eq('id', emailId)
    .eq('user_id', user.id)
    .single();

  if (!email) return NextResponse.json({ error: 'Email nenalezen' }, { status: 404 });

  // ── DB update ──────────────────────────────────────────────────────────────
  let resolvedTrash: string | null = null;
  let resolvedTarget: string | null = null;

  if (action === 'mark_read') {
    await supabase.from('emails').update({ is_read: true }).eq('id', emailId);
  } else if (action === 'mark_unread') {
    await supabase.from('emails').update({ is_read: false }).eq('id', emailId);
  } else if (action === 'flag') {
    await supabase.from('emails').update({ is_flagged: true }).eq('id', emailId);
  } else if (action === 'unflag') {
    await supabase.from('emails').update({ is_flagged: false }).eq('id', emailId);
  } else if (action === 'move_trash') {
    const { data: tf } = await supabase.from('email_folders').select('path').eq('user_id', user.id).eq('type', 'trash').single();
    resolvedTrash = tf?.path ?? 'Trash';
    await supabase.from('emails').update({ folder: resolvedTrash }).eq('id', emailId);
  } else if (action === 'move_folder' && targetFolder) {
    resolvedTarget = targetFolder;
    await supabase.from('emails').update({ folder: targetFolder }).eq('id', emailId);
  }

  // ── IMAP (best-effort) ────────────────────────────────────────────────────
  if (!email.message_id) return NextResponse.json({ success: true });

  const { data: settings } = await supabase
    .from('email_settings')
    .select('imap_host, imap_port, imap_secure, smtp_user, smtp_password, is_verified')
    .eq('user_id', user.id)
    .single();

  if (!settings?.is_verified || !settings.imap_host) return NextResponse.json({ success: true });

  const folder = email.folder ?? 'INBOX';
  const client = new ImapFlow({
    host: settings.imap_host,
    port: settings.imap_port ?? 993,
    secure: settings.imap_secure ?? true,
    auth: { user: settings.smtp_user, pass: settings.smtp_password },
    logger: false,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock(folder);
    try {
      const uids = await client.search({ header: { 'message-id': email.message_id } }, { uid: true });
      const uidList = Array.isArray(uids) ? uids : [];
      if (uidList.length > 0) {
        const uid = uidList[0];
        if (action === 'mark_read') await client.messageFlagsAdd({ uid }, ['\\Seen'], { uid: true });
        else if (action === 'mark_unread') await client.messageFlagsRemove({ uid }, ['\\Seen'], { uid: true });
        else if (action === 'flag') await client.messageFlagsAdd({ uid }, ['\\Flagged'], { uid: true });
        else if (action === 'unflag') await client.messageFlagsRemove({ uid }, ['\\Flagged'], { uid: true });
        else if (action === 'move_trash' && resolvedTrash) await client.messageMove({ uid }, resolvedTrash, { uid: true });
        else if (action === 'move_folder' && resolvedTarget) await client.messageMove({ uid }, resolvedTarget, { uid: true });
      }
    } finally { lock.release(); }
    await client.logout();
  } catch { /* non-fatal */ }

  return NextResponse.json({ success: true });
}
