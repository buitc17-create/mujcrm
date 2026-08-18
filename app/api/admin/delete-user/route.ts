import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { isAuthorizedAdmin } from '@/lib/adminAuth'
import { stripe } from '@/lib/stripe'
import nodemailer from 'nodemailer'
import { buildAccountDeletedEmailHtml } from '@/lib/accountDeletedEmailHtml'

export async function DELETE(req: NextRequest) {
  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'Chybí userId' }, { status: 400 })

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Načti auth uživatele (email + jméno) před smazáním
  const { data: authUserData } = await adminClient.auth.admin.getUserById(userId)
  const userEmail = authUserData.user?.email ?? ''
  const userName = (authUserData.user?.user_metadata?.full_name as string) || userEmail.split('@')[0]

  // Načti profil pro Stripe
  const { data: profile } = await adminClient
    .from('profiles')
    .select('stripe_subscription_id, stripe_customer_id')
    .eq('id', userId)
    .maybeSingle()

  // Zruš Stripe předplatné pokud existuje
  if (profile?.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(profile.stripe_subscription_id)
    } catch { /* ignoruj — předplatné možná již neexistuje */ }
  }

  // Smaž soubory ze storage
  const extensions = ['png', 'jpg', 'jpeg', 'webp']
  await adminClient.storage.from('logos').remove(
    extensions.map(ext => `${userId}/logo.${ext}`)
  )

  // Smaž auth uživatele (cascade smaže profiles a vše navázané přes FK)
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  // Pošli email uživateli o smazání
  if (userEmail) {
    const systemSmtpUser = process.env.SYSTEM_SMTP_USER
    const systemSmtpPass = process.env.SYSTEM_SMTP_PASS
    const systemSmtpFrom = process.env.SYSTEM_SMTP_FROM ?? systemSmtpUser

    if (systemSmtpUser && systemSmtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SYSTEM_SMTP_HOST ?? 'smtp.gmail.com',
          port: Number(process.env.SYSTEM_SMTP_PORT ?? 465),
          secure: process.env.SYSTEM_SMTP_SECURE !== 'false',
          auth: { user: systemSmtpUser, pass: systemSmtpPass },
        })
        await transporter.sendMail({
          from: `"MujCRM" <${systemSmtpFrom}>`,
          to: userEmail,
          subject: 'Váš účet MujCRM byl smazán',
          html: buildAccountDeletedEmailHtml(userName),
        })
      } catch { /* email selhal — neblokuj smazání */ }
    }
  }

  return NextResponse.json({ success: true })
}
