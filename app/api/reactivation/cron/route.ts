import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const INACTIVE_DAYS = 60     // uživatel je "spící" po 60 dnech bez přihlášení
const RESEND_COOLDOWN = 90   // znovu nepošleme, pokud jsme email poslali v posledních 90 dnech

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

function reactivationHtml(name: string) {
  return `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0a;font-family:Inter,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;width:48px;height:48px;background:linear-gradient(135deg,#00BFFF,#7B2FFF);border-radius:14px;line-height:48px;font-size:22px;font-weight:900;color:#0a0a0a;text-align:center;">M</div>
    <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:20px;font-weight:700;color:#fff;">Muj<span style="color:#00BFFF">CRM</span></span>
  </div>
  <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:36px;">
    <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 16px;">Chybíš nám, ${name}! 👋</h1>
    <p style="color:rgba(237,237,237,0.6);font-size:15px;line-height:1.6;margin:0 0 16px;">Všimli jsme si, že jsi v MujCRM chvíli nebyl/a. Chápeme — čas letí a práce nikdy nekončí.</p>
    <p style="color:rgba(237,237,237,0.6);font-size:15px;line-height:1.6;margin:0 0 28px;">Vrať se a podívej se, co nového přibylo:</p>

    <div style="background:rgba(0,191,255,0.06);border:1px solid rgba(0,191,255,0.15);border-radius:14px;padding:20px;margin-bottom:14px;">
      <p style="color:#00BFFF;font-weight:700;margin:0 0 6px;font-size:14px;">📧 Onboarding automatizace</p>
      <p style="color:rgba(237,237,237,0.55);font-size:13px;margin:0;">Nová e-mailová sekvence, která za tebe pozdraví každého nového zákazníka ve správný čas.</p>
    </div>
    <div style="background:rgba(0,191,255,0.06);border:1px solid rgba(0,191,255,0.15);border-radius:14px;padding:20px;margin-bottom:14px;">
      <p style="color:#00BFFF;font-weight:700;margin:0 0 6px;font-size:14px;">🎂 Narozeninové emaily</p>
      <p style="color:rgba(237,237,237,0.55);font-size:13px;margin:0;">Zadej datum narození zákazníka a MujCRM mu automaticky pošle přání — bez tvé práce.</p>
    </div>
    <div style="background:rgba(0,191,255,0.06);border:1px solid rgba(0,191,255,0.15);border-radius:14px;padding:20px;margin-bottom:28px;">
      <p style="color:#00BFFF;font-weight:700;margin:0 0 6px;font-size:14px;">👥 Týmová spolupráce</p>
      <p style="color:rgba(237,237,237,0.55);font-size:13px;margin:0;">Přidej kolegy do svého workspace, přiděluj jim zakázky a sleduj jejich výsledky v měsíčních výkazech.</p>
    </div>

    <a href="${BASE_URL}/dashboard" style="display:block;text-align:center;background:linear-gradient(135deg,#00BFFF,#0090cc);color:#0a0a0a;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;margin-bottom:20px;">Vrátit se do MujCRM →</a>

    <p style="color:rgba(237,237,237,0.35);font-size:12px;text-align:center;margin:0;">Máš otázku nebo problém? Odpověz na tento email — jsme tu pro tebe.</p>
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
  const now = new Date()
  const inactiveThreshold = new Date(now.getTime() - INACTIVE_DAYS * 24 * 60 * 60 * 1000)
  const resendThreshold = new Date(now.getTime() - RESEND_COOLDOWN * 24 * 60 * 60 * 1000)

  // Načti všechny uživatele (stránkování po 1000)
  let allUsers: { id: string; email?: string; last_sign_in_at?: string; created_at: string; user_metadata?: Record<string, string> }[] = []
  let page = 1
  while (true) {
    const { data: { users }, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error || !users?.length) break
    allUsers = allUsers.concat(users)
    if (users.length < 1000) break
    page++
  }

  // Filtruj spící uživatele: posledně přihlášeni před více než INACTIVE_DAYS dny
  const inactiveUsers = allUsers.filter(u => {
    if (!u.email) return false
    const lastSeen = u.last_sign_in_at ? new Date(u.last_sign_in_at) : new Date(u.created_at)
    return lastSeen < inactiveThreshold
  })

  if (inactiveUsers.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0, errors: [] })
  }

  // Zjisti kdo dostал email v posledních RESEND_COOLDOWN dnech
  const userIds = inactiveUsers.map(u => u.id)
  const { data: recentlySent } = await admin
    .from('reactivation_emails')
    .select('user_id')
    .in('user_id', userIds)
    .gte('sent_at', resendThreshold.toISOString())

  const recentlySentIds = new Set((recentlySent ?? []).map((r: { user_id: string }) => r.user_id))

  const transporter = getTransporter()
  let sent = 0
  let skipped = 0
  const errors: string[] = []

  for (const user of inactiveUsers) {
    if (recentlySentIds.has(user.id)) { skipped++; continue }

    const name = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'příteli'
    const email = user.email!

    try {
      await transporter.sendMail({
        from: FROM,
        to: email,
        subject: `Chybíš nám, ${name} — vrať se a podívej se na novinky`,
        html: reactivationHtml(name),
      })

      await admin.from('reactivation_emails').insert({ user_id: user.id })
      sent++
    } catch (err) {
      errors.push(`${email}: ${err instanceof Error ? err.message : 'Chyba'}`)
    }
  }

  return NextResponse.json({ sent, skipped, errors, totalInactive: inactiveUsers.length })
}
