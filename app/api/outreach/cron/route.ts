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
const STEP2_DELAY_DAYS = 5
const STEP3_DELAY_DAYS = 12

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const admin = getAdmin()
  const now = new Date()

  // ── Fáze A: úvodní e-mail pro nové, čekající kontakty ──────────────────────
  const { data: pending } = await admin
    .from('outreach_recipients')
    .select('id, email, jmeno, unsubscribe_token')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE)

  let sent = 0, failed = 0
  for (const r of pending ?? []) {
    const result = await sendOutreachEmail(r.email, r.jmeno, r.unsubscribe_token, 1)
    const nowIso = new Date().toISOString()
    if (result.ok) {
      await admin.from('outreach_recipients').update({ status: 'sent', sequence_step: 1, sent_at: nowIso, first_sent_at: nowIso, error: null }).eq('id', r.id)
      sent++
    } else {
      await admin.from('outreach_recipients').update({ status: 'failed', error: result.error }).eq('id', r.id)
      failed++
    }
  }

  // ── Fáze B: okamžitá kontrola konverze — u všech odeslaných kontaktů, ne
  // až těsně před připomínkou. Kdo se mezitím zaregistroval, sekvence se mu
  // ihned zastaví (status → converted) a v adminu je to vidět hned, ne až po
  // pár dnech.
  const { data: allSent } = await admin
    .from('outreach_recipients')
    .select('id, email')
    .eq('status', 'sent')

  let converted = 0
  if (allSent && allSent.length > 0) {
    const { data: authList } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const registeredEmails = new Set((authList?.users ?? []).map(u => u.email?.toLowerCase()).filter(Boolean))

    const convertedIds = allSent.filter(r => registeredEmails.has(r.email.toLowerCase())).map(r => r.id)
    if (convertedIds.length > 0) {
      await admin.from('outreach_recipients').update({ status: 'converted' }).in('id', convertedIds)
      converted = convertedIds.length
    }
  }

  // ── Fáze C: navazující sekvence (den 5, den 12 od prvního e-mailu) ─────────
  // Kdo právě konvertoval ve Fázi B, už má status 'converted', takže se sem
  // vůbec nedostane (filtr níže bere jen status = 'sent').
  const day5cutoff = new Date(now.getTime() - STEP2_DELAY_DAYS * 86400000).toISOString()
  const day12cutoff = new Date(now.getTime() - STEP3_DELAY_DAYS * 86400000).toISOString()

  const [{ data: step2candidates }, { data: step3candidates }] = await Promise.all([
    admin.from('outreach_recipients').select('id, email, jmeno, unsubscribe_token')
      .eq('status', 'sent').eq('sequence_step', 1).lte('first_sent_at', day5cutoff).limit(BATCH_SIZE),
    admin.from('outreach_recipients').select('id, email, jmeno, unsubscribe_token')
      .eq('status', 'sent').eq('sequence_step', 2).lte('first_sent_at', day12cutoff).limit(BATCH_SIZE),
  ])

  const followupCandidates = [
    ...(step2candidates ?? []).map(r => ({ ...r, nextStep: 2 as const })),
    ...(step3candidates ?? []).map(r => ({ ...r, nextStep: 3 as const })),
  ]

  let followupSent = 0, followupFailed = 0

  for (const r of followupCandidates) {
    const result = await sendOutreachEmail(r.email, r.jmeno, r.unsubscribe_token, r.nextStep)
    if (result.ok) {
      await admin.from('outreach_recipients').update({ sequence_step: r.nextStep, sent_at: new Date().toISOString(), error: null }).eq('id', r.id)
      followupSent++
    } else {
      await admin.from('outreach_recipients').update({ status: 'failed', error: result.error }).eq('id', r.id)
      followupFailed++
    }
  }

  return NextResponse.json({ sent, failed, followupSent, followupFailed, converted })
}
