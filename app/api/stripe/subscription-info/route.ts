import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, stripe_customer_id, stripe_subscription_id, pending_plan, pending_plan_date')
    .eq('id', user.id)
    .single()

  let trialEnd: string | null = null
  if (profile?.stripe_subscription_id) {
    try {
      const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
      if (sub.trial_end && sub.status === 'trialing') {
        trialEnd = new Date(sub.trial_end * 1000).toISOString()
      }
    } catch { /* ignoruj chyby */ }
  }

  return NextResponse.json({
    plan: profile?.plan ?? 'free',
    hasStripe: !!profile?.stripe_customer_id,
    hasSubscription: !!profile?.stripe_subscription_id,
    pendingPlan: profile?.pending_plan ?? null,
    pendingPlanDate: profile?.pending_plan_date ?? null,
    trialEnd,
  })
}
