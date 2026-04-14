import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/stripe-config'
import Stripe from 'stripe'

function planFromPriceId(priceId: string): string {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.monthly.priceId === priceId || plan.yearly.priceId === priceId) {
      return key.toLowerCase()
    }
  }
  return 'active'
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { priceId } = await req.json()
  if (!priceId) return NextResponse.json({ error: 'Chybí priceId' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, stripe_subscription_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_subscription_id) {
    return NextResponse.json({ error: 'Nemáš aktivní předplatné' }, { status: 400 })
  }

  // Načti aktuální subscription
  const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id) as Stripe.Subscription
  const currentItemId = sub.items.data[0]?.id
  const currentPeriodEnd = sub.current_period_end // unix timestamp

  // Zjisti, zda již existuje schedule
  const existingScheduleId = (sub as Stripe.Subscription & { schedule?: string | null }).schedule

  if (existingScheduleId && typeof existingScheduleId === 'string') {
    // Aktualizuj existující schedule — zachovej fázi 1 (do konce období) a uprav fázi 2 (nový plán)
    const schedule = await stripe.subscriptionSchedules.retrieve(existingScheduleId)
    const phase1 = schedule.phases[0]

    await stripe.subscriptionSchedules.update(existingScheduleId, {
      phases: [
        {
          items: phase1.items.map(i => ({
            price: typeof i.price === 'string' ? i.price : i.price.id,
            quantity: i.quantity ?? 1,
          })),
          start_date: phase1.start_date,
          end_date: currentPeriodEnd,
        },
        {
          items: [{ price: priceId, quantity: 1 }],
          start_date: currentPeriodEnd,
        },
      ],
      end_behavior: 'release',
    })
  } else {
    // Vytvoř nový subscription schedule ze stávajícího předplatného
    const schedule = await stripe.subscriptionSchedules.create({
      from_subscription: profile.stripe_subscription_id,
    })

    // Fáze 1: aktuální plán do konce období, fáze 2: nový plán
    await stripe.subscriptionSchedules.update(schedule.id, {
      phases: [
        {
          items: [{ price: sub.items.data[0].price.id, quantity: 1 }],
          start_date: sub.start_date,
          end_date: currentPeriodEnd,
        },
        {
          items: [{ price: priceId, quantity: 1 }],
          start_date: currentPeriodEnd,
        },
      ],
      end_behavior: 'release',
    })
  }

  const pendingPlan = planFromPriceId(priceId)
  const periodEndDate = new Date(currentPeriodEnd * 1000).toISOString()

  // Ulož naplánovanou změnu do profilu
  await supabase.from('profiles').update({
    pending_plan: pendingPlan,
    pending_plan_date: periodEndDate,
  }).eq('id', user.id)

  return NextResponse.json({ ok: true, pendingPlan, periodEnd: periodEndDate })
}
