import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: memberRecord } = await admin
    .from('team_members')
    .select('owner_id, role')
    .eq('member_user_id', user.id)
    .eq('status', 'aktivni')
    .maybeSingle()

  if (!memberRecord) return NextResponse.json({ error: 'Nejsi člen týmu' }, { status: 403 })

  const ownerId = memberRecord.owner_id

  const [{ data: deals }, { data: stages }, { data: contacts }] = await Promise.all([
    admin.from('deals')
      .select('id, nazev, hodnota, status, stage_id, datum_uzavreni, contact_id, priorita, pravdepodobnost, zdroj, assigned_to, assignment_status, contacts(jmeno, prijmeni, firma)')
      .eq('user_id', ownerId)
      .eq('assigned_to', user.id)
      .order('created_at', { ascending: false }),
    admin.from('pipeline_stages')
      .select('id, nazev, barva, poradi')
      .eq('user_id', ownerId)
      .order('poradi'),
    admin.from('contacts')
      .select('id, jmeno, prijmeni, firma')
      .eq('user_id', ownerId)
      .order('jmeno'),
  ])

  return NextResponse.json({
    deals: deals ?? [],
    stages: stages ?? [],
    contacts: contacts ?? [],
    ownerId,
    memberUserId: user.id,
    role: memberRecord.role,
  })
}

// Update deal stage (for drag & drop) or assignment_status
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: memberRecord } = await admin
    .from('team_members')
    .select('owner_id')
    .eq('member_user_id', user.id)
    .eq('status', 'aktivni')
    .maybeSingle()

  if (!memberRecord) return NextResponse.json({ error: 'Nejsi člen týmu' }, { status: 403 })

  const body = await request.json()
  const { id, ...updates } = body

  // Verify deal belongs to owner
  const { data: deal } = await admin.from('deals').select('user_id').eq('id', id).single()
  if (!deal || deal.user_id !== memberRecord.owner_id) {
    return NextResponse.json({ error: 'Přístup odepřen' }, { status: 403 })
  }

  const { error: updateError } = await admin.from('deals').update(updates).eq('id', id)
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// Create deal
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: memberRecord } = await admin
    .from('team_members')
    .select('owner_id')
    .eq('member_user_id', user.id)
    .eq('status', 'aktivni')
    .maybeSingle()

  if (!memberRecord) return NextResponse.json({ error: 'Nejsi člen týmu' }, { status: 403 })

  const body = await request.json()
  const { data, error } = await admin
    .from('deals')
    .insert({ ...body, user_id: memberRecord.owner_id })
    .select('id, nazev, hodnota, status, stage_id, datum_uzavreni, contact_id, priorita, pravdepodobnost, zdroj, assigned_to, assignment_status, contacts(jmeno, prijmeni, firma)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deal: data })
}
