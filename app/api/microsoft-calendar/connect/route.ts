import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const clientId = process.env.MICROSOFT_CLIENT_ID
  if (!clientId) return NextResponse.json({ error: 'Microsoft OAuth není nakonfigurován' }, { status: 500 })

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mujcrm.cz'}/api/microsoft-calendar/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: 'https://graph.microsoft.com/Calendars.Read offline_access openid email profile',
    response_mode: 'query',
    state: user.id,
  })

  return NextResponse.redirect(`https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`)
}
