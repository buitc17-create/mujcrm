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
    .select('owner_id')
    .eq('member_user_id', user.id)
    .eq('status', 'aktivni')
    .maybeSingle()

  if (!memberRecord) return NextResponse.json({ error: 'Nejsi člen týmu' }, { status: 403 })

  const ownerId = memberRecord.owner_id

  // Get contact IDs from assigned deals and tasks
  const [{ data: deals }, { data: tasks }] = await Promise.all([
    admin.from('deals')
      .select('contact_id')
      .eq('user_id', ownerId)
      .eq('assigned_to', user.id)
      .not('contact_id', 'is', null),
    admin.from('tasks')
      .select('contact_id')
      .eq('user_id', ownerId)
      .eq('assigned_to', user.id)
      .not('contact_id', 'is', null),
  ])

  const contactIds = [...new Set([
    ...(deals ?? []).map((d: { contact_id: string }) => d.contact_id),
    ...(tasks ?? []).map((t: { contact_id: string }) => t.contact_id),
  ].filter(Boolean))]

  if (contactIds.length === 0) return NextResponse.json({ contacts: [] })

  const { data: contacts } = await admin
    .from('contacts')
    .select('id, jmeno, prijmeni, email, telefon, firma, tag, created_at')
    .in('id', contactIds)
    .order('created_at', { ascending: false })

  return NextResponse.json({ contacts: contacts ?? [] })
}
