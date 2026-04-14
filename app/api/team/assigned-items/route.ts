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

  const [{ data: tasks }, { data: deals }, { data: stages }] = await Promise.all([
    admin.from('tasks')
      .select('id, nazev, popis, deadline, dokonceno, contact_id, assigned_to, assignment_status, created_at, contacts(jmeno, prijmeni)')
      .eq('user_id', ownerId)
      .eq('assigned_to', user.id)
      .order('created_at', { ascending: false }),
    admin.from('deals')
      .select('id, nazev, hodnota, status, stage_id, datum_uzavreni, contact_id, priorita, pravdepodobnost, zdroj, assigned_to, assignment_status, contacts(jmeno, prijmeni, firma)')
      .eq('user_id', ownerId)
      .eq('assigned_to', user.id)
      .order('created_at', { ascending: false }),
    admin.from('pipeline_stages')
      .select('id, nazev, barva, poradi')
      .eq('user_id', ownerId)
      .order('poradi'),
  ])

  return NextResponse.json({ tasks: tasks ?? [], deals: deals ?? [], stages: stages ?? [], ownerId, role: memberRecord.role })
}
