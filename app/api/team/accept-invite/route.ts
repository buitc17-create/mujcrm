import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const ownerIdFromMeta = user.user_metadata?.owner_id
  const teamMemberIdFromMeta = user.user_metadata?.team_member_id

  if (!ownerIdFromMeta) return NextResponse.json({ ok: true })

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (teamMemberIdFromMeta) {
    await adminClient.from('team_members')
      .update({ member_user_id: user.id, status: 'aktivni' })
      .eq('id', teamMemberIdFromMeta)
  } else {
    await adminClient.from('team_members')
      .update({ member_user_id: user.id, status: 'aktivni' })
      .eq('owner_id', ownerIdFromMeta)
      .eq('member_email', user.email!)
  }

  return NextResponse.json({ ok: true })
}
