import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/stripe-config'

const BUSINESS_PRICE_IDS: string[] = [PLANS.BUSINESS.monthly.priceId, PLANS.BUSINESS.yearly.priceId]

// GET — Safari-compatible přímý redirect (bez async fetch na klientovi)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const priceId = searchParams.get('priceId')
  if (!priceId) return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login?next=${encodeURIComponent(`/api/stripe/checkout?priceId=${priceId}`)}`)

  const isBusiness = BUSINESS_PRICE_IDS.includes(priceId)

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    customer_email: user.email,
    allow_promotion_codes: true,
    metadata: { userId: user.id, priceId },
    ...(isBusiness && { subscription_data: { trial_period_days: 7 } }),
  })
  return NextResponse.redirect(session.url!)
}

// POST — zachováno pro zpětnou kompatibilitu
export async function POST(req: Request) {
  const { priceId } = await req.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isBusiness = BUSINESS_PRICE_IDS.includes(priceId)

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    customer_email: user.email,
    allow_promotion_codes: true,
    metadata: { userId: user.id, priceId },
    ...(isBusiness && { subscription_data: { trial_period_days: 7 } }),
  })
  return NextResponse.json({ url: session.url })
}
