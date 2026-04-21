import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWebPush } from '@/lib/webpush'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { leadName } = await request.json()

  try {
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', user.id)

    if (!subs?.length) return NextResponse.json({ ok: true, sent: 0 })

    const wp = getWebPush()
    const payload = JSON.stringify({
      title: '🎯 Nový lead',
      body: leadName ?? 'Byl přidán nový lead',
      url: '/dashboard/leads',
    })

    let sent = 0
    for (const sub of subs) {
      try {
        await wp.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        sent++
      } catch {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
      }
    }

    return NextResponse.json({ ok: true, sent })
  } catch {
    return NextResponse.json({ ok: true, sent: 0 })
  }
}
