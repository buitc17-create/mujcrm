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

  const { data: contacts } = await admin
    .from('contacts')
    .select('id, jmeno, prijmeni, email, telefon, firma, tag, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ contacts: contacts ?? [] })
}

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

  const ownerId = memberRecord.owner_id
  const { contacts: records } = await request.json()

  if (!Array.isArray(records) || records.length === 0) {
    return NextResponse.json({ error: 'Žádné záznamy' }, { status: 400 })
  }

  const toInsert = records.map((r: Record<string, string | null>) => ({ ...r, user_id: ownerId }))

  const { data: inserted, error } = await admin.from('contacts').insert(toInsert).select('id, jmeno, prijmeni, email')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, inserted: inserted ?? [] })
}
