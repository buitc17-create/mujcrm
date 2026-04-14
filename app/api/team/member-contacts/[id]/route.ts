import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  // Verify the contact is linked to at least one of the member's assigned deals or tasks
  const [{ data: deals }, { data: tasks }] = await Promise.all([
    admin.from('deals').select('id').eq('user_id', ownerId).eq('assigned_to', user.id).eq('contact_id', id).limit(1),
    admin.from('tasks').select('id').eq('user_id', ownerId).eq('assigned_to', user.id).eq('contact_id', id).limit(1),
  ])

  if (!deals?.length && !tasks?.length) {
    return NextResponse.json({ error: 'Přístup odepřen' }, { status: 403 })
  }

  const [{ data: contact }, { data: assignedDeals }, { data: assignedTasks }] = await Promise.all([
    admin.from('contacts').select('*').eq('id', id).single(),
    admin.from('deals')
      .select('id, nazev, hodnota, status, datum_uzavreni')
      .eq('user_id', ownerId)
      .eq('assigned_to', user.id)
      .eq('contact_id', id)
      .order('created_at', { ascending: false }),
    admin.from('tasks')
      .select('id, nazev, deadline, dokonceno')
      .eq('user_id', ownerId)
      .eq('assigned_to', user.id)
      .eq('contact_id', id)
      .order('created_at', { ascending: false }),
  ])

  return NextResponse.json({ contact, deals: assignedDeals ?? [], tasks: assignedTasks ?? [] })
}
