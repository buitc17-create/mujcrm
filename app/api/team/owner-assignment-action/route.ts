import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const { id, action } = await request.json()
  if (!['accepted', 'declined'].includes(action)) {
    return NextResponse.json({ error: 'Neplatné parametry' }, { status: 400 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verify the deal exists and is assigned to this user (owner)
  const { data: deal } = await admin
    .from('deals')
    .select('id, nazev, user_id, assigned_to')
    .eq('id', id)
    .single()

  if (!deal || deal.assigned_to !== user.id) {
    return NextResponse.json({ error: 'Přístup odepřen' }, { status: 403 })
  }

  if (action === 'accepted') {
    // Owner accepts – mark as accepted, keep assigned_to = owner (deal is now owner's)
    await admin.from('deals').update({ assignment_status: 'accepted' }).eq('id', id)
  } else {
    // Owner declines – return deal to unassigned pool in owner's workspace
    await admin.from('deals').update({ assigned_to: null, assignment_status: null }).eq('id', id)
  }

  return NextResponse.json({ success: true })
}
