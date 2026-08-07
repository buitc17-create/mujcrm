import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '@/lib/adminAuth'
import { sendOutreachEmail } from '@/lib/outreachEmail'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const BATCH_SIZE = 10

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token || !verifyAdminToken(token)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const batchSize = Number(body?.batchSize) || BATCH_SIZE

  const admin = getAdmin()
  const { data: batch, error } = await admin
    .from('outreach_recipients')
    .select('id, email, jmeno, unsubscribe_token')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(batchSize)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!batch || batch.length === 0) return NextResponse.json({ sent: 0, failed: 0, message: 'Žádní čekající příjemci.' })

  let sent = 0, failed = 0
  for (const r of batch) {
    const result = await sendOutreachEmail(r.email, r.jmeno, r.unsubscribe_token, 1)
    if (result.ok) {
      const now = new Date().toISOString()
      await admin.from('outreach_recipients').update({ status: 'sent', sequence_step: 1, sent_at: now, first_sent_at: now, error: null }).eq('id', r.id)
      sent++
    } else {
      await admin.from('outreach_recipients').update({ status: 'failed', error: result.error }).eq('id', r.id)
      failed++
    }
  }

  return NextResponse.json({ sent, failed })
}
