import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { decryptPassword } from '@/lib/emailCrypto'

function passwordChangedHtml({ userEmail, appUrl }: { userEmail: string; appUrl: string }) {
  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:linear-gradient(135deg,#0a0a0a 0%,#111827 100%);padding:32px 40px;text-align:center">
    <div style="display:inline-flex;align-items:center;gap:10px">
      <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#00BFFF,#7B2FFF);display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:16px;color:#ffffff">M</div>
      <span style="font-size:20px;font-weight:700;color:#ffffff">Muj<span style="color:#00BFFF">CRM</span></span>
    </div>
  </div>
  <div style="padding:40px">
    <div style="width:56px;height:56px;border-radius:50%;background:#d1fae5;display:flex;align-items:center;justify-content:center;margin:0 0 24px">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    </div>
    <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#111827">Heslo bylo úspěšně změněno</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6">
      Heslo k vašemu účtu <strong style="color:#111827">${userEmail}</strong> bylo právě změněno.
      Pokud jste tuto změnu neprovedli vy, kontaktujte nás ihned.
    </p>
    <a href="${appUrl}/auth/login" style="display:inline-block;background:linear-gradient(135deg,#00BFFF,#0090cc);color:#ffffff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none">
      Přihlásit se →
    </a>
  </div>
  <div style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center">
    <p style="margin:0;font-size:12px;color:#9ca3af">© 2025 MujCRM · Automatický email, neodpovídej na něj</p>
  </div>
</div>`
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return NextResponse.json({ ok: true, skipped: 'no_user' })

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const appUrl = 'https://www.mujcrm.cz'

  // Determine whose SMTP settings to use (member uses owner's SMTP)
  let emailSettingsUserId = user.id

  const { data: memberRecord } = await admin
    .from('team_members')
    .select('owner_id')
    .eq('member_user_id', user.id)
    .eq('status', 'aktivni')
    .maybeSingle()

  if (memberRecord?.owner_id) {
    emailSettingsUserId = memberRecord.owner_id
  }

  const { data: emailSettings } = await admin
    .from('email_settings')
    .select('*')
    .eq('user_id', emailSettingsUserId)
    .single()

  if (!emailSettings) return NextResponse.json({ ok: true, skipped: 'no_smtp' })

  const html = passwordChangedHtml({ userEmail: user.email, appUrl })

  try {
    const transporter = nodemailer.createTransport({
      host: emailSettings.smtp_host,
      port: emailSettings.smtp_port,
      secure: emailSettings.smtp_secure,
      auth: { user: emailSettings.smtp_user, pass: decryptPassword(emailSettings.smtp_password) },
    })
    await transporter.sendMail({
      from: `"${emailSettings.display_name || 'MujCRM'}" <${emailSettings.smtp_user}>`,
      to: user.email,
      subject: 'Vaše heslo bylo změněno',
      html,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const error = err instanceof Error ? err.message : 'SMTP error'
    return NextResponse.json({ ok: false, error })
  }
}
