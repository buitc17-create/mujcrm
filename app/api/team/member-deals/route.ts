import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST – create deal as member (bypasses RLS so user_id = ownerId)
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const admin = getAdmin()

  const { data: memberRecord } = await admin
    .from('team_members')
    .select('owner_id')
    .eq('member_user_id', user.id)
    .eq('status', 'aktivni')
    .maybeSingle()

  if (!memberRecord) return NextResponse.json({ error: 'Nejsi člen týmu' }, { status: 403 })

  const body = await request.json()
  const { nazev, hodnota, contact_id, stage_id, status, priorita, pravdepodobnost, zdroj } = body

  if (!nazev?.trim()) return NextResponse.json({ error: 'Název je povinný' }, { status: 400 })
  if (!stage_id) return NextResponse.json({ error: 'Fáze pipeline je povinná' }, { status: 400 })

  const { data, error } = await admin
    .from('deals')
    .insert({
      user_id: memberRecord.owner_id,
      // Auto-assign to member so it appears in their pipeline view
      assigned_to: user.id,
      nazev: nazev.trim(),
      hodnota: parseFloat(hodnota) || 0,
      contact_id: contact_id || null,
      stage_id,
      status: status ?? 'novy',
      priorita: priorita ?? 'stredni',
      pravdepodobnost: pravdepodobnost ?? 50,
      zdroj: zdroj ?? 'jine',
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ deal: data })
}
