import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const memberId = searchParams.get('user_id')
  if (!memberId) return NextResponse.json({ error: 'Chybí user_id' }, { status: 400 })

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Ověř, že aktuální uživatel je vlastník tohoto člena
  const { data: asMember } = await adminClient
    .from('team_members')
    .select('owner_id')
    .eq('member_user_id', user.id)
    .eq('status', 'aktivni')
    .maybeSingle()

  const ownerId = asMember ? asMember.owner_id : user.id

  const isOwner = ownerId === user.id
  if (!isOwner) return NextResponse.json({ error: 'Nedostatečná práva' }, { status: 403 })

  // Ověř, že memberId patří do tohoto týmu
  if (memberId !== ownerId) {
    const { data: memberCheck } = await adminClient
      .from('team_members')
      .select('id')
      .eq('owner_id', ownerId)
      .eq('member_user_id', memberId)
      .eq('status', 'aktivni')
      .maybeSingle()
    if (!memberCheck) return NextResponse.json({ error: 'Člen nenalezen' }, { status: 404 })
  }

  // Načti data daného člena — vlastní zakázky + zakázky přiřazené adminem
  const [{ data: ownDeals }, { data: assignedDeals }, { data: tasks }, { data: leads }, { data: activities }] = await Promise.all([
    adminClient.from('deals').select('id, nazev, hodnota, pravdepodobnost, stage_id, datum_uzavreni, contacts(jmeno, prijmeni)').eq('user_id', memberId),
    adminClient.from('deals').select('id, nazev, hodnota, pravdepodobnost, stage_id, datum_uzavreni, contacts(jmeno, prijmeni)').eq('user_id', ownerId).eq('assigned_to', memberId),
    adminClient.from('tasks').select('id, dokonceno').eq('user_id', memberId),
    adminClient.from('leads').select('id, zdroj, konvertovan, lead_status_id, created_at').eq('user_id', memberId),
    adminClient.from('activities').select('id, typ, datum').eq('user_id', memberId),
  ])

  // Deduplikace
  const ownIds = new Set((ownDeals ?? []).map((d: { id: string }) => d.id));
  const uniqueAssigned = (assignedDeals ?? []).filter((d: { id: string }) => !ownIds.has(d.id));
  const allDeals = [...(ownDeals ?? []), ...uniqueAssigned];

  return NextResponse.json({ deals: allDeals, tasks: tasks ?? [], leads: leads ?? [], activities: activities ?? [] })
}
