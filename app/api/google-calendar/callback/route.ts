import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const userId = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mujcrm.cz'

  if (error || !code || !userId) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?gcal=error`)
  }

  const redirectUri = `${appUrl}/api/google-calendar/callback`

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?gcal=error`)
  }

  const tokens = await tokenRes.json()
  const { access_token, refresh_token, expires_in } = tokens

  // Get connected Google account email
  let connectedEmail: string | null = null
  try {
    const meRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    if (meRes.ok) {
      const me = await meRes.json()
      connectedEmail = me.email ?? null
    }
  } catch { /* ignore */ }

  const expiresAt = new Date(Date.now() + (expires_in ?? 3600) * 1000).toISOString()

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await admin.from('google_calendar_tokens').upsert({
    user_id: userId,
    access_token,
    refresh_token: refresh_token ?? null,
    expires_at: expiresAt,
    connected_email: connectedEmail,
  }, { onConflict: 'user_id' })

  return NextResponse.redirect(`${appUrl}/dashboard/settings?gcal=connected`)
}
