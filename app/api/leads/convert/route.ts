import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Determine if member and resolve ownerId
  const { data: memberRecord } = await admin
    .from('team_members')
    .select('owner_id')
    .eq('member_user_id', user.id)
    .eq('status', 'aktivni')
    .maybeSingle()

  const isMember = !!memberRecord
  const ownerId = memberRecord?.owner_id ?? user.id

  const body = await request.json()
  const { lead_id, jmeno, prijmeni, email, telefon, firma, zdroj, create_deal, deal_name, deal_value, stage_id } = body

  // 1. Create contact — use user.id so it appears in the converter's own contacts list
  const { data: contact, error: contactError } = await admin
    .from('contacts')
    .insert({
      user_id: user.id,
      jmeno,
      prijmeni: prijmeni || null,
      email: email || null,
      telefon: telefon || null,
      firma: firma || null,
      tag: 'zákazník',
    })
    .select('id')
    .single()

  if (contactError || !contact) {
    return NextResponse.json({ error: contactError?.message ?? 'Chyba při vytváření zákazníka' }, { status: 500 })
  }

  // 2. Optionally create deal
  let dealId: string | null = null
  if (create_deal && deal_name?.trim() && stage_id) {
    const { data: deal } = await admin
      .from('deals')
      .insert({
        user_id: ownerId,
        assigned_to: isMember ? user.id : null,
        nazev: deal_name.trim(),
        hodnota: parseFloat(deal_value) || 0,
        contact_id: contact.id,
        stage_id,
        status: 'novy',
        priorita: 'stredni',
        pravdepodobnost: 50,
        zdroj: zdroj ?? 'jine',
      })
      .select('id')
      .single()
    dealId = deal?.id ?? null
  }

  // 3. Mark lead as converted
  await admin
    .from('leads')
    .update({ konvertovan: true, contact_id: contact.id })
    .eq('id', lead_id)

  return NextResponse.json({ contact_id: contact.id, deal_id: dealId })
}
