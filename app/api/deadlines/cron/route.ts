import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SYSTEM_SMTP_USER!,
      pass: process.env.SYSTEM_SMTP_PASS!,
    },
  })
}

const FROM = `"MujCRM" <${process.env.SYSTEM_SMTP_USER}>`
const BASE_URL = 'https://www.mujcrm.cz'

const WON_KEYWORDS  = ['vyhráno','vyhrano','uzavřeno','uzavreno','zaplaceno','dokončeno','dokonceno','won','closed']
const LOST_KEYWORDS = ['prohráno','prohrano','ztraceno','lost','zamítnuto','zamitnuto']

function deadlineEmailHtml(name: string, items: { label: string; nazev: string; url: string }[]) {
  const rows = items.map(i => `
    <div style="background:rgba(0,191,255,0.06);border:1px solid rgba(0,191,255,0.15);border-radius:14px;padding:18px;margin-bottom:12px;">
      <p style="color:rgba(237,237,237,0.45);font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:.5px;">${i.label}</p>
      <p style="color:#fff;font-weight:700;font-size:15px;margin:0 0 10px;">${i.nazev}</p>
      <a href="${i.url}" style="color:#00BFFF;font-size:13px;text-decoration:none;">Zobrazit →</a>
    </div>`).join('')

  return `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0a;font-family:Inter,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;width:48px;height:48px;background:linear-gradient(135deg,#00BFFF,#7B2FFF);border-radius:14px;line-height:48px;font-size:22px;font-weight:900;color:#0a0a0a;text-align:center;">M</div>
    <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:20px;font-weight:700;color:#fff;">Muj<span style="color:#00BFFF">CRM</span></span>
  </div>
  <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:36px;">
    <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 8px;">⏰ Zítra ti vyprší deadline</h1>
    <p style="color:rgba(237,237,237,0.6);font-size:15px;line-height:1.6;margin:0 0 24px;">Ahoj, ${name}! Připomínáme, že následující položky mají deadline <strong style="color:#fff;">zítra</strong>:</p>
    ${rows}
    <a href="${BASE_URL}/dashboard" style="display:block;text-align:center;background:linear-gradient(135deg,#00BFFF,#0090cc);color:#0a0a0a;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;margin-top:24px;">Otevřít MujCRM →</a>
  </div>
  <p style="text-align:center;color:rgba(237,237,237,0.25);font-size:12px;margin-top:24px;">MujCRM · <a href="${BASE_URL}" style="color:rgba(0,191,255,0.6);">mujcrm.cz</a></p>
</div>
</body></html>`
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const admin = getAdmin()

  // Tomorrow's date range (full day, UTC)
  const now = new Date()
  const tomorrowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  const tomorrowEnd   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 2))

  // --- Tasks with deadline tomorrow and not done ---
  const { data: tasks } = await admin
    .from('tasks')
    .select('id, nazev, user_id, assigned_to, deadline')
    .eq('dokonceno', false)
    .gte('deadline', tomorrowStart.toISOString())
    .lt('deadline', tomorrowEnd.toISOString())

  // --- Deals with datum_uzavreni tomorrow ---
  const { data: deals } = await admin
    .from('deals')
    .select('id, nazev, user_id, assigned_to, stage_id, datum_uzavreni')
    .gte('datum_uzavreni', tomorrowStart.toISOString().slice(0, 10))
    .lt('datum_uzavreni', tomorrowEnd.toISOString().slice(0, 10))

  // Get all pipeline stages to filter out won/lost deals
  const { data: allStages } = await admin
    .from('pipeline_stages')
    .select('id, nazev')

  const finishedStageIds = new Set(
    (allStages ?? [])
      .filter(s => {
        const n = s.nazev.toLowerCase()
        return WON_KEYWORDS.some(k => n.includes(k)) || LOST_KEYWORDS.some(k => n.includes(k))
      })
      .map(s => s.id)
  )

  const openDeals = (deals ?? []).filter(d => !finishedStageIds.has(d.stage_id))

  // --- Aggregate items per user to notify ---
  // Map: notifyUserId → { ownerId, items[] }
  const userMap = new Map<string, { ownerId: string; items: { label: string; nazev: string; url: string }[] }>()

  function addItem(notifyUserId: string, ownerId: string, label: string, nazev: string, url: string) {
    if (!userMap.has(notifyUserId)) {
      userMap.set(notifyUserId, { ownerId, items: [] })
    }
    userMap.get(notifyUserId)!.items.push({ label, nazev, url })
  }

  for (const task of tasks ?? []) {
    const notifyId = task.assigned_to ?? task.user_id
    const ownerId  = task.user_id
    addItem(notifyId, ownerId, 'Úkol', task.nazev, `${BASE_URL}/dashboard/tasks`)
  }

  for (const deal of openDeals) {
    const notifyId = deal.assigned_to ?? deal.user_id
    const ownerId  = deal.user_id
    addItem(notifyId, ownerId, 'Zakázka', deal.nazev, `${BASE_URL}/dashboard/deals`)
  }

  if (userMap.size === 0) {
    return NextResponse.json({ notified: 0, pushQueued: 0 })
  }

  const transporter = getTransporter()
  let notified = 0
  let pushQueued = 0
  const errors: string[] = []

  for (const [notifyUserId, { items }] of userMap) {
    // Get user email + name from auth
    const { data: { user: authUser } } = await admin.auth.admin.getUserById(notifyUserId)
    const email = authUser?.email
    const name  = authUser?.user_metadata?.full_name ?? email?.split('@')[0] ?? 'uživateli'

    if (!email) continue

    // Push notification
    const pushTitle = items.length === 1
      ? `⏰ Deadline zítra: ${items[0].nazev}`
      : `⏰ Zítra máš ${items.length} deadliny`
    const pushBody = items.map(i => `${i.label}: ${i.nazev}`).join(', ')

    await admin.from('notification_queue').insert({
      user_id: notifyUserId,
      title: pushTitle,
      body: pushBody,
      url: '/dashboard',
      sent: false,
      scheduled_at: new Date().toISOString(),
    })
    pushQueued++

    // Email
    try {
      await transporter.sendMail({
        from: FROM,
        to: email,
        subject: items.length === 1
          ? `⏰ Zítra vyprší deadline: ${items[0].nazev}`
          : `⏰ Zítra máš ${items.length} deadliny v MujCRM`,
        html: deadlineEmailHtml(name, items),
      })
      notified++
    } catch (err) {
      errors.push(`${email}: ${err instanceof Error ? err.message : 'Chyba'}`)
    }
  }

  return NextResponse.json({ notified, pushQueued, errors, totalUsers: userMap.size })
}
