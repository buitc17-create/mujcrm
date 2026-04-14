import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import Stripe from 'stripe'
import { PLANS } from '@/lib/stripe-config'
import { buildTrialEndEmailHtml } from '@/lib/trialEndEmailHtml'
import { decryptPassword } from '@/lib/emailCrypto'

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
      await supabase.from('profiles').update({
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        plan: planFromPriceId(priceId),
      }).eq('id', session.metadata!.userId)
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

      // Načti SMTP nastavení uživatele
      const { data: emailSettings } = await adminClient
        .from('email_settings')
        .select('*')
        .eq('user_id', profile.id)
        .single()

      if (!emailSettings) break

      try {
        const transporter = nodemailer.createTransport({
          host: emailSettings.smtp_host,
          port: emailSettings.smtp_port,
          secure: emailSettings.smtp_secure,
          auth: { user: emailSettings.smtp_user, pass: decryptPassword(emailSettings.smtp_password) },
        })

        await transporter.sendMail({
          from: `"MujCRM" <${emailSettings.smtp_user}>`,
          to: userEmail,
          subject: 'Váš bezplatný měsíc právě skončil — co dál?',
          html: buildTrialEndEmailHtml(),
        })
      } catch { /* tiché selhání — neblokuj webhook */ }

      break
    }
  }

  return NextResponse.json({ received: true })
}
