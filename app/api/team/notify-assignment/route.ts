import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { decryptPassword } from '@/lib/emailCrypto'

function assignmentEmailHtml({
  memberName, ownerName, itemName, typeLabel, typePath, appUrl, mode, itemType, itemValue,
}: {
  memberName: string | null; ownerName: string; itemName: string;
  typeLabel: string; typePath: string; appUrl: string;
  mode: 'assigned' | 'accepted' | 'declined';
  itemType?: 'task' | 'deal';
  itemValue?: number | null;
}) {
  const isDeal = itemType === 'deal';
  // Czech grammar: zakázka is feminine, úkol is masculine
  const headingNominative = isDeal ? 'zakázka' : 'úkol';
  const headingVerb = isDeal ? 'Byla vám přiřazena' : 'Byl vám přiřazen';
  const assignedAdj = isDeal ? 'přiřazenou zakázku' : 'přiřazený úkol';

  const isAssigned = mode === 'assigned';
  const heading = isAssigned
    ? `${headingVerb} ${headingNominative}`
    : mode === 'accepted'
    ? `${memberName || 'Člen'} přijal/a ${typeLabel}`
    : `${memberName || 'Člen'} odmítl/a ${typeLabel}`;

  const bodyText = isAssigned
    ? `<strong style="color:#111827">${ownerName}</strong> vám přiřadil/a ${typeLabel}. Přihlaste se do MujCRM a potvrďte přijetí.`
    : mode === 'accepted'
    ? `Člen <strong style="color:#111827">${memberName || ''}</strong> přijal/a ${assignedAdj}.`
    : `Člen <strong style="color:#111827">${memberName || ''}</strong> odmítl/a ${assignedAdj}.`;

  const btnColor = isAssigned
    ? 'background:linear-gradient(135deg,#00BFFF,#0090cc)'
    : mode === 'accepted'
    ? 'background:#10b981'
    : 'background:#ef4444';

  const btnText = isAssigned ? `Zobrazit ${typeLabel} →` : `Přejít na ${typeLabel} →`;
  const badgeColor = mode === 'accepted' ? '#10b981' : mode === 'declined' ? '#ef4444' : '#00BFFF';
  const badgeBg = mode === 'accepted' ? '#d1fae5' : mode === 'declined' ? '#fee2e2' : '#e0f7ff';
  const badgeText = mode === 'accepted' ? '✓ Přijato' : mode === 'declined' ? '✗ Odmítnuto' : '● Přiřazeno';

  const valueRow = (itemType === 'deal' && itemValue != null)
    ? `<div style="margin-top:8px;font-size:13px;color:#6b7280">Hodnota zakázky: <strong style="color:#111827">${itemValue.toLocaleString('cs-CZ')} Kč</strong></div>`
    : '';

  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:linear-gradient(135deg,#0a0a0a 0%,#111827 100%);padding:32px 40px;text-align:center">
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto">
      <tr>
        <td style="vertical-align:middle;padding-right:10px">
          <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#00BFFF,#7B2FFF);text-align:center;line-height:36px;font-weight:900;font-size:18px;color:#ffffff">M</div>
        </td>
        <td style="vertical-align:middle">
          <span style="font-size:20px;font-weight:700;color:#ffffff">Muj<span style="color:#00BFFF">CRM</span></span>
        </td>
      </tr>
    </table>
  </div>
  <div style="padding:40px">
    <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#111827">${heading}</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6">${bodyText}</p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;margin:0 0 24px">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td><span style="font-size:16px;font-weight:700;color:#111827">${itemName}</span></td>
          <td style="text-align:right"><span style="font-size:12px;font-weight:600;padding:4px 10px;border-radius:20px;color:${badgeColor};background:${badgeBg};white-space:nowrap">${badgeText}</span></td>
        </tr>
      </table>
      ${valueRow}
    </div>
    <a href="${appUrl}/dashboard/${typePath}" style="display:inline-block;${btnColor};color:#ffffff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none">
      ${btnText}
    </a>
  </div>
  <div style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center">
    <p style="margin:0;font-size:12px;color:#9ca3af">© 2025 MujCRM · Automatický email, neodpovídej na něj</p>
  </div>
</div>`;
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const { type, id, assignedToId, itemName, itemValue } = await request.json()

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const typeLabel = type === 'task' ? 'úkol' : 'zakázku'
  const typePath = type === 'task' ? 'tasks' : 'deals'
  const appUrl = 'https://www.mujcrm.cz'
  const subjectVerb = type === 'deal' ? 'Byla vám přiřazena zakázka' : 'Byl vám přiřazen úkol'

  // Detect direction: member assigning to owner vs owner assigning to member
  const { data: callerMemberRecord } = await admin
    .from('team_members')
    .select('owner_id, member_name, member_email')
    .eq('member_user_id', user.id)
    .eq('status', 'aktivni')
    .maybeSingle()

  let recipientEmail: string | null = null
  let recipientName: string | null = null
  let senderName: string
  let emailSettingsUserId: string

  if (callerMemberRecord && assignedToId === callerMemberRecord.owner_id) {
    // Member → Owner: notify the owner
    const { data: ownerAuth } = await admin.auth.admin.getUserById(callerMemberRecord.owner_id)
    recipientEmail = ownerAuth?.user?.email ?? null
    recipientName = (ownerAuth?.user?.user_metadata?.full_name as string) || recipientEmail
    senderName = callerMemberRecord.member_name || callerMemberRecord.member_email || user.email || 'Člen'
    emailSettingsUserId = callerMemberRecord.owner_id
  } else {
    // Owner → Member: notify the member
    const { data: member } = await admin
      .from('team_members')
      .select('member_email, member_name')
      .eq('owner_id', user.id)
      .eq('member_user_id', assignedToId)
      .eq('status', 'aktivni')
      .maybeSingle()
    recipientEmail = member?.member_email ?? null
    recipientName = member?.member_name ?? null
    senderName = (user.user_metadata?.full_name as string) || user.email || 'Administrátor'
    emailSettingsUserId = user.id
  }

  if (!recipientEmail) return NextResponse.json({ ok: true, skipped: 'no_email' })

  const { data: emailSettings } = await admin
    .from('email_settings')
    .select('*')
    .eq('user_id', emailSettingsUserId)
    .single()

  if (!emailSettings) return NextResponse.json({ ok: true, skipped: 'no_smtp' })

  const html = assignmentEmailHtml({
    memberName: recipientName,
    ownerName: senderName,
    itemName,
    typeLabel,
    typePath,
    appUrl,
    mode: 'assigned',
    itemType: type,
    itemValue: type === 'deal' ? (itemValue ?? null) : null,
  })

  let smtpError = null
  try {
    const transporter = nodemailer.createTransport({
      host: emailSettings.smtp_host,
      port: emailSettings.smtp_port,
      secure: emailSettings.smtp_secure,
      auth: { user: emailSettings.smtp_user, pass: decryptPassword(emailSettings.smtp_password) },
    })
    await transporter.sendMail({
      from: `"${emailSettings.display_name || senderName}" <${emailSettings.smtp_user}>`,
      to: recipientEmail,
      subject: `${subjectVerb}: ${itemName}`,
      html,
    })
  } catch (err) {
    smtpError = err instanceof Error ? err.message : 'SMTP error'
  }

  return NextResponse.json({ ok: !smtpError, error: smtpError })
}

export { assignmentEmailHtml }
