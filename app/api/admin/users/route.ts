import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import { PLANS } from '@/lib/stripe-config'
import { verifyAdminToken } from '@/lib/adminAuth'
import { cookies } from 'next/headers'

function getBillingInterval(priceId: string): 'monthly' | 'yearly' | null {
  for (const plan of Object.values(PLANS)) {
    if (plan.monthly.priceId === priceId) return 'monthly'
    if (plan.yearly.priceId === priceId) return 'yearly'
  }
  return null
}

function daysLeft(unixTs: number): number {
  return Math.ceil((unixTs * 1000 - Date.now()) / 86400000)
}

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: authData } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
  const authUsers = authData?.users ?? []

  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, plan, stripe_customer_id, stripe_subscription_id, pending_plan, pending_plan_date, trial_ends_at')

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))
  const paidProfiles = (profiles ?? []).filter(p => p.stripe_subscription_id)

  const stripeSubMap = new Map<string, {
    interval: 'monthly' | 'yearly' | null
    periodStart: string
    periodEnd: string
    status: string
    trialDaysLeft: number | null
    discountDaysLeft: number | null
    discountCode: string | null
  }>()

  await Promise.all(
    paidProfiles.map(async (p) => {
      try {
        const sub = await stripe.subscriptions.retrieve(p.stripe_subscription_id!, {
          expand: ['discounts.coupon', 'discounts.promotion_code'],
        })
        const item = sub.items.data[0]
        const priceId = item?.price?.id ?? ''
        const periodStart = item?.current_period_start ?? sub.billing_cycle_anchor
        const periodEnd = item?.current_period_end ?? sub.billing_cycle_anchor

        // Trial
        const trialDaysLeft = (sub.status === 'trialing' && sub.trial_end && sub.trial_end > Date.now() / 1000)
          ? daysLeft(sub.trial_end)
          : null

        // Voucher / discount (Stripe v21 používá discounts[])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const firstDiscount = ((sub.discounts ?? []) as any[])[0] ?? null
        const discountEnd: number | null = firstDiscount?.end ?? null
        const discountDaysLeft = (discountEnd && discountEnd > Date.now() / 1000)
          ? daysLeft(discountEnd)
          : null
        const discountCode: string | null =
          firstDiscount?.promotion_code?.code ?? firstDiscount?.coupon?.id ?? null

        stripeSubMap.set(p.id, {
          interval: getBillingInterval(priceId),
          periodStart: new Date(periodStart * 1000).toISOString(),
          periodEnd: new Date(periodEnd * 1000).toISOString(),
          status: sub.status,
          trialDaysLeft,
          discountDaysLeft,
          discountCode,
        })
      } catch { /* předplatné neexistuje nebo bylo smazáno */ }
    })
  )

  const users = authUsers.map(authUser => {
    const profile = profileMap.get(authUser.id)
    const stripeSub = stripeSubMap.get(authUser.id)
    return {
      id: authUser.id,
      email: authUser.email ?? '',
      fullName: (authUser.user_metadata?.full_name as string) || null,
      createdAt: authUser.created_at,
      plan: profile?.plan ?? 'free',
      stripeCustomerId: profile?.stripe_customer_id ?? null,
      stripeSubscriptionId: profile?.stripe_subscription_id ?? null,
      pendingPlan: profile?.pending_plan ?? null,
      pendingPlanDate: profile?.pending_plan_date ?? null,
      appTrialEndsAt: profile?.trial_ends_at ?? null,
      appTrialDaysLeft: (profile?.plan === 'trial' && profile?.trial_ends_at)
        ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / 86400000))
        : null,
      billingInterval: stripeSub?.interval ?? null,
      periodStart: stripeSub?.periodStart ?? null,
      periodEnd: stripeSub?.periodEnd ?? null,
      subscriptionStatus: stripeSub?.status ?? null,
      trialDaysLeft: stripeSub?.trialDaysLeft ?? null,
      discountDaysLeft: stripeSub?.discountDaysLeft ?? null,
      discountCode: stripeSub?.discountCode ?? null,
    }
  })

  return NextResponse.json({ users })
}
