import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { PLANS } from '@/lib/stripe-config'

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
  }

  return NextResponse.json({ received: true })
}
