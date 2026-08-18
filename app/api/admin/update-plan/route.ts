import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

export async function PATCH(req: NextRequest) {
  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId, plan } = await req.json()
  if (!userId || !plan) return NextResponse.json({ error: 'Chybí parametry' }, { status: 400 })

  const validPlans = ['free', 'start', 'tym', 'business', 'enterprise']
  if (!validPlans.includes(plan)) return NextResponse.json({ error: 'Neplatný tarif' }, { status: 400 })

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await adminClient
    .from('profiles')
    .update({ plan })
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
