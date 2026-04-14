import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, stripe_customer_id, stripe_subscription_id, pending_plan, pending_plan_date')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    plan: profile?.plan ?? 'free',
    hasStripe: !!profile?.stripe_customer_id,
    hasSubscription: !!profile?.stripe_subscription_id,
    pendingPlan: profile?.pending_plan ?? null,
    pendingPlanDate: profile?.pending_plan_date ?? null,
  })
}
