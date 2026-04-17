import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_at: string } | null> {
  try {
    const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/Calendars.Read offline_access',
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return {
      access_token: data.access_token,
      expires_at: new Date(Date.now() + (data.expires_in ?? 3600) * 1000).toISOString(),
    }
  } catch { return null }
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  const url = new URL(request.url)
  const start = url.searchParams.get('start')
  const end = url.searchParams.get('end')

  if (!start || !end) return NextResponse.json({ events: [] })

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: tokenRow } = await admin
    .from('microsoft_calendar_tokens')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!tokenRow) return NextResponse.json({ events: [], connected: false })

  let accessToken = tokenRow.access_token

  // Refresh if expired or within 60s of expiry
  if (tokenRow.expires_at && new Date(tokenRow.expires_at).getTime() - Date.now() < 60_000) {
    if (tokenRow.refresh_token) {
      const refreshed = await refreshAccessToken(tokenRow.refresh_token)
      if (refreshed) {
        accessToken = refreshed.access_token
        await admin.from('microsoft_calendar_tokens').update({
          access_token: refreshed.access_token,
          expires_at: refreshed.expires_at,
        }).eq('user_id', user.id)
      }
    }
  }

  const startDateTime = `${start}T00:00:00`
  const endDateTime = `${end}T23:59:59`

  try {
    // Get all calendars
    const calRes = await fetch('https://graph.microsoft.com/v1.0/me/calendars?$select=id,name,color,hexColor', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!calRes.ok) {
      if (calRes.status === 401) {
        await admin.from('microsoft_calendar_tokens').delete().eq('user_id', user.id)
        return NextResponse.json({ events: [], connected: false, error: 'Token vypršel, odpojte a znovu propojte Microsoft Kalendář' })
      }
      return NextResponse.json({ events: [], connected: true })
    }

    const calData = await calRes.json()
    const calendars: Array<{ id: string; name: string; hexColor: string }> = calData.value ?? []

    const allEvents: Array<{
      id: string; title: string; date: string; timeStart: string | null;
      timeEnd: string | null; allDay: boolean; calendarName: string;
      calendarColor: string; description: string | null; location: string | null;
    }> = []

    await Promise.all(calendars.map(async (cal) => {
      const params = new URLSearchParams({
        startDateTime,
        endDateTime,
        '$select': 'id,subject,start,end,isAllDay,bodyPreview,location',
        '$top': '250',
        '$orderby': 'start/dateTime',
      })

      const evRes = await fetch(
        `https://graph.microsoft.com/v1.0/me/calendars/${cal.id}/calendarView?${params}`,
        { headers: { Authorization: `Bearer ${accessToken}`, Prefer: 'outlook.timezone="Europe/Prague"' } }
      )
      if (!evRes.ok) return

      const evData = await evRes.json()
      for (const ev of evData.value ?? []) {
        const isAllDay = ev.isAllDay ?? false
        const startRaw: string = ev.start?.dateTime ?? ''
        const endRaw: string = ev.end?.dateTime ?? ''

        const date = startRaw.slice(0, 10)
        const timeStart = isAllDay ? null : startRaw.slice(11, 16)
        const timeEnd = isAllDay ? null : endRaw.slice(11, 16)

        // Microsoft calendar colors — use hexColor if available, else default blue
        const color = cal.hexColor && cal.hexColor !== '#000000' ? cal.hexColor : '#0078D4'

        allEvents.push({
          id: `mscal_${ev.id}`,
          title: ev.subject ?? '(bez názvu)',
          date,
          timeStart,
          timeEnd,
          allDay: isAllDay,
          calendarName: cal.name,
          calendarColor: color,
          description: ev.bodyPreview ?? null,
          location: ev.location?.displayName ?? null,
        })
      }
    }))

    return NextResponse.json({ events: allEvents, connected: true })
  } catch {
    return NextResponse.json({ events: [], connected: true, error: 'Chyba při načítání Microsoft Kalendáře' })
  }
}
