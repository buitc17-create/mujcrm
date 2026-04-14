import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { ImapFlow } from 'imapflow';
import { decryptPassword } from '@/lib/emailCrypto';

function detectFolderType(path: string, flags: Set<string>, specialUse?: string): string {
  if (specialUse === '\\Sent' || flags.has('\\Sent')) return 'sent';
  if (specialUse === '\\Drafts' || flags.has('\\Drafts')) return 'drafts';
  if (specialUse === '\\Trash' || flags.has('\\Trash')) return 'trash';
  if (specialUse === '\\Junk' || flags.has('\\Junk') || flags.has('\\Spam')) return 'spam';
  const p = path.toLowerCase();
  if (p === 'inbox') return 'inbox';
  if (/sent|odeslané|odeslan/i.test(p)) return 'sent';
  if (/draft|koncept/i.test(p)) return 'drafts';
  if (/spam|junk|nevyžádaná/i.test(p)) return 'spam';
  if (/trash|deleted|koš|smazané/i.test(p)) return 'trash';
  return 'custom';
}

export async function POST() {
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

  const { data: settings } = await supabase
    .from('email_settings')
    .select('imap_host, imap_port, imap_secure, smtp_user, smtp_password, is_verified')
    .eq('user_id', user.id)
    .single();

  if (!settings?.is_verified) return NextResponse.json({ error: 'Email není nastaven' }, { status: 400 });
  if (!settings.imap_host) return NextResponse.json({ error: 'Chybí IMAP host' }, { status: 400 });

  const client = new ImapFlow({
    host: settings.imap_host,
    port: settings.imap_port ?? 993,
    secure: settings.imap_secure ?? true,
    auth: { user: settings.smtp_user, pass: decryptPassword(settings.smtp_password) },
    logger: false,
  });

  try {
    await client.connect();
    const list = await client.list();
    await client.logout();

    await supabase.from('email_folders').delete().eq('user_id', user.id);

    const folders = list
      .filter(f => !f.flags?.has('\\Noselect'))
      .map(f => ({
        user_id: user.id,
        name: f.name,
        path: f.path,
        type: detectFolderType(f.path, f.flags ?? new Set(), (f as { specialUse?: string }).specialUse),
      }));

    await supabase.from('email_folders').insert(folders);

    return NextResponse.json({ count: folders.length, folders });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'IMAP chyba';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
