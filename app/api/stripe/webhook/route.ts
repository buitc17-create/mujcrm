import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import Stripe from 'stripe'
import { PLANS } from '@/lib/stripe-config'
import { buildTrialEndEmailHtml } from '@/lib/trialEndEmailHtml'
import { buildPaymentFailedEmailHtml } from '@/lib/paymentFailedEmailHtml'

function planFromPriceId(priceId: string): string {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.monthly.priceId === priceId || plan.yearly.priceId === priceId) {
      return key.toLowerCase(); // 'start', 'tym', 'business', 'enterprise'
    }
  }
  return 'active';
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createClient()
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const priceId = session.metadata?.priceId ?? ''
      const planName = planFromPriceId(priceId)
      await supabase.from('profiles').update({
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        plan: planName,
      }).eq('id', session.metadata!.userId)

      // Interní notifikace o novém předplatném
      try {
        // Načti session s rozšířenými daty o slevách
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['discounts.coupon', 'discounts.promotion_code'],
        })

        const userEmail = fullSession.customer_details?.email ?? fullSession.customer_email ?? ''
        const userName = fullSession.customer_details?.name ?? userEmail.split('@')[0]

        // Voucher info
        const discounts = (fullSession.discounts ?? []) as Stripe.Discount[]
        const voucherParts = discounts.map(d => {
          const coupon = d.coupon as Stripe.Coupon
          const code = (d.promotion_code as Stripe.PromotionCode | null)?.code ?? coupon.id
          const off = coupon.percent_off ? `${coupon.percent_off} %` : coupon.amount_off ? `${(coupon.amount_off / 100).toFixed(0)} Kč` : ''
          return off ? `${code} (${off})` : code
        })
        const voucherText = voucherParts.length > 0 ? voucherParts.join(', ') : null

        const PLAN_LABELS: Record<string, string> = {
          start: 'Start', tym: 'Tým', business: 'Business', enterprise: 'Enterprise',
        }
        const planLabel = PLAN_LABELS[planName] ?? planName

        const systemSmtpUser = process.env.SYSTEM_SMTP_USER
        const systemSmtpPass = process.env.SYSTEM_SMTP_PASS
        const systemSmtpFrom = process.env.SYSTEM_SMTP_FROM ?? systemSmtpUser
        if (systemSmtpUser && systemSmtpPass) {
          const date = new Date().toLocaleString('cs-CZ', { timeZone: 'Europe/Prague' })
          const transporter = nodemailer.createTransport({
            host: process.env.SYSTEM_SMTP_HOST ?? 'smtp.gmail.com',
            port: Number(process.env.SYSTEM_SMTP_PORT ?? 465),
            secure: process.env.SYSTEM_SMTP_SECURE !== 'false',
            auth: { user: systemSmtpUser, pass: systemSmtpPass },
          })
          await transporter.sendMail({
            from: `"MujCRM Systém" <${systemSmtpFrom}>`,
            to: 'info@mujcrm.cz',
            subject: `💳 Nové předplatné: ${userName} → ${planLabel}`,
            html: `
              <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
                <div style="background:#0a0a0a;padding:20px 24px;border-radius:10px 10px 0 0">
                  <span style="color:#fff;font-size:18px;font-weight:900">Muj</span><span style="color:#00BFFF;font-size:18px;font-weight:900">CRM</span>
                  <span style="color:rgba(255,255,255,0.4);font-size:13px;margin-left:12px">Nové předplatné</span>
                </div>
                <div style="background:#f8fafc;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px">
                  <h2 style="margin:0 0 16px;font-size:16px;color:#111">Uživatel si aktivoval předplatné</h2>
                  <table style="width:100%;border-collapse:collapse;font-size:14px">
                    <tr><td style="padding:8px 0;color:#6b7280;width:120px">Jméno</td><td style="padding:8px 0;color:#111;font-weight:600">${userName}</td></tr>
                    <tr><td style="padding:8px 0;color:#6b7280">E-mail</td><td style="padding:8px 0;color:#111;font-weight:600">${userEmail}</td></tr>
                    <tr><td style="padding:8px 0;color:#6b7280">Tarif</td><td style="padding:8px 0;color:#00BFFF;font-weight:700">${planLabel}</td></tr>
                    ${voucherText ? `<tr><td style="padding:8px 0;color:#6b7280">Voucher</td><td style="padding:8px 0;color:#10b981;font-weight:600">${voucherText}</td></tr>` : ''}
                    <tr><td style="padding:8px 0;color:#6b7280">Datum</td><td style="padding:8px 0;color:#111">${date}</td></tr>
                  </table>
                </div>
              </div>
            `,
          })
        }
      } catch { /* tiché selhání — neblokuj webhook */ }

      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabase.from('profiles').update({
        plan: 'free',
        pending_plan: null,
        pending_plan_date: null,
      }).eq('stripe_subscription_id', sub.id)
      break
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const prevAttrs = (event.data.previous_attributes ?? {}) as Record<string, unknown>

      // Reaguj jen tehdy, pokud se změnila položka (price) — tedy nastal přechod na nový plán
      const itemsChanged = 'items' in prevAttrs
      if (!itemsChanged) break

      const priceId = sub.items.data[0]?.price?.id ?? ''
      if (!priceId) break

      const newPlan = planFromPriceId(priceId)
      if (newPlan === 'active') break // neznámý plán, ignoruj

      // Nový plán je aktivní — smaž pending
      await supabase.from('profiles').update({
        plan: newPlan,
        pending_plan: null,
        pending_plan_date: null,
      }).eq('stripe_subscription_id', sub.id)
      break
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      // Zajímají nás pouze první reálné platby po slevovém měsíci (billing_reason = subscription_cycle)
      if ((invoice as Stripe.Invoice & { billing_reason?: string }).billing_reason !== 'subscription_cycle') break

      // Zjisti zda měl zákazník discount (promo kód) na předchozím cyklu
      const hadDiscount = (invoice.discounts && invoice.discounts.length > 0)

      if (!hadDiscount) break // Nebyl promo kód, email neposíláme

      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
      if (!customerId) break

      // Najdi uživatele podle stripe_customer_id
      const { data: profile } = await adminClient
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()
      if (!profile) break

      // Načti email z auth
      const { data: authUser } = await adminClient.auth.admin.getUserById(profile.id)
      const userEmail = authUser.user?.email
      if (!userEmail) break

      // Použij systémový SMTP (info@mujcrm.cz)
      const systemSmtpUser = process.env.SYSTEM_SMTP_USER
      const systemSmtpPass = process.env.SYSTEM_SMTP_PASS
      const systemSmtpFrom = process.env.SYSTEM_SMTP_FROM ?? systemSmtpUser
      if (!systemSmtpUser || !systemSmtpPass) break

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
          subject: 'Váš bezplatný měsíc právě skončil — co dál?',
          html: buildTrialEndEmailHtml(),
        })
      } catch { /* tiché selhání — neblokuj webhook */ }

      break
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
      if (!customerId) break

      const { data: profile } = await adminClient
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()
      if (!profile) break

      const { data: authUser } = await adminClient.auth.admin.getUserById(profile.id)
      const userEmail = authUser.user?.email
      if (!userEmail) break

      const systemSmtpUser = process.env.SYSTEM_SMTP_USER
      const systemSmtpPass = process.env.SYSTEM_SMTP_PASS
      const systemSmtpFrom = process.env.SYSTEM_SMTP_FROM ?? systemSmtpUser
      if (!systemSmtpUser || !systemSmtpPass) break

      const amountDue = invoice.amount_due
        ? `${(invoice.amount_due / 100).toFixed(0)} Kč`
        : ''

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
          subject: 'Platba se nezdařila — aktualizujte prosím platební údaje',
          html: buildPaymentFailedEmailHtml(amountDue),
        })
      } catch { /* tiché selhání — neblokuj webhook */ }

      break
    }
  }

  return NextResponse.json({ received: true })
}
