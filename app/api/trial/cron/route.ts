import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { buildTrialWarningEmailHtml } from '@/lib/trialWarningEmailHtml'
import { buildTrialExpiredNotifEmailHtml } from '@/lib/trialExpiredNotifEmailHtml'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const systemSmtpUser = process.env.SYSTEM_SMTP_USER
  const systemSmtpPass = process.env.SYSTEM_SMTP_PASS
  const systemSmtpFrom = process.env.SYSTEM_SMTP_FROM ?? systemSmtpUser

  if (!systemSmtpUser || !systemSmtpPass) {
    return NextResponse.json({ error: 'SMTP not configured' }, { status: 500 })
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SYSTEM_SMTP_HOST ?? 'smtp.gmail.com',
    port: Number(process.env.SYSTEM_SMTP_PORT ?? 465),
    secure: process.env.SYSTEM_SMTP_SECURE !== 'false',
    auth: { user: systemSmtpUser, pass: systemSmtpPass },
  })

  const admin = getAdmin()
  const now = new Date()

  // Warning window: trial expires in 24–48h (fires once on day 5)
  const warningFrom = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  const warningTo = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString()

  // Expired window: trial expired in last 24h (fires once on day 7)
  const expiredFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const expiredTo = now.toISOString()

  const { data: trialProfiles } = await admin
    .from('profiles')
    .select('id, trial_ends_at')
    .eq('plan', 'trial')
    .not('trial_ends_at', 'is', null)

  let warningSent = 0
  let expiredSent = 0
  const errors: string[] = []

  for (const profile of trialProfiles ?? []) {
    const trialEndsAt = profile.trial_ends_at as string
    const isWarning = trialEndsAt >= warningFrom && trialEndsAt < warningTo
    const isExpired = trialEndsAt >= expiredFrom && trialEndsAt < expiredTo

    if (!isWarning && !isExpired) continue

    const { data: authUser } = await admin.auth.admin.getUserById(profile.id)
    const userEmail = authUser.user?.email
    if (!userEmail) continue

    const userName = (authUser.user?.user_metadata?.full_name as string) || userEmail.split('@')[0]
    const daysLeft = Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - now.getTime()) / 86400000))

    try {
      if (isWarning) {
        await transporter.sendMail({
          from: `"MujCRM" <${systemSmtpFrom}>`,
          to: userEmail,
          subject: `${userName}, zkušební verze MujCRM brzy skončí — zbývají ${daysLeft} dny`,
          html: buildTrialWarningEmailHtml(userName, daysLeft),
        })
        warningSent++
      } else if (isExpired) {
        await transporter.sendMail({
          from: `"MujCRM" <${systemSmtpFrom}>`,
          to: userEmail,
          subject: 'Tvoje zkušební verze MujCRM skončila — vyber si tarif',
          html: buildTrialExpiredNotifEmailHtml(userName),
        })
        expiredSent++
      }
    } catch (err) {
      errors.push(`${userEmail}: ${err instanceof Error ? err.message : 'Chyba'}`)
    }
  }

  return NextResponse.json({ warningSent, expiredSent, errors })
}
