import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') ?? '/'

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // Zpracování token_hash (reset hesla, email change, magic link)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: type as any,
      token_hash,
    })

    if (!error) {
      if (type === 'recovery') {
        return NextResponse.redirect(
          new URL('/auth/update-password', requestUrl.origin)
        )
      }
      if (type === 'email_change') {
        return NextResponse.redirect(
          new URL('/dashboard/settings?email=changed', requestUrl.origin)
        )
      }
      return NextResponse.redirect(
        new URL('/dashboard', requestUrl.origin)
      )
    }
  }

  // Zpracování code (OAuth, standardní flow)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  // Chyba → zpět na login
  return NextResponse.redirect(
    new URL('/auth/login?error=auth_error', requestUrl.origin)
  )
}
