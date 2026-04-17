import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { decryptPassword } from '@/lib/emailCrypto'
import { assignmentEmailHtml } from '../notify-assignment/route'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const { type, id, action } = await request.json()
  // type: 'task' | 'deal'
  // action: 'accepted' | 'declined'

  if (!['task', 'deal'].includes(type) || !['accepted', 'declined'].includes(action)) {
    return NextResponse.json({ error: 'Neplatné parametry' }, { status: 400 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verify user is a member
  const { data: memberRecord } = await admin
    .from('team_members')
    .select('owner_id, member_name, member_email')
    .eq('member_user_id', user.id)
    .eq('status', 'aktivni')
    .maybeSingle()

  if (!memberRecord) return NextResponse.json({ error: 'Nejsi člen týmu' }, { status: 403 })

  const table = type === 'task' ? 'tasks' : 'deals'

  // Verify the item is assigned to this member
  const { data: item } = await admin
    .from(table)
    .select('id, nazev, hodnota, assigned_to')
    .eq('id', id)
    .single()

  if (!item || item.assigned_to !== user.id) {
    return NextResponse.json({ error: 'Přístup odepřen' }, { status: 403 })
  }

  // Update assignment_status
  await admin.from(table).update({ assignment_status: action }).eq('id', id)

  // Send email to owner
  const { data: emailSettings } = await admin
    .from('email_settings')
    .select('*')
    .eq('user_id', memberRecord.owner_id)
    .single()

  if (emailSettings) {
    const { data: ownerAuth } = await admin.auth.admin.getUserById(memberRecord.owner_id)
    const ownerEmail = ownerAuth?.user?.email
    const memberDisplayName = memberRecord.member_name || memberRecord.member_email || user.email || 'Člen'
    const ownerName = (ownerAuth?.user?.user_metadata?.full_name as string) || ownerEmail || 'Admin'
    const typeLabel = type === 'task' ? 'úkol' : 'zakázku'
    const typePath = type === 'task' ? 'tasks' : 'deals'
    const actionLabel = action === 'accepted' ? 'přijal/a' : 'odmítl/a'

    if (ownerEmail) {
      try {
        const html = assignmentEmailHtml({
          memberName: memberDisplayName,
          ownerName,
          itemName: item.nazev,
          typeLabel,
          typePath,
          appUrl: 'https://www.mujcrm.cz',
          mode: action,
          itemType: type as 'task' | 'deal',
          itemValue: type === 'deal' ? (item as { hodnota?: number }).hodnota ?? null : null,
        })
        const subjectTypeLabel = type === 'deal' ? 'zakázku' : 'úkol'
        const transporter = nodemailer.createTransport({
          host: emailSettings.smtp_host,
          port: emailSettings.smtp_port,
          secure: emailSettings.smtp_secure,
          auth: { user: emailSettings.smtp_user, pass: decryptPassword(emailSettings.smtp_password) },
        })
        await transporter.sendMail({
          from: `"${emailSettings.display_name || emailSettings.smtp_user}" <${emailSettings.smtp_user}>`,
          to: ownerEmail,
          subject: `${memberDisplayName} ${actionLabel} ${subjectTypeLabel}: ${item.nazev}`,
          html,
        })
      } catch { /* ignore */ }
    }
  }

  return NextResponse.json({ success: true })
}
