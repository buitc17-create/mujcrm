import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Zjisti, jestli je přihlášený uživatel člen (ne vlastník)
  const { data: asMember } = await adminClient
    .from('team_members')
    .select('owner_id')
    .eq('member_user_id', user.id)
    .eq('status', 'aktivni')
    .maybeSingle()

  const ownerId = asMember ? asMember.owner_id : user.id

  // Načti vlastníka přes auth.users
  const { data: ownerAuth } = await adminClient.auth.admin.getUserById(ownerId)
  const ownerName = (ownerAuth?.user?.user_metadata?.full_name as string) || ownerAuth?.user?.email || 'Admin'

  // Načti aktivní členy týmu
  const { data: members } = await adminClient
    .from('team_members')
    .select('member_user_id, member_name, member_email, role')
    .eq('owner_id', ownerId)
    .eq('status', 'aktivni')

  const result = [
    { id: ownerId, name: ownerName, email: ownerAuth?.user?.email ?? '', role: 'admin' as const, isOwner: true },
    ...(members ?? [])
      .filter(m => m.member_user_id)
      .map(m => ({
        id: m.member_user_id as string,
        name: m.member_name || m.member_email || 'Člen',
        email: m.member_email || '',
        role: m.role as string,
        isOwner: false,
      })),
  ]

  return NextResponse.json({ members: result, ownerId })
}
