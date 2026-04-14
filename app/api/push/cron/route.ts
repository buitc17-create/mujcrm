import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWebPush } from '@/lib/webpush';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  // Fetch all unsent notifications that are due
  const { data: notifications } = await supabase
    .from('notification_queue')
    .select('id, user_id, title, body, url')
    .eq('sent', false)
    .lte('scheduled_at', now);

  if (!notifications?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;

  for (const notif of notifications) {
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', notif.user_id);

    const wp = getWebPush();
    for (const sub of subs ?? []) {
      try {
        await wp.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title: notif.title, body: notif.body, url: notif.url ?? '/dashboard' })
        );
      } catch {
        // Subscription expired or invalid — remove it
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      }
    }

    await supabase.from('notification_queue').update({ sent: true }).eq('id', notif.id);
    sent++;
  }

  return NextResponse.json({ sent });
}
