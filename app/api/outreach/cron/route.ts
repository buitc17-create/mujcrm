import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendOutreachEmail } from '@/lib/outreachEmail'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const BATCH_SIZE = 10

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const admin = getAdmin()
  const { data: batch, error } = await admin
    .from('outreach_recipients')
    .select('id, email, jmeno, unsubscribe_token')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let sent = 0, failed = 0
  for (const r of batch ?? []) {
    const result = await sendOutreachEmail(r.email, r.jmeno, r.unsubscribe_token)
    if (result.ok) {
      await admin.from('outreach_recipients').update({ status: 'sent', sent_at: new Date().toISOString(), error: null }).eq('id', r.id)
      sent++
    } else {
      await admin.from('outreach_recipients').update({ status: 'failed', error: result.error }).eq('id', r.id)
      failed++
    }
  }

  return NextResponse.json({ sent, failed })
}
