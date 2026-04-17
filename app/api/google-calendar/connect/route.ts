import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) return NextResponse.json({ error: 'Google OAuth není nakonfigurován' }, { status: 500 })

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mujcrm.cz'}/api/google-calendar/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'openid',
      'email',
    ].join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state: user.id,
  })

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}
