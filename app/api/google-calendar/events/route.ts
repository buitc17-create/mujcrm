import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_at: string } | null> {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
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
  const start = url.searchParams.get('start') // YYYY-MM-DD
  const end = url.searchParams.get('end')     // YYYY-MM-DD

  if (!start || !end) return NextResponse.json({ events: [] })

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: tokenRow } = await admin
    .from('google_calendar_tokens')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!tokenRow) return NextResponse.json({ events: [], connected: false })

  let accessToken = tokenRow.access_token

  // Refresh if expired (or within 60s of expiry)
  if (tokenRow.expires_at && new Date(tokenRow.expires_at).getTime() - Date.now() < 60_000) {
    if (tokenRow.refresh_token) {
      const refreshed = await refreshAccessToken(tokenRow.refresh_token)
      if (refreshed) {
        accessToken = refreshed.access_token
        await admin.from('google_calendar_tokens').update({
          access_token: refreshed.access_token,
          expires_at: refreshed.expires_at,
        }).eq('user_id', user.id)
      }
    }
  }

  // Fetch all calendars first, then events from each
  const timeMin = new Date(`${start}T00:00:00`).toISOString()
  const timeMax = new Date(`${end}T23:59:59`).toISOString()

  try {
    // Get all calendars
    const calListRes = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!calListRes.ok) {
      if (calListRes.status === 401) {
        // Token invalid, remove it
        await admin.from('google_calendar_tokens').delete().eq('user_id', user.id)
        return NextResponse.json({ events: [], connected: false, error: 'Token vypršel, odpojte a znovu propojte Google Kalendář' })
      }
      return NextResponse.json({ events: [], connected: true })
    }

    const calList = await calListRes.json()
    const calendars: Array<{ id: string; summary: string; backgroundColor: string; primary?: boolean }> =
      calList.items ?? []

    // Fetch events from all calendars in parallel
    const allEvents: Array<{
      id: string; title: string; date: string; timeStart: string | null;
      timeEnd: string | null; allDay: boolean; calendarName: string;
      calendarColor: string; description: string | null; location: string | null;
    }> = []

    await Promise.all(calendars.map(async (cal) => {
      const params = new URLSearchParams({
        timeMin,
        timeMax,
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '250',
      })
      const evRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?${params}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (!evRes.ok) return
      const evData = await evRes.json()
      for (const ev of evData.items ?? []) {
        if (ev.status === 'cancelled') continue
        const isAllDay = !!ev.start?.date
        const startRaw: string = ev.start?.dateTime ?? ev.start?.date ?? ''
        const endRaw: string = ev.end?.dateTime ?? ev.end?.date ?? ''

        // Extract date and time
        const date = startRaw.slice(0, 10)
        const timeStart = isAllDay ? null : startRaw.slice(11, 16)
        const timeEnd = isAllDay ? null : endRaw.slice(11, 16)

        allEvents.push({
          id: `gcal_${ev.id}`,
          title: ev.summary ?? '(bez názvu)',
          date,
          timeStart,
          timeEnd,
          allDay: isAllDay,
          calendarName: cal.summary,
          calendarColor: cal.backgroundColor ?? '#4285F4',
          description: ev.description ?? null,
          location: ev.location ?? null,
        })
      }
    }))

    return NextResponse.json({ events: allEvents, connected: true })
  } catch {
    return NextResponse.json({ events: [], connected: true, error: 'Chyba při načítání Google Kalendáře' })
  }
}
