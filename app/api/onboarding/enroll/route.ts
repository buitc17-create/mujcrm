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

function welcomeHtml(name: string) {
  return `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0a;font-family:Inter,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;width:48px;height:48px;background:linear-gradient(135deg,#00BFFF,#7B2FFF);border-radius:14px;line-height:48px;font-size:22px;font-weight:900;color:#0a0a0a;">M</div>
    <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:20px;font-weight:700;color:#fff;">Muj<span style="color:#00BFFF">CRM</span></span>
  </div>
  <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:36px;">
    <h1 style="color:#fff;font-size:24px;font-weight:800;margin:0 0 8px;">Vítej v MujCRM, ${name}! 🎉</h1>
    <p style="color:rgba(237,237,237,0.6);font-size:15px;line-height:1.6;margin:0 0 24px;">Jsme rádi, že jsi tu. Tady jsou 3 věci, které ti pomohou začít:</p>
    <div style="background:rgba(0,191,255,0.06);border:1px solid rgba(0,191,255,0.15);border-radius:14px;padding:20px;margin-bottom:16px;">
      <p style="color:#00BFFF;font-weight:700;margin:0 0 6px;font-size:14px;">① Přidej prvního zákazníka</p>
      <p style="color:rgba(237,237,237,0.55);font-size:13px;margin:0;">Jdi do sekce Zákazníci a klikni na „Přidat zákazníka". Nebo importuj celý seznam přes CSV.</p>
    </div>
    <div style="background:rgba(0,191,255,0.06);border:1px solid rgba(0,191,255,0.15);border-radius:14px;padding:20px;margin-bottom:16px;">
      <p style="color:#00BFFF;font-weight:700;margin:0 0 6px;font-size:14px;">② Nastav svůj pipeline</p>
      <p style="color:rgba(237,237,237,0.55);font-size:13px;margin:0;">V sekci Zakázky si přizpůsob fáze prodeje podle svého procesu — od prvního kontaktu až po uzavření.</p>
    </div>
    <div style="background:rgba(0,191,255,0.06);border:1px solid rgba(0,191,255,0.15);border-radius:14px;padding:20px;margin-bottom:28px;">
      <p style="color:#00BFFF;font-weight:700;margin:0 0 6px;font-size:14px;">③ Propoj svůj e-mail</p>
      <p style="color:rgba(237,237,237,0.55);font-size:13px;margin:0;">V Nastavení → E-mail zadej SMTP přístup a začni odesílat e-maily přímo z CRM.</p>
    </div>
    <a href="${BASE_URL}/dashboard" style="display:block;text-align:center;background:linear-gradient(135deg,#00BFFF,#0090cc);color:#0a0a0a;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;">Jít do dashboardu →</a>
  </div>
  <p style="text-align:center;color:rgba(237,237,237,0.25);font-size:12px;margin-top:24px;">MujCRM · info@mujcrm.cz · <a href="${BASE_URL}" style="color:rgba(0,191,255,0.6);">mujcrm.cz</a></p>
</div>
</body></html>`
}

export async function POST(request: Request) {
  const { userId, email, name } = await request.json()
  if (!userId || !email) return NextResponse.json({ error: 'Chybí parametry' }, { status: 400 })

  const admin = getAdmin()

  // Idempotent — pokud již existuje enrollment, nic nedělej
  const { data: existing } = await admin
    .from('onboarding_enrollments')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) return NextResponse.json({ ok: true, already: true })

  // Vytvoř enrollment (current_step=1 protože step 0 odesíláme hned)
  await admin.from('onboarding_enrollments').insert({
    user_id: userId,
    user_email: email,
    user_name: name ?? email.split('@')[0],
    current_step: 1,
    status: 'active',
    plan_at_enrollment: 'trial',
  })

  // Odešli uvítací email okamžitě
  const displayName = name ?? email.split('@')[0]
  try {
    const transporter = getTransporter()
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: `Vítej v MujCRM, ${displayName}! 🎉`,
      html: welcomeHtml(displayName),
    })
  } catch (err) {
    console.error('Onboarding welcome email error:', err)
  }

  return NextResponse.json({ ok: true })
}
