import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
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
      if (type === 'invite') {
        // Napoj člena týmu a přesměruj na nastavení hesla
        const { data: { user: invitedUser } } = await supabase.auth.getUser()
        if (invitedUser?.user_metadata?.owner_id) {
          const adminClient = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )
          const memberId = invitedUser.user_metadata.team_member_id
          if (memberId) {
            await adminClient.from('team_members')
              .update({ member_user_id: invitedUser.id, status: 'aktivni' })
              .eq('id', memberId)
          } else {
            await adminClient.from('team_members')
              .update({ member_user_id: invitedUser.id, status: 'aktivni' })
              .eq('owner_id', invitedUser.user_metadata.owner_id)
              .eq('member_email', invitedUser.email!)
          }
        }
        return NextResponse.redirect(
          new URL('/auth/update-password?invited=true', requestUrl.origin)
        )
      }
      return NextResponse.redirect(
        new URL('/dashboard', requestUrl.origin)
      )
    }
  }

  // Zpracování code (OAuth, standardní flow, pozvánky, PKCE reset hesla)
  if (code) {
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // PKCE reset hesla — detekuj podle type v URL, next parametru, nebo podle Supabase session
      const isRecovery = type === 'recovery'
        || next === '/auth/update-password'
        || sessionData?.user?.recovery_sent_at != null
      if (isRecovery) {
        return NextResponse.redirect(new URL('/auth/update-password', requestUrl.origin))
      }

      // Pokud jde o přijetí pozvánky do týmu — napoj člena
      const invited = requestUrl.searchParams.get('invited') === 'true'
      if (invited) {
        const { data: { user: invitedUser } } = await supabase.auth.getUser()
        if (invitedUser?.user_metadata?.owner_id) {
          const adminClient = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )
          const memberId = invitedUser.user_metadata.team_member_id
          if (memberId) {
            await adminClient.from('team_members')
              .update({ member_user_id: invitedUser.id, status: 'aktivni' })
              .eq('id', memberId)
          } else {
            await adminClient.from('team_members')
              .update({ member_user_id: invitedUser.id, status: 'aktivni' })
              .eq('owner_id', invitedUser.user_metadata.owner_id)
              .eq('member_email', invitedUser.email!)
          }
          // Nový člen musí nastavit heslo
          return NextResponse.redirect(new URL('/auth/update-password?invited=true', requestUrl.origin))
        }
      }
      // Onboarding enroll pro nové uživatele (OAuth) — volaj fire-and-forget
      const { data: { user: oauthUser } } = await supabase.auth.getUser()
      if (oauthUser) {
        const createdAt = new Date(oauthUser.created_at)
        const isNewUser = (Date.now() - createdAt.getTime()) < 60_000 // registroval se před méně než minutou
        if (isNewUser) {
          const adminClient = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )
          const userName = oauthUser.user_metadata?.full_name ?? oauthUser.email?.split('@')[0]
          await adminClient.from('onboarding_enrollments').upsert({
            user_id: oauthUser.id,
            user_email: oauthUser.email!,
            user_name: userName,
            current_step: 1,
            status: 'active',
            plan_at_enrollment: 'trial',
          }, { onConflict: 'user_id' }).select()
        }
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  // Chyba → zpět na login
  return NextResponse.redirect(
    new URL('/auth/login?error=auth_error', requestUrl.origin)
  )
}
